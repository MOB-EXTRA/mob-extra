import {
  findReviewByDeviceToken,
  saveReview,
  synchronizeReviewAuthor,
  getCurrentReviewContext,
  getReviewTargetId,
  populateReviewFeatureSelect,
  getReviewAuthorName,
  getReviewDeviceId,
  isReservedReviewAuthor,
  setReviewAuthorName,
  isReviewEnabled,
} from "./server/api.js";

const pagePath = window.location.pathname;
const siteBase = new URL("../../", import.meta.url);

if (
  isReviewEnabled(document, pagePath) &&
  !window.mobExtraReviewWidgetLoaded &&
  !document.querySelector("[data-service-reviews]")
) {
  window.mobExtraReviewWidgetLoaded = true;
  document
    .querySelectorAll("#reviews, [data-review-widget]")
    .forEach((node) => node.remove());
  const section = document.createElement("section");
  section.className = "service-reviews review-widget-section is-loading";
  section.id = "reviews";
  section.dataset.serviceReviews = "";
  section.setAttribute("aria-labelledby", "service-reviews-title");
  section.innerHTML = `
    <div class="service-reviews-heading"><div><p class="kicker">COMMUNITY FEEDBACK</p><h2 id="service-reviews-title">Reviews &amp; experiences</h2><p class="service-reviews-note">See what visitors think and share your experience with this page or feature.</p></div></div>
    <div class="review-top-dashboard">
      <section class="review-analytics-panel" aria-label="Review analytics">
        <div class="review-panel-heading"><h3>Reviews overview</h3><span>All time</span></div>
        <div class="review-stat-cards">
          <div class="review-stat-card"><span>Total reviews</span><strong data-service-review-count>—</strong><small>Published feedback</small></div>
          <div class="review-stat-card"><span>Average rating</span><strong><b data-service-review-average>—</b><span class="service-review-stars" data-service-review-stars aria-label="No ratings yet"><i class="fa-regular fa-star" aria-hidden="true"></i><i class="fa-regular fa-star" aria-hidden="true"></i><i class="fa-regular fa-star" aria-hidden="true"></i><i class="fa-regular fa-star" aria-hidden="true"></i><i class="fa-regular fa-star" aria-hidden="true"></i></span></strong><small>Across all review types</small></div>
        </div>
        <div class="review-dashboard" aria-label="Rating distribution" data-review-dashboard><div class="review-dashboard-title"><span>Rating<br>breakdown</span><span data-review-total>0 total</span></div><div class="review-rating-rows">
          ${[5,4,3,2,1].map((rating) => `<div class="review-rating-row" data-rating-row="${rating}"><span>${rating} <i class="fa-solid fa-star" aria-hidden="true"></i></span><span class="review-rating-track"><i data-rating-bar="${rating}"></i></span><span data-rating-count="${rating}">0</span></div>`).join("")}
        </div></div>
        <div class="review-trend-chart" aria-label="Reviews by month over the last six months" data-review-trend aria-busy="true"></div>
      </section>
      <div class="review-recent-panel"><div class="review-recent-heading"><h3>Recent reviews</h3><span>Latest feedback</span></div><div class="review-recent-list" data-review-latest aria-busy="true"></div></div>
    </div>
    <div class="review-type-overview" aria-label="Review types" data-review-type-overview aria-busy="true"></div>
    <div class="review-community-layout">
      <section class="review-all-panel" aria-labelledby="review-all-title">
        <div class="review-customer-heading"><div><h3 id="review-all-title">All reviews</h3><p>Feedback from across the community</p></div><p class="service-review-live is-connecting" data-review-live-status><span aria-hidden="true"></span> Connecting to live feed</p></div>
        <div class="service-review-filters" role="group" aria-label="Filter reviews by category" data-review-filters>
          <button type="button" class="service-review-filter is-active" data-review-filter="all" aria-pressed="true">All</button>
          <button type="button" class="service-review-filter" data-review-filter="General Feedback" aria-pressed="false">General</button>
          <button type="button" class="service-review-filter" data-review-filter="Commissions / Services" aria-pressed="false">Services</button>
          <button type="button" class="service-review-filter" data-review-filter="Utilities" aria-pressed="false">Utilities</button>
          <button type="button" class="service-review-filter" data-review-filter="Buying in Shop" aria-pressed="false">Shop</button>
        </div>
        <div class="service-review-list" data-service-review-list aria-live="polite" aria-busy="true"></div>
      </section>
      <form class="review-submit-panel" data-review-submit>
      <div class="review-submit-heading"><p class="kicker">YOUR EXPERIENCE MATTERS</p><h3 data-review-form-title>Leave a review</h3><p>Tell us about your experience with this page or feature.</p></div>
      <p class="review-target-notice" data-review-target-notice role="status" aria-live="polite" hidden></p>
      <div class="review-submit-fields">
        <label>Category<select name="reviewType"><option>General Feedback</option><option>Commissions / Services</option><option>Utilities</option><option>Buying in Shop</option></select></label>
        <label>Rating<select name="rating" required><option value="5">5 stars — Excellent</option><option value="4">4 stars — Good</option><option value="3">3 stars — Fair</option><option value="2">2 stars — Poor</option><option value="1">1 star — Very poor</option></select></label>
        <label class="review-submit-utility" data-review-utility-field hidden>Which utility or hub is this about?<select name="specificUtility"><option value="">Select a utility or hub</option></select></label>
        <label class="review-submit-name">Name or gamer tag <span>(optional; shared across your reviews)</span><input name="author" maxlength="80" autocomplete="nickname" placeholder="Community member"></label>
        <label class="review-submit-comment">Your review<textarea name="comment" minlength="5" maxlength="1200" rows="4" required placeholder="Share your experience…"></textarea></label>
      </div>
      <label class="review-submit-consent"><input type="checkbox" name="consent" required><span>I agree that my review may be displayed publicly. See the <a href="${new URL("pages/privacy.html", siteBase).href}">Privacy Policy</a>.</span></label>
      <div class="review-submit-actions"><button type="submit"><span data-review-submit-label>Submit review</span> <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></button><p class="review-submit-status" role="status" aria-live="polite"></p></div>
      </form>
    </div>`;
  const main = document.querySelector("main");
  const footer = document.querySelector("[data-site-footer], footer");
  if (main) main.after(section);
  else if (footer) footer.before(section);
  else document.body.append(section);

  const skeleton = '<span class="review-loading-shimmer" aria-hidden="true"></span>';
  section.querySelector("[data-review-latest]").innerHTML = Array.from(
    { length: 5 },
    () => `<div class="review-recent-skeleton" aria-hidden="true"><span class="review-loading-shimmer review-recent-skeleton-author"></span><span class="review-loading-shimmer review-recent-skeleton-rating"></span><span class="review-loading-shimmer review-recent-skeleton-comment"></span></div>`,
  ).join("");
  section.querySelector("[data-service-review-list]").innerHTML = Array.from(
    { length: 6 },
    () => `<div class="service-review-skeleton" aria-hidden="true"><span class="review-skeleton-avatar">${skeleton}</span><span class="review-skeleton-bubble"><span class="review-loading-shimmer"></span><span class="review-loading-shimmer"></span><span class="review-loading-shimmer"></span></span></div>`,
  ).join("");
  section.querySelector("[data-review-type-overview]").innerHTML = Array.from(
    { length: 4 },
    () => `<div class="review-type-skeleton" aria-hidden="true"><span class="review-loading-shimmer"></span><span class="review-loading-shimmer"></span><span class="review-loading-shimmer"></span></div>`,
  ).join("");
  section.querySelector("[data-review-trend]").innerHTML = Array.from(
    { length: 6 },
    (_, index) => `<span class="review-trend-skeleton" aria-hidden="true"><span class="review-loading-shimmer"></span><span class="review-loading-shimmer" style="--skeleton-bar-height:${[18, 32, 24, 42, 58, 76][index]}%"></span><span class="review-loading-shimmer"></span></span>`,
  ).join("");

  import("./service-reviews.js").catch((error) => {
    console.warn("Review analytics could not be loaded.", error);
    const status = section.querySelector("[data-review-live-status]");
    if (status) status.textContent = " Review feed temporarily unavailable";
  });

  const form = section.querySelector("[data-review-submit]");
  const formStatus = section.querySelector(".review-submit-status");
  const submit = form.querySelector("button[type=submit]");
  const submitLabel = form.querySelector("[data-review-submit-label]");
  const formTitle = form.querySelector("[data-review-form-title]");
  const categorySelect = form.elements.reviewType;
  const utilityField = form.querySelector("[data-review-utility-field]");
  const utilitySelect = form.elements.specificUtility;
  let isCategoryLocked = true;
  let isUtilityLocked = true;
  categorySelect.disabled = true;
  utilitySelect.disabled = true;
  const deviceToken = getReviewDeviceId();
  let authorProfileName = getReviewAuthorName();
  if (authorProfileName) form.elements.author.value = authorProfileName;

  let isEditing = false;
  let isSubmitting = false;
  let activeReviewTargetId = "";
  let targetLookupSequence = 0;
  let reviewLookup = Promise.resolve(false);
  const reviewDrafts = new Map();
  const targetNotice = form.querySelector("[data-review-target-notice]");
  let reviewContext = {
    category: "General Feedback",
    section: "",
    title: document.title || "Current page",
    pageId:
      pagePath.replace(/index\.html$/i, "").replace(/\/+$/, "").toLowerCase() ||
      "/",
    features: [],
    categoryChangeable: false,
  };
  let compactReview = null;

  function setReviewStatus(message, kind = "") {
    formStatus.textContent = kind === "warning" ? "" : message;
    formStatus.classList.toggle("is-warning", kind === "warning");
    targetNotice.hidden = kind !== "warning" || !message;
    targetNotice.textContent = kind === "warning" ? message : "";
    if (compactReview) {
      compactReview.status.textContent = message;
      compactReview.status.classList.toggle("is-warning", kind === "warning");
    }
  }

  function setSubmissionDisabled(disabled) {
    submit.disabled = disabled;
    categorySelect.disabled = disabled || isCategoryLocked;
    utilitySelect.disabled = disabled || isUtilityLocked;
    if (compactReview) compactReview.submitButton.disabled = disabled;
  }

  function populateUtilityOptions(selectedValue = "") {
    populateReviewFeatureSelect(utilitySelect, reviewContext, selectedValue);
  }

  function updateUtilityField() {
    const isUtilityReview = categorySelect.value === "Utilities";
    utilityField.hidden = !isUtilityReview;
    utilitySelect.required = isUtilityReview;
  }

  function getCurrentReviewTargetId() {
    if (categorySelect.value === "Utilities" && !utilitySelect.value) return "";
    return getReviewTargetId(
      categorySelect.value,
      categorySelect.value === "Utilities" ? utilitySelect.value : "",
      reviewContext.pageId,
    );
  }

  function getCurrentReviewTargetLabel() {
    return categorySelect.value === "Utilities"
      ? utilitySelect.value || "a utility or hub"
      : reviewContext.title;
  }

  function reviewMatchesCompactTarget(review) {
    const targetId = getCurrentReviewTargetId();
    if (review.reviewTargetId) return review.reviewTargetId === targetId;
    if (review.reviewType !== categorySelect.value) return false;

    const normalizeFeature = (value) =>
      String(value || "")
        .normalize("NFKC")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
    if (
      categorySelect.value === "Utilities" &&
      normalizeFeature(review.specificUtility) ===
        normalizeFeature(utilitySelect.value)
    ) {
      return true;
    }
    let legacyPath = String(review.pageId || "");
    if (!legacyPath && review.pageUrl) {
      try {
        legacyPath = new URL(review.pageUrl, window.location.href).pathname;
      } catch {
        return false;
      }
    }
    return (
      legacyPath.replace(/index\.html$/i, "").replace(/\/+$/, "").toLowerCase() ||
      "/"
    ) === reviewContext.pageId;
  }

  function renderCompactRecentReviews(reviews, error = null) {
    if (!compactReview) return;
    compactReview.recentSection.setAttribute("aria-busy", "false");
    if (error) {
      const state = document.createElement("p");
      state.className = "compact-review-recent-state";
      state.textContent = "Recent reviews are temporarily unavailable.";
      compactReview.recent.replaceChildren(state);
      return;
    }

    const approvedReviews = reviews.filter(
      (review) =>
        review.isApproved !== false &&
        Number.isInteger(Number(review.rating)) &&
        Number(review.rating) >= 1 &&
        Number(review.rating) <= 5 &&
        typeof review.comment === "string" &&
        review.comment.trim(),
    );
    approvedReviews.sort((first, second) => {
      const getTimestamp = (review) => {
        const timestamp =
          review.timestamp || review.updatedAt || review.createdAt;
        if (typeof timestamp?.toMillis === "function") {
          return timestamp.toMillis();
        }
        if (typeof timestamp?.seconds === "number") {
          return timestamp.seconds * 1000;
        }
        const parsed = Date.parse(timestamp || "");
        return Number.isNaN(parsed) ? 0 : parsed;
      };
      return getTimestamp(second) - getTimestamp(first);
    });
    if (!approvedReviews.length) {
      const state = document.createElement("p");
      state.className = "compact-review-recent-state";
      state.textContent = "No reviews for this page yet. Be the first to share your experience.";
      compactReview.recent.replaceChildren(state);
      return;
    }

    const fragment = document.createDocumentFragment();
    approvedReviews.slice(0, 3).forEach((review) => {
      const card = document.createElement("article");
      card.className = "compact-review-recent-item";
      const meta = document.createElement("div");
      meta.className = "compact-review-recent-meta";
      const author = document.createElement("strong");
      const rawAuthor = String(review.author || "").trim();
      author.textContent =
        !rawAuthor ||
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawAuthor) ||
        isReservedReviewAuthor(rawAuthor)
          ? "Community member"
          : rawAuthor.slice(0, 80);
      const rating = document.createElement("span");
      rating.className = "compact-review-recent-rating";
      rating.innerHTML = `<i class="fa-solid fa-star" aria-hidden="true"></i> ${Number(review.rating)}.0`;
      meta.append(author, rating);
      const comment = document.createElement("p");
      comment.textContent = review.comment.trim();
      card.append(meta, comment);
      fragment.append(card);
    });
    compactReview.recent.replaceChildren(fragment);
  }

  function saveReviewDraft(targetId) {
    reviewDrafts.set(targetId, {
      author: form.elements.author.value,
      rating: form.elements.rating.value,
      comment: form.elements.comment.value,
      consent: form.elements.consent.checked,
    });
  }

  function prepareNewReview(targetId) {
    const draft = reviewDrafts.get(targetId);
    isEditing = false;
    formTitle.textContent = "Leave a review";
    submitLabel.textContent = "Submit review";
    form.elements.author.value =
      draft?.author || authorProfileName || "";
    form.elements.rating.value = draft?.rating || "5";
    form.elements.comment.value = draft?.comment || "";
    form.elements.consent.checked = Boolean(draft?.consent);
    updateUtilityField();
    syncCompactReview();
    setReviewStatus(draft ? "Your unsent draft was restored." : "");
  }

  function syncCompactReview() {
    if (!compactReview) return;
    compactReview.rating.value = form.elements.rating.value || "5";
    compactReview.comment.value = form.elements.comment.value || "";
    compactReview.context.textContent =
      categorySelect.value === "Utilities"
        ? `${categorySelect.value} · ${utilitySelect.value || "Choose a utility or hub"}`
        : categorySelect.value;
    compactReview.submitLabel.textContent = isEditing
      ? "Save changes"
      : "Submit review";
    updateCompactRating();
  }

  function updateCompactRating() {
    if (!compactReview) return;
    const rating = Number(compactReview.rating.value) || 5;
    const ratingDescriptions = {
      1: "Very poor",
      2: "Poor",
      3: "Fair",
      4: "Good",
      5: "Excellent",
    };
    compactReview.stars.forEach(({ label, input }) => {
      label.classList.toggle("is-filled", Number(input.value) <= rating);
    });
    compactReview.ratingDescription.textContent =
      ratingDescriptions[rating] || "Choose a rating";
  }

  function setCompactReviewLoading(loading) {
    if (!compactReview || (loading && compactReview.isReady)) return;
    compactReview.section.classList.toggle("is-loading", loading);
    compactReview.section.setAttribute("aria-busy", String(loading));
    compactReview.skeleton.hidden = !loading;
    compactReview.form.hidden = loading;
    if (!loading) compactReview.isReady = true;
  }

  function findCompactReviewTarget(context) {
    if (context.section !== "tools" && context.section !== "hubs") return null;

    const currentPath = pagePath
      .replace(/index\.html$/i, "")
      .replace(/\/+$/, "");
    if (/\/pages\/(tools|hubs)$/i.test(currentPath)) return null;

    const main = document.querySelector("main");
    if (!main) return null;
    const selectors =
      context.section === "tools"
        ? [
            "[data-review-primary]",
            ".tool-workspace",
            ".formatter-page-content",
            "[data-tool-workspace]",
            "[data-tool-primary]",
          ]
        : [
            "[data-review-primary]",
            "[data-hub-primary]",
            "[data-ptb-root]",
            "[data-code-hub] .content-grid",
            ".page-content .content-grid",
          ];

    for (const selector of selectors) {
      const target = main.querySelector(selector);
      if (target) return target;
    }

    return main.querySelector(".page-content")?.firstElementChild || null;
  }

  function createCompactReview(context) {
    const target = findCompactReviewTarget(context);
    if (!target) return null;

    const quickSection = document.createElement("section");
    quickSection.className = "compact-review-section is-loading";
    quickSection.setAttribute("aria-busy", "true");
    if (
      target.matches(".container") ||
      !target.parentElement?.closest(".container")
    ) {
      quickSection.classList.add("compact-review-section--contained");
    }
    quickSection.setAttribute("aria-labelledby", "compact-review-title");
    quickSection.innerHTML = `
      <div class="compact-review-heading">
        <div><p class="kicker">YOUR EXPERIENCE MATTERS</p><h2 id="compact-review-title">Rate this page</h2></div>
        <span class="compact-review-context" data-compact-review-context></span>
      </div>
      <div class="compact-review-skeleton" data-compact-review-skeleton aria-hidden="true">
        <div class="compact-review-skeleton-rating">
          <span class="review-loading-shimmer"></span>
          <div>${Array.from({ length: 5 }, () => '<span class="review-loading-shimmer"></span>').join("")}</div>
          <span class="review-loading-shimmer"></span>
        </div>
        <div class="compact-review-skeleton-comment">
          <span class="review-loading-shimmer"></span>
          <span class="review-loading-shimmer"></span>
        </div>
        <div class="compact-review-skeleton-actions">
          <span class="review-loading-shimmer"></span>
          <span class="review-loading-shimmer"></span>
        </div>
        <span class="review-loading-shimmer compact-review-skeleton-status"></span>
      </div>
      <form class="compact-review-form" data-compact-review-form hidden>
        <fieldset class="compact-review-rating">
          <legend>Rating</legend>
          <div class="compact-review-stars" role="radiogroup" aria-label="Rating">
            ${[1, 2, 3, 4, 5]
              .map(
                (rating) => `
                  <label class="compact-review-star">
                    <input type="radio" name="rating" value="${rating}" aria-label="${rating} ${rating === 1 ? "star" : "stars"}" ${rating === 5 ? "required checked" : ""}>
                    <span aria-hidden="true">★</span>
                  </label>`,
              )
              .join("")}
          </div>
          <p class="compact-review-rating-description" data-compact-rating-description aria-live="polite"></p>
        </fieldset>
        <label class="compact-review-comment">Your review
          <textarea name="comment" minlength="5" maxlength="1200" rows="2" required placeholder="Share your experience…"></textarea>
        </label>
        <div class="compact-review-actions">
          <label class="compact-review-consent"><input type="checkbox" name="consent" required><span>I agree to public display. <a href="${new URL("pages/privacy.html", siteBase).href}">Privacy Policy</a></span></label>
          <button type="submit"><span data-compact-review-submit>Submit review</span><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></button>
        </div>
        <p class="compact-review-status" role="status" aria-live="polite"></p>
      </form>`;

    const recentReviews = document.createElement("section");
    recentReviews.className = "compact-review-recent";
    recentReviews.setAttribute("aria-labelledby", "compact-review-recent-title");
    recentReviews.setAttribute("aria-busy", "true");
    recentReviews.innerHTML = `
      <div class="compact-review-recent-heading"><div><p class="kicker">COMMUNITY FEEDBACK</p><h3 id="compact-review-recent-title">Recent reviews</h3></div><span>Latest 3</span></div>
      <div class="compact-review-recent-list" data-compact-review-recent>
        ${Array.from(
          { length: 3 },
          () => '<article class="compact-review-recent-skeleton" aria-hidden="true"><span class="review-loading-shimmer"></span><span class="review-loading-shimmer"></span><span class="review-loading-shimmer"></span></article>',
        ).join("")}
      </div>`;
    quickSection.prepend(recentReviews);

    const quickForm = quickSection.querySelector("[data-compact-review-form]");
    compactReview = {
      section: quickSection,
      form: quickForm,
      skeleton: quickSection.querySelector("[data-compact-review-skeleton]"),
      recent: recentReviews.querySelector("[data-compact-review-recent]"),
      recentSection: recentReviews,
      isReady: false,
      rating: quickForm.elements.rating,
      comment: quickForm.elements.comment,
      consent: quickForm.elements.consent,
      stars: [...quickForm.querySelectorAll(".compact-review-star")].map(
        (label) => ({
          label,
          input: label.querySelector('input[type="radio"]'),
        }),
      ),
      ratingDescription: quickSection.querySelector(
        "[data-compact-rating-description]",
      ),
      context: quickSection.querySelector("[data-compact-review-context]"),
      submitButton: quickForm.querySelector('button[type="submit"]'),
      submitLabel: quickForm.querySelector("[data-compact-review-submit]"),
      status: quickSection.querySelector(".compact-review-status"),
    };
    compactReview.context.textContent =
      context.category === "Utilities"
        ? `${context.category} · ${context.title}`
        : context.category;
    compactReview.submitButton.disabled = true;
    target.before(quickSection);
    compactReview.recentSection = recentReviews;
    document.addEventListener("site:reviews-updated", (event) => {
      const reviews = event.detail?.reviews;
      if (!Array.isArray(reviews)) return;
      renderCompactRecentReviews(reviews.filter(reviewMatchesCompactTarget));
    });
    document.addEventListener("site:reviews-error", () => {
      renderCompactRecentReviews([], new Error("Review feed unavailable"));
    });
    if (Array.isArray(window.mobExtraReviews)) {
      renderCompactRecentReviews(
        window.mobExtraReviews.filter(reviewMatchesCompactTarget),
      );
    } else if (window.mobExtraReviewsError) {
      renderCompactRecentReviews([], new Error("Review feed unavailable"));
    }
    quickForm.addEventListener("change", (event) => {
      if (event.target.name === "rating") updateCompactRating();
    });

    quickForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!quickForm.reportValidity()) return;
      form.elements.rating.value = compactReview.rating.value;
      form.elements.comment.value = compactReview.comment.value;
      form.elements.consent.checked = compactReview.consent.checked;
      form.requestSubmit();
    });

    syncCompactReview();
    return compactReview;
  }

  let reviewPanelHeight = "";
  function syncReviewPanelHeight() {
    if (window.innerWidth > 980) {
      const height = `${form.getBoundingClientRect().height}px`;
      if (height === reviewPanelHeight) return;
      reviewPanelHeight = height;
      section.style.setProperty("--review-all-panel-height", height);
    } else if (reviewPanelHeight) {
      reviewPanelHeight = "";
      section.style.removeProperty("--review-all-panel-height");
    }
  }

  syncReviewPanelHeight();
  if (window.ResizeObserver) {
    new ResizeObserver(syncReviewPanelHeight).observe(form);
  }
  form.addEventListener("change", syncReviewPanelHeight);
  window.addEventListener("resize", syncReviewPanelHeight, { passive: true });

  const reviewContextReady = getCurrentReviewContext()
    .then((context) => {
      reviewContext = context;
      populateUtilityOptions(
        context.category === "Utilities" ? context.title : "",
      );
      categorySelect.value = context.category;
      isCategoryLocked = !context.categoryChangeable;
      isUtilityLocked =
        context.category === "Utilities" && !context.categoryChangeable;
      categorySelect.disabled = isCategoryLocked;
      utilitySelect.disabled = isUtilityLocked;
      updateUtilityField();
      return context;
    })
    .catch((error) => {
      console.warn("The current review category could not be detected.", error);
      populateUtilityOptions("");
      categorySelect.disabled = isCategoryLocked;
      updateUtilityField();
      return reviewContext;
    });

  const compactReviewReady = reviewContextReady.then(createCompactReview);

  function setEditMode(review = null) {
    isEditing = Boolean(review);
    formTitle.textContent = isEditing ? "Edit your review" : "Leave a review";
    submitLabel.textContent = isEditing ? "Save changes" : "Submit review";
    if (!review) {
      syncCompactReview();
      return;
    }
    const savedAuthor =
      review.author === "Community member" ||
      isReservedReviewAuthor(review.author)
        ? ""
        : review.author || "";
    form.elements.author.value = authorProfileName || savedAuthor;
    categorySelect.value = isCategoryLocked
      ? reviewContext.category
      : review.reviewType || reviewContext.category;
    populateUtilityOptions(
      isUtilityLocked
        ? reviewContext.title
        : review.specificUtility || reviewContext.title,
    );
    updateUtilityField();
    form.elements.rating.value = String(Number(review.rating) || 5);
    form.elements.comment.value = review.comment || "";
    syncCompactReview();
  }

  function refreshReviewTarget(force = false) {
    const targetId = getCurrentReviewTargetId();
    if (!force && targetId === activeReviewTargetId) return reviewLookup;
    if (!targetId) {
      if (activeReviewTargetId) saveReviewDraft(activeReviewTargetId);
      activeReviewTargetId = "";
      targetLookupSequence += 1;
      reviewLookup = Promise.resolve(false);
      prepareNewReview("");
      setReviewStatus("Choose a utility or hub before submitting a review.");
      setSubmissionDisabled(false);
      setCompactReviewLoading(false);
      return reviewLookup;
    }
    if (activeReviewTargetId && activeReviewTargetId !== targetId) {
      saveReviewDraft(activeReviewTargetId);
    }

    activeReviewTargetId = targetId;
    const sequence = ++targetLookupSequence;
    const targetLabel = getCurrentReviewTargetLabel();
    setSubmissionDisabled(true);
    setCompactReviewLoading(true);
    setReviewStatus(`Checking for an existing review for ${targetLabel}…`);
    reviewLookup = (async () => {
      try {
        const review = await findReviewByDeviceToken(deviceToken, targetId);
        if (sequence !== targetLookupSequence) return false;
        if (review) {
          if (
            !authorProfileName &&
            review.author &&
            !isReservedReviewAuthor(review.author)
          ) {
            authorProfileName = setReviewAuthorName(review.author);
          }
          setEditMode(review);
          setReviewStatus(
            `You already have a review for ${targetLabel}. Its saved values were loaded so you can edit it instead of submitting another.`,
            "warning",
          );
        } else {
          prepareNewReview(targetId);
        }
        return true;
      } catch (error) {
        console.warn("Your existing review could not be checked.", error);
        if (sequence === targetLookupSequence) {
          setReviewStatus(
            "We couldn’t check for an existing review. Submit again to retry.",
          );
        }
        return false;
      } finally {
        if (sequence === targetLookupSequence) {
          setSubmissionDisabled(false);
          setCompactReviewLoading(false);
        }
      }
    })();
    return reviewLookup;
  }

  function handleReviewTargetChange(event) {
    if (event.target === categorySelect && categorySelect.value === "Utilities") {
      populateUtilityOptions(utilitySelect.value);
    }
    updateUtilityField();
    syncCompactReview();
    refreshReviewTarget();
  }

  categorySelect.addEventListener("change", handleReviewTargetChange);
  utilitySelect.addEventListener("change", handleReviewTargetChange);
  compactReviewReady.then(() => refreshReviewTarget());

  window.addEventListener("storage", (event) => {
    if (event.key !== "mob-extra-review-author") return;
    if (isReservedReviewAuthor(event.newValue)) {
      setReviewAuthorName("");
      form.elements.author.value = "";
      setReviewStatus(
        "That name is reserved and cannot be used for a community review.",
        "warning",
      );
      return;
    }
    authorProfileName = setReviewAuthorName(event.newValue || "");
    form.elements.author.value = authorProfileName;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;
    if (!(await reviewLookup)) {
      if (!(await refreshReviewTarget(true))) {
        isSubmitting = false;
        return;
      }
    }
    if (!form.reportValidity()) {
      isSubmitting = false;
      return;
    }
    const data = new FormData(form);
    const enteredAuthor = String(data.get("author") || "").trim();
    if (isReservedReviewAuthor(enteredAuthor)) {
      setReviewStatus(
        "That name is reserved and cannot be used for a community review.",
        "warning",
      );
      form.elements.author.focus();
      isSubmitting = false;
      return;
    }
    const author =
      !enteredAuthor || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enteredAuthor)
        ? "Community member"
        : enteredAuthor.slice(0, 80);
    const reviewData = {
      userId: deviceToken,
      deviceToken,
      schemaVersion: 2,
      author,
      reviewType: categorySelect.value,
      specificUtility:
        categorySelect.value === "Utilities"
          ? isUtilityLocked
            ? reviewContext.title
            : String(data.get("specificUtility") || "").trim()
          : null,
      rating: Number(data.get("rating")),
      comment: String(data.get("comment")).trim().slice(0, 1200),
      pageId: reviewContext.pageId,
      pageTitle: reviewContext.title,
      pageUrl: pagePath,
    };
    reviewData.reviewTargetId = getReviewTargetId(
      reviewData.reviewType,
      reviewData.specificUtility,
      reviewData.pageId,
    );
    reviewData.reviewTargetType = reviewData.reviewType === "Utilities"
      ? "feature"
      : "page";
    setSubmissionDisabled(true);
    setReviewStatus(
      isEditing
        ? "Checking your changes…"
        : "Checking for an existing review…",
    );
    try {
      const latest = await findReviewByDeviceToken(
        deviceToken,
        reviewData.reviewTargetId,
      );
      if (latest) {
        if (!isEditing) {
          setEditMode(latest);
          setReviewStatus(
            `You already have a review for ${getCurrentReviewTargetLabel()}. Its saved values were loaded so you can edit it instead of submitting another.`,
            "warning",
          );
          return;
        }
        const normalize = (key, value) => {
          if (key === "rating") return Number(value);
          if (key === "author") return String(value ?? "Community member").trim();
          if (key === "comment") return String(value ?? "").trim();
          return String(value ?? "");
        };
        const unchanged = [
          "author",
          "reviewType",
          "specificUtility",
          "rating",
          "comment",
          "reviewTargetId",
        ].every(
          (key) =>
            normalize(
              key,
              latest[key] ??
                (key === "specificUtility"
                  ? reviewData.specificUtility
                  : undefined),
            ) === normalize(key, reviewData[key]),
        );
        if (unchanged) {
          setEditMode(latest);
          setReviewStatus("No changes detected. Your review was not sent.");
          return;
        }
      } else if (isEditing) {
        setReviewStatus(
          "Your saved review is no longer available. You can submit this as a new review.",
        );
      }

      await synchronizeReviewAuthor(deviceToken, author);
      const savedReview = await saveReview({
        ...reviewData,
        timestamp: new Date(),
        isApproved: true,
      });
      authorProfileName = setReviewAuthorName(author);
      reviewDrafts.delete(reviewData.reviewTargetId);
      setEditMode({ id: savedReview.id, ...reviewData });
      setReviewStatus(
        latest ? "Your review was updated." : "Thanks! Your review was submitted. You can edit it here.",
      );
    } catch (error) {
      console.error("Review submission failed.", error);
      setReviewStatus("We couldn’t submit that review. Please try again later.");
    } finally {
      setSubmissionDisabled(false);
      isSubmitting = false;
    }
  });
}
