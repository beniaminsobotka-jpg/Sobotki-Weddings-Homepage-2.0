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
  };
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

leadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formError.textContent = "";

  const lead = getLeadData();
  const error = validateLead(lead);
  if (error) {
    formError.textContent = error;
    return;
  }

  state.lastLead = lead;
  revealOffer();

  saveLead(EVENTS.offerViewed, lead).catch((saveError) => {
    console.warn("[Sobotki Portraits Offer] Nie udało się zapisać eventu oferta_obejrzana", saveError);
  });
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

document.addEventListener("DOMContentLoaded", () => {
  try {
    const saved = localStorage.getItem('sobotki_lead_portraits');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (document.querySelector("#name")) document.querySelector("#name").value = parsed.name || "";
      if (document.querySelector("#email")) document.querySelector("#email").value = parsed.email || "";
      if (document.querySelector("#weddingDate")) document.querySelector("#weddingDate").value = parsed.weddingDate || "";
      if (document.querySelector("#venue")) document.querySelector("#venue").value = parsed.venue || "";
      if (document.querySelector("#guestsCount")) document.querySelector("#guestsCount").value = parsed.guestsCount || "";
      if (document.querySelector("#howDidYouHear")) document.querySelector("#howDidYouHear").value = parsed.howDidYouHear || "";
      if (document.querySelector("textarea[name='inquiryMessage']")) {
        document.querySelector("textarea[name='inquiryMessage']").value = parsed.notes || "";
      }
      
      state.lastLead = getLeadData();
      
      const headerEl = document.querySelector("header");
      if (headerEl) headerEl.style.display = "none";
      
      revealOffer();
    }
  } catch (e) {}
});
