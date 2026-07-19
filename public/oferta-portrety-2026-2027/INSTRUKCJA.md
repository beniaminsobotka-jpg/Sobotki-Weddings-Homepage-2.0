# Ukryta oferta Sobotki Portraits 2026/2027

Adres po wdrożeniu:

`https://www.sobotkiweddings.pl/oferta-portrety-2026-2027/`

Strona ma ustawione `noindex, nofollow`, nie jest dodana do nawigacji ani mapy strony.

## Edycja treści i cen

- Treść sekcji, pakietów, cen, dodatków i FAQ: `index.html`.
- Kolory, fonty i podstawowe ustawienia wyglądu: zmienne `:root` na górze `styles.css`.
- E-mail, Instagram, PDF i adres funkcji zapisującej leady: obiekt `CONFIG` na górze `script.js`.
- Zdjęcia: folder `assets/`. Można podmienić plik, zachowując jego nazwę.

## Brevo i powiadomienia mailowe

Strona korzysta z tej samej funkcji serverless co oferta Sobotki Weddings: `/api/offer-lead`.

W Vercelu musi pozostać ustawiona zmienna:

- `BREVO_API_KEY` - klucz API Brevo.
- `BREVO_LIST_ID_OFFER` - opcjonalny numer listy kontaktów dla leadów z ofert.
- `BREVO_NOTIFY_FROM_NAME` - opcjonalna nazwa nadawcy. Jeśli jej nie ma, dla tej strony używana jest nazwa `Sobotki Portraits`.

Nadawca i odbiorca wiadomości są ustawieni na zweryfikowany adres `kontakt@sobotkiweddings.pl`. Pole `Reply-To` wskazuje adres klienta, więc odpowiedź z programu pocztowego trafia bezpośrednio do niego.

## Eventy

- Odsłonięcie oferty: `oferta_obejrzana`.
- Wysłanie zapytania: `zapytanie_o_termin`.
- Wysłanie sondy rezygnacji: `odrzucenie`.

Każdy event z tej podstrony ma źródło `hidden_offer_portraits_2026_2027`, dzięki czemu można go odróżnić w Brevo od leadów z oferty Sobotki Weddings.

## PDF

Przycisk pobierania prowadzi do:

`/oferta-portrety-2026-2027.pdf`
