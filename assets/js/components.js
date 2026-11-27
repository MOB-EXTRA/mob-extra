/* Shared shell and sitemap-driven page catalog for the static site. */
(() => {
  const siteRoot = new URL("../../", document.currentScript.src);
  window.siteBase = siteRoot.href;
  const sitePrefix = siteRoot.pathname.replace(/\/$/, "");
  const path = (value) => new URL(value, siteRoot).href;
  const currentPath = window.location.pathname;
  const portfolioRoot = new URL("pages/portfolio/", siteRoot);
  const portfolioIndexUrl = new URL("index.html", portfolioRoot).href;
  const portfolioIndexPath = new URL(portfolioIndexUrl).pathname;
  const isPortfolioIndex = (pathname) => pathname === portfolioRoot.pathname || pathname === portfolioIndexPath;
  const isPortfolioNavigationPage = (page) => {
    const pathname = new URL(page.url).pathname;
    return isPortfolioIndex(pathname) || (pathname.startsWith(portfolioRoot.pathname) && page.section === "more" && Boolean(page.portfolioGroup));
  };
  window.portfolioViewerUrl = (value) => {
    const destination = new URL(value, siteRoot);
    if (destination.origin !== portfolioRoot.origin || !destination.pathname.startsWith(portfolioRoot.pathname) || destination.pathname === portfolioRoot.pathname) return destination.href;
    let source = `${destination.pathname.slice(portfolioRoot.pathname.length)}${destination.search}${destination.hash}`;
    if (/\/(?:index\.html)?$/.test(source) && source !== "index.html") source = `${source.replace(/(?:index\.html)?$/, "")}index.html`;
    const viewer = new URL("view.html", portfolioRoot);
    viewer.searchParams.set("src", source);
    return viewer.href;
  };

  const header = `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header"><div class="container nav-wrap">
      <a class="brand" href="${path("index.html")}"><img src="${path("assets/img/mob-extra.png")}" alt="" width="38" height="38"><span>MOB<span class="brand-accent">EXTRA</span><small>PLAY SMARTER</small></span></a>
      <button class="menu-toggle" aria-expanded="false" aria-label="Open navigation"><span></span><span></span></button>
      <nav class="main-nav" aria-label="Main navigation">
        <a class="${currentPath === `${sitePrefix}/index.html` || currentPath === `${sitePrefix}/` ? "active" : ""}" href="${path("index.html")}">Home</a>
        <div class="nav-group" data-nav-group="hubs"><a class="${currentPath.includes("/pages/hubs/") ? "active" : ""}" href="${path("pages/hubs/index.html")}">Hubs <span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></span></a><div class="nav-menu"><a href="${path("pages/hubs/index.html")}">All game hubs</a></div></div>
        <div class="nav-group" data-nav-group="tools"><a class="${currentPath.includes("/pages/tools/") ? "active" : ""}" href="${path("pages/tools/index.html")}">Tools <span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></span></a><div class="nav-menu"><a href="${path("pages/tools/index.html")}">All tools</a></div></div>
        <div class="nav-group" data-nav-group="more"><a href="${path("pages/portfolio/index.html")}">More <span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></span></a><div class="nav-menu"><a href="${path("pages/portfolio/index.html")}">Portfolios</a><a href="${path("pages/services/index.html")}">Services</a><a href="${path("pages/about.html")}">About MOB EXTRA</a></div></div>
        <a class="nav-cta ${currentPath.endsWith("/contact.html") ? "active" : ""}" href="${path("pages/contact.html")}">Get in touch <span><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></span></a>
      </nav>
    </div></header>`;

  const footer = `
    <footer class="site-footer"><div class="container footer-main">
      <div class="footer-brand"><a class="brand" href="${path("index.html")}"><img src="${path("assets/img/mob-extra.png")}" alt="" width="38" height="38"><span>MOB<span class="brand-accent">EXTRA</span><small>PLAY SMARTER</small></span></a><p>Independent resources for mobile players.<br>Made with curiosity and care.</p></div>
      <div class="footer-col"><span>EXPLORE</span><a href="${path("pages/hubs/codm/codm-redeem-codes-hub.html")}">CODM redeem codes</a><a href="${path("pages/hubs/codm/codm-ptb-download.html")}">CODM test builds</a><a href="${path("pages/hubs/mlbb/mlbb-redeem-codes-hub.html")}">MLBB redeem codes</a><a href="${path("pages/tools/index.html")}">Player tools</a></div>
      <div class="footer-col"><span>PEOPLE &amp; SERVICES</span><a href="${path("pages/portfolio/index.html")}">Portfolios</a><a href="${path("pages/portfolio/view.html?src=team%2Fmarc%2F")}">Marc Johnford</a><a href="${path("pages/portfolio/view.html?src=team%2Fcarl%2F")}">Carl Vincent</a><a href="${path("pages/services/index.html")}">Professional services</a></div>
      <div class="footer-col"><span>ABOUT &amp; LEGAL</span><a href="${path("pages/about.html")}">About MOB EXTRA</a><a href="${path("pages/editorial.html")}">Editorial policy</a><a href="${path("pages/contact.html")}">Contact</a><a href="${path("pages/privacy.html")}">Privacy policy</a><a href="${path("pages/terms.html")}">Terms of use</a></div>
    </div><div class="container footer-bottom"><span>© <span data-year>2026</span> MOB EXTRA</span><span>Built for players, wherever you play.</span><a href="#main">Back to top <i class="fa-solid fa-arrow-up" aria-hidden="true"></i></a></div></footer>`;

  document.querySelectorAll("[data-site-header]").forEach((node) => node.outerHTML = header);
  document.querySelectorAll("[data-site-footer]").forEach((node) => node.outerHTML = footer);

  const motionScript = document.createElement("script");
  motionScript.src = path("assets/js/animations/replay.js");
  motionScript.dataset.motionReplay = "";
  document.body.append(motionScript);

  const reviewBootstrap = document.createElement("script");
  reviewBootstrap.type = "module";
  reviewBootstrap.src = path("assets/js/review-bootstrap.js");
  reviewBootstrap.dataset.reviewBootstrap = "";
  document.body.append(reviewBootstrap);

  const getMeta = (doc, name) => doc.querySelector(`meta[name="${name}"]`)?.content?.trim() || "";
  window.siteCatalogReady = fetch(path("sitemap.xml"))
    .then((response) => { if (!response.ok) throw new Error("Sitemap unavailable"); return response.text(); })
    .then((xml) => new DOMParser().parseFromString(xml, "application/xml"))
    .then(async (sitemap) => {
      const urls = [...sitemap.querySelectorAll("loc")]
        .map((loc) => {
          const publishedPath = new URL(loc.textContent.trim()).pathname;
          const marker = "/mob-extra/";
          const markerIndex = publishedPath.indexOf(marker);
          if (markerIndex < 0) return null;
          return new URL(publishedPath.slice(markerIndex + marker.length), siteRoot);
        })
        .filter((url) => url && url.pathname.startsWith(`${sitePrefix}/pages/`));
      const pages = await Promise.all(urls.map(async (url) => {
        try {
          const response = await fetch(url.href);
          if (!response.ok) return null;
          const doc = new DOMParser().parseFromString(await response.text(), "text/html");
          const section = getMeta(doc, "nav-section");
          const label = getMeta(doc, "nav-label");
          if (!section || !label) return null;
          const directoryImage = getMeta(doc, "directory-image");
          const directoryLogo = getMeta(doc, "directory-logo");
          return {
            section,
            label,
            reviewCategory: getMeta(doc, "review-category"),
            reviewFeature: getMeta(doc, "review-feature"),
            portfolioGroup: getMeta(doc, "portfolio-group"),
            description: getMeta(doc, "nav-description") || getMeta(doc, "description"),
            directoryTitle: getMeta(doc, "directory-title") || label,
            directoryKicker: getMeta(doc, "directory-kicker") || "PORTFOLIO",
            url: url.href,
            image: directoryImage ? new URL(directoryImage, url).href : "",
            imageAlt: getMeta(doc, "directory-image-alt") || `${label} preview`,
            imageFit: getMeta(doc, "directory-image-fit"),
            logo: directoryLogo ? new URL(directoryLogo, url).href : "",
            logoAlt: getMeta(doc, "directory-logo-alt") || `${label} logo`,
          };
        } catch { return null; }
      }));
      const catalog = pages.filter(Boolean);
      for (const section of ["hubs", "tools", "more"]) {
        const group = document.querySelector(`[data-nav-group="${section}"] .nav-menu`);
        if (!group) continue;
        const selected = catalog.filter((page) => page.section === section);
        if (section === "tools") group.innerHTML = `<a href="${path("pages/tools/index.html")}">All tools</a>`;
        else if (section === "hubs") group.innerHTML = `<a href="${path("pages/hubs/index.html")}">All game hubs</a>`;
        else group.replaceChildren();
        const navigationPages = section === "more"
          ? selected.filter(isPortfolioNavigationPage)
          : selected;
        navigationPages.forEach((page) => {
          const link = document.createElement("a");
          const pagePath = new URL(page.url).pathname;
          link.href = section !== "more"
            ? page.url
            : isPortfolioIndex(pagePath) ? portfolioIndexUrl : window.portfolioViewerUrl(page.url);
          link.textContent = page.label;
          if (pagePath === currentPath || (isPortfolioIndex(pagePath) && isPortfolioIndex(currentPath))) link.setAttribute("aria-current", "page");
          group.append(link);
        });
      }
      renderTicker(catalog);
      window.dispatchEvent(new CustomEvent("sitecatalogready", { detail: catalog }));
      return catalog;
    })
    .catch(() => []);

  function renderTicker(catalog) {
    const track = document.querySelector("[data-ticker-track]");
    if (!track) return;
    const destinations = catalog.filter((page) => {
      if (!["hubs", "tools", "more"].includes(page.section)) return false;
      if (page.section !== "more") return true;
      const pagePath = new URL(page.url).pathname;
      return isPortfolioNavigationPage(page);
    });
    if (!destinations.length) return;

    const makeSet = (hidden) => {
      const set = document.createElement("div");
      set.className = "ticker-set";
      if (hidden) set.setAttribute("aria-hidden", "true");
      destinations.forEach((page, index) => {
        const link = document.createElement("a");
        link.className = "ticker-item";
        const pagePath = new URL(page.url).pathname;
        link.href = page.section !== "more"
          ? page.url
          : isPortfolioIndex(pagePath) ? portfolioIndexUrl : window.portfolioViewerUrl(page.url);
        link.textContent = page.label.toLocaleUpperCase();
        if (hidden) link.tabIndex = -1;
        set.append(link);
        if (index < destinations.length - 1) {
          const separator = document.createElement("b");
          separator.setAttribute("aria-hidden", "true");
          const icon = document.createElement("i");
          icon.className = "fa-solid fa-sparkles";
          icon.setAttribute("aria-hidden", "true");
          separator.append(icon);
          set.append(separator);
        }
      });
      return set;
    };

    track.replaceChildren(makeSet(false), makeSet(true));
    const firstSet = track.querySelector(".ticker-set");
    const pixelsPerSecond = 42;
    track.style.animationDuration = `${Math.max(22, firstSet.scrollWidth / pixelsPerSecond)}s`;
    track.dataset.ready = "true";
  }
})();
