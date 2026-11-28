const SITE_ROOT = new URL("../../../", import.meta.url);
let catalogPromise;

function getMeta(document, name) {
  return (
    document
      .querySelector(`meta[name="${name}"]`)
      ?.content?.trim() || ""
  );
}

function normalizePath(pathname) {
  return pathname.replace(/index\.html$/i, "").replace(/\/+$/, "") || "/";
}

function getSiteRelativePath(pathname) {
  const path = normalizePath(pathname).toLowerCase();
  const siteRootPath = normalizePath(SITE_ROOT.pathname).toLowerCase();
  if (siteRootPath === "/") return path;
  if (path === siteRootPath) return "/";
  return path.startsWith(`${siteRootPath}/`)
    ? path.slice(siteRootPath.length)
    : path;
}

function isGeneralReviewPage(pathname) {
  const path = getSiteRelativePath(pathname);
  return path === "/" || /^\/pages\/[^/]+$/.test(path);
}

function normalizeFeatureName(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function getReviewTargetId(reviewType, specificUtility, pageId) {
  if (reviewType === "Utilities" && normalizeFeatureName(specificUtility)) {
    return `feature:${encodeURIComponent(normalizeFeatureName(specificUtility))}`;
  }
  return `page:${encodeURIComponent(normalizePath(pageId).toLowerCase())}`;
}

function categoryForPage(page, pathname, hash, pageReviewCategory) {
  const path = pathname.toLowerCase();
  const normalizedPath = normalizePath(path);
  const section = page?.section?.toLowerCase();
  if (path.includes("/shop/") || path.endsWith("/shop")) {
    return "Buying in Shop";
  }
  if (
    path.includes("/services/") ||
    path.endsWith("/services") ||
    hash === "#services"
  ) {
    return "Commissions / Services";
  }
  if (page?.reviewCategory || pageReviewCategory) {
    return page?.reviewCategory || pageReviewCategory;
  }
  if (
    section === "hubs" ||
    section === "tools" ||
    /\/pages\/(?:hubs|tools)\/.+/i.test(normalizedPath) ||
    /\/pages\/(?:codm-ptb-download|codm-redeem-codes)(?:\/|$)/i.test(path)
  ) {
    return "Utilities";
  }
  return "General Feedback";
}

async function loadFromSitemap() {
  const response = await fetch(new URL("sitemap.xml", SITE_ROOT));
  if (!response.ok) throw new Error(`Sitemap request failed (${response.status}).`);

  const sitemap = new DOMParser().parseFromString(
    await response.text(),
    "application/xml",
  );
  const urls = [...sitemap.querySelectorAll("loc")]
    .map((node) => {
      try {
        const url = new URL(node.textContent.trim());
        if (
          url.origin !== SITE_ROOT.origin ||
          !url.pathname.startsWith(SITE_ROOT.pathname)
        ) {
          return null;
        }
        return new URL(url.pathname.slice(SITE_ROOT.pathname.length), SITE_ROOT);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return Promise.all(
    urls.map(async (url) => {
      try {
        const pageResponse = await fetch(url.href);
        if (!pageResponse.ok) return null;
        const pageDocument = new DOMParser().parseFromString(
          await pageResponse.text(),
          "text/html",
        );
        const section = getMeta(pageDocument, "nav-section");
        const label = getMeta(pageDocument, "nav-label");
        if (!section || !label) return null;
        return {
          section,
          label: getMeta(pageDocument, "directory-title") || label,
          reviewCategory: getMeta(pageDocument, "review-category"),
          reviewFeature: getMeta(pageDocument, "review-feature"),
          url: url.href,
        };
      } catch {
        return null;
      }
    }),
  ).then((pages) => pages.filter(Boolean));
}

export function getReviewCatalog() {
  if (!catalogPromise) {
    catalogPromise = (async () => {
      if (window.siteCatalogReady) {
        const pages = await window.siteCatalogReady;
        if (pages.length) return pages;
      }
      return loadFromSitemap();
    })().catch((error) => {
      catalogPromise = undefined;
      throw error;
    });
  }
  return catalogPromise;
}

export function populateReviewFeatureSelect(
  select,
  context,
  selectedValue = context.title,
) {
  const options = new Map(
    context.features.map((feature) => [feature.toLowerCase(), feature]),
  );
  if (selectedValue && !options.has(selectedValue.toLowerCase())) {
    options.set(selectedValue.toLowerCase(), selectedValue);
  }

  select.replaceChildren(new Option("Select a utility or hub", ""));
  [...options.values()].forEach((feature) => {
    select.add(new Option(feature, feature));
  });
  if (selectedValue) select.value = selectedValue;
}

export async function getCurrentReviewContext() {
  let catalog = [];
  try {
    catalog = await getReviewCatalog();
  } catch (error) {
    console.warn("Review categories could not load the site catalog.", error);
  }

  const pathname = window.location.pathname;
  const currentPath = normalizePath(pathname);
  const page = catalog.find(
    (entry) => normalizePath(new URL(entry.url).pathname) === currentPath,
  );
  const title =
    getMeta(document, "review-feature") ||
    page?.label ||
    getMeta(document, "directory-title") ||
    getMeta(document, "nav-label") ||
    document.querySelector("main h1, h1")?.textContent?.trim() ||
    document.title.split(/[|—–]/)[0].trim() ||
    "Current page";
  const features = new Map();

  catalog
    .filter(
      (entry) =>
        entry.section === "hubs" ||
        entry.section === "tools" ||
        entry.reviewCategory === "Utilities",
    )
    .forEach((entry) => {
      const feature = entry.reviewFeature || entry.label;
      features.set(feature.toLowerCase(), feature);
    });

  const category = categoryForPage(
    page,
    pathname,
    window.location.hash.toLowerCase(),
    getMeta(document, "review-category"),
  );
  const section = (
    page?.section ||
    getMeta(document, "nav-section") ||
    (/\/pages\/tools\//i.test(pathname)
      ? "tools"
      : /\/pages\/hubs\//i.test(pathname)
        ? "hubs"
        : "")
  ).toLowerCase();
  if (category === "Utilities") {
    features.set(title.toLowerCase(), title);
  }

  return {
    category,
    section,
    title,
    pageId: currentPath.toLowerCase(),
    features: [...features.values()].sort((first, second) =>
      first.localeCompare(second),
    ),
    categoryChangeable: isGeneralReviewPage(pathname),
  };
}
