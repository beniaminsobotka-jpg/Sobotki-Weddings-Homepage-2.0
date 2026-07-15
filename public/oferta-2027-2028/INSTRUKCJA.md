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

## Dodanie zajętej daty

Otwórz `blocked-dates.json` i wpisz daty w formacie `YYYY-MM-DD`, np.

```json
[
  "2027-06-19",
  "2027-08-14"
]
```

To tylko wizualna wskazówka dla klienta - nie blokuje dostępu do oferty.

## Podpięcie Brevo

Front wysyła dane do `/api/offer-lead`.

Na Vercelu dodaj zmienne środowiskowe:

- `BREVO_API_KEY` - klucz API z Brevo
- `BREVO_LIST_ID_OFFER` - ID listy w Brevo, do której mają wpadać leady z tej oferty

Nie wklejaj klucza Brevo do `script.js`, bo pliki frontu są publiczne.
