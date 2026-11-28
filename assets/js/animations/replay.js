/* Replays entrance and CSS keyframe motion every time it enters the viewport. */
(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const revealSelector = [
    "[data-reveal]", ".animate-on-scroll", ".animate-fade-left", ".animate-fade-right", ".animate-scale-up",
    ".work-card", ".service-card", ".about-copy", ".about-aside", ".contact-wrap > div",
    ".content-section .section-container", ".experience-panel", ".hero-actions", ".hero-content",
    ".hero-image-wrapper", ".services-section", ".services-grid .service-box", ".utilities-section",
    ".contact-section", ".community-intel-section", "[data-service-reviews]", "[data-review-dashboard]", "[data-review-trend]",
    ".hero-section .portrait-column", ".hero-section .intro-column", ".hero-section .content-column",
  ].join(",");
  const observed = new WeakSet();
  const scanned = new WeakSet();
  const registered = new Set();
  let observer;
  let scanQueued = false;
  const pendingRoots = new Map();

  document.documentElement.classList.add("js");

  const hasKeyframeMotion = (element) => {
    const name = getComputedStyle(element).animationName;
    return name && name.split(",").some((item) => item.trim() !== "none");
  };

  const restartKeyframes = (element) => {
    if (!hasKeyframeMotion(element)) return;
    const keyframes = element.getAnimations?.().filter(
      (animation) => typeof animation.animationName === "string",
    );
    if (keyframes?.length) {
      keyframes.forEach((animation) => {
        animation.cancel();
        animation.play();
      });
      return;
    }
    const originalName = element.style.animationName;
    element.style.animationName = "none";
    void element.offsetWidth;
    requestAnimationFrame(() => {
      if (originalName) element.style.animationName = originalName;
      else element.style.removeProperty("animation-name");
    });
  };

  const observeElement = (element, force = false) => {
    if (!(element instanceof Element)) return;
    if (scanned.has(element) && !force) return;
    scanned.add(element);
    if (observed.has(element)) return;
    const reveal = element.matches(revealSelector);
    const animated = hasKeyframeMotion(element);
    if (!reveal && !animated) return;
    observed.add(element);
    registered.add(element);
    if (reducedMotion.matches || !observer) {
      if (reveal) element.classList.add("is-visible");
      return;
    }
    observer.observe(element);
  };

  const scan = (root = document, force = false) => {
    if (root instanceof Element) observeElement(root, force);
    root.querySelectorAll?.("*").forEach((element) => observeElement(element, force));
  };

  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target;
        if (entry.isIntersecting) {
          element.classList.add("is-visible");
          restartKeyframes(element);
          element.dispatchEvent(new CustomEvent("site:motion-enter", { bubbles: true, detail: { element } }));
        } else {
          element.classList.remove("is-visible");
          element.dispatchEvent(new CustomEvent("site:motion-leave", { bubbles: true, detail: { element } }));
        }
      });
    }, { threshold: 0, rootMargin: "0px 0px -4% 0px" });
  }

  const queueScan = (root, force = false) => {
    const target = root || document;
    pendingRoots.set(target, pendingRoots.get(target) || force);
    if (scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(() => {
      scanQueued = false;
      const roots = [...pendingRoots];
      pendingRoots.clear();
      roots.forEach(([entry, shouldForce]) => scan(entry, shouldForce));
    });
  };

  const normalizedVisibilityClass = (value) =>
    ` ${String(value || "").replace(/\s+/g, " ").trim()} `
      .replace(" is-visible ", " ")
      .replace(/\s+/g, " ")
      .trim();

  scan();
  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) queueScan(node);
      });
      else if (mutation.target instanceof Element) {
        if (
          mutation.attributeName === "class" &&
          normalizedVisibilityClass(mutation.oldValue) ===
            normalizedVisibilityClass(mutation.target.getAttribute("class"))
        ) return;
        queueScan(mutation.target, true);
      }
    });
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ["class", "style", "data-reveal"],
  });

  reducedMotion.addEventListener?.("change", () => {
    if (reducedMotion.matches) {
      document.querySelectorAll(revealSelector).forEach((element) => element.classList.add("is-visible"));
      observer?.disconnect();
    } else {
      registered.forEach((element) => observer?.observe(element));
    }
  });
})();
