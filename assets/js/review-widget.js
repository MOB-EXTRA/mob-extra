const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCbCgCRWV4cIDjfGg0llNQXzIscnKvLc9w",
  authDomain: "vile-tempest-reviews.firebaseapp.com",
  projectId: "vile-tempest-reviews",
  storageBucket: "vile-tempest-reviews.firebasestorage.app",
  messagingSenderId: "1047163835896",
  appId: "1:1047163835896:web:93edcc036534ee83f6720d",
};

const pagePath = window.location.pathname;
const siteBase = new URL("../../", import.meta.url);
const excluded = /(?:^|\/)(?:terms|privacy|legal)(?:\.html|\/|$)/i.test(pagePath) || /\/pages\/portfolio\/(?:team\/)?carl(?:\/|$)/i.test(pagePath);

if (!excluded && !document.querySelector("[data-service-reviews]")) {
  document.querySelectorAll("#reviews, .redeem-reviews-wrapper, [data-review-widget]").forEach((node) => node.remove());
  const section = document.createElement("section");
  section.className = "service-reviews review-widget-section";
  section.id = "reviews";
  section.dataset.serviceReviews = "";
  section.setAttribute("aria-labelledby", "service-reviews-title");
  section.innerHTML = `
    <div class="service-reviews-heading"><div><p class="kicker">COMMUNITY FEEDBACK</p><h2 id="service-reviews-title">Reviews &amp; experiences</h2><p class="service-reviews-note">Feedback across services, utilities, and the wider MOB EXTRA community.</p></div></div>
    <div class="review-top-dashboard">
      <section class="review-analytics-panel" aria-label="Review analytics">
        <div class="review-panel-heading"><h3>Reviews overview</h3><span>All time</span></div>
        <div class="review-stat-cards">
          <div class="review-stat-card"><span>Total reviews</span><strong data-service-review-count>—</strong><small>Published feedback</small></div>
          <div class="review-stat-card"><span>Average rating</span><strong><b data-service-review-average>—</b><i class="service-review-stars" data-service-review-stars aria-label="No ratings yet">☆☆☆☆☆</i></strong><small>Across all review types</small></div>
        </div>
        <div class="review-dashboard" aria-label="Rating distribution" data-review-dashboard><div class="review-dashboard-title"><span>Rating<br>breakdown</span><span data-review-total>0 total</span></div><div class="review-rating-rows">
          ${[5,4,3,2,1].map((rating) => `<div class="review-rating-row" data-rating-row="${rating}"><span>${rating} <i>★</i></span><span class="review-rating-track"><i data-rating-bar="${rating}"></i></span><span data-rating-count="${rating}">0</span></div>`).join("")}
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
      <div class="review-submit-heading"><p class="kicker">YOUR EXPERIENCE MATTERS</p><h3>Leave a review</h3><p>Share feedback about MOB EXTRA, a service, or one of its tools.</p></div>
      <div class="review-submit-fields">
        <label class="review-submit-name">Name or gamer tag <span>(optional)</span><input name="author" maxlength="80" autocomplete="nickname" placeholder="Community member"></label>
        <label>Category<select name="reviewType"><option>General Feedback</option><option>Commissions / Services</option><option>Utilities</option><option>Buying in Shop</option></select></label>
        <label>Rating<select name="rating" required><option value="5">★★★★★ — Excellent</option><option value="4">★★★★ — Good</option><option value="3">★★★ — Fair</option><option value="2">★★ — Poor</option><option value="1">★ — Very poor</option></select></label>
        <label class="review-submit-comment">Your review<textarea name="comment" minlength="5" maxlength="1200" rows="4" required placeholder="Share your experience…"></textarea></label>
      </div>
      <label class="review-submit-consent"><input type="checkbox" name="consent" required><span>I agree that my review may be displayed publicly. See the <a href="${new URL("pages/privacy.html", siteBase).href}">Privacy Policy</a>.</span></label>
      <div class="review-submit-actions"><button type="submit">Submit review <span aria-hidden="true">↗</span></button><p class="review-submit-status" role="status" aria-live="polite"></p></div>
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
  const deviceKey = "mob-extra-review-device";
  let deviceToken = localStorage.getItem(deviceKey) || localStorage.getItem("vile_tempest_device_token");
  if (!deviceToken) {
    deviceToken = `review_${crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
  }
  localStorage.setItem(deviceKey, deviceToken);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const submit = form.querySelector("button[type=submit]");
    const data = new FormData(form);
    submit.disabled = true;
    formStatus.textContent = "Submitting your review…";
    try {
      const [{ initializeApp, getApps }, store] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js"),
      ]);
      const appName = "portfolio-community-reviews";
      const app = getApps().find((entry) => entry.name === appName) || initializeApp(FIREBASE_CONFIG, appName);
      const db = store.getFirestore(app);
      const existing = await store.getDocs(store.query(store.collection(db, "site_reviews")));
      if (existing.docs.some((entry) => entry.data().deviceToken === deviceToken)) {
        formStatus.textContent = "This device has already submitted a review.";
        return;
      }
      const enteredAuthor = String(data.get("author") || "").trim();
      const author = !enteredAuthor || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enteredAuthor) ? "Community member" : enteredAuthor.slice(0, 80);
      await store.addDoc(store.collection(db, "site_reviews"), {
        deviceToken,
        author,
        reviewType: String(data.get("reviewType")),
        specificUtility: document.title.slice(0, 120),
        rating: Number(data.get("rating")),
        comment: String(data.get("comment")).trim().slice(0, 1200),
        timestamp: new Date(),
        isApproved: true,
      });
      form.reset();
      formStatus.textContent = "Thanks! Your review was submitted.";
    } catch (error) {
      console.error("Review submission failed.", error);
      formStatus.textContent = "We couldn’t submit that review. Please try again later.";
    } finally {
      submit.disabled = false;
    }
  });
}
