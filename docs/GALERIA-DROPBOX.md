# Galeria Sobotki Portraits z Dropboxa

Gość otwiera adres w formacie:

`https://www.sobotkiweddings.pl/galeria/slug-wydarzenia`

Strona pobiera listę zdjęć przez prywatne endpointy Vercela. Dane dostępowe do
Dropboxa nigdy nie trafiają do kodu uruchamianego w przeglądarce.

## 1. Aplikacja Dropbox

W Dropbox App Console utwórz aplikację API. Najmniejszy potrzebny zakres to:

- `files.metadata.read` — lista zdjęć w folderze,
- `files.content.read` — miniatury i pobieranie oryginałów.

Możesz wybrać dostęp typu **App folder**. Wtedy folder `/Galerie` widziany przez
API znajduje się fizycznie w katalogu aplikacji wewnątrz `Apps` na Dropboxie.

Do stałego działania produkcyjnego użyj tokenu odświeżania (OAuth z parametrem
`token_access_type=offline`). Krótkotrwały `DROPBOX_ACCESS_TOKEN` nadaje się tylko
do szybkiego testu.

## 2. Zmienne środowiskowe Vercela

Ustaw dla środowiska Production:

- `DROPBOX_APP_KEY`
- `DROPBOX_APP_SECRET`
- `DROPBOX_REFRESH_TOKEN`
- `DROPBOX_GALLERY_ROOT` — domyślnie `/Galerie`

Opcjonalnie ustaw `DROPBOX_GALLERY_EVENTS`. To mapa publicznego, trudnego do
odgadnięcia sluga na nazwę i folder wydarzenia, na przykład (jako jedna linia):

```json
{
  "ania-marek-x7k2": {
    "title": "Ania & Marek",
    "date": "24 sierpnia 2026",
    "folder": "/Galerie/ania-i-marek"
  }
}
```

Jeśli `DROPBOX_GALLERY_EVENTS` jest ustawione, działa jako lista dozwolonych
galerii. Nieznane slugi zwracają stronę błędu bez ujawniania zawartości Dropboxa.

Jeżeli zmienna nie jest ustawiona, działa prosty tryb konwencji:

- URL `/galeria/ania-i-marek`
- folder Dropbox `/Galerie/ania-i-marek`
- tytuł galerii `Ania i Marek`

Tryb konwencji jest wygodny na start, ale na prawdziwych imprezach lepiej używać
allowlisty i losowego fragmentu w slugu.

## 3. Workflow podczas imprezy

1. Utwórz folder wydarzenia na Dropboxie.
2. Dodaj wydarzenie do `DROPBOX_GALLERY_EVENTS` albo nazwij folder tak jak slug.
3. Wygeneruj QR prowadzący bezpośrednio do adresu galerii.
4. Eksportuj zdjęcia do folderu wydarzenia jak dotychczas.
5. Galeria gości odświeża listę co 10 sekund. Miniatury są cache'owane na CDN
   Vercela, a przycisk pobierania prowadzi do krótkotrwałego linku oryginału.

Obsługiwane formaty to JPG/JPEG, PNG, WebP, GIF, TIFF i BMP. Dla najlepszego
czasu pojawiania się zdjęć rekomendowany jest JPG w przestrzeni sRGB.
