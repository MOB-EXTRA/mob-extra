// ==========================================
// DYNAMIC FILTER & VIEW ALL FOR RECENT BUILDS
// Reads existing .build-card elements in DOM,
// auto-collects filter options, and manages
// initial 3-card preview vs. View All state.
// ==========================================

(() => {
  const INITIAL_VISIBLE_COUNT = 3;

  function normalizeText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function extractCardMeta(card) {
    const dataset = card.dataset || {};

    const kickerCategory = normalizeText(
      card.querySelector(".build-kicker-line span:first-child")?.textContent,
    );

    const metaCells = Array.from(
      card.querySelectorAll(".build-meta-grid .meta-cell"),
    );
    const metaMap = {};

    metaCells.forEach((cell) => {
      const label = normalizeText(
        cell.querySelector("span")?.textContent,
      ).toLowerCase();
      const val = normalizeText(cell.querySelector("strong")?.textContent);
      if (label && val) {
        metaMap[label] = val;
      }
    });

    const category = normalizeText(
      dataset.category || kickerCategory || "Uncategorized",
    );
    const location = normalizeText(
      dataset.location || metaMap["location"] || "",
    );
    const budget = normalizeText(dataset.budget || metaMap["budget"] || "");
    const finishedText = normalizeText(
      dataset.finished || metaMap["finished"] || "",
    );

    const yearMatch = (dataset.year || finishedText).match(/\b(19|20)\d{2}\b/);
    const year = normalizeText(dataset.year || (yearMatch ? yearMatch[0] : ""));

    const rawScope = normalizeText(dataset.scope || metaMap["scope"] || "");
    const scopeItems = rawScope
      .split(/[·,|/]+/)
      .map((item) => normalizeText(item))
      .filter(Boolean);

    const searchableText = normalizeText(card.textContent).toLowerCase();

    return {
      element: card,
      category,
      location,
      budget,
      year,
      scopeItems,
      searchableText,
    };
  }

  function createSelectControl({
    id,
    labelText,
    options,
    defaultLabel = "All",
  }) {
    const wrapper = document.createElement("div");
    wrapper.className = "filter-field";

    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.textContent = labelText;

    const select = document.createElement("select");
    select.id = id;
    select.className = "filter-select";

    const allOpt = document.createElement("option");
    allOpt.value = "ALL";
    allOpt.textContent = `${defaultLabel} ${labelText}`;
    select.appendChild(allOpt);

    options.forEach((optValue) => {
      const option = document.createElement("option");
      option.value = optValue;
      option.textContent = optValue;
      select.appendChild(option);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(select);

    return { wrapper, select };
  }

  function initRecentProjectsFilter() {
    const section = document.querySelector("#finished-projects");
    const grid = section?.querySelector(".builds-grid");
    if (!section || !grid) return;

    const cards = Array.from(grid.querySelectorAll(".build-card"));
    if (!cards.length) return;

    const records = cards.map(extractCardMeta);

    const uniqueCategories = Array.from(
      new Set(records.map((r) => r.category).filter(Boolean)),
    );

    const uniqueLocations = Array.from(
      new Set(records.map((r) => r.location).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));

    const uniqueBudgets = Array.from(
      new Set(records.map((r) => r.budget).filter(Boolean)),
    );

    const uniqueYears = Array.from(
      new Set(records.map((r) => r.year).filter(Boolean)),
    ).sort((a, b) => Number(b) - Number(a));

    const uniqueScopes = Array.from(
      new Set(records.flatMap((r) => r.scopeItems).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));

    // Prevent duplicate toolbar creation if re-initialized
    if (section.querySelector(".projects-toolbar")) return;

    const toolbar = document.createElement("div");
    toolbar.className = "projects-toolbar";
    toolbar.setAttribute("aria-label", "Filter recent projects");

    const topRow = document.createElement("div");
    topRow.className = "projects-filter-row";

    const categoryCtrl = createSelectControl({
      id: "filter-project-category",
      labelText: "Type",
      options: uniqueCategories,
    });

    const locationCtrl = createSelectControl({
      id: "filter-project-location",
      labelText: "Location",
      options: uniqueLocations,
    });

    const budgetCtrl = createSelectControl({
      id: "filter-project-budget",
      labelText: "Budget",
      options: uniqueBudgets,
    });

    const scopeCtrl = createSelectControl({
      id: "filter-project-scope",
      labelText: "Scope",
      options: uniqueScopes,
    });

    const yearCtrl = createSelectControl({
      id: "filter-project-year",
      labelText: "Year",
      options: uniqueYears,
    });

    const searchField = document.createElement("div");
    searchField.className = "filter-field filter-search-field";
    const searchLabel = document.createElement("label");
    searchLabel.setAttribute("for", "filter-project-search");
    searchLabel.textContent = "Search";
    const searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.id = "filter-project-search";
    searchInput.className = "filter-input";
    searchInput.placeholder = "Project name, city, scope...";
    searchField.appendChild(searchLabel);
    searchField.appendChild(searchInput);

    topRow.appendChild(categoryCtrl.wrapper);
    topRow.appendChild(locationCtrl.wrapper);
    topRow.appendChild(budgetCtrl.wrapper);
    topRow.appendChild(scopeCtrl.wrapper);
    topRow.appendChild(yearCtrl.wrapper);
    topRow.appendChild(searchField);

    const pillsRow = document.createElement("div");
    pillsRow.className = "filter-pills-row";
    pillsRow.setAttribute("role", "group");
    pillsRow.setAttribute("aria-label", "Quick category filters");

    const pillButtons = [];
    const makePill = (labelText, value) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-pill";
      btn.dataset.categoryValue = value;
      btn.textContent = labelText;
      if (value === "ALL") btn.classList.add("is-active");
      pillButtons.push(btn);
      pillsRow.appendChild(btn);
      return btn;
    };

    makePill("All Projects", "ALL");
    uniqueCategories.forEach((cat) => makePill(cat, cat));

    const metaBar = document.createElement("div");
    metaBar.className = "filter-meta-bar";

    const statusText = document.createElement("p");
    statusText.className = "filter-status-text";

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "filter-reset-btn";
    resetBtn.innerHTML = `<i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Reset Filters`;
    resetBtn.hidden = true;

    metaBar.appendChild(statusText);
    metaBar.appendChild(resetBtn);

    toolbar.appendChild(topRow);
    toolbar.appendChild(pillsRow);
    toolbar.appendChild(metaBar);

    const emptyState = document.createElement("div");
    emptyState.className = "projects-empty-state";
    emptyState.hidden = true;
    emptyState.innerHTML = `
      <i class="fa-solid fa-folder-open" aria-hidden="true"></i>
      <h3>No matching projects found</h3>
      <p>Try clearing one or more filters to view other completed engineering builds.</p>
    `;

    const viewAllBar = document.createElement("div");
    viewAllBar.className = "projects-view-all-bar";

    const viewAllBtn = document.createElement("button");
    viewAllBtn.type = "button";
    viewAllBtn.className = "btn-view-all-projects";
    viewAllBtn.setAttribute("aria-expanded", "false");

    viewAllBar.appendChild(viewAllBtn);

    grid.parentNode.insertBefore(toolbar, grid);
    grid.parentNode.insertBefore(emptyState, grid.nextSibling);
    grid.parentNode.insertBefore(viewAllBar, emptyState.nextSibling);

    let showAllProjects = false;

    function hasActiveFilters() {
      return (
        categoryCtrl.select.value !== "ALL" ||
        locationCtrl.select.value !== "ALL" ||
        budgetCtrl.select.value !== "ALL" ||
        scopeCtrl.select.value !== "ALL" ||
        yearCtrl.select.value !== "ALL" ||
        normalizeText(searchInput.value).length > 0
      );
    }

    function syncCategoryPills() {
      const activeCat = categoryCtrl.select.value;
      pillButtons.forEach((btn) => {
        btn.classList.toggle(
          "is-active",
          btn.dataset.categoryValue === activeCat,
        );
      });
    }

    function render() {
      const selectedCategory = categoryCtrl.select.value;
      const selectedLocation = locationCtrl.select.value;
      const selectedBudget = budgetCtrl.select.value;
      const selectedScope = scopeCtrl.select.value;
      const selectedYear = yearCtrl.select.value;
      const query = normalizeText(searchInput.value).toLowerCase();

      const matchingRecords = records.filter((rec) => {
        if (selectedCategory !== "ALL" && rec.category !== selectedCategory) {
          return false;
        }
        if (selectedLocation !== "ALL" && rec.location !== selectedLocation) {
          return false;
        }
        if (selectedBudget !== "ALL" && rec.budget !== selectedBudget) {
          return false;
        }
        if (selectedYear !== "ALL" && rec.year !== selectedYear) {
          return false;
        }
        if (
          selectedScope !== "ALL" &&
          !rec.scopeItems.some(
            (item) => item.toLowerCase() === selectedScope.toLowerCase(),
          )
        ) {
          return false;
        }
        if (query && !rec.searchableText.includes(query)) {
          return false;
        }
        return true;
      });

      const filtersActive = hasActiveFilters();
      resetBtn.hidden = !filtersActive;
      syncCategoryPills();

      const shouldShowAll = showAllProjects || filtersActive;
      const visibleSet = new Set(
        shouldShowAll
          ? matchingRecords
          : matchingRecords.slice(0, INITIAL_VISIBLE_COUNT),
      );

      records.forEach((rec) => {
        rec.element.hidden = !visibleSet.has(rec);
      });

      const matchCount = matchingRecords.length;
      const shownCount = visibleSet.size;

      emptyState.hidden = matchCount > 0;
      grid.hidden = matchCount === 0;

      if (matchCount === 0) {
        statusText.textContent = `Showing 0 of ${records.length} projects`;
      } else if (filtersActive) {
        statusText.textContent = `Showing ${shownCount} of ${matchCount} matching project${
          matchCount === 1 ? "" : "s"
        }`;
      } else {
        statusText.textContent = `Showing ${shownCount} of ${records.length} recent projects`;
      }

      if (!filtersActive && matchCount > INITIAL_VISIBLE_COUNT) {
        viewAllBar.hidden = false;
        if (showAllProjects) {
          viewAllBtn.setAttribute("aria-expanded", "true");
          viewAllBtn.innerHTML = `
            Show Fewer Projects (${INITIAL_VISIBLE_COUNT})
            <i class="fa-solid fa-chevron-up" aria-hidden="true"></i>
          `;
        } else {
          viewAllBtn.setAttribute("aria-expanded", "false");
          viewAllBtn.innerHTML = `
            View All Projects (${matchCount})
            <i class="fa-solid fa-arrow-down" aria-hidden="true"></i>
          `;
        }
      } else {
        viewAllBar.hidden = true;
      }
    }

    [
      categoryCtrl.select,
      locationCtrl.select,
      budgetCtrl.select,
      scopeCtrl.select,
      yearCtrl.select,
    ].forEach((select) => {
      select.addEventListener("change", render);
    });

    searchInput.addEventListener("input", render);

    pillButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        categoryCtrl.select.value = btn.dataset.categoryValue || "ALL";
        render();
      });
    });

    resetBtn.addEventListener("click", () => {
      categoryCtrl.select.value = "ALL";
      locationCtrl.select.value = "ALL";
      budgetCtrl.select.value = "ALL";
      scopeCtrl.select.value = "ALL";
      yearCtrl.select.value = "ALL";
      searchInput.value = "";
      showAllProjects = false;
      render();
    });

    viewAllBtn.addEventListener("click", () => {
      showAllProjects = !showAllProjects;
      render();

      if (!showAllProjects) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRecentProjectsFilter);
  } else {
    initRecentProjectsFilter();
  }
})();
