import { isReviewEnabled } from "./server/review-policy.js";

if (isReviewEnabled(document) && !window.mobExtraReviewBootstrapLoaded) {
  const startReviewBootstrap = async () => {
    if (window.mobExtraReviewBootstrapLoaded) return;
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
      script.addEventListener("error", () => {
        window.mobExtraReviewBootstrapLoaded = false;
        console.error(`Review widget could not be loaded: ${script.src}`);
      }, { once: true });
      document.body.append(script);
    }
  };
  const launchReviewBootstrap = () =>
    startReviewBootstrap().catch((error) => {
      window.mobExtraReviewBootstrapLoaded = false;
      console.error("Review widget could not be initialized.", error);
    });

  const footer = document.querySelector("[data-site-footer], footer");
  const pageRoute = window.location.pathname
    .toLowerCase()
    .split("/pages/")[1] || "";
  const reviewSection = pageRoute.split("/")[0];
  let compactReviewTarget = null;
  if (
    (reviewSection === "tools" || reviewSection === "hubs") &&
    !/^(tools|hubs)\/?(?:index\.html)?$/.test(pageRoute)
  ) {
    const main = document.querySelector("main");
    const selectors =
      reviewSection === "tools"
        ? [
            "[data-review-primary]",
            ".tool-workspace",
            ".formatter-page-content",
            "[data-tool-workspace]",
            "[data-tool-primary]",
          ]
        : [
            "[data-review-primary]",
            "[data-hub-primary]",
            "[data-ptb-root]",
            "[data-code-hub] .content-grid",
            ".page-content .content-grid",
          ];
    compactReviewTarget =
      selectors.map((selector) => main?.querySelector(selector)).find(Boolean) ||
      main?.querySelector(".page-content")?.firstElementChild ||
      null;
  }
  const bootstrapTarget = compactReviewTarget || footer;
  if ("IntersectionObserver" in window && bootstrapTarget) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      launchReviewBootstrap();
    }, { rootMargin: "1200px 0px" });
    observer.observe(bootstrapTarget);
  } else if ("requestIdleCallback" in window) {
    requestIdleCallback(launchReviewBootstrap, { timeout: 2500 });
  } else {
    window.setTimeout(launchReviewBootstrap, 0);
  }
}
