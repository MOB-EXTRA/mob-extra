(() => {
  const currentScriptUrl =
    document.currentScript && document.currentScript.src;
  if (
    currentScriptUrl &&
    !document.querySelector("script[data-scroll-header-loader]")
  ) {
    const scrollHeaderScript = document.createElement("script");
    scrollHeaderScript.src = new URL("scroll-header.js", currentScriptUrl).href;
    scrollHeaderScript.dataset.scrollHeaderLoader = "true";
    document.head.appendChild(scrollHeaderScript);
  }

  const preferenceKey = "mob-extra-theme";
  const root = document.documentElement;
  const systemPreference = window.matchMedia("(prefers-color-scheme: dark)");
  const portfolioTheme = document.querySelector(
    'meta[name="mob-extra-portfolio"]',
  );
  let preference = "system";

  if (portfolioTheme && ["marc", "vile"].includes(portfolioTheme.content)) {
    root.dataset.portfolioTheme = portfolioTheme.content;
  }

  try {
    const savedPreference = localStorage.getItem(preferenceKey);
    if (["system", "light", "dark"].includes(savedPreference)) {
      preference = savedPreference;
    }
  } catch (error) {
    console.warn("Could not read the saved color theme; using the device setting.", error);
  }

  function applyTheme() {
    const theme =
      preference === "system"
        ? systemPreference.matches
          ? "dark"
          : "light"
        : preference;
    root.dataset.theme = theme;
    root.dataset.themePreference = preference;
    root.style.colorScheme = theme;

    syncPortfolioStylesheet();

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === "light" ? "#f3f7fa" : "#07111e";
    window.dispatchEvent(new CustomEvent("mobextrathemechange", {
      detail: { preference, theme },
    }));
  }

  function syncPortfolioStylesheet() {
    const darkThemeStylesheet = document.querySelector(
      "[data-portfolio-dark-theme]",
    );
    if (darkThemeStylesheet) {
      darkThemeStylesheet.media =
        root.dataset.theme === "dark" ? "all" : "not all";
    }
  }

  window.mobExtraTheme = {
    getPreference: () => preference,
    setPreference(nextPreference) {
      if (!["system", "light", "dark"].includes(nextPreference)) {
        throw new TypeError(`Unsupported color theme preference: ${nextPreference}`);
      }

      preference = nextPreference;
      try {
        localStorage.setItem(preferenceKey, preference);
      } catch (error) {
        console.warn("Could not save the color theme preference for future visits.", error);
      }
      applyTheme();
    },
  };

  applyTheme();
  window.addEventListener("storage", (event) => {
    if (event.key !== preferenceKey && event.key !== null) return;
    preference =
      event.newValue && ["system", "light", "dark"].includes(event.newValue)
        ? event.newValue
        : "system";
    applyTheme();
  });

  if (typeof systemPreference.addEventListener === "function") {
    systemPreference.addEventListener("change", () => {
      if (preference === "system") applyTheme();
    });
  } else if (typeof systemPreference.addListener === "function") {
    systemPreference.addListener(() => {
      if (preference === "system") applyTheme();
    });
  }

  function installPortfolioThemeControl() {
    if (!["marc", "vile"].includes(root.dataset.portfolioTheme)) return;
    if (document.querySelector("[data-portfolio-theme-control]")) return;

    const hostSelectors = [
      ".site-header .header-actions",
      ".hub-header .header-actions",
      ".site-header .nav-wrap",
      ".site-header .header-container",
      ".legal-header-inner",
      ".hub-header .header-top",
      ".app-header .top-nav-bar",
      ".site-nav",
      ".header-container",
      "header",
    ];
    const host = hostSelectors
      .map((selector) => document.querySelector(selector))
      .find((element) => element);

    if (!host) return;

    const control = document.createElement("div");
    control.className = "portfolio-theme-control";
    control.dataset.portfolioThemeControl = "";
    control.innerHTML = `
      <button class="portfolio-theme-toggle" type="button" aria-label="Choose color theme" aria-expanded="false" aria-controls="portfolio-theme-menu">
        <i aria-hidden="true"></i>
      </button>
      <div class="portfolio-theme-menu" id="portfolio-theme-menu" hidden>
        <span class="portfolio-theme-menu-title">Appearance</span>
        <button type="button" data-theme-choice="system" aria-pressed="false"><span>Device default</span><span class="portfolio-theme-hint">Auto</span></button>
        <button type="button" data-theme-choice="light" aria-pressed="false"><span>Light</span><i class="fa-solid fa-sun" aria-hidden="true"></i></button>
        <button type="button" data-theme-choice="dark" aria-pressed="false"><span>Dark</span><i class="fa-solid fa-moon" aria-hidden="true"></i></button>
      </div>`;
    host.append(control);
    syncPortfolioStylesheet();

    const toggle = control.querySelector(".portfolio-theme-toggle");
    const menu = control.querySelector(".portfolio-theme-menu");
    const choices = control.querySelectorAll("[data-theme-choice]");

    function updateControls() {
      const theme = root.dataset.theme;
      toggle.setAttribute("aria-label", `Color theme: ${theme}. Choose appearance.`);
      toggle.innerHTML = `<i class="fa-solid fa-${theme === "light" ? "sun" : "moon"}" aria-hidden="true"></i>`;
      choices.forEach((choice) => {
        choice.setAttribute(
          "aria-pressed",
          String(choice.dataset.themeChoice === window.mobExtraTheme.getPreference()),
        );
      });
    }

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      menu.hidden = expanded;
    });

    choices.forEach((choice) => {
      choice.addEventListener("click", () => {
        window.mobExtraTheme.setPreference(choice.dataset.themeChoice);
        toggle.setAttribute("aria-expanded", "false");
        menu.hidden = true;
        toggle.focus();
      });
    });

    document.addEventListener("click", (event) => {
      if (!control.contains(event.target)) {
        toggle.setAttribute("aria-expanded", "false");
        menu.hidden = true;
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !menu.hidden) {
        toggle.setAttribute("aria-expanded", "false");
        menu.hidden = true;
        toggle.focus();
      }
    });

    window.addEventListener("mobextrathemechange", updateControls);
    updateControls();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installPortfolioThemeControl, {
      once: true,
    });
  } else {
    installPortfolioThemeControl();
  }
})();
