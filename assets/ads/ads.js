/* Site-wide, privacy-conscious sponsored placements. Campaigns live in config.json. */
(() => {
  const script = document.currentScript;
  const root = new URL("../../", script.src);
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = new URL("assets/ads/ads.css", root).href;
  document.head.append(css);

  const loadPromotions = async () => {
    try {
      const response = await fetch(new URL("assets/ads/config.json", root), { cache: "no-store" });
      if (!response.ok) return;
      const config = await response.json();
      if (!config.enabled || !Array.isArray(config.promotions) || !config.promotions.length) return;

      const promotions = config.promotions.filter((item) =>
        item && item.title && item.description && item.href && item.sponsor,
      );
      if (!promotions.length) return;
      const pageText = [
        document.title,
        document.querySelector('meta[name="description"]')?.content || "",
        [...document.querySelectorAll("main h1, main h2, main h3")].map((heading) => heading.textContent).join(" "),
        document.querySelector("main")?.innerText || document.body.innerText,
        window.location.pathname,
      ].join(" ").slice(0, 16000);
      const ranked = promotions
        .map((campaign) => ({ campaign, score: scoreCampaign(campaign, pageText) }))
        .sort((a, b) => b.score - a.score);
      const selectedCampaigns = selectCampaigns(ranked, 2);
      const anchors = [
        document.querySelector("main .page-hero, main .hero"),
      ].filter(Boolean);
      const footer = document.querySelector("footer");
      if (pageText.length > 2600 && footer) anchors.push(footer);
      if (!anchors.length && footer) anchors.push(footer);

      const makePlacement = (index) => {
        const campaign = selectedCampaigns[index];
        if (!campaign) return null;
        const placement = document.createElement("aside");
        placement.className = "sponsored-placement";
        placement.setAttribute("aria-label", `Sponsored promotion by ${campaign.sponsor}`);
        placement.dataset.sponsoredPlacement = "";

        const copy = document.createElement("div");
        copy.className = "sponsored-placement__copy";
        const label = document.createElement("span");
        label.className = "sponsored-placement__label";
        label.textContent = `${campaign.label || "SPONSORED"} · ${campaign.sponsor}`;
        const title = document.createElement("h2");
        title.textContent = campaign.title;
        const description = document.createElement("p");
        description.textContent = campaign.description;
        copy.append(label, title, description);

        const link = document.createElement("a");
        link.className = "sponsored-placement__link";
        const destination = new URL(campaign.href, root);
        link.href = destination.href;
        link.rel = "sponsored";
        if (destination.origin !== root.origin) {
          link.target = "_blank";
          link.rel = "sponsored noopener noreferrer";
        }
        link.textContent = campaign.cta || "Learn more";
        placement.append(copy, link);
        return placement;
      };

      anchors.forEach((anchor, index) => {
        const placement = makePlacement(index);
        if (!placement) return;
        if (anchor.matches("footer")) anchor.before(placement);
        else anchor.after(placement);
      });
    } catch (error) {
      console.warn("Sponsored placements could not be loaded.", error);
    }
  };

  function normalize(value) {
    return value.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  }

  function scoreCampaign(campaign, pageText) {
    const context = ` ${normalize(pageText)} `;
    const configured = Array.isArray(campaign.keywords) ? campaign.keywords : [];
    const inferred = `${campaign.sponsor} ${campaign.title} ${campaign.description}`
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word.length >= 4);
    const keywords = [...new Set([...configured, ...inferred].map(normalize).filter(Boolean))];
    return keywords.reduce((score, keyword) => {
      const phrase = ` ${keyword} `;
      if (context.includes(phrase)) return score + (keyword.includes(" ") ? 7 : 4);
      const parts = keyword.split(" ").filter((part) => part.length >= 4);
      return score + (parts.length ? parts.filter((part) => context.includes(` ${part} `)).length : 0);
    }, 0);
  }

  function selectCampaigns(ranked, count) {
    const remaining = [...ranked];
    const selected = [];
    while (remaining.length && selected.length < count) {
      const relevant = remaining.filter((item) => item.score > 0);
      const explore = relevant.length === 0 || Math.random() >= 0.75;
      const pool = explore ? remaining : relevant;
      const picked = explore ? pool[Math.floor(Math.random() * pool.length)] : weightedPick(pool);
      selected.push(picked.campaign);
      remaining.splice(remaining.indexOf(picked), 1);
    }
    return selected;
  }

  function weightedPick(items) {
    const total = items.reduce((sum, item) => sum + item.score, 0);
    let point = Math.random() * total;
    return items.find((item) => (point -= item.score) <= 0) || items[0];
  }

  loadPromotions();
})();
