# Galeria Sobotki Portraits z Dropboxa

Gość otwiera adres w formacie:

`https://www.sobotkiweddings.pl/galeria/slug-wydarzenia`

Strona pobiera listę zdjęć przez prywatne endpointy Vercela. Dane dostępowe do
Dropboxa nigdy nie trafiają do kodu uruchamianego w przeglądarce.

## 1. Aplikacja Dropbox

W Dropbox App Console utwórz aplikację API. Najmniejszy potrzebny zakres to:

- `files.metadata.read` — lista zdjęć w folderze,
- `files.content.read` — miniatury i pobieranie oryginałów.
- `files.content.write` — zapis prywatnego rejestru galerii przez panel.

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
- `GALLERY_ADMIN_PASSWORD` — długie, losowe hasło do panelu

Opcjonalnie możesz ustawić osobny `GALLERY_ADMIN_SESSION_SECRET`. Jeżeli go nie
ustawisz, sesje panelu będą podpisywane przez `DROPBOX_APP_SECRET`.

## 3. Panel galerii

Panel znajduje się pod adresem:

`https://www.sobotkiweddings.pl/panel/galerie`

Panel automatycznie listuje podfoldery z `/Galerie`. Utworzone galerie zapisuje
w prywatnym pliku `/Galerie/_sobotki-galleries.json`. Plik jest dostępny tylko
dla serwera i nie jest wystawiany gościom.

Panel pozwala:

- utworzyć lub edytować galerię,
- przypisać folder Dropboxa,
- skopiować publiczny adres,
- pobrać kod QR w PNG,
- zarchiwizować lub przywrócić galerię.

## 4. Workflow podczas imprezy

1. Utwórz folder wydarzenia na Dropboxie.
2. Otwórz panel i kliknij **Nowa galeria**.
3. Wybierz folder, wpisz nazwę i pobierz wygenerowany QR.
4. Eksportuj zdjęcia do folderu wydarzenia jak dotychczas.
5. Galeria gości odświeża listę co 10 sekund. Miniatury są cache'owane na CDN
   Vercela, a przycisk pobierania prowadzi do krótkotrwałego linku oryginału.

## 5. Darmowe statystyki

Projekt zawiera Vercel Web Analytics. Po włączeniu Analytics w dashboardzie
projektu Vercel zobaczysz odsłony i anonimowych odwiedzających galerii. Panel
administracyjny jest wyłączony z pomiaru. Płatne zdarzenia, takie jak kliknięcia
pobierania, nie są wymagane w wersji pilotażowej.

Obsługiwane formaty to JPG/JPEG, PNG, WebP, GIF, TIFF i BMP. Dla najlepszego
czasu pojawiania się zdjęć rekomendowany jest JPG w przestrzeni sRGB.
