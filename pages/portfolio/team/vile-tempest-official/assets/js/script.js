/**
 * Vile Tempest Official — Main Application Script
 */
document.addEventListener("DOMContentLoaded", function () {
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
