import {
  getReviewsByDeviceToken,
  saveReview,
  synchronizeReviewAuthor,
  getCurrentReviewContext,
  getReviewTargetId,
  populateReviewFeatureSelect,
  getReviewAuthorName,
  getReviewDeviceId,
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
  section.className = "service-reviews review-widget-section";
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
        <div class="review-trend-chart" aria-label="Reviews by month over the last six months" data-review-trend></div>
      </section>
      <div class="review-recent-panel"><div class="review-recent-heading"><h3>Recent reviews</h3><span>Latest feedback</span></div><div class="review-recent-list" data-review-latest><p class="review-recent-empty">Loading reviews…</p></div></div>
    </div>
    <div class="review-type-overview" aria-label="Review types" data-review-type-overview></div>
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
        <div class="service-review-list" data-service-review-list aria-live="polite"><p class="service-review-state">Loading reviews…</p></div>
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
  const deviceToken = getReviewDeviceId();
  let authorProfileName = getReviewAuthorName();
  if (authorProfileName) form.elements.author.value = authorProfileName;

  let isEditing = false;
  let isSubmitting = false;
  let activeReviewTargetId = "";
  let targetLookupSequence = 0;
  let userReviewsPromise = null;
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
  };
  let compactReview = null;

  function setReviewStatus(message, kind = "") {
    formStatus.textContent = message;
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
    categorySelect.disabled = disabled;
    utilitySelect.disabled = disabled;
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

  async function loadMyReviews(refresh = false) {
    if (refresh || !userReviewsPromise) {
      userReviewsPromise = getReviewsByDeviceToken(deviceToken).catch((error) => {
        userReviewsPromise = null;
        throw error;
      });
    }
    return userReviewsPromise;
  }

  function adoptReviewAuthor(reviews) {
    if (authorProfileName) {
      form.elements.author.value = authorProfileName;
      return;
    }

    const savedAuthor = reviews
      .map((review) => String(review.author || "").trim())
      .find(
        (author) =>
          author &&
          author !== "Community member" &&
          author.length <= 80,
      );
    if (savedAuthor) {
      authorProfileName = setReviewAuthorName(savedAuthor);
      form.elements.author.value = authorProfileName;
    }
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
    quickSection.className = "compact-review-section";
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
      <form class="compact-review-form" data-compact-review-form>
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

    const quickForm = quickSection.querySelector("[data-compact-review-form]");
    compactReview = {
      section: quickSection,
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

  function syncReviewPanelHeight() {
    if (window.innerWidth > 980) {
      section.style.setProperty(
        "--review-all-panel-height",
        `${form.getBoundingClientRect().height}px`,
      );
    } else {
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
      updateUtilityField();
      return context;
    })
    .catch((error) => {
      console.warn("The current review category could not be detected.", error);
      populateUtilityOptions("");
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
    form.elements.author.value =
      authorProfileName ||
      (review.author === "Community member" ? "" : review.author || "");
    categorySelect.value = review.reviewType || reviewContext.category;
    populateUtilityOptions(review.specificUtility || reviewContext.title);
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
      return reviewLookup;
    }
    if (activeReviewTargetId && activeReviewTargetId !== targetId) {
      saveReviewDraft(activeReviewTargetId);
    }

    activeReviewTargetId = targetId;
    const sequence = ++targetLookupSequence;
    const targetLabel = getCurrentReviewTargetLabel();
    setSubmissionDisabled(true);
    setReviewStatus(`Checking for an existing review for ${targetLabel}…`);
    reviewLookup = (async () => {
      try {
        const reviews = await loadMyReviews(true);
        if (sequence !== targetLookupSequence) return false;
        adoptReviewAuthor(reviews);
        const review =
          reviews.find((entry) => entry.reviewTargetId === targetId) || null;
        if (review) {
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
        if (sequence === targetLookupSequence) setSubmissionDisabled(false);
      }
    })();
    return reviewLookup;
  }

  function handleReviewTargetChange() {
    updateUtilityField();
    syncCompactReview();
    refreshReviewTarget();
  }

  categorySelect.addEventListener("change", handleReviewTargetChange);
  utilitySelect.addEventListener("change", handleReviewTargetChange);
  compactReviewReady.then(() => refreshReviewTarget());

  window.addEventListener("storage", (event) => {
    if (event.key !== "mob-extra-review-author") return;
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
    const author =
      !enteredAuthor || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enteredAuthor)
        ? "Community member"
        : enteredAuthor.slice(0, 80);
    const reviewData = {
      userId: deviceToken,
      deviceToken,
      schemaVersion: 2,
      author,
      reviewType: String(data.get("reviewType")),
      specificUtility:
        categorySelect.value === "Utilities"
          ? String(data.get("specificUtility") || "").trim()
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
      const latestReviews = await loadMyReviews(true);
      const latest =
        latestReviews.find(
          (review) => review.reviewTargetId === reviewData.reviewTargetId,
        ) || null;
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
      userReviewsPromise = null;
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
