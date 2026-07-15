# Ukryta oferta Sobotki Weddings 2027/2028

Adres po wdrożeniu:

`https://www.sobotkiweddings.pl/oferta-2027-2028/`

## Edycja danych kontaktowych

Otwórz `script.js` i zmień wartości w obiekcie `CONFIG` na samej górze pliku:

- `contactEmail`
- `instagramUrl`
- `pdfUrl`
- `leadEndpoint`

Kolory i zdjęcie hero są w `styles.css` w sekcji `:root`.

## Edycja cen i treści

Pakiety, ceny, dodatki, FAQ i CTA są w `index.html`.
Szukaj nagłówków:

- `Pakiety`
- `Dodatki`
- `FAQ`
- `Co teraz?`

## Data i miejsce ślubu

Formularz zbiera:

- imię
- e-mail
- datę ślubu
- miejsce / nazwę sali

Dostępność terminu nie jest sprawdzana automatycznie. Potwierdzasz ją ręcznie po kontakcie.

## Eventy Brevo

Front wysyła dane do `/api/offer-lead`.

Obsługiwane eventy:

- `oferta_obejrzana` - wysyła się po poprawnym formularzu i odsłonięciu oferty
- `zapytanie_o_termin` - wysyła się po kliknięciu dużego CTA na końcu strony
- `odrzucenie` - wysyła się po wysłaniu sondy "To nie dla mnie"

Na Vercelu dodaj zmienne środowiskowe:

- `BREVO_API_KEY` - klucz API z Brevo
- `BREVO_LIST_ID_OFFER` - ID listy Brevo dla leadów z ukrytej oferty

Endpoint aktualizuje kontakt w Brevo oraz próbuje wysłać custom event do Brevo Events API. Dane eventu są też dopisywane do pola `MESSAGE`, więc nawet bez automatyzacji eventowej zobaczysz historię w kontakcie.

## Mail powiadomień dla "zapytanie_o_termin"

Dla dużego CTA endpoint wysyła mail przez Brevo SMTP API.

Zmienne środowiskowe:

- `BREVO_OFFER_NOTIFY_TO_EMAIL` - adres, na który mają przychodzić zapytania z tej oferty
- `BREVO_NOTIFY_TO_EMAIL` - fallback, jeśli nie ustawisz osobnego `BREVO_OFFER_NOTIFY_TO_EMAIL`
- `BREVO_NOTIFY_FROM_EMAIL` - zweryfikowany nadawca w Brevo
- `BREVO_NOTIFY_FROM_NAME` - nazwa nadawcy, np. `Sobotki Weddings`

Mail zawiera: imię, e-mail, datę ślubu, miejsce / salę, timestamp formularza i timestamp eventu.

## Gdzie zobaczysz wyniki sondy odrzuceń

Wyniki sondy zapisują się w Brevo przy kontakcie jako event `odrzucenie` oraz w polu `MESSAGE`.

W `MESSAGE` zobaczysz m.in.:

- `Event: odrzucenie`
- `Powód odrzucenia`
- `Komentarz odrzucenia`, jeśli klient coś dopisał

Nie wklejaj klucza Brevo do `script.js`, bo pliki frontu są publiczne.
