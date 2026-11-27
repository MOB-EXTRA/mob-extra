/**
 * Vile Tempest Official — Main Application Script
 * Handles YouTube-style smart header hide/show behavior on scroll.
 */
document.addEventListener("DOMContentLoaded", function () {
  const siteHeader = document.querySelector(".site-header");
  let lastScrollY = window.pageYOffset;
  let ticking = false;
  const scrollThreshold = 5; // Minimum scroll delta required to trigger transition

  function handleYouTubeHeaderScroll() {
    const currentScrollY = window.pageYOffset;
    const tickerElem = document.querySelector(".quick-ticker-bar");
    const filterDropdownMenu = document.querySelector(".filter-dropdown-menu");

    // Don't hide header when near top of the page
    if (currentScrollY <= 80) {
      if (siteHeader) siteHeader.classList.remove("header-hidden");
      if (tickerElem) tickerElem.classList.remove("ticker-hidden");
      lastScrollY = currentScrollY;
      ticking = false;
      return;
    }

    const diff = currentScrollY - lastScrollY;

    if (Math.abs(diff) >= scrollThreshold) {
      if (diff > 0) {
        // Scrolling Down -> Hide Header and Quick Ticker
        if (siteHeader) siteHeader.classList.add("header-hidden");
        if (tickerElem) tickerElem.classList.add("ticker-hidden");
        if (filterDropdownMenu) filterDropdownMenu.classList.remove("active");
      } else {
        // Scrolling Up (even slightly) -> Instantly Reveal Header and Quick Ticker
        if (siteHeader) siteHeader.classList.remove("header-hidden");
        if (tickerElem) tickerElem.classList.remove("ticker-hidden");
      }
      lastScrollY = currentScrollY;
    }
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        window.requestAnimationFrame(handleYouTubeHeaderScroll);
        ticking = true;
      }
    },
    { passive: true },
  );

  const reviewBtn = document.getElementById("jump-to-commissions-reviews");
  if (reviewBtn) {
    reviewBtn.addEventListener("click", function (e) {
      e.preventDefault();

      const reviewsSection = document.getElementById("reviews");
      if (reviewsSection) {
        const headerOffset = 80;
        const elementPosition = reviewsSection.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }

      document
        .querySelector('[data-review-filter="Commissions / Services"]')
        ?.click();
    });
  }
});
