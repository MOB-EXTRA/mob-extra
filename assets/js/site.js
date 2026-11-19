(() => {
  document.documentElement.classList.add("js");

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute(
        "aria-label",
        open ? "Close navigation" : "Open navigation",
      );
    });

    // Delegate so sitemap-discovered links added later work too.
    nav.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (!link) return;
      const navGroup = link.closest(".nav-group");
      const isMobile = window.matchMedia("(max-width: 992px)").matches;

        // If it's a dropdown parent link on mobile, toggle the sub-menu instead of closing/navigating
      if (
        isMobile &&
        navGroup &&
        link === navGroup.querySelector(":scope > a")
      ) {
        e.preventDefault();
        navGroup.classList.toggle("open");
        return;
      }

        // Otherwise, close the mobile menu normally when a sub-item or regular link is clicked
      nav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation");
    });
  }

  const revealItems = document.querySelectorAll("[data-reveal]");
  revealItems.forEach((item) =>
    item.style.setProperty("--delay", `${item.dataset.delay || 0}ms`),
  );
  // Close dropdowns when tapping outside on mobile
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav-group")) {
      document
        .querySelectorAll(".nav-group")
        .forEach((g) => g.classList.remove("open"));
    }
  });
})();
