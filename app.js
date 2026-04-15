// helpers
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* -------------------------
   Mobile menu
-------------------------- */
const menuBtn = $("#menuBtn");
const mobileMenu = $("#mobileMenu");
menuBtn?.addEventListener("click", () => mobileMenu.classList.toggle("hidden"));
$$('#mobileMenu a').forEach(a => a.addEventListener("click", () => mobileMenu.classList.add("hidden")));

/* -------------------------
   Smooth scroll
-------------------------- */
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;

  const href = a.getAttribute("href");
  if (!href || href === "#") return;

  const target = document.querySelector(href);
  if (!target) return;

  e.preventDefault();
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", href);
});

/* -------------------------
   Scroll progress bar
-------------------------- */
const progress = $("#progress");
function updateProgress() {
  const st = window.scrollY || document.documentElement.scrollTop;
  const h = document.documentElement.scrollHeight - window.innerHeight;
  const p = h > 0 ? (st / h) * 100 : 0;
  progress.style.width = `${p}%`;
}
window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

/* -------------------------
   Reveal on scroll
-------------------------- */
const revealEls = $$(".reveal");
const io = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add("is-in");
      io.unobserve(en.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

/* -------------------------
   Active nav highlight
-------------------------- */
const navLinks = $$(".navlink");
const sections = ["home","showcase","work","services","contact"]
  .map(id => document.getElementById(id))
  .filter(Boolean);

const activeIO = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const id = "#" + en.target.id;
    navLinks.forEach(a => {
      if (a.getAttribute("href") === id) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  });
}, { threshold: 0.55 });

sections.forEach(s => activeIO.observe(s));

/* -------------------------
   Counters (one-time)
-------------------------- */
const counterIO = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const el = en.target;
    const to = Number(el.dataset.to || 0);
    const start = performance.now();
    const dur = 900;

    const tick = (t) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * eased);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    counterIO.unobserve(el);
  });
}, { threshold: 0.65 });
$$(".count").forEach(el => counterIO.observe(el));

/* -------------------------
   Tilt effect (hover only)
-------------------------- */
function attachTilt(el) {
  if (prefersReduce) return;

  const max = 7;
  const z = 10;

  function onMove(e) {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const ry = (px - 0.5) * max * 2;
    const rx = -(py - 0.5) * max * 2;
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${z}px)`;
  }
  function onLeave() {
    el.style.transform = `perspective(900px) rotateX(0) rotateY(0) translateZ(0)`;
  }

  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", onLeave);
}
$$("[data-tilt]").forEach(attachTilt);

/* -------------------------
   Hero parallax (mouse only)
   (This does NOT move by itself)
-------------------------- */
const hero = $("#heroParallax");
if (hero && !prefersReduce) {
  const items = $$("[data-depth]", hero);

  hero.addEventListener("mousemove", (e) => {
    const r = hero.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height;

    items.forEach(el => {
      const depth = Number(el.dataset.depth || 0.6);
      el.style.translate = `${dx * 18 * depth}px ${dy * 18 * depth}px`;
    });
  });

  hero.addEventListener("mouseleave", () => {
    items.forEach(el => el.style.translate = `0px 0px`);
  });
}

/* -------------------------
   MOBILE SHOWCASE carousel (MANUAL ONLY)
   - NO setInterval
   - No autoplay
-------------------------- */
const track = $("#showcaseTrack");
const scPrev = $("#scPrev");
const scNext = $("#scNext");
const dotsWrap = $("#scDots");

let scIndex = 0;

function slides() {
  return track ? $$(".showcase-slide", track) : [];
}

function updateDots() {
  if (!dotsWrap) return;
  const ds = $$(".dotbtn", dotsWrap);
  ds.forEach((d, i) => d.setAttribute("aria-current", i === scIndex ? "true" : "false"));
}

function buildDots() {
  if (!dotsWrap) return;
  dotsWrap.innerHTML = "";

  slides().forEach((_, i) => {
    const b = document.createElement("button");
    b.className = "dotbtn";
    b.type = "button";
    b.setAttribute("aria-label", `Go to slide ${i + 1}`);
    b.addEventListener("click", () => scrollToIndex(i));
    dotsWrap.appendChild(b);
  });

  updateDots();
}

function scrollToIndex(i) {
  const s = slides();
  if (!track || s.length === 0) return;

  scIndex = (i + s.length) % s.length;
  s[scIndex].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  updateDots();
}

function setIndexFromScroll() {
  if (!track) return;
  const s = slides();
  if (s.length === 0) return;

  const tr = track.getBoundingClientRect();
  const center = tr.left + tr.width / 2;

  let best = 0;
  let bestDist = Infinity;

  s.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const c = r.left + r.width / 2;
    const dist = Math.abs(center - c);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });

  scIndex = best;
  updateDots();
}

if (track) {
  buildDots();

  // Update dots when user swipes/scrolls (no auto scroll)
  track.addEventListener("scroll", () => {
    if (track._raf) cancelAnimationFrame(track._raf);
    track._raf = requestAnimationFrame(setIndexFromScroll);
  }, { passive: true });

  scPrev?.addEventListener("click", () => scrollToIndex(scIndex - 1));
  scNext?.addEventListener("click", () => scrollToIndex(scIndex + 1));
}

/* -------------------------
   Contact form toast (no auto scrolling)
-------------------------- */
const form = $("#contactForm");
const toast = $("#formToast");
form?.addEventListener("submit", (e) => {
  e.preventDefault();
  toast.classList.remove("hidden");

  if (!prefersReduce && toast.animate) {
    toast.animate(
      [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0px)" }],
      { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" }
    );
  }

  form.reset();
  setTimeout(() => toast.classList.add("hidden"), 3200);
});

/* -------------------------
   Project modal
-------------------------- */
const modal = $("#modal");
const modalBackdrop = $("#modalBackdrop");
const modalPanel = $("#modalPanel");
const closeModal = $("#closeModal");
const mTitle = $("#mTitle");
const mYear = $("#mYear");
const mTags = $("#mTags");
const mDesc = $("#mDesc");
const mImg = $("#mImg");
const modalNext = $("#modalNext");

const projectButtons = $$(".openModal");
let lastProjectIndex = 0;

function openProject(i) {
  const btn = projectButtons[i];
  if (!btn) return;

  lastProjectIndex = i;
  mTitle.textContent = btn.dataset.title || "Project";
  mYear.textContent = btn.dataset.year || "";
  mTags.textContent = btn.dataset.tags || "";
  mDesc.textContent = btn.dataset.desc || "";
  mImg.src = btn.dataset.img || "";

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  if (!prefersReduce && modalPanel?.animate) {
    modalPanel.animate(
      [{ opacity: 0, transform: "translateY(12px) scale(.985)" }, { opacity: 1, transform: "translateY(0px) scale(1)" }],
      { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" }
    );
  }
}

function closeProject() {
  if (modal.classList.contains("hidden")) return;

  if (!prefersReduce && modalPanel?.animate) {
    const anim = modalPanel.animate(
      [{ opacity: 1, transform: "translateY(0px) scale(1)" }, { opacity: 0, transform: "translateY(10px) scale(.99)" }],
      { duration: 160, easing: "ease", fill: "both" }
    );
    anim.onfinish = () => {
      modal.classList.add("hidden");
      document.body.style.overflow = "";
    };
  } else {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }
}

projectButtons.forEach((btn, i) => btn.addEventListener("click", () => openProject(i)));
modalBackdrop?.addEventListener("click", closeProject);
closeModal?.addEventListener("click", closeProject);
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeProject(); });

modalNext?.addEventListener("click", () => {
  if (projectButtons.length === 0) return;
  openProject((lastProjectIndex + 1) % projectButtons.length);
});

/* -------------------------
   Footer year
-------------------------- */
const y = $("#year");
if (y) y.textContent = new Date().getFullYear();