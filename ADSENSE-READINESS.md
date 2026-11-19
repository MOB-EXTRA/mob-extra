# AdSense readiness notes

This site is structured to support a future publisher review: it has direct navigation, original explanatory pages, ownership and contact details, a privacy page, and a clear independent-resource disclaimer. Approval depends on Google's review, the live site's content and behavior, account eligibility, traffic sources, and the publisher policies in force when applying.

`robots.txt` and `sitemap.xml` currently assume the site will be published at `https://mob-extra.github.io/mob-extra/`. Update both if the production domain or project path differs.

## Before applying

1. Deploy to the final domain and ensure every public navigation link works on desktop and mobile.
2. Keep each game hub genuinely maintained. Remove stale code listings, show source/update dates, and add original help that serves visitors beyond a list of codes.
3. Confirm the live privacy policy describes the actual host, analytics, advertising vendors, cookies, and data use. Add any consent flow required for the site's audience and locations.
4. Keep About, Contact, Editorial, Privacy, and Terms pages reachable from the footer.
5. Verify the site is crawlable and has no placeholder sections, broken images, misleading download buttons, or restricted pages.
6. Apply through AdSense and add only the verification method and ad code Google provides for the approved site.
7. If Google requires an `ads.txt` file, create it at the domain root with the exact publisher record supplied in the AdSense account. Do not publish a guessed publisher ID or a generic placeholder record.
8. Recheck Google's current publisher policies and site approval guidance before enabling ads; requirements can change.

## Current implementation

- MOB EXTRA's own sponsored promotions are displayed using the managed files in `assets/ads/`. They do not load an external ad network or record views/clicks.
- Pages load Google Tag Manager container `GTM-TZ7P5GLL`. The container's published tags are managed outside this repository, so verify its live configuration and update the privacy notice if it changes. The local `gtag()` stub alone would not load Google Analytics; the hub and legal pages now use the standard GTM bootstrap.
- Firebase Firestore is used by review widgets on portfolio and service pages. Review the Firebase security rules, data fields, and actual collection behavior against the privacy notice before applying.
- The site verification meta tag supports Search Console ownership verification. The site is currently a GitHub Pages static site, not Google Sites. Do not describe Google Sites as a data processor unless the deployment actually embeds or uses it.
- No AdSense publisher ID, ad-unit IDs, or third-party ad scripts are configured. Add only real values provided by an approved publisher account.
- The privacy policy describes the current first-party promotions. Update it and add any required consent controls before enabling external ad technology.
- An `ads.txt` file is intentionally not supplied before a real publisher ID exists.
- A privacy notice alone does not replace consent tooling where law or Google's current requirements call for it.

## Official references

- [Prepare your site for AdSense](https://support.google.com/adsense/answer/7299563)
- [Common reasons for AdSense disapproval](https://support.google.com/adsense/answer/81904)
- [Google Publisher Policies](https://support.google.com/adsense/answer/10502938)
- [Privacy and required content](https://support.google.com/adsense/answer/1348695)
