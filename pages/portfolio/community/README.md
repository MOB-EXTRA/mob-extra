# Hosted community portfolios

Place each hosted member portfolio in its own folder here, for example `community/<slug>/`.

To publish a profile in the shared portfolio directory, navigation, and scrolling ticker:

1. Add the profile URL to the root `sitemap.xml`.
2. Add `nav-section=more`, `nav-label`, and `portfolio-group=community` metadata in the profile page's `<head>`.
3. Add the card metadata: `nav-description`, `directory-title`, `directory-kicker`, `directory-image`, and `directory-logo`.
4. Keep the profile's images in its `assets/img/` folder. Use `thumbnail.png` for card artwork and `favicon.png` for the card logo when those are the portfolio's selected assets.

The shared MOB EXTRA scripts read the sitemap and metadata and create the card and links. Portfolio links open in the shared viewer, which provides the common movable return button.
