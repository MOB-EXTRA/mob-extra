/* Floats the proof-strip labels around the hero artwork, then settles them into the strip on scroll. */
(function initializeProofFloaters() {
  const heroArt = document.querySelector(".hero-art");
  const proofStrip = document.querySelector(".proof-strip");
  const floatLayer = document.querySelector(".proof-float-layer");
  const floaters = Array.from(document.querySelectorAll(".proof-floater"));
  const destinations = Array.from(document.querySelectorAll(".proof-inner > div > a"));
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  if (!heroArt || !proofStrip || !floatLayer || floaters.length !== 4 || destinations.length !== 4 || reducedMotion) {
    return;
  }

  const positions = [
    [0.04, 0.2],
    [0.72, 0.3],
    [0.05, 0.73],
    [0.68, 0.82],
  ];
  let startPositions = [];
  let startScroll = 0;
  let endScroll = 1;
  let framePending = false;

  function measure() {
    const heroRect = heroArt.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const stripTop = proofStrip.getBoundingClientRect().top + scrollY;

    startPositions = positions.map(([x, y]) => ({
      x: heroRect.left + scrollX + heroRect.width * x,
      y: heroRect.top + scrollY + heroRect.height * y,
    }));
    startScroll = Math.max(0, stripTop - window.innerHeight * 0.78);
    endScroll = Math.max(startScroll + 1, stripTop - window.innerHeight * 0.3);
    update();
  }

  function update() {
    framePending = false;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const progress = Math.max(0, Math.min(1, (scrollY - startScroll) / (endScroll - startScroll)));
    const hasReturned = progress >= 1;

    floaters.forEach((floater, index) => {
      const targetRect = destinations[index].getBoundingClientRect();
      const source = startPositions[index];
      const targetX = targetRect.left + scrollX;
      const targetY = targetRect.top + scrollY;
      const x = source.x + (targetX - source.x) * progress - scrollX;
      const y = source.y + (targetY - source.y) * progress - scrollY;

      floater.style.left = `${x}px`;
      floater.style.top = `${y}px`;
      floater.style.opacity = hasReturned ? "0" : "1";
      floater.style.animationPlayState = progress > 0 ? "paused" : "running";
      floater.style.pointerEvents = hasReturned ? "none" : "auto";
      floater.tabIndex = hasReturned ? -1 : 0;
      floater.setAttribute("aria-hidden", String(hasReturned));
      destinations[index].style.opacity = hasReturned ? "1" : "0";
      destinations[index].style.pointerEvents = hasReturned ? "auto" : "none";
      destinations[index].tabIndex = hasReturned ? 0 : -1;
      destinations[index].setAttribute("aria-hidden", String(!hasReturned));
    });

    floatLayer.setAttribute("aria-hidden", String(hasReturned));
    document.documentElement.classList.add("proof-motion-ready");
  }

  function scheduleUpdate() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", measure, { passive: true });
  measure();
  document.fonts?.ready?.then(measure).catch(() => {});
})();
