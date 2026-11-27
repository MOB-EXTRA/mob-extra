(() => {
  "use strict";

  // ==================================================
  // 1. GAME CONFIGURATION
  // ==================================================
  // Add future games here.
  // The identifier must match data-code-hub in HTML.
  // ==================================================

  const GAME_CONFIG = {
    codm: {
      name: "CODM",
      defaultRegion: "Global",
    },

    mlbb: {
      name: "MLBB",
      defaultRegion: "Global",
    },

    // FUTURE EXAMPLES:
    //
    // genshin: {
    //   name: 'Genshin Impact',
    //   repositoryFolder: 'genshin-redeem-code',
    //   defaultRegion: 'Global'
    // },
    //
    // pubgm: {
    //   name: 'PUBG Mobile',
    //   repositoryFolder: 'pubgm-redeem-code',
    //   defaultRegion: 'Global'
    // }
  };

  // ==================================================
  // 2. INITIALIZATION
  // ==================================================

  const hub = document.querySelector("[data-code-hub]");

  if (!hub) return;

  const game = hub.dataset.codeHub?.toLowerCase();
  const config = GAME_CONFIG[game];

  if (!config) {
    console.error(`[Redeem Hub] Unknown game identifier: ${game}`);
    return;
  }

  const listRoot = hub.querySelector("[data-code-list]");
  const countLabel = hub.querySelector("[data-code-count]");
  const sourceLabel = hub.querySelector("[data-code-source]");
  const searchInput = hub.querySelector("[data-code-search]");
  const limitSelect = hub.querySelector("[data-code-limit]");

  const filterButtons = [...hub.querySelectorAll("[data-code-filter]")];

  if (!listRoot) {
    console.error("[Redeem Hub] Code list element not found.");
    return;
  }

  // ==================================================
  // 3. STATE
  // ==================================================

  let codes = [];
  let activeRegion = "all";

  // ==================================================
  // 4. HTML ESCAPING
  // ==================================================

  function escapeHTML(value) {
    return String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    );
  }

  // ==================================================
  // 5. SOURCE PARSER
  // ==================================================

  function parseSource(sourceText) {
    if (typeof sourceText !== "string" || !/^\s*r-code\s*:/im.test(sourceText)) {
      throw new Error("No redeem code data found in source.");
    }

    const entries = [];

    const blocks = sourceText.split(/\r?\n\s*\r?\n/);

    for (const block of blocks) {
      const code = block.match(/^\s*r-code:\s*(.+?)\s*$/im)?.[1];

      if (!code) continue;

      const region =
        block.match(/^\s*version:\s*(.+?)\s*$/im)?.[1] || config.defaultRegion;

      const added =
        block.match(/^\s*data-added:\s*(.+?)\s*$/im)?.[1] || "Date not listed";

      const locked =
        /^\s*locked:\s*1\s*$/im.test(block) || /^\s*1\s*$/m.test(block);

      entries.push({
        code: code.trim(),
        region: region.trim(),
        added: added.trim(),
        locked,
      });
    }

    if (!entries.length) {
      throw new Error("The source contained no readable code entries.");
    }

    return entries;
  }

  // ==================================================
  // 6. SHARED REPOSITORY DATA
  function loadSource() {
    if (!window.MobExtraDataClient) {
      return Promise.reject(new Error("Shared data client is not loaded."));
    }

    return window.MobExtraDataClient.loadRedeemCodes(game).then((result) => ({
      entries: parseSource(result.data),
      source: result.repository,
    }));
  }

  // ==================================================
  // 7. RENDER CODE LIST
  // ==================================================

  function render() {
    const query = searchInput?.value.trim().toLowerCase() || "";

    const filteredCodes = codes.filter((item) => {
      const matchesRegion =
        activeRegion === "all" || item.region.toLowerCase() === activeRegion;

      const matchesSearch =
        !query ||
        item.code.toLowerCase().includes(query) ||
        item.region.toLowerCase().includes(query) ||
        item.added.toLowerCase().includes(query);

      return matchesRegion && matchesSearch;
    });

    // ----------------------------------------------
    // DISPLAY LIMIT
    // ----------------------------------------------

    const requestedLimit = limitSelect?.value || "20";

    const maxItems =
      requestedLimit === "all"
        ? filteredCodes.length
        : Math.max(20, Number.parseInt(requestedLimit, 10) || 20);

    const visibleCodes = filteredCodes.slice(0, maxItems);

    // ----------------------------------------------
    // CODE COUNT
    // ----------------------------------------------

    if (countLabel) {
      countLabel.textContent = `Showing ${visibleCodes.length} of ${filteredCodes.length} matching codes`;
    }

    // ----------------------------------------------
    // EMPTY RESULTS
    // ----------------------------------------------

    if (!visibleCodes.length) {
      const emptyMessage =
        game === "mlbb"
          ? "This MLBB hub is ready for future code listings. No matching codes are available."
          : "No codes match these filters.";

      listRoot.innerHTML = `<div class="no-codes">${emptyMessage}</div>`;

      return;
    }

    // ----------------------------------------------
    // GENERATE CODE CARDS
    // ----------------------------------------------

    listRoot.innerHTML = visibleCodes
      .map((item) => {
        const lockedMarkup = item.locked
          ? `
          <a
            class="copy-btn code-source-link"
            href="https://www.youtube.com/channel/UCbDtYZS08VvB6luAcyn08bQ"
            target="_blank"
            rel="noopener noreferrer"
          >
            View source
          </a>
        `
          : `
          <button
            class="copy-btn"
            type="button"
            data-copy="${escapeHTML(item.code)}"
            aria-label="Copy code ${escapeHTML(item.code)}"
          >
            Copy
          </button>
        `;

        const codeLabel = item.locked ? "••••••••••" : item.code;

        const lockedClass = item.locked ? " is-locked" : "";

        return `
        <article
          class="code-card${lockedClass}"
          data-region="${escapeHTML(item.region.toLowerCase())}"
        >

          <span class="code-symbol" aria-hidden="true">
            <i class="fa-solid fa-ticket" aria-hidden="true"></i>
          </span>

          <div class="code-detail">

            <code>${escapeHTML(codeLabel)}</code>

            <span>
              ${escapeHTML(item.region)}
              · Added ${escapeHTML(item.added)}
              ${item.locked ? " · See source" : ""}
            </span>

          </div>

          ${lockedMarkup}

        </article>
      `;
      })
      .join("");
  }

  // ==================================================
  // 8. INITIALIZE DATA LOADING
  // ==================================================

  listRoot.innerHTML = `
    <div class="no-codes">
      Connecting to the shared code source…
    </div>
  `;

  if (sourceLabel) {
    sourceLabel.textContent = `Checking ${config.name} shared sources…`;
  }

  if (countLabel) {
    countLabel.textContent = "Loading code count…";
  }

  loadSource()
    // ----------------------------------------------
    // SUCCESS
    // ----------------------------------------------

    .then((result) => {
      codes = result.entries;

      if (sourceLabel) {
        sourceLabel.textContent = `Live data · ${result.source}`;
      }

      console.info(
        `[Redeem Hub] ${config.name}: Loaded ${codes.length} codes from ${result.source}.`,
      );

      render();
    })

    // ----------------------------------------------
    // ALL REPOSITORIES FAILED
    // ----------------------------------------------

    .catch((error) => {
      console.error(`[Redeem Hub] ${config.name} failed to load:`, error);

      if (sourceLabel) {
        sourceLabel.textContent = "Shared sources are currently unavailable";
      }

      if (countLabel) {
        countLabel.textContent = "Unable to load code count.";
      }

      listRoot.innerHTML = `
        <div class="no-codes">
          We could not reach the shared code sources.
          Please try again later.
        </div>
      `;
    });

  // ==================================================
  // 9. SEARCH
  // ==================================================

  searchInput?.addEventListener("input", render);

  // ==================================================
  // 10. DISPLAY LIMIT
  // ==================================================

  limitSelect?.addEventListener("change", render);

  // ==================================================
  // 11. REGION FILTERS
  // ==================================================

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((candidate) => {
        candidate.classList.toggle("active", candidate === button);
      });

      activeRegion = button.dataset.codeFilter;

      render();
    });
  });

  // ==================================================
  // 12. COPY CODE (WITH SECURE / LEGACY FALLBACK)
  // ==================================================

  listRoot.addEventListener("click", async (event) => {
    const copyButton = event.target.closest("[data-copy]");

    if (!copyButton) return;

    const codeText = copyButton.dataset.copy;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(codeText);
      } else {
        // Fallback for non-HTTPS or older local environments
        const textarea = document.createElement("textarea");
        textarea.value = codeText;
        textarea.style.position = "fixed"; // Avoid scrolling to bottom
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      copyButton.textContent = "Copied";
    } catch {
      copyButton.textContent = "Copy failed";
    }

    window.setTimeout(() => {
      if (copyButton.isConnected) {
        copyButton.textContent = "Copy";
      }
    }, 1500);
  });

  // ==================================================
  // END
  // ==================================================
})();
