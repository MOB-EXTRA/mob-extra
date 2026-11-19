/* Fills project cards from the editable works manifest and project metadata. */
function sizeWorkActionButtons() {
  document.querySelectorAll(".work-card .round-link").forEach((button) => {
    const label = button.querySelector(".round-link-copy");
    const icon = button.querySelector(".round-link-icon");
    if (!label || !icon) return;

    const contentWidth = label.scrollWidth + icon.getBoundingClientRect().width + 43;
    button.style.setProperty("--expanded-width", `${Math.ceil(contentWidth)}px`);
  });
}

sizeWorkActionButtons();
window.addEventListener("resize", sizeWorkActionButtons, { passive: true });
document.fonts?.ready?.then(sizeWorkActionButtons).catch(() => {});

function setWorkThumbnail(thumbnail, thumbnailPath) {
  const fallback = window.SITE_CONFIG?.assets?.portfolioLogo ||
    window.SITE_CONFIG?.assets?.portfolioIcon ||
    window.SITE_CONFIG?.assets?.fallbackSiteIcon;

  if (thumbnailPath) {
    thumbnail.src = new URL(thumbnailPath, document.baseURI).href;
  } else if (fallback) {
    thumbnail.classList.add("is-favicon");
    thumbnail.src = window.getSiteAssetUrl?.(fallback) || fallback;
  } else {
    thumbnail.hidden = true;
  }
}

async function initializeWorkProjects() {
  try {
    const manifestResponse = await fetch("works/manifest.json");
    if (!manifestResponse.ok) throw new Error("Could not load the work manifest.");
    const manifest = await manifestResponse.json();
    let thumbnailManifest = {};

    try {
      const thumbnailManifestResponse = await fetch("works/thumbnail-manifest.json");
      if (thumbnailManifestResponse.ok) thumbnailManifest = await thumbnailManifestResponse.json();
    } catch {
      // A missing generated thumbnail manifest means every project uses the fallback logo.
    }

    let galleryManifest = {};
    try {
      const galleryManifestResponse = await fetch("works/gallery-manifest.json");
      if (galleryManifestResponse.ok) galleryManifest = await galleryManifestResponse.json();
    } catch {
      // Galleries remain usable when no optional screenshot manifest is available.
    }

    const galleryDialog = document.querySelector(".work-gallery-dialog");
    const galleryTitle = galleryDialog?.querySelector("[data-gallery-title]");
    const galleryBody = galleryDialog?.querySelector("[data-gallery-body]");
    const galleryViewer = galleryDialog?.querySelector("[data-gallery-viewer]");
    const viewerImage = galleryViewer?.querySelector("[data-viewer-image]");
    const viewerCount = galleryViewer?.querySelector("[data-viewer-count]");
    const previousButton = galleryViewer?.querySelector("[data-viewer-prev]");
    const nextButton = galleryViewer?.querySelector("[data-viewer-next]");
    let activeGalleryImages = [];
    let activeGalleryProject = null;
    let activeImageIndex = 0;
    let activeGalleryThumbnail = null;

    function updateGalleryViewer() {
      const imagePath = activeGalleryImages[activeImageIndex];
      if (!imagePath || !viewerImage) return;
      const projectTitle = activeGalleryProject?.title || "Project";
      viewerImage.src = new URL(imagePath, document.baseURI).href;
      viewerImage.alt = `${projectTitle} screenshot ${activeImageIndex + 1}`;
      if (viewerCount) viewerCount.textContent = `${String(activeImageIndex + 1).padStart(2, "0")} / ${String(activeGalleryImages.length).padStart(2, "0")}`;
      if (previousButton) previousButton.disabled = activeImageIndex <= 0;
      if (nextButton) nextButton.disabled = activeImageIndex >= activeGalleryImages.length - 1;
    }

    function closeGalleryViewer() {
      if (galleryViewer) galleryViewer.hidden = true;
      if (viewerImage) viewerImage.removeAttribute("src");
      if (activeGalleryThumbnail?.isConnected) activeGalleryThumbnail.focus();
    }

    function openGalleryViewer(index) {
      if (!galleryViewer || !activeGalleryImages.length) return;
      activeImageIndex = Math.max(0, Math.min(index, activeGalleryImages.length - 1));
      updateGalleryViewer();
      galleryViewer.hidden = false;
      galleryViewer.focus();
    }

    function renderProjectGallery(project, images = []) {
      if (!galleryDialog || !galleryTitle || !galleryBody) return;
      galleryTitle.textContent = project.title || "Project screenshots";
      galleryBody.replaceChildren();
      activeGalleryProject = project;
      activeGalleryImages = images;
      closeGalleryViewer();

      if (!images.length) {
        const emptyState = document.createElement("p");
        emptyState.className = "work-gallery-empty";
        emptyState.textContent = "Screenshots for this project will appear here when they are added.";
        galleryBody.append(emptyState);
      } else {
        const grid = document.createElement("div");
        grid.className = "work-gallery-grid";

        images.forEach((imagePath, index) => {
          const previewButton = document.createElement("button");
          previewButton.className = "work-gallery-item";
          previewButton.type = "button";
          previewButton.setAttribute("aria-label", `Zoom ${project.title || "project"} screenshot ${index + 1}`);
          const image = document.createElement("img");
          image.src = new URL(imagePath, document.baseURI).href;
          image.alt = `${project.title || "Project"} screenshot ${index + 1}`;
          image.loading = "lazy";
          image.addEventListener("error", () => previewButton.remove(), { once: true });
          previewButton.append(image);
          previewButton.addEventListener("click", () => {
            activeGalleryThumbnail = previewButton;
            openGalleryViewer(index);
          });
          grid.append(previewButton);
        });

        galleryBody.append(grid);
        grid.addEventListener("error", () => {
          if (!grid.querySelector(".work-gallery-item")) {
            const emptyState = document.createElement("p");
            emptyState.className = "work-gallery-empty";
            emptyState.textContent = "Screenshots for this project will appear here when they are added.";
            galleryBody.replaceChildren(emptyState);
          }
        }, true);
      }

      if (!galleryDialog.open) galleryDialog.showModal();
    }

    galleryDialog?.querySelector("[data-gallery-close]")?.addEventListener("click", () => {
      galleryDialog.close();
    });
    galleryViewer?.querySelector("[data-viewer-close]")?.addEventListener("click", closeGalleryViewer);
    galleryViewer?.addEventListener("click", (event) => {
      if (event.target === galleryViewer) closeGalleryViewer();
    });
    previousButton?.addEventListener("click", () => {
      if (activeImageIndex > 0) {
        activeImageIndex -= 1;
        updateGalleryViewer();
      }
    });
    nextButton?.addEventListener("click", () => {
      if (activeImageIndex < activeGalleryImages.length - 1) {
        activeImageIndex += 1;
        updateGalleryViewer();
      }
    });
    galleryDialog?.addEventListener("keydown", (event) => {
      if (galleryViewer?.hidden) return;
      if (event.key === "ArrowLeft" && activeImageIndex > 0) {
        event.preventDefault();
        activeImageIndex -= 1;
        updateGalleryViewer();
      } else if (event.key === "ArrowRight" && activeImageIndex < activeGalleryImages.length - 1) {
        event.preventDefault();
        activeImageIndex += 1;
        updateGalleryViewer();
      } else if (event.key === "Escape") {
        event.stopPropagation();
        closeGalleryViewer();
      }
    });
    galleryDialog?.addEventListener("click", (event) => {
      if (event.target === galleryDialog) galleryDialog.close();
    });
    galleryDialog?.addEventListener("close", () => {
      activeGalleryThumbnail = null;
      closeGalleryViewer();
    });

    await Promise.all(
      manifest.projects.map(async (metadataPath) => {
        try {
          const response = await fetch(metadataPath);
          if (!response.ok) throw new Error(`Could not load ${metadataPath} (${response.status}).`);
          const project = await response.json();
          const card = document.querySelector(`[data-project-id="${project.id}"]`);
          if (!card) return;

          card.querySelectorAll("[data-project-field]").forEach((field) => {
            const value = project[field.dataset.projectField];
            if (value) field.textContent = value;
          });

          const siteUrl = project.siteUrl;
          if (siteUrl) {
            document.querySelectorAll(`[data-project-link="${project.id}"]`).forEach((link) => {
              link.href = siteUrl;
            });
          }

          card.querySelectorAll("[data-work-gallery-trigger]").forEach((trigger) => {
            if (siteUrl) {
              trigger.hidden = true;
              return;
            }
            trigger.addEventListener("click", () => {
              renderProjectGallery(project, galleryManifest[project.id] || []);
            });
          });

          document.querySelectorAll(`[data-project-site-icon="${project.id}"]`).forEach((siteIcon) => {
            const portfolioLogo = window.SITE_CONFIG?.assets?.portfolioLogo ||
              window.SITE_CONFIG?.assets?.portfolioIcon ||
              window.SITE_CONFIG?.assets?.fallbackSiteIcon;
            const projectFolder = new URL(".", new URL(metadataPath, document.baseURI));
            const iconUrl = project.siteIcon
              ? new URL(project.siteIcon, projectFolder).href
              : siteUrl
                ? new URL("favicon.ico", new URL(".", siteUrl)).href
                : portfolioLogo;

            siteIcon.addEventListener("error", () => {
              if (portfolioLogo) siteIcon.src = window.getSiteAssetUrl?.(portfolioLogo) || portfolioLogo;
            }, { once: true });
            if (iconUrl) siteIcon.src = iconUrl;
          });

          document.querySelectorAll(`[data-project-name="${project.id}"]`).forEach((element) => {
            element.textContent = project.title;
          });

          const thumbnail = card.querySelector("[data-work-thumbnail]");
          if (thumbnail) {
            thumbnail.addEventListener("error", () => {
              const fallback = window.SITE_CONFIG?.assets?.portfolioLogo ||
                window.SITE_CONFIG?.assets?.portfolioIcon ||
                window.SITE_CONFIG?.assets?.fallbackSiteIcon;
              if (fallback && !thumbnail.classList.contains("is-favicon")) {
                thumbnail.classList.add("is-favicon");
                thumbnail.src = window.getSiteAssetUrl?.(fallback) || fallback;
              } else {
                thumbnail.hidden = true;
              }
            }, { once: true });
            setWorkThumbnail(thumbnail, thumbnailManifest[project.id]);
          }
        } catch (error) {
          console.warn(`Work project could not be initialized: ${metadataPath}`, error);
        }
      }),
    );
  } catch (error) {
    console.error("Work project details could not be loaded:", error);
  }
}

if (document.documentElement.dataset.componentsReady === "true") {
  initializeWorkProjects();
} else {
  document.addEventListener("site:components-ready", initializeWorkProjects, { once: true });
}
