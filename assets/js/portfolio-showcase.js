/* Shared, sitemap-driven portfolio showcase used on the home page and portfolio directory. */
(() => {
  const hosts = [...document.querySelectorAll("[data-portfolio-showcase]")];
  if (!hosts.length || !window.siteCatalogReady) return;

  const portfolioRoot = new URL(
    "pages/portfolio/",
    window.siteBase || window.location.href,
  );
  const directoryPath = new URL("index.html", portfolioRoot).pathname;
  const isDirectory = (pathname) =>
    pathname === portfolioRoot.pathname || pathname === directoryPath;
  const isPortfolioPage = (page) => {
    if (page.section !== "more" || !page.portfolioGroup) return false;
    const pathname = new URL(page.url).pathname;
    return (
      pathname.startsWith(portfolioRoot.pathname) && !isDirectory(pathname)
    );
  };

  const createPortfolioCard = (page, index) => {
    const card = document.createElement("article");
    card.className = "portfolio-tile";
    card.dataset.reveal = "";
    card.style.setProperty("--delay", `${index * 90}ms`);

    if (page.image) {
      const artwork = document.createElement("div");
      artwork.className = "portfolio-tile-artwork";
      const image = document.createElement("img");
      image.src = page.image;
      image.alt = page.imageAlt;
      image.loading = "lazy";
      image.decoding = "async";
      if (page.imageFit === "cover") image.classList.add("is-cover");
      if (page.imageWebp) {
        const picture = document.createElement("picture");
        const source = document.createElement("source");
        source.type = "image/webp";
        source.srcset = page.imageWebp;
        picture.append(source, image);
        artwork.append(picture);
      } else {
        artwork.append(image);
      }
      card.append(artwork);
    }

    const header = document.createElement("div");
    header.className = "portfolio-tile-header";
    if (page.logo) {
      const logo = document.createElement("img");
      logo.className = "portfolio-tile-logo";
      logo.src = page.logo;
      logo.alt = page.logoAlt;
      logo.loading = "lazy";
      logo.decoding = "async";
      header.append(logo);
    }

    const title = document.createElement("div");
    title.className = "portfolio-tile-title";
    const kicker = document.createElement("span");
    kicker.className = "portfolio-meta";
    kicker.textContent = page.directoryKicker;
    const heading = document.createElement("h3");
    heading.textContent = page.directoryTitle;
    title.append(kicker, heading);
    header.append(title);

    if (page.image) {
      header.classList.add("is-overlay");
      card.querySelector(".portfolio-tile-artwork").append(header);
    } else {
      card.append(header);
    }

    const description = document.createElement("p");
    description.textContent = page.description;

    const link = document.createElement("a");
    link.className = "text-link";
    link.href = page.url;
    link.append("View portfolio ");
    const arrow = document.createElement("i");
    arrow.className = "fa-solid fa-arrow-right";
    arrow.setAttribute("aria-hidden", "true");
    link.append(arrow);

    card.append(description, link);
    return card;
  };

  window.siteCatalogReady.then((catalog) => {
    const pages = catalog.filter(isPortfolioPage);
    hosts.forEach((host) => {
      const section = document.createElement("section");
      section.className = "section container portfolio-showcase";
      section.setAttribute("aria-labelledby", "portfolio-showcase-title");

      const heading = document.createElement("div");
      heading.className = "section-heading compact portfolio-showcase-heading";
      heading.dataset.reveal = "";
      const titleGroup = document.createElement("div");
      const eyebrow = document.createElement("div");
      eyebrow.className = "eyebrow";
      const dot = document.createElement("i");
      dot.className = "fa-solid fa-users";
      dot.setAttribute("aria-hidden", "true");
      eyebrow.append(dot, " FEATURED PROFILES");
      const title = document.createElement("h2");
      title.id = "portfolio-showcase-title";
      title.append("Explore the ");
      const accent = document.createElement("span");
      accent.textContent = "portfolios.";
      title.append(accent);
      titleGroup.append(eyebrow, title);
      const intro = document.createElement("p");
      intro.textContent =
        "Explore the development work behind MOB EXTRA alongside partnered civil engineering services—review past projects, capabilities, and direct contact details.";
      heading.append(titleGroup, intro);

      const groups = [
        { key: "team", title: "Creator & Collaborator" },
        { key: "community", title: "Hosted Community Portfolios" },
      ];
      const groupSections = groups.flatMap((group) => {
        const entries = pages.filter(
          (page) => page.portfolioGroup === group.key,
        );
        if (!entries.length) return [];
        const sectionGroup = document.createElement("section");
        sectionGroup.className = "portfolio-showcase-group";
        const groupTitle = document.createElement("h3");
        groupTitle.textContent = group.title;
        const grid = document.createElement("div");
        grid.className = "portfolio-card-grid";
        grid.setAttribute("aria-live", "polite");
        entries.forEach((page, index) =>
          grid.append(createPortfolioCard(page, index)),
        );
        sectionGroup.append(groupTitle, grid);
        return [sectionGroup];
      });
      if (!groupSections.length) {
        const empty = document.createElement("p");
        empty.className = "content-card";
        empty.textContent = "No portfolios are listed yet.";
        groupSections.push(empty);
      }

      const note = document.createElement("div");
      note.className = "portfolio-showcase-note";
      note.dataset.reveal = "";
      const noteText = document.createElement("p");
      const noteTitle = document.createElement("strong");
      noteTitle.textContent = "Independent profiles.";
      noteText.append(
        noteTitle,
        " Each portfolio represents its named professional. Contact details and services are shown on the relevant profile page.",
      );
      const services = document.createElement("a");
      services.className = "text-link";
      services.href = new URL(
        "pages/services/index.html",
        window.siteBase || window.location.href,
      ).href;
      services.append("Professional services ");
      const servicesArrow = document.createElement("i");
      servicesArrow.className = "fa-solid fa-arrow-right";
      servicesArrow.setAttribute("aria-hidden", "true");
      services.append(servicesArrow);
      note.append(noteText, services);
      section.append(heading, ...groupSections, note);
      host.replaceWith(section);
    });
  });
})();
