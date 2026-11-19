/* Applies editable brand details, external links, and image paths from site-config.js. */
function initializeBrandLinks() {
  const config = window.SITE_CONFIG;
  if (!config) return;

  document.querySelectorAll("[data-brand-accent]").forEach((element) => {
    element.textContent = config.brandAccent;
  });
  document.querySelectorAll("[data-brand-nickname]").forEach((element) => {
    element.textContent = config.nickname;
  });
  document.querySelectorAll("[data-brand-project]").forEach((element) => {
    element.textContent = config.projectName;
  });
  document.querySelectorAll("[data-site-link]").forEach((element) => {
    const destination = config.links?.[element.dataset.siteLink];
    if (destination) element.href = destination;
  });
  document.querySelectorAll("[data-site-email]").forEach((element) => {
    element.textContent = config.links?.emailAddress || "";
  });
  document.querySelectorAll("[data-site-asset]").forEach((element) => {
    const assetPath = config.assets?.[element.dataset.siteAsset];
    if (!assetPath) return;
    const fallbackPath = config.assets?.portfolioIcon || config.assets?.fallbackSiteIcon;

    if (element instanceof HTMLImageElement) {
      element.addEventListener(
        "error",
        () => {
          if (fallbackPath && element.src !== new URL(fallbackPath, document.baseURI).href) {
            element.src = fallbackPath;
          }
        },
        { once: true },
      );
      element.src = window.getSiteAssetUrl?.(assetPath) || assetPath;
    } else if (element instanceof HTMLLinkElement) {
      element.addEventListener(
        "error",
        () => {
          if (fallbackPath) element.href = fallbackPath;
        },
        { once: true },
      );
      element.href = window.getSiteAssetUrl?.(assetPath) || assetPath;
    }
  });
}

if (document.documentElement.dataset.componentsReady === "true") {
  initializeBrandLinks();
} else {
  document.addEventListener("site:components-ready", initializeBrandLinks, { once: true });
}
