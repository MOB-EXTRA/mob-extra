(() => {
  const rootInput = document.getElementById("root-size");
  const pxInput = document.getElementById("input-px");
  const remInput = document.getElementById("input-rem");
  const snippetEl = document.getElementById("css-snippet");
  const scaleTbody = document.getElementById("scale-tbody");
  const toastEl = document.getElementById("copy-toast");

  const commonPixels = [8, 10, 12, 14, 16, 18, 20, 24, 32, 40, 48, 64];
  const tailwindMap = {
    8: "text-[8px] / p-2",
    10: "text-[10px]",
    12: "text-xs / p-3",
    14: "text-sm",
    16: "text-base / p-4",
    18: "text-lg",
    20: "text-xl / p-5",
    24: "text-2xl / p-6",
    32: "text-3xl / p-8",
    40: "text-4xl / p-10",
    48: "text-5xl / p-12",
    64: "text-6xl / p-16",
  };

  const formatNum = (num) => {
    if (!Number.isFinite(num)) return "";
    return parseFloat(num.toFixed(4)).toString();
  };

  const showToast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toastEl.classList.remove("show"), 1800);
  };

  const copyText = (text) => {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => showToast(`Copied: ${text}`));
  };

  const updateSnippet = () => {
    const px = parseFloat(pxInput.value) || 0;
    const rem = parseFloat(remInput.value) || 0;
    snippetEl.textContent = `font-size: ${formatNum(rem)}rem; /* ${formatNum(px)}px */`;
  };

  const renderScaleTable = () => {
    const base = parseFloat(rootInput.value) || 16;
    scaleTbody.innerHTML = commonPixels
      .map((px) => {
        const rem = formatNum(px / base);
        const tw = tailwindMap[px] || "—";
        return `
          <tr data-copy-val="${rem}rem">
            <td><strong>${px}px</strong></td>
            <td><code>${rem}rem</code></td>
            <td>${tw}</td>
            <td><button type="button" class="copy-btn">Copy ${rem}rem</button></td>
          </tr>
        `;
      })
      .join("");
  };

  const convertFromPx = () => {
    const base = parseFloat(rootInput.value) || 16;
    const px = parseFloat(pxInput.value);
    if (Number.isNaN(px)) {
      remInput.value = "";
      return;
    }
    remInput.value = formatNum(px / base);
    updateSnippet();
  };

  const convertFromRem = () => {
    const base = parseFloat(rootInput.value) || 16;
    const rem = parseFloat(remInput.value);
    if (Number.isNaN(rem)) {
      pxInput.value = "";
      return;
    }
    pxInput.value = formatNum(rem * base);
    updateSnippet();
  };

  // Event Listeners: Instant Converter
  pxInput.addEventListener("input", convertFromPx);
  remInput.addEventListener("input", convertFromRem);
  rootInput.addEventListener("input", () => {
    convertFromPx();
    renderScaleTable();
    runBatchConvert();
    updateClamp();
  });

  document.querySelectorAll(".preset-chip[data-base]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".preset-chip[data-base]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      rootInput.value = btn.dataset.base;
      convertFromPx();
      renderScaleTable();
      runBatchConvert();
      updateClamp();
    });
  });

  document.getElementById("swap-btn").addEventListener("click", () => {
    const temp = pxInput.value;
    pxInput.value = remInput.value;
    remInput.value = temp;
    convertFromPx();
  });

  scaleTbody.addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (row && row.dataset.copyVal) {
      copyText(row.dataset.copyVal);
    }
  });

  // Global Copy Buttons
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".copy-btn");
    if (!btn) return;
    if (btn.dataset.copyTarget) {
      const target = document.getElementById(btn.dataset.copyTarget);
      if (target) copyText(`${target.value}${btn.dataset.suffix || ""}`);
    } else if (btn.dataset.copyText) {
      const target = document.getElementById(btn.dataset.copyText);
      if (target) copyText(target.textContent);
    }
  });

  // Tabs Navigation
  document.querySelectorAll(".tool-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tool-tab").forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      document
        .querySelectorAll(".tool-panel")
        .forEach((p) => p.classList.remove("active"));

      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      document
        .getElementById(`panel-${tab.dataset.tab}`)
        .classList.add("active");
    });
  });

  // Batch CSS Converter
  const batchInput = document.getElementById("batch-input");
  const batchOutput = document.getElementById("batch-output");
  let batchDirection = "px-to-rem";

  const runBatchConvert = () => {
    const base = parseFloat(rootInput.value) || 16;
    const raw = batchInput.value;
    if (!raw.trim()) {
      batchOutput.value = "";
      return;
    }

    if (batchDirection === "px-to-rem") {
      batchOutput.value = raw.replace(/(-?\d*\.?\d+)px\b/gi, (_, num) => {
        const val = parseFloat(num);
        return val === 0 ? "0" : `${formatNum(val / base)}rem`;
      });
    } else {
      batchOutput.value = raw.replace(/(-?\d*\.?\d+)rem\b/gi, (_, num) => {
        const val = parseFloat(num);
        return val === 0 ? "0" : `${formatNum(val * base)}px`;
      });
    }
  };

  batchInput.addEventListener("input", runBatchConvert);

  document.querySelectorAll(".dir-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".dir-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      batchDirection = btn.dataset.dir;
      runBatchConvert();
    });
  });

  document.getElementById("batch-sample").addEventListener("click", () => {
    batchInput.value = `.card {\n  padding: 24px 32px;\n  border-radius: 12px;\n  font-size: 18px;\n  gap: 16px;\n}`;
    runBatchConvert();
  });

  // Fluid clamp() Generator
  const clampInputs = [
    "clamp-min-fs",
    "clamp-max-fs",
    "clamp-min-vw",
    "clamp-max-vw",
  ];
  const clampOutput = document.getElementById("clamp-output");

  const updateClamp = () => {
    const base = parseFloat(rootInput.value) || 16;
    const minFs =
      parseFloat(document.getElementById("clamp-min-fs").value) || 16;
    const maxFs =
      parseFloat(document.getElementById("clamp-max-fs").value) || 32;
    const minVw =
      parseFloat(document.getElementById("clamp-min-vw").value) || 375;
    const maxVw =
      parseFloat(document.getElementById("clamp-max-vw").value) || 1280;

    if (maxVw <= minVw) {
      clampOutput.textContent =
        "/* Max viewport must be larger than min viewport */";
      return;
    }

    const slope = (maxFs - minFs) / (maxVw - minVw);
    const yAxisIntersection = -minVw * slope + minFs;

    const minRem = formatNum(minFs / base);
    const maxRem = formatNum(maxFs / base);
    const preferred = `${formatNum(yAxisIntersection / base)}rem + ${formatNum(slope * 100)}vw`;

    clampOutput.textContent = `font-size: clamp(${minRem}rem, ${preferred}, ${maxRem}rem);`;
  };

  clampInputs.forEach((id) => {
    document.getElementById(id).addEventListener("input", updateClamp);
  });

  // Initial render
  renderScaleTable();
  updateClamp();
})();
