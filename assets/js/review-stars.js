const STAR_COUNT = 5;

export function renderAverageStars(container, rating) {
  const score = Number(rating);
  if (!Number.isFinite(score) || score <= 0) {
    container.replaceChildren(
      ...Array.from({ length: STAR_COUNT }, () => {
        const star = document.createElement("i");
        star.className = "fa-regular fa-star";
        star.setAttribute("aria-hidden", "true");
        return star;
      }),
    );
    container.removeAttribute("data-rating");
    container.setAttribute("aria-label", "No ratings yet");
    return;
  }

  const normalizedScore = Math.min(STAR_COUNT, score);
  container.replaceChildren(
    ...Array.from({ length: STAR_COUNT }, (_, index) => {
      const fill = Math.min(1, Math.max(0, normalizedScore - index));
      const star = document.createElement("i");
      star.className = "fa-solid fa-star";
      star.style.setProperty("--star-fill", `${fill * 100}%`);
      star.setAttribute("aria-hidden", "true");
      return star;
    }),
  );
  container.dataset.rating = normalizedScore.toFixed(2);
  container.setAttribute(
    "aria-label",
    `${normalizedScore.toFixed(2)} out of 5 stars`,
  );
}
