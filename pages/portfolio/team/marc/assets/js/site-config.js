const sharedContactConfig = window.MOB_EXTRA_SITE_CONFIG;
if (!sharedContactConfig) {
  throw new Error("The shared MOB EXTRA site config must load before the Marc site config.");
}

/*
 * Site identity and external links.
 * Update this file to change destinations across the site.
 */
window.SITE_CONFIG = Object.freeze({
  brandName: "Marc Johnford",
  brandAccent: "Marc Johnford Cagatin",
  nickname: "Vile Tempest",
  projectName: "MOB EXTRA",
  assets: {
    portfolioLogo: "assets/img/favicon.png",
    portfolioIcon: "assets/img/favicon.png",
    fallbackSiteIcon: "assets/img/favicon.png",
  },
  links: {
    youtubeChannel: "https://www.youtube.com/channel/UCbDtYZS08VvB6luAcyn08bQ",
    youtubeVideos:
      "https://www.youtube.com/channel/UCbDtYZS08VvB6luAcyn08bQ/videos",
    youtubeCommunity:
      "https://www.youtube.com/channel/UCbDtYZS08VvB6luAcyn08bQ/community",
    emailAddress: sharedContactConfig.contactEmail,
    emailComposeUrl: sharedContactConfig.mailto(
      "Inquiry / Commission Request — Vile Tempest",
    ),
    facebook: "https://facebook.com/vile.tempest.extra",
    tiktok: "https://tiktok.com/@vile.tempest.extr",
    twitter: "https://x.com/VileTempestExtr",
  },
});

const siteAssetVersion = Date.now().toString();
window.getSiteAssetUrl = (assetPath) => {
  const assetUrl = new URL(assetPath, document.baseURI);
  if (assetUrl.origin !== window.location.origin) {
    assetUrl.searchParams.set("portfolio_refresh", siteAssetVersion);
  }
  return assetUrl.href;
};
