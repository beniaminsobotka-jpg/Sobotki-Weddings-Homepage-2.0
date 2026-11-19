// Remembers a couple's personal offer link on this device after they send the
// wedding Fotostacja form, so coming back to /portraits does not ask for it again.
// The offer pages (studio-7m4q, oferta-portrety) write the same key.
const KEY = 'sobotki_portraits_offer';
export const SAVED_OFFER_DAYS = 60;

type SavedOffer = { path: string; expiresAt: number };

const isOfferPath = (path: string) =>
    /^\/(studio-7m4q|oferta-portrety)\/\?access=[^&#\s]+/.test(path);

export const saveOffer = (path: string | undefined) => {
    if (!path || !isOfferPath(path)) return;
    try {
        const offer: SavedOffer = { path, expiresAt: Date.now() + SAVED_OFFER_DAYS * 864e5 };
        localStorage.setItem(KEY, JSON.stringify(offer));
    } catch {
        // Private mode or blocked storage: the form simply shows again next time.
    }
};

export const readSavedOffer = (): SavedOffer | null => {
    try {
        const offer = JSON.parse(localStorage.getItem(KEY) || 'null') as SavedOffer | null;
        if (!offer || !isOfferPath(offer.path) || !(offer.expiresAt > Date.now())) return null;
        return offer;
    } catch {
        return null;
    }
};

export const clearSavedOffer = () => {
    try {
        localStorage.removeItem(KEY);
    } catch {
        // Nothing to clear.
    }
};
