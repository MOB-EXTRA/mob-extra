const CONTACT_EMAIL = "mob.extra.contact@gmail.com";

const createContactMailto = (subject = "") =>
  `mailto:${CONTACT_EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;

window.MOB_EXTRA_SITE_CONFIG = Object.freeze({
  contactEmail: CONTACT_EMAIL,
  mailto: createContactMailto,
});

document.querySelectorAll("[data-site-email], .config-email-text").forEach((element) => {
  element.textContent = CONTACT_EMAIL;
});

document.querySelectorAll("[data-site-email-link], a.config-link-email").forEach((link) => {
  link.href = createContactMailto(link.dataset.siteEmailSubject || "");
});

document
  .querySelectorAll('script[type="application/ld+json"][data-site-email-schema]')
  .forEach((schemaScript) => {
    const schema = JSON.parse(schemaScript.textContent);
    const entities = Array.isArray(schema) ? schema : [schema];

    entities.forEach((entity) => {
      if (entity && typeof entity === "object") {
        entity.email = CONTACT_EMAIL;
      }
    });

    schemaScript.textContent = JSON.stringify(schema);
  });
