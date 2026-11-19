(() => {
  const renderDirectory = (directory, pages, emptyMessage, actionLabel) => {
    if (!pages.length) {
      const empty = document.createElement("p");
      empty.className = "content-card";
      empty.textContent = emptyMessage;
      directory.replaceChildren(empty);
      return;
    }

    directory.replaceChildren(...pages.map((page, index) => {
      const card = document.createElement("article");
      card.className = "tool-card";
      card.dataset.reveal = "";
      card.style.setProperty("--delay", `${index * 70}ms`);

      const heading = document.createElement("h2");
      heading.textContent = page.label;
      const description = document.createElement("p");
      description.textContent = page.description;
      const link = document.createElement("a");
      link.className = "text-link";
      link.href = page.url;
      link.append(`${actionLabel} `);
      const arrow = document.createElement("i");
      arrow.className = "fa-solid fa-arrow-right";
      arrow.setAttribute("aria-hidden", "true");
      link.append(arrow);

      card.append(heading, description, link);
      return card;
    }));
  };

  if (!window.siteCatalogReady) return;

  const toolDirectory = document.querySelector("[data-tool-directory]");
  if (toolDirectory) {
    window.siteCatalogReady.then((pages) => renderDirectory(
      toolDirectory,
      pages.filter((page) => page.section === "tools"),
      "Tools are temporarily unavailable. Please try again later.",
      "Open tool",
    ));
  }

  const pageDirectory = document.querySelector("[data-page-directory]");
  if (pageDirectory) {
    const section = pageDirectory.dataset.pageDirectory;
    window.siteCatalogReady.then((pages) => renderDirectory(
      pageDirectory,
      pages.filter((page) => page.section === section),
      section === "hubs" ? "No game hubs are listed yet." : "No pages are listed yet.",
      section === "hubs" ? "Open hub" : "Explore",
    ));
  }
})();
