import { isReviewEnabled } from "./server/api.js";

if (isReviewEnabled(document) && !window.mobExtraReviewBootstrapLoaded) {
  window.mobExtraReviewBootstrapLoaded = true;
  const siteRoot = new URL("../../", import.meta.url);

  if (!document.querySelector("link[data-review-widget-style]")) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = new URL("assets/css/review-widget.css", siteRoot).href;
    stylesheet.dataset.reviewWidgetStyle = "";
    document.head.append(stylesheet);
  }

  if (!document.querySelector("script[data-review-widget-script]")) {
    const script = document.createElement("script");
    script.type = "module";
    script.src = new URL("assets/js/review-widget.js", siteRoot).href;
    script.dataset.reviewWidgetScript = "";
    document.body.append(script);
  }
}
