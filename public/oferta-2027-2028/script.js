const CONFIG = {
  brandName: "Sobotki Weddings",
  contactEmail: "[email]",
  instagramUrl: "[link]",
  pdfUrl: "/oferta-sw-2027-2028.pdf",

  // Jeśli używasz obecnej strony na Vercelu, zostaw "/api/offer-lead".
  // Jeśli przenosisz folder jako czysty static na Netlify/inny hosting,
  // wpisz tutaj URL webhooka albo swojej funkcji serverless, np.
  // "https://twoja-domena.netlify.app/.netlify/functions/offer-lead".
  leadEndpoint: "/api/offer-lead",

  // Klucza Brevo nie wklejaj tutaj. Front jest publiczny.
  // Klucz wkleja się w panelu hostingu jako zmienną środowiskową
  // BREVO_API_KEY dla funkcji serverless.
};

const state = {
  blockedDates: new Set(),
  offerShown: false,
};

const leadForm = document.querySelector("#leadForm");
const offerContent = document.querySelector("#offerContent");
const availabilityMessage = document.querySelector("#availabilityMessage");
const formError = document.querySelector("#formError");
const dateInput = document.querySelector("#weddingDate");

function setContactLinks() {
  const reserveCta = document.querySelector("#reserveCta");
  if (reserveCta && CONFIG.contactEmail !== "[email]") {
    reserveCta.href = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent("Zapytanie o termin - Sobotki Weddings")}`;
  }

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

async function loadBlockedDates() {
  try {
    const response = await fetch("./blocked-dates.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Blocked dates file not found");
    const dates = await response.json();
    state.blockedDates = new Set(Array.isArray(dates) ? dates : []);
  } catch (error) {
    console.warn("[Sobotki Offer] Nie udało się wczytać blocked-dates.json", error);
    state.blockedDates = new Set();
  }
}

function renderAvailability(dateValue) {
  availabilityMessage.className = "availability-message";
  availabilityMessage.textContent = "";

  if (!dateValue) return;

  if (state.blockedDates.has(dateValue)) {
    availabilityMessage.classList.add("is-blocked");
    availabilityMessage.innerHTML =
      `Ten termin jest już zarezerwowany - <a href="mailto:${CONFIG.contactEmail}">napisz do nas</a>, coś wymyślimy.`;
    return;
  }

  availabilityMessage.classList.add("is-free");
  availabilityMessage.textContent = "Ten termin jest u nas wolny 🎉";
}

function getLeadData() {
  const formData = new FormData(leadForm);
  return {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim().toLowerCase(),
    weddingDate: String(formData.get("weddingDate") || "").trim(),
    timestamp: new Date().toISOString(),
    source: "hidden_offer_2027_2028",
  };
}

function validateLead(lead) {
  if (!lead.name) return "Podaj proszę imię.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return "Podaj poprawny adres e-mail.";
  if (!lead.weddingDate) return "Wybierz proszę datę ślubu.";
  return "";
}

async function saveLead(lead) {
  // MODUŁ DO PODPIĘCIA BREVO / WEBHOOKA
  // 1. Najbezpieczniej: zostaw leadEndpoint = "/api/offer-lead" i ustaw
  //    BREVO_API_KEY oraz BREVO_LIST_ID_OFFER w panelu Vercela.
  // 2. Alternatywnie: podmień CONFIG.leadEndpoint na URL webhooka Make/Zapier/Brevo.
  // 3. Nie wklejaj sekretnego klucza API Brevo do tego pliku - front jest publiczny.
  if (!CONFIG.leadEndpoint) {
    console.info("[Sobotki Offer] Lead captured locally:", lead);
    return { ok: true, skipped: true };
  }

  const response = await fetch(CONFIG.leadEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(lead),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(details || `Lead save failed with status ${response.status}`);
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

dateInput.addEventListener("change", () => renderAvailability(dateInput.value));

leadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formError.textContent = "";

  const lead = getLeadData();
  const error = validateLead(lead);
  if (error) {
    formError.textContent = error;
    return;
  }

  revealOffer();

  saveLead(lead).catch((saveError) => {
    // Oferta celowo odsłania się od razu. Błąd zapisu leada nie blokuje klienta.
    console.warn("[Sobotki Offer] Nie udało się zapisać leada", saveError);
  });
});

setContactLinks();
loadBlockedDates().then(() => renderAvailability(dateInput.value));
