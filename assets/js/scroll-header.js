(() => {
  const scriptUrl = document.currentScript && document.currentScript.src;
  if (scriptUrl && document.head) {
    const stylesheetUrl = new URL("../css/scroll-header.css", scriptUrl).href;
    const stylesheetExists = Array.from(
      document.querySelectorAll('link[rel="stylesheet"]'),
    ).some((link) => link.href === stylesheetUrl);

    if (!stylesheetExists) {
      const stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = stylesheetUrl;
      document.head.appendChild(stylesheet);
    }
  }

  const headerSelector = [
    "header",
    '[role="banner"]',
    ".site-header",
    ".legal-header",
    ".hub-header",
    ".app-header",
    ".site-nav",
    ".top-nav-bar",
    ".header-top",
  ].join(", ");

  let groups = [];
  let lastScrollY = window.scrollY || 0;
  let animationFramePending = false;
  let listenersInstalled = false;

  function isTopPinned(element) {
    const style = window.getComputedStyle(element);
    const top = Number.parseFloat(style.top);
    return (
      (style.position === "fixed" || style.position === "sticky") &&
      Number.isFinite(top) &&
      top >= -12 &&
      top <= 12
    );
  }

  function setHidden(hidden) {
    groups.forEach(({ header, companion }) => {
      if (hidden) {
        header.dataset.scrollHeaderHidden = "true";
        if (companion) {
          companion.dataset.scrollHeaderHidden = "true";
        }
      } else {
        delete header.dataset.scrollHeaderHidden;
        if (companion) {
          delete companion.dataset.scrollHeaderHidden;
        }
      }
    });
  }

  function updateCompanionOffsets() {
    groups.forEach(({ header, companion }) => {
      if (!companion) return;
      const offset =
        header.getBoundingClientRect().height +
        companion.getBoundingClientRect().height;
      companion.style.setProperty(
        "--scroll-header-hide-offset",
        `-${Math.ceil(offset)}px`,
      );
    });
  }

  function headerHasKeyboardFocusOrOpenMenu(header) {
    return (
      header.matches(":focus-visible") ||
      Boolean(header.querySelector(":focus-visible")) ||
      Boolean(
        header.querySelector(
          '[aria-expanded="true"], .menu-open, .nav-open, .open',
        ),
      )
    );
  }

  function handleScroll() {
    animationFramePending = false;
    const currentScrollY = Math.max(window.scrollY || 0, 0);

    if (currentScrollY <= 80) {
      setHidden(false);
      lastScrollY = currentScrollY;
      return;
    }

    const delta = currentScrollY - lastScrollY;
    if (Math.abs(delta) >= 5) {
      if (delta > 0) {
        const keepVisible = groups.some(({ header }) =>
          headerHasKeyboardFocusOrOpenMenu(header),
        );
        setHidden(!keepVisible);

        if (!keepVisible) {
          document
            .querySelectorAll(".filter-dropdown-menu.active")
            .forEach((menu) => menu.classList.remove("active"));
        }
      } else {
        setHidden(false);
      }
      lastScrollY = currentScrollY;
    }
  }

  function installListeners() {
    if (listenersInstalled) return;
    listenersInstalled = true;

    window.addEventListener(
      "scroll",
      () => {
        if (animationFramePending) return;
        animationFramePending = true;
        window.requestAnimationFrame(handleScroll);
      },
      { passive: true },
    );

    document.addEventListener("focusin", (event) => {
      if (
        groups.some(({ header }) => header.contains(event.target)) &&
        groups.some(({ header }) =>
          header.hasAttribute("data-scroll-header-hidden"),
        )
      ) {
        setHidden(false);
      }
    });
  }

  function initialize() {
    const pinnedHeaders = Array.from(
      document.querySelectorAll(headerSelector),
    ).filter(isTopPinned);
    const headers = pinnedHeaders.filter(
      (element) =>
        !pinnedHeaders.some(
          (ancestor) => ancestor !== element && ancestor.contains(element),
        ),
    );
    const newHeaders = headers.filter(
      (header) => !groups.some((group) => group.header === header),
    );

    groups.push(
      ...newHeaders.map((header) => {
        header.dataset.scrollHeader = "true";
        return { header, companion: null };
      }),
    );

    const companion = document.querySelector(".quick-ticker-bar");
    groups.forEach((group) => {
      if (!group.companion && group.header.matches(".site-header") && companion) {
        group.companion = companion;
        companion.dataset.scrollHeaderCompanion = "true";
        if (group.header.hasAttribute("data-scroll-header-hidden")) {
          companion.dataset.scrollHeaderHidden = "true";
        }
      }
    });

    if (groups.length === 0) return;

    installListeners();
    updateCompanionOffsets();
  }

  function start() {
    initialize();
    const observedSelector = `${headerSelector}, .quick-ticker-bar`;
    const observer = new MutationObserver((records) => {
      const addedHeader = records.some((record) =>
        Array.from(record.addedNodes).some(
          (node) =>
            node instanceof Element &&
            (node.matches(observedSelector) ||
              Boolean(node.querySelector(observedSelector))),
        ),
      );
      if (addedHeader) initialize();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    window.addEventListener("load", initialize, { once: true });
    window.addEventListener(
      "resize",
      () => {
        initialize();
        updateCompanionOffsets();
      },
      { passive: true },
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
