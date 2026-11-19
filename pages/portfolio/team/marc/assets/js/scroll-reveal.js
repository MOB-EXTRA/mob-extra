/* Reveals work and service cards as they enter the viewport. */
function initializeScrollReveal() {
  const targets = document.querySelectorAll(
    ".work-card, .service-card, .about-copy, .about-aside, .contact-wrap > div",
  );

  if (!("IntersectionObserver" in window)) {
    targets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, activeObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        activeObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );

  targets.forEach((target) => observer.observe(target));
}

if (document.documentElement.dataset.componentsReady === "true") {
  initializeScrollReveal();
} else {
  document.addEventListener("site:components-ready", initializeScrollReveal, { once: true });
}
