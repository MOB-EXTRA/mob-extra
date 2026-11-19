const REVIEWS_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCbCgCRWV4cIDjfGg0llNQXzIscnKvLc9w",
  authDomain: "vile-tempest-reviews.firebaseapp.com",
  projectId: "vile-tempest-reviews",
  storageBucket: "vile-tempest-reviews.firebasestorage.app",
  messagingSenderId: "1047163835896",
  appId: "1:1047163835896:web:93edcc036534ee83f6720d",
};

const REVIEW_CATEGORIES = [
  "General Feedback",
  "Commissions / Services",
  "Utilities",
  "Buying in Shop",
];

let selectedReviewFilter = "all";
let currentReviews = [];
let reviewSectionVisible = false;
let reviewDashboardVisible = false;
let reviewTrendVisible = false;
const countAnimationFrames = new WeakMap();

function stopReviewCountAnimation(element) {
  const frame = countAnimationFrames.get(element);
  if (frame) cancelAnimationFrame(frame);
  countAnimationFrames.delete(element);
}

function resetRatingBars() {
  document.querySelectorAll("[data-rating-bar]").forEach((bar) => { bar.style.height = "0%"; });
}

function replayRatingBars() {
  const bars = [...document.querySelectorAll("[data-rating-bar]")];
  bars.forEach((bar) => { bar.style.height = "0%"; });
  bars.forEach((bar) => void bar.offsetHeight);
  requestAnimationFrame(() => bars.forEach((bar) => { bar.style.height = bar.dataset.targetHeight || "0%"; }));
}

function resetReviewTrend() {
  document.querySelectorAll(".review-trend-track i").forEach((bar) => bar.classList.remove("is-animated"));
}

function replayReviewTrend() {
  const chart = document.querySelector("[data-review-trend]");
  if (!chart) return;
  const bars = [...chart.querySelectorAll(".review-trend-track i")];
  bars.forEach((bar) => bar.classList.remove("is-animated"));
  void chart.offsetWidth;
  requestAnimationFrame(() => bars.forEach((bar, index) => {
    bar.style.transitionDelay = `${index * 100}ms`;
    bar.classList.add("is-animated");
  }));
}

document.addEventListener("site:motion-enter", (event) => {
  if (event.target.matches?.("[data-review-dashboard]")) {
    reviewDashboardVisible = true;
    replayRatingBars();
    return;
  }
  if (event.target.matches?.("[data-review-trend]")) {
    reviewTrendVisible = true;
    replayReviewTrend();
    return;
  }
  if (!event.target.matches?.("[data-service-reviews]")) return;
  reviewSectionVisible = true;
  const count = document.querySelector("[data-service-review-count]");
  if (count) {
    stopReviewCountAnimation(count);
    count.dataset.displayedCount = "0";
    count.textContent = "0 reviews";
    if (currentReviews.length) animateReviewCount(count, currentReviews.length);
  }
});

document.addEventListener("site:motion-leave", (event) => {
  if (event.target.matches?.("[data-review-dashboard]")) {
    reviewDashboardVisible = false;
    resetRatingBars();
    return;
  }
  if (event.target.matches?.("[data-review-trend]")) {
    reviewTrendVisible = false;
    resetReviewTrend();
    return;
  }
  if (!event.target.matches?.("[data-service-reviews]")) return;
  reviewSectionVisible = false;
  const count = document.querySelector("[data-service-review-count]");
  if (count) {
    stopReviewCountAnimation(count);
    count.dataset.displayedCount = "0";
    count.textContent = "0 reviews";
  }
  resetRatingBars();
  resetReviewTrend();
});

function safeAuthor(value) {
  const author = typeof value === "string" ? value.trim() : "";
  if (!author || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(author))
    return "Community member";
  return author.slice(0, 80);
}

function validReviews(reviews) {
  return reviews.filter(
    (review) =>
      review?.isApproved !== false &&
      Number.isInteger(Number(review?.rating)) &&
      Number(review.rating) >= 1 &&
      Number(review.rating) <= 5 &&
      typeof review?.comment === "string" &&
      review.comment.trim(),
  );
}

function renderReviewCards() {
  const list = document.querySelector("[data-service-review-list]");
  if (!list) return;

  const reviews =
    selectedReviewFilter === "all"
      ? currentReviews
      : currentReviews.filter(
          (review) => review.reviewType === selectedReviewFilter,
        );

  if (!reviews.length) {
    const state = document.createElement("p");
    state.className = "service-review-state";
    state.textContent = currentReviews.length
      ? "No reviews in this category yet."
      : "There are no published reviews yet.";
    list.replaceChildren(state);
    return;
  }

  const fragment = document.createDocumentFragment();
  reviews.forEach((review, index) => {
    const card = document.createElement("article");
    card.className = "service-review-card";
    card.style.setProperty("--review-index", Math.min(index, 12));

    const avatar = document.createElement("span");
    avatar.className = "service-review-avatar";
    avatar.setAttribute("aria-hidden", "true");
    const displayAuthor = safeAuthor(review.author);
    avatar.textContent =
      displayAuthor === "Community member"
        ? "•"
        : Array.from(displayAuthor.trim())[0].toUpperCase();

    const bubble = document.createElement("div");
    bubble.className = "service-review-bubble";

    const top = document.createElement("div");
    top.className = "service-review-card-top";
    const authorMeta = document.createElement("div");
    authorMeta.className = "service-review-author-meta";
    const author = document.createElement("strong");
    author.className = "service-review-author";
    author.textContent = displayAuthor;
    const category = document.createElement("span");
    category.className = "service-review-category";
    category.textContent = REVIEW_CATEGORIES.includes(review.reviewType)
      ? review.reviewType
      : "Community feedback";
    authorMeta.append(author, category);

    const rating = Number(review.rating);
    const ratingStars = document.createElement("span");
    ratingStars.className = "service-review-card-stars";
    ratingStars.innerHTML = Array.from({ length: 5 }, (_, index) =>
      `<i class="fa-${index < rating ? "solid" : "regular"} fa-star" aria-hidden="true"></i>`,
    ).join("");
    ratingStars.setAttribute("aria-label", `${rating} out of 5 stars`);
    top.append(authorMeta, ratingStars);

    const comment = document.createElement("p");
    comment.className = "service-review-comment";
    comment.textContent = review.comment.trim();
    bubble.append(top, comment);

    if (review.specificUtility) {
      const detail = document.createElement("span");
      detail.className = "service-review-detail";
      detail.textContent = review.specificUtility;
      bubble.append(detail);
    }
    card.append(avatar, bubble);
    fragment.append(card);
  });
  list.replaceChildren(fragment);
}

function animateReviewCount(element, target, duration = 1200) {
  stopReviewCountAnimation(element);
  const start = performance.now();
  const previous = Number(element.dataset.displayedCount || 0);

  const format = (value) => `${value} ${value === 1 ? "review" : "reviews"}`;

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased =
      progress < 0.5
        ? 4 * Math.pow(progress, 3)
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    const value = Math.round(previous + (target - previous) * eased);

    element.textContent = format(value);

    if (progress < 1) {
      countAnimationFrames.set(element, requestAnimationFrame(update));
    } else {
      element.textContent = format(target);
      element.dataset.displayedCount = String(target);
      countAnimationFrames.delete(element);
    }
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    element.textContent = format(target);
    element.dataset.displayedCount = String(target);
    return;
  }

  countAnimationFrames.set(element, requestAnimationFrame(update));
}

function updateSummary() {
  const average = document.querySelector("[data-service-review-average]");
  const stars = document.querySelector("[data-service-review-stars]");
  const count = document.querySelector("[data-service-review-count]");
  if (!average || !stars || !count) return;

  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  currentReviews.forEach((review) => {
    ratingCounts[Number(review.rating)] += 1;
  });
  const totalElement = document.querySelector("[data-review-total]");
  if (totalElement) totalElement.textContent = `${currentReviews.length} total`;
  Object.entries(ratingCounts).forEach(([rating, amount]) => {
    const countElement = document.querySelector(
      `[data-rating-count="${rating}"]`,
    );
    const bar = document.querySelector(`[data-rating-bar="${rating}"]`);
    if (countElement) countElement.textContent = String(amount);
    if (bar) {
      const targetHeight = `${currentReviews.length ? (amount / currentReviews.length) * 100 : 0}%`;
      bar.dataset.targetHeight = targetHeight;
      bar.style.height = reviewDashboardVisible ? targetHeight : "0%";
    }
  });

  renderReviewTypeOverview();
  renderRecentReviews();
  renderMonthlyTrend();

  if (!currentReviews.length) {
    average.textContent = "—";
    stars.innerHTML = Array.from({ length: 5 }, () => '<i class="fa-regular fa-star" aria-hidden="true"></i>').join("");
    stars.setAttribute("aria-label", "No ratings yet");
    count.textContent = "No reviews yet";
  } else {
    const score =
      currentReviews.reduce((sum, review) => sum + Number(review.rating), 0) /
      currentReviews.length;
    const rounded = Math.round(score);
    average.textContent = score.toFixed(2);
    stars.innerHTML = Array.from({ length: 5 }, (_, index) =>
      `<i class="fa-${index < rounded ? "solid" : "regular"} fa-star" aria-hidden="true"></i>`,
    ).join("");
    stars.setAttribute("aria-label", `${score.toFixed(2)} out of 5 stars`);
    if (reviewSectionVisible) animateReviewCount(count, currentReviews.length);
    else count.textContent = `${currentReviews.length} reviews`;
  }

  const filterBar = document.querySelector("[data-review-filters]");
  const categories = [
    ...new Set([
      ...REVIEW_CATEGORIES,
      ...currentReviews
        .map((review) => review.reviewType)
        .filter((category) => typeof category === "string" && category.trim()),
    ]),
  ];
  categories.forEach((category) => {
    if (
      filterBar &&
      !filterBar.querySelector(`[data-review-filter="${CSS.escape(category)}"]`)
    ) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "service-review-filter";
      button.dataset.reviewFilter = category;
      button.setAttribute("aria-pressed", "false");
      button.textContent = category;
      filterBar.append(button);
    }
  });

  document.querySelectorAll("[data-review-filter]").forEach((button) => {
    const category = button.dataset.reviewFilter;
    const amount =
      category === "all"
        ? currentReviews.length
        : currentReviews.filter((review) => review.reviewType === category)
            .length;
    button.dataset.count = String(amount);
  });
}

function renderMonthlyTrend() {
  const chart = document.querySelector("[data-review-trend]");
  if (!chart) return;
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return { date, count: 0 };
  });
  currentReviews.forEach((review) => {
    let date = null;
    try {
      if (review.timestamp?.toDate) date = review.timestamp.toDate();
      else if (review.timestamp) date = new Date(review.timestamp);
    } catch {
      date = null;
    }
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return;
    const slot = months.find(
      ({ date: month }) =>
        month.getFullYear() === date.getFullYear() &&
        month.getMonth() === date.getMonth(),
    );
    if (slot) slot.count += 1;
  });
  const highest = Math.max(1, ...months.map((month) => month.count));
  const fragment = document.createDocumentFragment();
  months.forEach(({ date, count }) => {
    const column = document.createElement("div");
    column.className = "review-trend-column";
    const value = document.createElement("span");
    value.textContent = String(count);
    const track = document.createElement("span");
    track.className = "review-trend-track";
    const bar = document.createElement("i");
    bar.style.height = `${count ? Math.max(8, (count / highest) * 100) : 0}%`;
    track.append(bar);
    const label = document.createElement("span");
    label.textContent = date.toLocaleString(undefined, { month: "short" });
    column.append(value, track, label);
    fragment.append(column);
  });
  chart.replaceChildren(fragment);

  // Trigger the bar animations after rendering.
  if (reviewTrendVisible) requestAnimationFrame(() => {
    chart.querySelectorAll(".review-trend-track i").forEach((bar, index) => {
      bar.style.transitionDelay = `${index * 100}ms`;
      bar.classList.add("is-animated");
    });
  });
}

function renderRecentReviews() {
  const list = document.querySelector("[data-review-latest]");
  if (!list) return;
  if (!currentReviews.length) {
    const empty = document.createElement("p");
    empty.className = "review-recent-empty";
    empty.textContent = "No published reviews yet.";
    list.replaceChildren(empty);
    return;
  }
  list.replaceChildren();
  const panel = list.closest(".review-recent-panel");
  const analytics = document.querySelector(".review-analytics-panel");
  const panelStyle = panel ? getComputedStyle(panel) : null;
  const panelPadding = panelStyle
    ? parseFloat(panelStyle.paddingTop) + parseFloat(panelStyle.paddingBottom)
    : 0;
  const headingHeight =
    panel?.querySelector(".review-recent-heading")?.getBoundingClientRect()
      .height || 0;
  const gapAllowance = 8;
  const availableHeight = analytics?.getBoundingClientRect().height
    ? Math.max(
        0,
        analytics.getBoundingClientRect().height -
          panelPadding -
          headingHeight -
          gapAllowance,
      )
    : Infinity;
  let usedHeight = 0;

  currentReviews.forEach((review) => {
    const row = document.createElement("article");
    row.className = "review-recent-item";
    const meta = document.createElement("div");
    meta.className = "review-recent-meta";
    const author = document.createElement("strong");
    author.textContent = safeAuthor(review.author);
    const category = document.createElement("span");
    category.textContent = REVIEW_CATEGORIES.includes(review.reviewType)
      ? review.reviewType
      : "Community feedback";
    meta.append(author, category);
    const rating = document.createElement("span");
    rating.className = "review-recent-score";
    rating.innerHTML = `<i class="fa-solid fa-star" aria-hidden="true"></i> ${Number(review.rating).toFixed(2)}`;
    const comment = document.createElement("p");
    comment.textContent = review.comment.trim();
    row.append(meta, rating, comment);
    list.append(row);
    const rowHeight = row.getBoundingClientRect().height;

    // if (usedHeight + rowHeight > availableHeight && list.children.length > 1) {
    if (usedHeight > availableHeight && list.children.length > 1) {
      row.remove();
      return;
    }
    usedHeight += rowHeight;
  });
}

function renderReviewTypeOverview() {
  const container = document.querySelector("[data-review-type-overview]");
  if (!container) return;
  const categories = [
    ...new Set([
      ...REVIEW_CATEGORIES,
      ...currentReviews
        .map((review) => review.reviewType)
        .filter((value) => typeof value === "string" && value.trim()),
    ]),
  ].map((name) => {
    const items = currentReviews.filter((review) => review.reviewType === name);
    const mean = items.length
      ? items.reduce((sum, review) => sum + Number(review.rating), 0) /
        items.length
      : 0;
    return { name, items, mean };
  });
  const leadingCount = Math.max(
    0,
    ...categories.map((category) => category.items.length),
  );
  const fragment = document.createDocumentFragment();
  categories.forEach(({ name, items, mean }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `review-type-card${items.length && items.length === leadingCount ? " is-leading" : ""}`;
    button.dataset.reviewTypeSelect = name;
    button.setAttribute(
      "aria-label",
      `Filter ${name}: ${items.length} reviews, ${mean ? mean.toFixed(2) : "no"} average rating`,
    );
    const title = document.createElement("span");
    title.className = "review-type-name";
    title.textContent = name;
    const metric = document.createElement("strong");
    metric.className = "review-type-count";
    metric.textContent = String(items.length);
    const note = document.createElement("span");
    note.className = "review-type-meta";
    note.innerHTML = `${items.length ? mean.toFixed(2) : "—"} <i class="fa-solid fa-star" aria-hidden="true"></i> average · ${currentReviews.length ? Math.round((items.length / currentReviews.length) * 100) : 0}% of reviews`;
    const bar = document.createElement("i");
    bar.className = "review-type-bar";
    bar.style.setProperty(
      "--fill",
      `${leadingCount ? (items.length / leadingCount) * 100 : 0}%`,
    );
    button.append(title, metric, note, bar);
    fragment.append(button);
  });
  container.replaceChildren(fragment);
  container.querySelectorAll("[data-review-type-select]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedReviewFilter = button.dataset.reviewTypeSelect;
      document.querySelectorAll("[data-review-filter]").forEach((filter) => {
        const active = filter.dataset.reviewFilter === selectedReviewFilter;
        filter.classList.toggle("is-active", active);
        filter.setAttribute("aria-pressed", String(active));
      });
      renderReviewCards();
    });
  });
}

function bindReviewFilters() {
  const filterBar = document.querySelector("[data-review-filters]");
  if (!filterBar || filterBar.dataset.bound) return;
  filterBar.dataset.bound = "true";
  filterBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-review-filter]");
    if (!button || !filterBar.contains(button)) return;
    selectedReviewFilter = button.dataset.reviewFilter || "all";
    filterBar.querySelectorAll("[data-review-filter]").forEach((filter) => {
      const active = filter === button;
      filter.classList.toggle("is-active", active);
      filter.setAttribute("aria-pressed", String(active));
    });
    renderReviewCards();
  });
}

function showReviewLoadError() {
  const list = document.querySelector("[data-service-review-list]");
  const count = document.querySelector("[data-service-review-count]");
  if (count) count.textContent = "Reviews unavailable";
  const liveStatus = document.querySelector("[data-review-live-status]");
  if (liveStatus) {
    liveStatus.classList.add("is-offline");
    liveStatus.lastChild.textContent = " Feed temporarily unavailable";
  }
  if (!list) return;
  const state = document.createElement("p");
  state.className = "service-review-state";
  state.textContent =
    "Reviews are temporarily unavailable. Please try again later.";
  list.replaceChildren(state);
}

async function loadReviews() {
  const reviewSection = document.querySelector("[data-service-reviews]");
  if (!reviewSection) return;
  const bounds = reviewSection.getBoundingClientRect();
  reviewSectionVisible = bounds.bottom > 0 && bounds.top < window.innerHeight;
  const dashboard = document.querySelector("[data-review-dashboard]")?.getBoundingClientRect();
  reviewDashboardVisible = Boolean(dashboard && dashboard.bottom > 0 && dashboard.top < window.innerHeight);
  const trend = document.querySelector("[data-review-trend]")?.getBoundingClientRect();
  reviewTrendVisible = Boolean(trend && trend.bottom > 0 && trend.top < window.innerHeight);
  bindReviewFilters();
  const initialStatus = document.querySelector("[data-review-live-status]");
  if (initialStatus)
    initialStatus.lastChild.textContent = " Connecting to live feed";

  try {
    const [{ initializeApp, getApps }, firestore] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js"),
    ]);
    const appName = "portfolio-community-reviews";
    const app = getApps().find((entry) => entry.name === appName) ||
      initializeApp(REVIEWS_FIREBASE_CONFIG, appName);
    const db = firestore.getFirestore(app);
    const reviewQuery = firestore.query(
      firestore.collection(db, "site_reviews"),
      firestore.orderBy("timestamp", "desc"),
    );

    firestore.onSnapshot(
      reviewQuery,
      (snapshot) => {
        currentReviews = validReviews(
          snapshot.docs.map((entry) => entry.data()),
        );
        const liveStatus = document.querySelector("[data-review-live-status]");
        if (liveStatus) {
          liveStatus.classList.remove("is-offline");
          liveStatus.lastChild.textContent = " Live review feed";
        }
        updateSummary();
        renderReviewCards();
      },
      (error) => {
        console.warn("Live reviews could not be streamed.", error);
        showReviewLoadError();
      },
    );
    let resizeTimer;
    window.addEventListener(
      "resize",
      () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(renderRecentReviews, 120);
      },
      { passive: true },
    );
  } catch (error) {
    console.warn("Reviews could not be initialized.", error);
    showReviewLoadError();
  }
}

loadReviews();
