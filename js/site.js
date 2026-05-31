/* ============================================================
   Blue Horizon — marketing site behaviour
   Plain vanilla JS, no build step, no dependencies.
   ============================================================ */

/* ------------------------------------------------------------
   CONFIG — the only things you normally edit
   ------------------------------------------------------------ */

// Team section: 'anonymous' (leadership-style, no names) or 'named'.
// Flip this single value to switch the live site.
const TEAM_MODE = "anonymous";

// Web3Forms access key. Get one free at https://web3forms.com (enter
// contact@blue-horizon.xyz, confirm once). Paste the key here.
// While left as the placeholder, the form falls back to a mailto: draft.
const WEB3FORMS_KEY = "REPLACE-WITH-WEB3FORMS-ACCESS-KEY";

const CONTACT_EMAIL = "contact@blue-horizon.xyz";

/* ------------------------------------------------------------
   Boot
   ------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  initYear();
  initHeaderScroll();
  initMobileNav();
  initTeamMode();
  initReveal();
  initContactForm();
});

/* Current year in footer */
function initYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
}

/* Header gets a border/shadow once scrolled */
function initHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* Mobile nav toggle + auto-close on link click */
function initMobileNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");
  if (!toggle || !nav) return;
  const close = () => { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); };
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
}

/* Apply team display mode (anonymous / named) */
function initTeamMode() {
  const team = document.getElementById("team");
  if (!team) return;
  team.dataset.mode = TEAM_MODE === "named" ? "named" : "anonymous";
}

/* Reveal-on-scroll via IntersectionObserver */
function initReveal() {
  const items = document.querySelectorAll(".reveal-up");
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  items.forEach((el) => io.observe(el));
}

/* ------------------------------------------------------------
   Contact form — Web3Forms submit (with mailto fallback)
   ------------------------------------------------------------ */
function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;
  const note = document.getElementById("cf-note");
  const submit = document.getElementById("cf-submit");

  const setNote = (msg, type) => {
    note.textContent = msg || "";
    note.className = "form-note" + (type ? " " + type : "");
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setNote("");

    // Honeypot — silently drop bots
    if (form.elements["botcheck"] && form.elements["botcheck"].value) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = {
      name: form.elements["name"].value.trim(),
      email: form.elements["email"].value.trim(),
      company: form.elements["company"].value.trim(),
      message: form.elements["message"].value.trim(),
    };

    // Fallback: no key configured yet → open a pre-filled email draft
    if (!WEB3FORMS_KEY || WEB3FORMS_KEY.includes("REPLACE")) {
      const subject = encodeURIComponent(`Website enquiry — ${data.name}`);
      const body = encodeURIComponent(
        `Name: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company}\n\n${data.message}`
      );
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      setNote("Opening your email app… (the form isn't connected yet)", "ok");
      return;
    }

    const payload = {
      access_key: WEB3FORMS_KEY,
      subject: `New enquiry from ${data.name} — blue-horizon.xyz`,
      from_name: "Blue Horizon website",
      name: data.name,
      email: data.email,
      company: data.company || "—",
      message: data.message,
    };

    submit.disabled = true;
    submit.textContent = "Sending…";
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.success) {
        form.dataset.state = "sent";
      } else {
        throw new Error(out.message || "Submission failed");
      }
    } catch (err) {
      setNote(`Sorry, something went wrong. Please email ${CONTACT_EMAIL}.`, "err");
    } finally {
      submit.disabled = false;
      submit.textContent = "Send message";
    }
  });
}
