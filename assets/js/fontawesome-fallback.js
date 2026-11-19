(() => {
  const fallbackGlyphs = {
    "fa-house": "⌂", "fa-home": "⌂", "fa-house-chimney": "⌂",
    "fa-arrow-left": "←", "fa-arrow-right": "→",
    "fa-arrow-up-right-from-square": "↗", "fa-share-nodes": "↗",
    "fa-play": "▶", "fa-xmark": "×", "fa-youtube": "YT",
    "fa-ticket": "▱", "fa-magnifying-glass": "⌕",
    "fa-arrow-down-short-wide": "↕", "fa-envelope": "✉",
    "fa-headset": "◉", "fa-layer-group": "▤", "fa-code": "</>",
    "fa-terminal": ">_", "fa-diagram-project": "⑂",
    "fa-file-excel": "X", "fa-cube": "◆", "fa-compass-drafting": "⌖",
    "fa-star": "★", "fa-paper-plane": "➤", "fa-video": "▶",
    "fa-tiktok": "♪", "fa-facebook-f": "f", "fa-x-twitter": "X",
    "fa-envelope-open-text": "✉", "fa-at": "@", "fa-copy": "▢",
    "fa-download": "↓", "fa-font": "A", "fa-gift": "◇",
    "fa-users-viewfinder": "◎", "fa-reddit-alien": "●",
    "fa-screwdriver-wrench": "⚒", "fa-basket-shopping": "▱",
    "fa-users": "♟", "fa-handshake": "↔", "fa-angle-right": "›",
    "fa-code-branch": "⑂", "fa-person-digging": "⚒",
    "fa-circle-check": "✓", "fa-certificate": "✦",
    "fa-calculator": "▦", "fa-check": "✓", "fa-images": "▧",
    "fa-phone": "☎", "fa-chart-line": "↗", "fa-helmet-safety": "◉",
    "fa-shield-halved": "⛨", "fa-circle-info": "ⓘ",
    "fa-circle-notch": "◌", "fa-bell": "♢", "fa-android": "d",
    "fa-apple": "A", "fa-user-shield": "⛨", "fa-triangle-exclamation": "⚠",
    "fa-circle-exclamation": "⚠", "fa-key": "⚿", "fa-wifi": "⌁",
    "fa-calendar-check": "▣", "fa-list-check": "☷", "fa-server": "▤",
    "fa-link": "↗", "fa-face-confused": "?", "fa-bolt": "ϟ",
    "fa-comments": "▤", "fa-sparkles": "✦", "fa-gamepad": "▣",
    "fa-flask": "⚗", "fa-toolbox": "▣", "fa-lightbulb": "◉",
    "fa-comment-dots": "✉", "fa-award": "★", "fa-coins": "◉",
    "fa-thumbtack": "•", "fa-globe": "◎", "fa-chevron-down": "⌄",
    "fa-arrow-down": "↓", "fa-arrow-up": "↑",
    "fa-arrow-down-right-from-square": "↘", "fa-hand": "✋",
    "fa-circle": "•", "fa-grip": "⠿"
  };

  function renderFallback(root = document) {
    document.documentElement.classList.add("fa-unavailable");
    const icons = [];
    if (root.matches?.("i[class]")) icons.push(root);
    icons.push(...(root.querySelectorAll?.("i[class]") || []));
    icons.forEach((icon) => {
      const key = [...icon.classList].find((name) => fallbackGlyphs[name]);
      if (!key || icon.dataset.faFallback) return;
      // Keep the icon element empty: replacing textContent can destroy labels or
      // other accessible text supplied by the page. Render only a visual glyph.
      icon.dataset.faFallback = fallbackGlyphs[key];
    });
  }

  new MutationObserver((records) => {
    if (!document.documentElement.classList.contains("fa-unavailable")) return;
    records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) renderFallback(node);
    }));
  }).observe(document.documentElement, { childList: true, subtree: true });

  if (document.documentElement.classList.contains("fa-unavailable")) renderFallback();

  const stylesheet = [...document.styleSheets].find((sheet) =>
    sheet.href && sheet.href.includes("fontawesome-free@7.3.1")
  );
  if (!stylesheet) renderFallback();
  else {
    window.addEventListener("load", async () => {
      if (!document.fonts) return;
      const fontsInUse = [];
      if (document.querySelector('i.fa-solid, i.fa-classic:not(.fa-regular)')) {
        fontsInUse.push({ family: "Font Awesome 7 Free", weight: 900, glyph: "\uf015" });
      }
      if (document.querySelector("i.fa-regular")) {
        fontsInUse.push({ family: "Font Awesome 7 Free", weight: 400, glyph: "\uf005" });
      }
      if (document.querySelector("i.fa-brands")) {
        fontsInUse.push({ family: "Font Awesome 7 Brands", weight: 400, glyph: "\uf179" });
      }
      try {
        const results = await Promise.all(fontsInUse.map(async ({ family, weight, glyph }) => {
          const descriptor = `${weight} 16px "${family}"`;
          const loaded = await document.fonts.load(descriptor, glyph);
          return loaded.length > 0 && document.fonts.check(descriptor, glyph);
        }));
        if (results.some((loaded) => !loaded)) renderFallback();
      } catch {
        renderFallback();
      }
    }, { once: true });
    stylesheet.onerror = renderFallback;
  }
})();
