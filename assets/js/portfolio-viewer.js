(() => {
  const frame = document.querySelector(".portfolio-viewer-frame");
  const error = document.querySelector(".portfolio-viewer-error");
  const backButton = document.querySelector(".portfolio-viewer-control");
  const dragHandle = document.querySelector(".portfolio-viewer-drag-handle");
  const backStatus = document.querySelector(".portfolio-viewer-back-status");
  const commonRoot = new URL("../../", document.currentScript.src);
  const portfolioRoot = new URL("../../pages/portfolio/", document.currentScript.src);
  const positionKey = "mob-extra-portfolio-back-position";
  const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));
  let savedPosition = null;
  try { savedPosition = JSON.parse(localStorage.getItem(positionKey) || "null"); } catch {}

  const setPosition = (left, top, persist = false) => {
    const maxLeft = window.innerWidth - backButton.offsetWidth - 8;
    const maxTop = window.innerHeight - backButton.offsetHeight - 8;
    const x = clamp(left, 8, maxLeft);
    const y = clamp(top, 8, maxTop);
    backButton.style.left = `${x}px`;
    backButton.style.top = `${y}px`;
    backButton.style.right = "auto";
    backButton.style.bottom = "auto";
    if (persist) {
      savedPosition = {
        x: maxLeft > 8 ? (x - 8) / (maxLeft - 8) : 0,
        y: maxTop > 8 ? (y - 8) / (maxTop - 8) : 0,
      };
      try { localStorage.setItem(positionKey, JSON.stringify(savedPosition)); } catch {}
    }
    return { x, y };
  };

  if (savedPosition && Number.isFinite(savedPosition.x) && Number.isFinite(savedPosition.y)) {
    requestAnimationFrame(() => setPosition(
      8 + savedPosition.x * Math.max(0, window.innerWidth - backButton.offsetWidth - 16),
      8 + savedPosition.y * Math.max(0, window.innerHeight - backButton.offsetHeight - 16),
    ));
  }

  let drag = null;
  dragHandle.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    const bounds = backButton.getBoundingClientRect();
    drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: bounds.left, top: bounds.top, moved: false };
    dragHandle.setPointerCapture(event.pointerId);
  });
  dragHandle.addEventListener("pointermove", (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 5) return;
    drag.moved = true;
    event.preventDefault();
    dragHandle.classList.add("is-dragging");
    setPosition(drag.left + deltaX, drag.top + deltaY);
  });
  const finishDrag = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      const bounds = backButton.getBoundingClientRect();
      setPosition(bounds.left, bounds.top, true);
    }
    dragHandle.classList.remove("is-dragging");
    drag = null;
  };
  dragHandle.addEventListener("pointerup", finishDrag);
  dragHandle.addEventListener("pointercancel", finishDrag);
  dragHandle.addEventListener("lostpointercapture", finishDrag);
  dragHandle.addEventListener("keydown", (event) => {
    const movements = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] };
    const movement = movements[event.key];
    if (!movement) return;
    event.preventDefault();
    const bounds = backButton.getBoundingClientRect();
    const position = setPosition(bounds.left + movement[0], bounds.top + movement[1], true);
    if (backStatus) backStatus.textContent = `Return button moved to ${Math.round(position.x)}, ${Math.round(position.y)}.`;
  });
  window.addEventListener("resize", () => {
    if (!savedPosition) return;
    setPosition(
      8 + savedPosition.x * Math.max(0, window.innerWidth - backButton.offsetWidth - 16),
      8 + savedPosition.y * Math.max(0, window.innerHeight - backButton.offsetHeight - 16),
    );
  }, { passive: true });
  const requested = new URLSearchParams(window.location.search).get("src") || "";
  const safePath = requested.trim();
  if (!safePath || safePath.startsWith("/") || safePath.includes("\\") || safePath.split("/").some((part) => part === ".." || part === ".")) {
    frame.hidden = true;
    error.hidden = false;
    return;
  }

  const destination = new URL(safePath, portfolioRoot);
  if (
    destination.origin !== portfolioRoot.origin ||
    !destination.pathname.startsWith(portfolioRoot.pathname) ||
    destination.pathname === new URL("view.html", portfolioRoot).pathname
  ) {
    frame.hidden = true;
    error.hidden = false;
    return;
  }
  frame.src = destination.href;
  frame.title = `Portfolio: ${safePath.split("/").filter(Boolean).pop() || "selected profile"}`;
  frame.addEventListener("load", async () => {
    try {
      const page = frame.contentDocument;
      if (!page) return;
      if (!page.querySelector('script[data-motion-replay]')) {
        const motionScript = page.createElement("script");
        motionScript.src = new URL("assets/js/animations/replay.js", commonRoot).href;
        motionScript.dataset.motionReplay = "";
        page.body.append(motionScript);
      }
      const { isReviewEnabled } = await import(
        new URL("assets/js/server/api.js", commonRoot).href
      );
      if (!isReviewEnabled(page, page.location.pathname)) {
        page
          .querySelectorAll(
          "#reviews, [data-service-reviews], [data-review-widget]",
          )
          .forEach((node) => node.remove());
        page
          .querySelectorAll(
            "link[data-review-widget-style], script[data-review-widget-script], script[data-review-bootstrap]",
          )
          .forEach((node) => node.remove());
        return;
      }
      const existingWidget = page.querySelector("[data-service-reviews]");
      if (!existingWidget) {
        page
          .querySelectorAll(
            "#reviews, [data-service-reviews]",
          )
          .forEach((node) => node.remove());
      }
      if (
        !page.querySelector(
          "script[data-review-bootstrap], script[data-review-widget-script]",
        )
      ) {
        const script = page.createElement("script");
        script.type = "module";
        script.src = new URL("assets/js/review-bootstrap.js", commonRoot).href;
        script.dataset.reviewBootstrap = "";
        page.body.append(script);
      }
    } catch (injectionError) {
      console.warn("Shared portfolio reviews could not be injected.", injectionError);
    }
  });
})();
