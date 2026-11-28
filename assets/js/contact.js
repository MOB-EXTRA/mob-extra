(() => {
  const form = document.getElementById("site-contact-form");
  const formStatus = document.getElementById("contact-form-status");
  const copyButton = document.getElementById("copy-contact-email");
  const copyStatus = document.getElementById("contact-copy-status");

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const config = window.MOB_EXTRA_SITE_CONFIG;
      if (
        !config ||
        !config.contactEmail ||
        typeof config.mailto !== "function"
      ) {
        formStatus.textContent =
          "Email preparation is temporarily unavailable. Please use the copy-address option.";
        console.error("The shared contact email configuration is unavailable.");
        return;
      }

      const details = new FormData(form);
      const name = String(details.get("name") || "").trim();
      const email = String(details.get("email") || "").trim();
      const topic = String(details.get("topic") || "").trim();
      const page = String(details.get("page") || "").trim();
      const message = String(details.get("message") || "").trim();
      const subject = `MOB EXTRA: ${topic}`;
      const body = [
        `Name: ${name}`,
        `Email: ${email}`,
        `Inquiry type: ${topic}`,
        ...(page ? [`Related page: ${page}`] : []),
        "",
        "Message:",
        message,
      ].join("\r\n");

      formStatus.textContent =
        "Your email app should open with a draft. Review it and send it there; if it does not open, use the copy-address option.";
      window.location.href = `${config.mailto(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  if (!copyButton || !copyStatus) return;

  copyButton.addEventListener("click", async () => {
    const config = window.MOB_EXTRA_SITE_CONFIG;
    if (!config || !config.contactEmail) {
      copyStatus.textContent =
        "The email address is temporarily unavailable. Please try again later.";
      console.error("The shared contact email configuration is unavailable.");
      return;
    }

    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(config.contactEmail);
        copied = true;
      }
    } catch (error) {
      console.warn("Clipboard API was unavailable; trying the compatibility copy method.", error);
    }

    if (!copied) {
      let temporaryInput;
      try {
        temporaryInput = document.createElement("textarea");
        temporaryInput.value = config.contactEmail;
        temporaryInput.setAttribute("readonly", "");
        temporaryInput.style.position = "fixed";
        temporaryInput.style.left = "-9999px";
        document.body.append(temporaryInput);
        temporaryInput.focus();
        temporaryInput.select();
        copied = document.execCommand("copy");
      } catch (error) {
        console.error("The compatibility copy method failed.", error);
      } finally {
        if (temporaryInput) temporaryInput.remove();
      }
    }

    if (copied) {
      copyStatus.textContent = "Email address copied. Paste it into your email app.";
    } else {
      copyStatus.textContent =
        "Automatic copy is unavailable. Select the address above and copy it manually.";
      console.error("The contact email could not be copied automatically.");
    }
  });
})();
