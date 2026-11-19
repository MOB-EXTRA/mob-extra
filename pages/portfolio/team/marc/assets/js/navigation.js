/* Mobile navigation and automatic section highlighting. */
function initializeNavigation() {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  const setActiveLink = (activeLink) => {
    nav.querySelectorAll('a[href^="#"]').forEach((link) => {
      const isActive = link === activeLink;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  const getSectionLinks = () =>
    Array.from(nav.querySelectorAll('a[href^="#"]'))
      .map((link) => {
        let target = null;
        try {
          const id = decodeURIComponent(link.hash.slice(1));
          target = id ? document.getElementById(id) : null;
        } catch {
          // Ignore malformed fragment links and keep scanning the rest of the nav.
        }
        return { link, target };
      })
      .filter(({ link, target }) => target && link.hash !== "#top");

  const updateActiveLink = () => {
    const topLink = nav.querySelector('a[href="#top"]');
    const headerHeight = document.querySelector(".site-header")?.offsetHeight || 0;
    const marker = window.scrollY + headerHeight + 110;
    const sections = getSectionLinks().sort(
      (first, second) =>
        first.target.getBoundingClientRect().top -
        second.target.getBoundingClientRect().top,
    );
    let currentLink = null;

    sections.forEach(({ link, target }) => {
      if (target.getBoundingClientRect().top + window.scrollY <= marker) {
        currentLink = link;
      }
    });

    setActiveLink(currentLink || topLink);
  };

  nav.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (link) setActiveLink(link);
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
  });

  let updatePending = false;
  window.addEventListener(
    "scroll",
    () => {
      if (updatePending) return;
      updatePending = true;
      window.requestAnimationFrame(() => {
        updateActiveLink();
        updatePending = false;
      });
    },
    { passive: true },
  );
  window.addEventListener("resize", updateActiveLink);

  const navObserver = new MutationObserver(updateActiveLink);
  navObserver.observe(nav, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href"],
  });
  const main = document.querySelector("main");
  if (main) {
    const sectionObserver = new MutationObserver(updateActiveLink);
    sectionObserver.observe(main, { childList: true, subtree: true });
  }

  updateActiveLink();
}

if (document.documentElement.dataset.componentsReady === "true") {
  initializeNavigation();
} else {
  document.addEventListener("site:components-ready", initializeNavigation, { once: true });
}
