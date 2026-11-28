import { isReviewEnabled } from "./server/api.js";

if (isReviewEnabled(document) && !window.mobExtraReviewBootstrapLoaded) {
  window.mobExtraReviewBootstrapLoaded = true;
  const siteRoot = new URL("../../", import.meta.url);

  let stylesheet = document.querySelector("link[data-review-widget-style]");
  const waitForStylesheet = (link) =>
    new Promise((resolve, reject) => {
      link.addEventListener("load", resolve, { once: true });
      link.addEventListener(
        "error",
        () => reject(new Error(`Could not load review styles: ${link.href}`)),
        { once: true },
      );
    });
  let stylesheetLoad;
  if (!stylesheet) {
    stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = new URL("assets/css/review-widget.css", siteRoot).href;
    stylesheet.dataset.reviewWidgetStyle = "";
    stylesheetLoad = waitForStylesheet(stylesheet);
    document.head.append(stylesheet);
  }

  let stylesheetReady = Boolean(
    stylesheet.sheet && stylesheet.sheet.cssRules.length > 0,
  );
  if (!stylesheetReady) {
    if (!stylesheetLoad) stylesheetLoad = waitForStylesheet(stylesheet);
    try {
      await stylesheetLoad;
      stylesheetReady = true;
    } catch (error) {
      window.mobExtraReviewBootstrapLoaded = false;
      stylesheet.remove();
      console.error("Review styles could not be loaded; the review form was not rendered.", error);
    }
  }

  if (
    stylesheetReady &&
    !document.querySelector("script[data-review-widget-script]")
  ) {
    const script = document.createElement("script");
    script.type = "module";
    script.src = new URL("assets/js/review-widget.js", siteRoot).href;
    script.dataset.reviewWidgetScript = "";
    document.body.append(script);
  }
}
