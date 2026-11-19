import { useState } from 'react';
import { readSavedOffer } from '../utils/savedOffer';

/** Floating shortcut back to a couple's offer when they already sent the form on this device. */
export function SavedOfferPill() {
    const [offer] = useState(() => readSavedOffer());
    if (!offer) return null;
    return (
        <a
            href={offer.path}
            className="fixed bottom-5 left-1/2 z-50 inline-flex min-h-[48px] -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full border border-white/15 bg-[#FF0000] px-6 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_14px_44px_rgba(255,0,0,0.4)] transition-transform hover:-translate-x-1/2 hover:-translate-y-0.5"
        >
            Przejdź do oferty <span aria-hidden="true">→</span>
        </a>
    );
}
