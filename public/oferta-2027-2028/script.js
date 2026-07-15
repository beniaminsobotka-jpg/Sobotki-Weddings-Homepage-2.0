const CONFIG = {
  brandName: "Sobotki Weddings",
  contactEmail: "[email]",
  instagramUrl: "[link]",
  pdfUrl: "/oferta-sw-2027-2028.pdf",

  // Jeśli używasz obecnej strony na Vercelu, zostaw "/api/offer-lead".
  // Jeśli przenosisz folder jako czysty static na Netlify/inny hosting,
  // wpisz tutaj URL webhooka albo swojej funkcji serverless.
  leadEndpoint: "/api/offer-lead",

  // Klucza Brevo nie wklejaj tutaj. Front jest publiczny.
  // Klucz wkleja się w panelu hostingu jako zmienną środowiskową
  // BREVO_API_KEY dla funkcji serverless.
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
const showRejectSurvey = document.querySelector("#showRejectSurvey");
const rejectForm = document.querySelector("#rejectForm");
const rejectStatus = document.querySelector("#rejectStatus");

function setContactLinks() {
  document.querySelectorAll("[data-contact-email]").forEach((link) => {
    link.textContent = CONFIG.contactEmail;
    link.href = `mailto:${CONFIG.contactEmail}`;
  });

  document.querySelectorAll("[data-contact-instagram]").forEach((link) => {
    link.textContent = CONFIG.instagramUrl;
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
    timestamp: new Date().toISOString(),
    source: "hidden_offer_2027_2028",
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
  // MODUŁ DO PODPIĘCIA BREVO / WEBHOOKA
  // 1. Najbezpieczniej: zostaw leadEndpoint = "/api/offer-lead" i ustaw
  //    BREVO_API_KEY oraz BREVO_LIST_ID_OFFER w panelu Vercela.
  // 2. Dla maila po kliknięciu CTA ustaw też zmienne powiadomień opisane
  //    w INSTRUKCJA.md.
  // 3. Alternatywnie: podmień CONFIG.leadEndpoint na URL webhooka Make/Zapier/Brevo.
  // 4. Nie wklejaj sekretnego klucza API Brevo do tego pliku - front jest publiczny.
  const payload = {
    ...lead,
    ...extra,
    eventName,
    eventTimestamp: new Date().toISOString(),
  };

  if (!CONFIG.leadEndpoint) {
    console.info("[Sobotki Offer] Event captured locally:", payload);
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
    const details = await response.text().catch(() => "");
    throw new Error(details || `Lead event failed with status ${response.status}`);
  }

  return response.json().catch(() => ({ ok: true }));
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
    { threshold: 0.12 }
  );

  elements.forEach((element) => observer.observe(element));
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
    // Oferta celowo odsłania się od razu. Błąd zapisu eventu nie blokuje klienta.
    console.warn("[Sobotki Offer] Nie udało się zapisać eventu oferta_obejrzana", saveError);
  });
});

reserveCta.addEventListener("click", async () => {
  const lead = ensureLeadBeforeFinalAction();
  if (!lead || state.termInquirySent) return;

  ctaStatus.textContent = "";
  reserveCta.disabled = true;
  reserveCta.textContent = "Wysyłamy zapytanie...";

  try {
    await saveLead(EVENTS.termInquiry, lead);
    state.termInquirySent = true;
    ctaStatus.textContent = "Dziękujemy! Odezwiemy się mailowo, żeby potwierdzić dostępność terminu.";
    reserveCta.textContent = "Zapytanie wysłane";
  } catch (error) {
    console.warn("[Sobotki Offer] Nie udało się zapisać eventu zapytanie_o_termin", error);
    ctaStatus.textContent = "Coś poszło nie tak. Spróbuj jeszcze raz albo napisz do nas mailowo.";
    reserveCta.disabled = false;
    reserveCta.textContent = "Jestem zainteresowany — zapytaj o termin";
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
    console.warn("[Sobotki Offer] Nie udało się zapisać eventu odrzucenie", error);
    rejectStatus.textContent = "Nie udało się wysłać odpowiedzi. Spróbuj proszę jeszcze raz.";
  }
});

setContactLinks();
