/* Keeps displayed copyright and design years current. */
const currentYear = new Date().getFullYear();

document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = currentYear;
});
