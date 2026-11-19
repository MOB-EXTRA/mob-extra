# MOB EXTRA

Static, mobile-first website for the MOB EXTRA gaming resource hub. The source is kept in this folder; the separate `D:\maki\GitHub` reference projects are not modified.

## Structure

- `index.html` — main landing page and top-level navigation.
- `pages/hubs/codm/` — CODM redeem code and public test build hubs.
- `pages/hubs/mlbb/` — MLBB redeem code hub, using the same code hub styles and script as CODM.
- `pages/hubs/` — directory of all sitemap-listed game hubs; the navigation's “All game hubs” item opens this page.
- `pages/tools/` — auto-populated tool directory; each utility has its own page under this folder.
- `pages/portfolio/` — shared portfolio directory and viewer, with `team/` for MOB EXTRA project owners and `community/` for hosted member portfolios.
- `pages/portfolio/view.html` — shared same-tab portfolio viewer with a floating return link; it hosts each unique portfolio in an iframe to preserve its own styling.
- `pages/services/` — professional commissions for engineering estimates, CAD/SketchUp, diagrams, automation, and web tools.
- `pages/about.html`, `contact.html`, `editorial.html`, `privacy.html`, `terms.html` — ownership, contact, content standards, and policy pages.
- `assets/css/site.css` — import root for the shared shell and responsive styles.
- `assets/css/content-pages.css`, `redeem-hubs.css`, `ptb-hub.css`, `portfolio.css`, `tools.css` — focused page modules loaded only by the pages that use them.
- `assets/css/animations/` and `assets/js/animations/` — shared animation styles and viewport replay controller. It observes static and dynamically added content, emits `site:motion-enter` / `site:motion-leave` for scripted effects, and also runs inside portfolio pages opened through the shared viewer. Portfolio-specific art and motion styles remain with each portfolio.
- `assets/js/site.js` — shared navigation, scroll reveals, and footer year.
- `assets/js/portfolio-showcase.js` — reusable sitemap-driven portfolio cards shared by the home page and portfolio directory. Add `<div data-portfolio-showcase></div>` and load this file after `components.js` to place the same section elsewhere. Portfolio details come from their sitemap-listed page metadata.
- `assets/js/pages/` — page behavior kept separate for redeem hubs, CODM test builds, and player tools.
- `assets/ads/` — site-wide sponsored promotion configuration, placement loader, and styles. Edit `config.json` to update promotions or set `enabled` to `false` to turn them off.
- `assets/js/review-widget.js` and `assets/css/review-widget.css` — shared live review panel and submission form. The shared shell injects it on eligible MOB EXTRA pages; the portfolio viewer injects it into portfolio pages. Terms, privacy/legal pages, and Carl Vincent’s portfolio are excluded.
- `assets/img/` — shared MOB EXTRA brand artwork. All embedded projects use `img/` for image folders inside their own `assets/` directories.

## Consolidated source projects

| Read-only project in `D:\maki\GitHub` | New MOB EXTRA destination |
| --- | --- |
| `Vile-Tempest-Official` | Home, CODM hubs, tools, portfolio, and professional services pages |
| `SlimeSpace` | Player tools and shared CODM redeem hub |
| `CODM.TestServer.DL.Link` | CODM test build guide and its original shared status repositories |
| `marc-johnford-cagatin` | `pages/portfolio/team/marc/` with its own CSS modules, JavaScript, project data, galleries, images, and legal page |
| `carl-vincent-cagatin` | `pages/portfolio/team/carl/` with its own CSS, animation/navigation scripts, profile images, and legal page |
| `vile-tempest-official` | `pages/portfolio/team/vile-tempest-official/` with its existing site assets and pages |

CODM redeem listings and test build status are read from the original shared-data repositories 1, 2, and 3 in order. If a repository is unavailable, the page tries the next one. This keeps frequently updated records out of the MOB EXTRA site repository. MLBB uses the same hub layout and interaction code but stays in a clear empty state until a reliable source is added.

- CODM code sources, tried in order:
  1. `https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.1/codm-redeem-code/redeem-codes.js`
  2. `https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.2/codm-redeem-code/redeem-codes.js`
  3. `https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.3/codm-redeem-code/redeem-codes.js`
- CODM test build sources, tried in order:
  1. `https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.1/codm-test-server/codm-config.js`
  2. `https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.2/codm-test-server/codm-config.js`
  3. `https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.3/codm-test-server/codm-config.js`

The retired standalone project sites are not used for internal navigation. Game publisher links, creator contact channels, and the shared-data repositories listed above remain external by design.
Each portfolio keeps its original visual identity and frontend assets; the portfolio directory and MOB EXTRA pages provide the common path back into the main site.

## Adding pages to shared navigation and directories

The shared navigation, homepage scrolling ticker, and page directories discover pages from `sitemap.xml`. The portfolio showcase reads each profile's metadata from its sitemap-listed HTML page and builds the card automatically. Current profiles belong in `pages/portfolio/team/`; externally hosted member profiles belong in `pages/portfolio/community/`. Each group gets a heading in the shared showcase. Portfolio cards, navigation, and ticker links open through the shared viewer so the portfolio can retain its design and users always have one consistent return button. To add a tool, add its page URL to the sitemap and set these metadata tags in its HTML `<head>`:

```html
<meta name="nav-section" content="tools">
<meta name="nav-label" content="Your tool name">
<meta name="nav-description" content="A short description shown in the tools directory.">
```

For a game page, use `nav-section` value `hubs`; for a portfolio or other section page, use `more`. The shared menu and matching directory fetch sitemap-listed pages and read their labels/descriptions, so there is no separate navigation list to edit. The homepage ticker uses the same entries as clickable links and loops them smoothly. Ensure the page uses the shared header/footer placeholders and loads `assets/js/components.js` using the correct relative asset path.

To add a portfolio, place it under `pages/portfolio/team/<slug>/` or `pages/portfolio/community/<slug>/`, add its entry URL to `sitemap.xml`, and add `nav-section=more`, `nav-label`, and `portfolio-group` (`team` or `community`) metadata. Add `nav-description`, `directory-title`, `directory-kicker`, `directory-image`, and `directory-logo` metadata for its card. Use `assets/img/thumbnail.png` for the artwork and `assets/img/favicon.png` for the card logo when those are the portfolio's designated files. The shared showcase, navigation, and ticker then populate from those page metadata; no card markup needs to be duplicated.

## Adding another game hub

Create a game directory under `pages/`, link `redeem-hubs.css`, and load `assets/js/pages/redeem-hub.js` with a `data-code-hub` attribute. Keep the shared `.page-hero`, `.hub-meta`, `.hub-lead-grid`, `.content-grid`, `.code-toolbar`, `.code-grid`, `.steps-grid`, and FAQ patterns. Add a source adapter in the page script when that game's data format differs. Keep region filters, source dates, publisher routes, and empty states specific to the game, then add the page to the home cards and shared footer navigation.

## Publishing and advertising setup

Pages are plain HTML/CSS/JS and can be served by GitHub Pages or another static host. Before production, set the permanent domain and page canonicals, inspect every external link, and replace the static code dates with a maintenance process. Advertising is intentionally not injected until the owner has an AdSense account and the actual production domain is reviewed. Use `ADSENSE-READINESS.md` for the publisher setup checklist.

The root `404.html` is the custom not-found page used automatically by GitHub Pages. Other static hosts may require their own setting to serve this file for missing routes. Its base URL adjusts for the GitHub project path and the current local preview path.

Google decides site eligibility after review. A well-organized site does not guarantee account approval or ad serving.

## Community reviews

The shared review widget reads and writes the existing Firebase `site_reviews` collection used by the Vile Tempest review form. Keep review presentation and submission behavior in `assets/js/review-widget.js` and its layout in `assets/css/review-widget.css`. Standard MOB EXTRA pages receive the widget through `assets/js/components.js`; portfolio pages opened through the shared portfolio viewer receive it automatically. Reviews are public once submitted, and one submission per browser device is allowed.

## Sponsored promotions

The shared loader adds responsive MOB EXTRA promotions below each page's hero and, on longer pages, near the footer. These are first-party promotions rather than third-party ad-network inventory. Manage sponsor labels, copy, destinations, button text, and matching keywords in `assets/ads/config.json`. Campaigns are matched against the current page; unmatched campaigns remain eligible through a 25% exploration share. On longer pages a second distinct campaign may fill the footer placement. Layout styles and placement behavior are in the same folder. Pages under the Marc Johnford and Carl Vincent portfolios are excluded. External ad networks require their own real publisher and placement IDs and are not enabled by this setup.
