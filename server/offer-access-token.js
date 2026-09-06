import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const TOKEN_VERSION = 'v1';
const ALGORITHM = 'aes-256-gcm';

const getKey = () => {
  const secret = process.env.OFFER_ACCESS_SECRET || process.env.BREVO_API_KEY;

  if (!secret) {
    throw new Error('Offer access secret is not configured');
  }

  return createHash('sha256').update(secret).digest();
};

const encode = (value) => Buffer.from(value).toString('base64url');
const decode = (value) => Buffer.from(value, 'base64url');

export const createOfferAccessToken = (payload) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [TOKEN_VERSION, encode(iv), encode(authTag), encode(encrypted)].join('.');
};

export const readOfferAccessToken = (token) => {
  const [version, encodedIv, encodedAuthTag, encodedPayload, ...extra] = String(token || '').split('.');

  if (
    version !== TOKEN_VERSION ||
    !encodedIv ||
    !encodedAuthTag ||
    !encodedPayload ||
    extra.length > 0
  ) {
    throw new Error('Invalid offer access token');
  }

  const decipher = createDecipheriv(ALGORITHM, getKey(), decode(encodedIv));
  decipher.setAuthTag(decode(encodedAuthTag));
  const decrypted = Buffer.concat([
    decipher.update(decode(encodedPayload)),
    decipher.final(),
  ]);
  const payload = JSON.parse(decrypted.toString('utf8'));

  if (!payload?.expiresAt || Date.now() > Number(payload.expiresAt)) {
    throw new Error('Offer access token has expired');
  }

  return payload;
};
