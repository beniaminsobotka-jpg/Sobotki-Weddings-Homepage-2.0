const CONFIG = {
  brandName: "Sobotki Portraits",
  contactEmail: "kontakt@sobotkiweddings.pl",
  instagramUrl: "https://www.instagram.com/sobotki.portraits/",
  pdfUrl: "/oferta-portrety-2026-2027.pdf",

  // Zostaw ten adres przy wdrożeniu strony w obecnym projekcie na Vercelu.
  leadEndpoint: "/api/offer-lead",

  // Klucza Brevo nie umieszczaj w tym pliku - kod frontu jest publiczny.
  // Sekretny BREVO_API_KEY pozostaje w zmiennych środowiskowych Vercela.
};

const EVENTS = {
  offerViewed: "oferta_obejrzana",
  termInquiry: "zapytanie_o_termin",
  rejection: "odrzucenie",
};

const state = {
  offerShown: false,
  lastLead: null,
  termInquirySent: false,
  rejectionSent: false,
  pricing: null,
};

const leadForm = document.querySelector("#leadForm");
const offerContent = document.querySelector("#offerContent");
const formError = document.querySelector("#formError");
const reserveCta = document.querySelector("#reserveCta");
const ctaStatus = document.querySelector("#ctaStatus");
const inquiryModal = document.querySelector("#inquiryModal");
const inquiryForm = document.querySelector("#inquiryForm");
const inquiryError = document.querySelector("#inquiryError");
const showRejectSurvey = document.querySelector("#showRejectSurvey");
const rejectForm = document.querySelector("#rejectForm");
const rejectStatus = document.querySelector("#rejectStatus");

function setConfigLinks() {
  document.querySelectorAll("[data-contact-email]").forEach((link) => {
    link.textContent = CONFIG.contactEmail;
    link.href = `mailto:${CONFIG.contactEmail}`;
  });

  document.querySelectorAll("[data-contact-instagram]").forEach((link) => {
    link.textContent = "@sobotki.portraits";
    link.href = CONFIG.instagramUrl;
  });

  document.querySelectorAll("[data-pdf-link]").forEach((link) => {
    link.href = CONFIG.pdfUrl;
  });
}

function getLeadData() {
  const formData = new FormData(leadForm);
  return {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim().toLowerCase(),
    weddingDate: String(formData.get("weddingDate") || "").trim(),
    venue: String(formData.get("venue") || "").trim(),
    guestsCount: String(formData.get("guestsCount") || "").trim(),
    howDidYouHear: String(formData.get("howDidYouHear") || "").trim(),
    timestamp: new Date().toISOString(),
    source: "hidden_offer_portraits",
    distanceKm: state.pricing?.distanceKm || "",
    pricingTier: state.pricing?.tier || "",
    resolvedLocation: state.pricing?.resolvedLocation || "",
  };
}

function formatPrice(value) {
  return `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} zł`;
}

function applyPricing(pricing) {
  if (!pricing?.prices?.essential || !pricing?.prices?.exclusive) return;
  state.pricing = pricing;

  document.querySelectorAll("[data-package-price]").forEach((element) => {
    const packageName = element.dataset.packagePrice;
    element.textContent = formatPrice(pricing.prices[packageName]);
  });

  document.querySelectorAll("[data-package-option]").forEach((input) => {
    const packageName = input.dataset.packageOption;
    const label = packageName === "essential" ? "Fotostacja Essential" : "Fotostacja Exclusive";
    const price = pricing.prices[packageName];
    input.value = `${label} - ${price} zł`;
    const text = input.closest("label")?.querySelector("span");
    if (text) text.textContent = `${label} - ${formatPrice(price)}`;
  });

  document.querySelectorAll("[data-pdf-link]").forEach((link) => {
    link.hidden = true;
    link.style.display = "none";
  });
}

async function getTravelPricing(venue) {
  const response = await fetch(`/api/travel-distance?venue=${encodeURIComponent(venue)}`, {
    headers: { Accept: "application/json" },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "Nie udało się sprawdzić odległości do miejsca przyjęcia.");
  }
  return result;
}

function validateLead(lead) {
  if (!lead.name) return "Podaj proszę imię.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return "Podaj poprawny adres e-mail.";
  if (!lead.weddingDate) return "Wybierz proszę datę ślubu.";
  if (!lead.venue) return "Podaj proszę miejsce lub nazwę sali.";
  return "";
}

async function saveLead(eventName, lead, extra = {}) {
  const payload = {
    ...lead,
    ...extra,
    eventName,
    eventTimestamp: new Date().toISOString(),
  };

  if (!CONFIG.leadEndpoint) {
    console.info("[Sobotki Portraits Offer] Event captured locally:", payload);
    return { ok: true, skipped: true };
  }

  const response = await fetch(CONFIG.leadEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let details = "";
    try {
      const data = await response.json();
      details = data?.details || data?.error || "";
    } catch {
      details = await response.text().catch(() => "");
    }
    throw new Error(details || `Lead event failed with status ${response.status}`);
  }

  const result = await response.json().catch(() => ({ ok: true }));
  if (eventName === EVENTS.termInquiry && !result.notificationSent) {
    throw new Error("Brevo nie potwierdziło wysyłki maila powiadamiającego.");
  }
  return result;
}

function initRevealObserver() {
  const elements = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  elements.forEach((element) => observer.observe(element));
}

function revealOffer() {
  if (!state.offerShown) {
    state.offerShown = true;
    offerContent.classList.remove("is-hidden");
    offerContent.setAttribute("aria-hidden", "false");
    document.body.classList.add("offer-open");
    initRevealObserver();
  }

  requestAnimationFrame(() => {
    offerContent.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function ensureLeadBeforeFinalAction() {
  const lead = state.lastLead || getLeadData();
  const error = validateLead(lead);
  if (error) {
    formError.textContent = "Najpierw uzupełnij formularz na górze oferty.";
    leadForm.scrollIntoView({ behavior: "smooth", block: "center" });
    return null;
  }
  state.lastLead = lead;
  return lead;
}

function openInquiryModal() {
  inquiryError.textContent = "";
  inquiryModal.classList.remove("is-hidden");
  inquiryModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  inquiryModal.querySelector("input")?.focus();
}

function closeInquiryModal() {
  inquiryModal.classList.add("is-hidden");
  inquiryModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  reserveCta.focus();
}

leadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.textContent = "";

  const lead = getLeadData();
  const error = validateLead(lead);
  if (error) {
    formError.textContent = error;
    return;
  }

  const submitButton = leadForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Sprawdzamy lokalizację...";

  try {
    const pricing = await getTravelPricing(lead.venue);
    if (pricing.overLimit) {
      formError.textContent = pricing.message;
      return;
    }

    applyPricing(pricing);
    state.lastLead = { ...lead, distanceKm: pricing.distanceKm, pricingTier: pricing.tier, resolvedLocation: pricing.resolvedLocation };
    localStorage.setItem("sobotki_lead_portraits", JSON.stringify({ ...state.lastLead, packagePrices: pricing.prices }));
    revealOffer();

    saveLead(EVENTS.offerViewed, state.lastLead).catch((saveError) => {
      console.warn("[Sobotki Portraits Offer] Nie udało się zapisać eventu oferta_obejrzana", saveError);
    });
  } catch (error) {
    formError.textContent = error instanceof Error ? error.message : "Nie udało się sprawdzić odległości.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Pokaż ofertę";
  }
});

reserveCta.addEventListener("click", () => {
  const lead = ensureLeadBeforeFinalAction();
  if (!lead || state.termInquirySent) return;
  openInquiryModal();
});

inquiryModal.querySelectorAll("[data-close-inquiry-modal]").forEach((element) => {
  element.addEventListener("click", closeInquiryModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !inquiryModal.classList.contains("is-hidden")) {
    closeInquiryModal();
  }
});

inquiryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const lead = ensureLeadBeforeFinalAction();
  if (!lead || state.termInquirySent) return;

  const formData = new FormData(inquiryForm);
  const interestedOffers = formData.getAll("interestedOffers").map((value) => String(value));
  const inquiryMessage = String(formData.get("inquiryMessage") || "").trim();
  if (interestedOffers.length === 0) {
    inquiryError.textContent = "Zaznaczcie proszę przynajmniej jedną opcję.";
    return;
  }

  inquiryError.textContent = "";
  ctaStatus.textContent = "";
  const submitButton = inquiryForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Wysyłamy zapytanie...";

  try {
    const result = await saveLead(EVENTS.termInquiry, lead, {
      interestedOffers,
      inquiryMessage,
    });
    state.termInquirySent = true;
    ctaStatus.textContent = "Dziękujemy! Odezwiemy się mailowo, żeby potwierdzić dostępność terminu.";
    reserveCta.textContent = "Zapytanie wysłane";
    reserveCta.disabled = true;
    closeInquiryModal();
  } catch (error) {
    console.warn("[Sobotki Portraits Offer] Nie udało się wysłać zapytania", error);
    inquiryError.textContent = error instanceof Error
      ? `Nie udało się wysłać zapytania: ${error.message}`
      : "Coś poszło nie tak. Spróbuj ponownie albo napisz do nas mailowo.";
    submitButton.disabled = false;
    submitButton.textContent = "Wyślij zapytanie";
  }
});

showRejectSurvey.addEventListener("click", () => {
  rejectForm.classList.toggle("is-hidden");
  const isHidden = rejectForm.classList.contains("is-hidden");
  rejectForm.setAttribute("aria-hidden", String(isHidden));
});

rejectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const lead = ensureLeadBeforeFinalAction();
  if (!lead || state.rejectionSent) return;

  const formData = new FormData(rejectForm);
  const reason = String(formData.get("reason") || "").trim();
  const note = String(formData.get("note") || "").trim();
  if (!reason) {
    rejectStatus.textContent = "Wybierz proszę jedną odpowiedź.";
    return;
  }

  rejectStatus.textContent = "Wysyłamy odpowiedź...";
  try {
    await saveLead(EVENTS.rejection, lead, {
      rejectionReason: reason,
      rejectionNote: note,
    });
    state.rejectionSent = true;
    rejectStatus.textContent = "Dzięki za szczerą odpowiedź - bardzo nam to pomaga.";
  } catch (error) {
    console.warn("[Sobotki Portraits Offer] Nie udało się zapisać odpowiedzi", error);
    rejectStatus.textContent = "Nie udało się wysłać odpowiedzi. Spróbuj proszę jeszcze raz.";
  }
});

setConfigLinks();

function populateAndRevealSavedLead(parsed, { trackView = false } = {}) {
  if (document.querySelector("#name")) document.querySelector("#name").value = parsed.name || "";
  if (document.querySelector("#email")) document.querySelector("#email").value = parsed.email || "";
  if (document.querySelector("#weddingDate")) document.querySelector("#weddingDate").value = parsed.weddingDate || "";
  if (document.querySelector("#venue")) document.querySelector("#venue").value = parsed.venue || "";
  if (document.querySelector("#guestsCount")) document.querySelector("#guestsCount").value = parsed.guestsCount || "";
  if (document.querySelector("#howDidYouHear")) document.querySelector("#howDidYouHear").value = parsed.howDidYouHear || "";
  if (document.querySelector("textarea[name='inquiryMessage']")) {
    document.querySelector("textarea[name='inquiryMessage']").value = parsed.notes || "";
  }

  if (!parsed.pricingTier || !parsed.packagePrices || !parsed.distanceKm) return false;

  applyPricing({
    tier: parsed.pricingTier,
    prices: parsed.packagePrices,
    distanceKm: parsed.distanceKm,
    resolvedLocation: parsed.resolvedLocation || "",
  });
  state.lastLead = getLeadData();
  const headerEl = document.querySelector("header");
  if (headerEl) headerEl.style.display = "none";
  revealOffer();

  if (trackView) {
    saveLead(EVENTS.offerViewed, state.lastLead).catch((saveError) => {
      console.warn("[Sobotki Portraits Offer] Nie udało się zapisać otwarcia oferty", saveError);
    });
  }

  return true;
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const accessToken = new URLSearchParams(window.location.search).get("access");
    if (accessToken) {
      const response = await fetch(`/api/offer-lead?access=${encodeURIComponent(accessToken)}`, {
        headers: { Accept: "application/json" },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.lead) {
        throw new Error(result.error || "Nie udało się otworzyć oferty z tego linku.");
      }

      localStorage.setItem("sobotki_lead_portraits", JSON.stringify(result.lead));
      if (populateAndRevealSavedLead(result.lead, { trackView: true })) return;
    }

    const saved = localStorage.getItem('sobotki_lead_portraits');
    if (saved) {
      const parsed = JSON.parse(saved);
      populateAndRevealSavedLead(parsed);
    }
  } catch (error) {
    console.warn("[Sobotki Portraits Offer] Nie udało się automatycznie otworzyć oferty", error);
    formError.textContent = error instanceof Error ? error.message : "Nie udało się automatycznie otworzyć oferty.";
  }
});
