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
      repositoryFolder: "codm-redeem-code",
      defaultRegion: "Global",
    },

    mlbb: {
      name: "MLBB",
      repositoryFolder: "mlbb-redeem-code",
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
  // 2. REPOSITORY CONFIGURATION
  // ==================================================

  const REPOSITORY_BASE =
    "https://mob-extra.github.io/MOBEXTRA.github.shared-data-repo.";

  const REPOSITORY_NUMBERS = [1, 2, 3];

  const REPOSITORY_TIMEOUT = 10000;

  // ==================================================
  // 3. INITIALIZATION
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
  // 4. GENERATE GAME-SPECIFIC REPOSITORY URLS
  // ==================================================

  const sources = REPOSITORY_NUMBERS.map(
    (number) =>
      `${REPOSITORY_BASE}${number}/${config.repositoryFolder}/redeem-codes.js`,
  );

  console.log(
    `[Redeem Hub] ${config.name}: Checking ${sources.length} shared source repositories...`,
  );

  // ==================================================
  // 5. STATE
  // ==================================================

  let codes = [];
  let activeRegion = "all";

  // ==================================================
  // 6. HTML ESCAPING
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
  // 7. SOURCE PARSER
  // ==================================================

  function parseSource(sourceText) {
    const match = sourceText.match(/\bredeemCodesData\s*=\s*`([\s\S]*?)`\s*;/);

    if (!match) {
      throw new Error("No redeem code data found in source.");
    }

    const entries = [];

    const blocks = match[1].split(/\r?\n\s*\r?\n/);

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
  // 8. SEQUENTIAL REPOSITORY LOADER
  // ==================================================
  //
  // Priority:
  //
  // Repository 1
  //      |
  //      | Failed?
  //      v
  // Repository 2
  //      |
  //      | Failed?
  //      v
  // Repository 3
  //
  // Once a repository succeeds, STOP.
  // Remaining repositories will NOT be requested.
  //
  // ==================================================

  async function loadSource(index = 0) {
    if (index >= sources.length) {
      throw new Error("All shared source repositories are unavailable.");
    }

    const repositoryNumber = REPOSITORY_NUMBERS[index];

    console.info(
      `[Redeem Hub] ${config.name}: Checking Repository ${repositoryNumber}...`,
    );

    try {
      const controller = new AbortController();

      const timeout = window.setTimeout(
        () => controller.abort(),
        REPOSITORY_TIMEOUT,
      );

      let response;

      try {
        response = await fetch(sources[index], {
          method: "GET",
          cache: "no-cache",
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeout);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const sourceText = await response.text();

      if (!sourceText.trim()) {
        throw new Error("Repository returned an empty file.");
      }

      const entries = parseSource(sourceText);

      console.info(
        `[Redeem Hub] ${config.name}: Successfully loaded Repository ${repositoryNumber}.`,
      );

      // STOP: Do not request the remaining repositories.
      return {
        entries,
        source: `Repository ${repositoryNumber}`,
      };
    } catch (error) {
      console.warn(
        `[Redeem Hub] ${config.name} Repository ${repositoryNumber} failed:`,
        error.message,
      );

      // Try the next repository only after failure.
      return loadSource(index + 1);
    }
  }

  // ==================================================
  // 9. RENDER CODE LIST
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

    const requestedLimit = limitSelect?.value || "30";

    const maxItems =
      requestedLimit === "all"
        ? filteredCodes.length
        : Math.max(30, Number.parseInt(requestedLimit, 10) || 30);

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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="24"
              height="24"
              fill="none"
            >
              <circle cx="24" cy="24" r="19" fill="#E5A323"/>
              <circle cx="24" cy="24" r="15"
                      fill="#FFD45C" stroke="#FFE69A" stroke-width="2"/>
              <circle cx="24" cy="24" r="11"
                      stroke="#C98216" stroke-width="1.5"/>
              <path d="M28.5 17.5c-1.1-1-2.5-1.5-4.5-1.5-3 0-5 1.5-5 3.5 0 5 10 2 10 7 0 2-2 4-5 4-2 0-4-.7-5-2"
                    stroke="#9A5D0A" stroke-width="2.5"
                    stroke-linecap="round"/>
              <path d="M24 13v22" stroke="#9A5D0A"
                    stroke-width="2" stroke-linecap="round"/>
            </svg>
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
  // 10. INITIALIZE DATA LOADING
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
  // 11. SEARCH
  // ==================================================

  searchInput?.addEventListener("input", render);

  // ==================================================
  // 12. DISPLAY LIMIT
  // ==================================================

  limitSelect?.addEventListener("change", render);

  // ==================================================
  // 13. REGION FILTERS
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
  // 14. COPY CODE (WITH SECURE / LEGACY FALLBACK)
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
