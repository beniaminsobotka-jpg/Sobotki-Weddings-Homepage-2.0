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

let offerIntroSlideshowStarted = false;

let portraitMosaicStarted = false;

function startPortraitMosaic() {
  if (portraitMosaicStarted) return;
  portraitMosaicStarted = true;

  const gallery = document.querySelector(".portrait-gallery-section .portrait-gallery");
  if (!gallery) return;
  const figures = [...gallery.querySelectorAll("figure")];
  const images = figures.map((figure) => figure.querySelector("img"));
  const largerPhotos = new Set([0, 1, 11, 19, 22]);

  function layout() {
    const width = gallery.clientWidth;
    const columns = width < 560 ? 3 : width < 900 ? 4 : 6;
    const gap = width < 560 ? 10 : width < 900 ? 14 : 18;
    const unitWidth = (width - gap * (columns - 1)) / columns;
    const bottoms = Array(columns).fill(0);

    figures.forEach((figure, index) => {
      const image = images[index];
      const span = largerPhotos.has(index) ? 2 : 1;
      const tileWidth = unitWidth * span + gap * (span - 1);
      const ratio = image.naturalWidth && image.naturalHeight
        ? image.naturalHeight / image.naturalWidth
        : 1;
      const tileHeight = tileWidth * ratio;
      let column = 0;
      let top = Infinity;

      for (let start = 0; start <= columns - span; start += 1) {
        const candidate = Math.max(...bottoms.slice(start, start + span));
        if (candidate < top) {
          top = candidate;
          column = start;
        }
      }

      figure.style.left = `${column * (unitWidth + gap)}px`;
      figure.style.top = `${top}px`;
      figure.style.width = `${tileWidth}px`;
      figure.style.height = `${tileHeight}px`;
      for (let i = column; i < column + span; i += 1) {
        bottoms[i] = top + tileHeight + gap;
      }
    });

    gallery.style.height = `${Math.max(...bottoms) - gap}px`;
    gallery.classList.add("mosaic-ready");
  }

  images.forEach((image) => {
    image.loading = "eager";
  });
  Promise.all(images.map((image) => image.decode().catch(() => {}))).then(() => {
    layout();
    window.addEventListener("resize", layout, { passive: true });
  });
}

function startOfferIntroSlideshow() {
  if (offerIntroSlideshowStarted) return;
  offerIntroSlideshowStarted = true;

  const intro = document.querySelector(".offer-intro");
  const slides = [...document.querySelectorAll(".offer-intro-slide")];
  if (!intro || slides.length !== 2) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches) return;

  const desktopPhotos = ["fs4tc-21", "fenaq-152", "dv8gj-137", "tygge-114", "usuvk-10", "fenaq-172"];
  const mobilePhotos = ["fs4tc-21", "dv8gj-93", "6qmvn-211", "fs4tc-186", "fs4tc-230", "fs4tc-327"];
  const photoNames = window.matchMedia("(max-width: 600px)").matches ? mobilePhotos : desktopPhotos;
  const photoUrls = photoNames.map((name) => `./assets/mosaic/${name}.webp`);
  let visible = false;
  let activeSlide = 0;
  let currentPhoto = 0;
  let switching = false;

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    }, { threshold: 0.1 }).observe(intro);
  } else {
    visible = true;
  }

  Promise.all(photoUrls.map((url) => {
    const image = new Image();
    image.src = url;
    return image.decode().then(() => url).catch(() => null);
  })).then((results) => {
    const availablePhotos = results.filter(Boolean);
    if (availablePhotos.length < 2) return;

    window.setInterval(() => {
      if (!visible || document.hidden || reducedMotion.matches || switching) return;
      switching = true;
      const nextPhoto = (currentPhoto + 1) % availablePhotos.length;
      const nextSlide = 1 - activeSlide;
      slides[nextSlide].src = availablePhotos[nextPhoto];
      slides[nextSlide].decode().then(() => {
        slides[activeSlide].classList.remove("is-active");
        slides[nextSlide].classList.add("is-active");
        activeSlide = nextSlide;
        currentPhoto = nextPhoto;
      }).catch(() => {}).finally(() => {
        switching = false;
      });
    }, 500);
  });
}

function revealOffer() {
  if (!state.offerShown) {
    state.offerShown = true;
    offerContent.classList.remove("is-hidden");
    offerContent.setAttribute("aria-hidden", "false");
    document.body.classList.add("offer-open");
    initRevealObserver();
    startOfferIntroSlideshow();
    startPortraitMosaic();
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
