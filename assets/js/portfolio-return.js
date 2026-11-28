(() => {
  const button = document.querySelector("[data-portfolio-return]");
  if (!button) return;

  let pointer = null;
  let wasDragged = false;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));

  button.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;

    const rect = button.getBoundingClientRect();
    pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
    wasDragged = false;
    button.style.left = `${rect.left}px`;
    button.style.top = `${rect.top}px`;
    button.style.right = "auto";
    button.style.bottom = "auto";
    button.style.transform = "translate3d(0, 0, 0)";
    button.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  button.addEventListener("pointermove", (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;

    const deltaX = event.clientX - pointer.x;
    const deltaY = event.clientY - pointer.y;
    if (!wasDragged && Math.hypot(deltaX, deltaY) < 5) return;

    wasDragged = true;
    button.classList.add("is-dragging");
    const left = clamp(pointer.left + deltaX, 8, window.innerWidth - pointer.width - 8);
    const top = clamp(pointer.top + deltaY, 8, window.innerHeight - pointer.height - 8);
    button.style.transform = `translate3d(${left - pointer.left}px, ${top - pointer.top}px, 0)`;
  });

  const endDrag = (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    pointer = null;
    button.classList.remove("is-dragging");
  };
  button.addEventListener("pointerup", endDrag);
  button.addEventListener("pointercancel", (event) => {
    endDrag(event);
    wasDragged = false;
  });
  button.addEventListener("dragstart", (event) => event.preventDefault());

  button.addEventListener("click", (event) => {
    if (wasDragged && event.detail > 0) {
      event.preventDefault();
      wasDragged = false;
      return;
    }
    wasDragged = false;

    const touchActivation =
      event.pointerType === "touch" ||
      window.matchMedia("(hover: none)").matches;
    if (
      event.detail > 0 &&
      (touchActivation || !button.matches(":hover")) &&
      !button.classList.contains("is-expanded")
    ) {
      event.preventDefault();
      button.classList.add("is-expanded");
      return;
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!button.contains(event.target)) button.classList.remove("is-expanded");
  });
})();
