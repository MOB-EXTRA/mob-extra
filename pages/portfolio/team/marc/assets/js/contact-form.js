/* Builds a project inquiry email in the visitor's configured email application. */
function initializeContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const serviceSelect = form.elements.namedItem("service");
  document.querySelectorAll("[data-contact-service]").forEach((link) => {
    link.addEventListener("click", () => {
      if (!serviceSelect) return;
      const requestedService = link.dataset.contactService?.trim();
      const matchingOption = Array.from(serviceSelect.options).find((option) =>
        option.value === requestedService || option.textContent.trim() === requestedService,
      );
      if (!matchingOption) return;

      serviceSelect.value = matchingOption.value;
      serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const config = window.SITE_CONFIG;
    const details = new FormData(form);
    const recipient = config?.links?.emailAddress || "mob.extra.contact@gmail.com";
    const subject = `Project inquiry: ${details.get("service")} — ${config?.brandName || "Marc Johnford"}`;
    const body = [
      `Name: ${details.get("name")}`,
      `Email: ${details.get("email")}`,
      `Service: ${details.get("service")}`,
      "",
      "Project details:",
      details.get("message"),
    ].join("\n");

    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

if (document.documentElement.dataset.componentsReady === "true") {
  initializeContactForm();
} else {
  document.addEventListener("site:components-ready", initializeContactForm, { once: true });
}
