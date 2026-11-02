import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/gallery-videos.js';
import { hashSelectionPin, coupleSessionCookie } from '../server/gallery-couple-auth.js';
import { normalizeGalleryVideos, getVisibleVideoItems, youtubeVideoId } from '../server/gallery-videos.js';
import adminHandler from '../api/admin-galleries.js';
import { createAdminSessionCookie } from '../server/gallery-admin-auth.js';

test('optional films accept supported links and reject unsafe or folder links', () => {
  assert.deepEqual(getVisibleVideoItems({}),[]);
  const one = normalizeGalleryVideos({creative:{youtubeUrl:'https://youtu.be/dQw4w9WgXcQ',downloadUrl:'https://www.dropbox.com/scl/fi/abc/creative.mp4?rlkey=abc&dl=0'}},true);
  assert.equal(getVisibleVideoItems(one).length,1);
  assert.equal(new URL(one.creative.downloadUrl).searchParams.get('dl'),'1');
  assert.equal(new URL(one.creative.downloadUrl).searchParams.get('rlkey'),'abc');
  assert.equal(getVisibleVideoItems(one)[0].embedUrl,'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  assert.equal(youtubeVideoId('https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ'),'');
  assert.equal(youtubeVideoId('javascript:alert(1)'),'');
  assert.throws(() => normalizeGalleryVideos({family:{downloadUrl:'https://www.dropbox.com/scl/fo/abc'}},true),/folderu/);
  assert.throws(() => normalizeGalleryVideos({family:{youtubeUrl:'https://example.com/video'}},true),/YouTube/);
  assert.equal(getVisibleVideoItems({family:{downloadUrl:'https://www.dropbox.com/s/abc/family.mp4'}}).length,1);
});

test('only PIN session can expose or hide film URLs; guests see only explicitly published films', async () => {
  process.env.DROPBOX_ACCESS_TOKEN='test-token';
  process.env.DROPBOX_APP_SECRET='test-secret';
  process.env.GALLERY_ADMIN_PASSWORD='test-admin';
  const gallery = {slug:'weddings-video-test',title:'Test',kind:'weddings',folder:'/Galerie/WEDDINGS Test',active:true,selectionPinHash:hashSelectionPin('123456'),videos:normalizeGalleryVideos({creative:{youtubeUrl:'https://youtu.be/dQw4w9WgXcQ',downloadUrl:'https://www.dropbox.com/s/abc/creative.mp4'}})};
  let registry = {galleries:[gallery]};
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async (url,options={}) => {
    if(String(url).endsWith('/files/download')) return Response.json(registry);
    if(String(url).endsWith('/files/get_metadata')) return Response.json({'.tag':'folder'});
    if(String(url).endsWith('/files/list_folder')) {
      const path=JSON.parse(options.body).path;
      return Response.json({entries:path==='/Galerie' ? [{'.tag':'folder',name:'WEDDINGS Test',path_display:gallery.folder}] : [],has_more:false});
    }
    if(String(url).endsWith('/files/upload')) {registry=JSON.parse(options.body);return Response.json({});}
    throw new Error(`Unexpected request ${url}`);
  };
  const call = async (method,cookie='',body={}) => {
    const response={headers:{},status(code){this.code=code;return this;},setHeader(name,value){this.headers[name]=value;return this;},end(value){this.body=JSON.parse(value);}};
    await handler({method,query:{slug:gallery.slug},body:{slug:gallery.slug,...body},headers:{cookie}},response);
    return response;
  };
  try {
    const guest=await call('GET');
    assert.equal(guest.code,200);
    assert.deepEqual(guest.body.videos,[]);
    assert.ok(!JSON.stringify(guest.body).includes('dropbox.com'));
    assert.equal(guest.headers['Cache-Control'],'private, no-store');
    assert.equal((await call('POST','',{public:true})).code,403);
    const cookie=coupleSessionCookie(gallery).split(';')[0];
    const couple=await call('GET',cookie);
    assert.equal(couple.body.videos.length,1);
    assert.equal(couple.body.canManage,true);
    assert.equal((await call('POST',cookie,{public:true})).code,200);
    assert.equal((await call('GET')).body.videos.length,1);
    assert.equal((await call('GET')).body.canManage,false);
    assert.equal((await call('POST',cookie,{public:false})).code,200);
    assert.deepEqual((await call('GET')).body.videos,[]);
    assert.equal((await call('POST',cookie,{public:'true'})).code,400);
    await call('POST',cookie,{public:true});
    const adminCookie=createAdminSessionCookie().split(';')[0];
    const save = async (videos) => {
      const response={status(code){this.code=code;return this;},setHeader(){return this;},end(value){this.body=JSON.parse(value);}};
      await adminHandler({method:'POST',headers:{cookie:adminCookie},body:{action:'save',gallery:{...gallery,originalSlug:gallery.slug,publicationConsent:'denied',videos}}},response);
      return response;
    };
    assert.equal((await save(gallery.videos)).code,200);
    assert.equal(registry.galleries[0].videosPublic,true);
    assert.equal((await save({...gallery.videos,family:{youtubeUrl:'https://youtu.be/abcdefghijk'}})).code,200);
    assert.equal(registry.galleries[0].videosPublic,false);
    assert.deepEqual((await call('GET')).body.videos,[]);
    assert.equal((await call('GET',cookie)).body.videos.length,2);
    registry.galleries[0].active=false;
    assert.equal((await call('GET')).code,404);
  } finally {globalThis.fetch=originalFetch;}
});
