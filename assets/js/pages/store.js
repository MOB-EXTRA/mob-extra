(() => {
  const grid = document.querySelector("[data-product-grid]");
  if (!grid) return;

  const products = [
    {
      id: "pulse-headset",
      name: "Pulse Wireless Headset",
      category: "gear",
      categoryLabel: "Gaming gear",
      price: 2490,
      badge: "Featured",
      description: "A lightweight over-ear concept with cushioned comfort for long sessions.",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      alt: "Over-ear headphones on a dark background",
    },
    {
      id: "precision-mouse",
      name: "Precision Wireless Mouse",
      category: "gear",
      categoryLabel: "Gaming gear",
      price: 1790,
      badge: "Player pick",
      description: "A clean, ergonomic mouse concept made for quick movement and control.",
      image: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=800&q=80",
      alt: "Wireless computer mouse on a desk",
    },
    {
      id: "mechanical-keys",
      name: "Tactile Mechanical Keyboard",
      category: "gear",
      categoryLabel: "Gaming gear",
      price: 3290,
      badge: "New concept",
      description: "Compact mechanical keyboard inspiration with a crisp, tactile feel.",
      image: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80",
      alt: "Mechanical computer keyboard",
    },
    {
      id: "desk-light",
      name: "Ambient LED Desk Lamp",
      category: "desk",
      categoryLabel: "Desk setup",
      price: 1190,
      badge: "Setup upgrade",
      description: "A warm ambient desk lamp concept to bring atmosphere to your setup.",
      image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
      alt: "Modern desk lamp lighting a workspace",
    },
    {
      id: "desk-mat",
      name: "Extended Control Desk Mat",
      category: "desk",
      categoryLabel: "Desk setup",
      price: 890,
      badge: "Everyday",
      description: "A wide desk mat concept for a tidy keyboard and mouse workspace.",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
      alt: "Minimal computer workspace on a desk",
    },
    {
      id: "controller",
      name: "Arc Bluetooth Controller",
      category: "gear",
      categoryLabel: "Gaming gear",
      price: 2190,
      badge: "Cross-platform",
      description: "A versatile controller concept for supported mobile and desktop games.",
      image: "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=800&q=80",
      alt: "Game controller on a colorful background",
    },
    {
      id: "digital-wallpaper",
      name: "Neon Grid Wallpaper Pack",
      category: "digital",
      categoryLabel: "Digital",
      price: 149,
      badge: "Digital sample",
      description: "A sample set of futuristic desktop and phone wallpaper concepts.",
      image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=800&q=80",
      alt: "Colorful night sky with stars",
    },
    {
      id: "cable-kit",
      name: "Clean Setup Cable Kit",
      category: "desk",
      categoryLabel: "Desk setup",
      price: 390,
      badge: "Desk essential",
      description: "A small cable-management kit concept to keep a setup looking sharp.",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
      alt: "Close-up of organized computer equipment",
    },
  ];

  const storageKey = "mob-extra-store-demo-cart-v1";
  const currency = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });
  const searchInput = document.querySelector("[data-store-search]");
  const sortSelect = document.querySelector("[data-store-sort]");
  const resultCount = document.querySelector("[data-result-count]");
  const emptyState = document.querySelector("[data-empty-state]");
  const cartPanel = document.querySelector("[data-cart-panel]");
  const cartBackdrop = document.querySelector("[data-cart-backdrop]");
  const cartItems = document.querySelector("[data-cart-items]");
  const cartEmpty = document.querySelector("[data-cart-empty]");
  const cartFooter = document.querySelector("[data-cart-footer]");
  const toast = document.querySelector("[data-store-toast]");
  let activeCategory = "all";
  let toastTimer;
  let cart = readCart();

  function readCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (!Array.isArray(saved)) return [];
      return saved.filter(
        (item) =>
          products.some((product) => product.id === item.id) &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0,
      );
    } catch (error) {
      console.warn("Could not read the demo store bag from local storage.", error);
      return [];
    }
  }

  function persistCart() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch (error) {
      console.warn("Could not save the demo store bag to local storage.", error);
    }
  }

  function renderProducts() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const visibleProducts = products
      .filter((product) => activeCategory === "all" || product.category === activeCategory)
      .filter((product) =>
        `${product.name} ${product.categoryLabel} ${product.description}`
          .toLocaleLowerCase()
          .includes(query),
      );

    if (sortSelect.value === "price-low") visibleProducts.sort((a, b) => a.price - b.price);
    if (sortSelect.value === "price-high") visibleProducts.sort((a, b) => b.price - a.price);
    if (sortSelect.value === "name") visibleProducts.sort((a, b) => a.name.localeCompare(b.name));

    grid.innerHTML = visibleProducts
      .map(
        (product) => `
          <article class="store-product-card">
            <div class="store-product-art">
              <img src="${product.image}" alt="${product.alt}" loading="lazy" />
              <span class="store-product-badge">${product.badge}</span>
            </div>
            <div class="store-product-body">
              <span class="store-product-category">${product.categoryLabel}</span>
              <h3>${product.name}</h3>
              <p>${product.description}</p>
              <div class="store-product-meta">
                <strong class="store-product-price">${currency.format(product.price)}</strong>
                <span class="store-product-stock">SAMPLE</span>
              </div>
              <button type="button" class="store-add-button" data-add-product="${product.id}">
                <i class="fa-solid fa-plus" aria-hidden="true"></i> Add to demo bag
              </button>
            </div>
          </article>`,
      )
      .join("");

    resultCount.textContent = `${visibleProducts.length} sample ${visibleProducts.length === 1 ? "item" : "items"}`;
    grid.hidden = visibleProducts.length === 0;
    emptyState.hidden = visibleProducts.length !== 0;
  }

  function renderCart() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelector("[data-cart-count]").textContent = String(count);
    const lines = cart
      .map((item) => {
        const product = products.find((entry) => entry.id === item.id);
        return { ...product, quantity: item.quantity };
      })
      .filter(Boolean);

    cartItems.innerHTML = lines
      .map(
        (item) => `
          <article class="store-cart-row">
            <img src="${item.image}" alt="" />
            <div>
              <h3>${item.name}</h3>
              <p>${currency.format(item.price)}</p>
              <div class="store-quantity" aria-label="Quantity for ${item.name}">
                <button type="button" data-quantity="${item.id}" data-change="-1" aria-label="Decrease quantity">−</button>
                <span>${item.quantity}</span>
                <button type="button" data-quantity="${item.id}" data-change="1" aria-label="Increase quantity">+</button>
              </div>
            </div>
            <button type="button" class="store-remove-item" data-remove-product="${item.id}" aria-label="Remove ${item.name}">
              <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
            </button>
          </article>`,
      )
      .join("");

    const subtotal = lines.reduce((total, item) => total + item.price * item.quantity, 0);
    document.querySelector("[data-cart-subtotal]").textContent = currency.format(subtotal);
    cartEmpty.hidden = lines.length > 0;
    cartFooter.hidden = lines.length === 0;
    persistCart();
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  function openCart() {
    cartPanel.classList.add("is-open");
    cartPanel.setAttribute("aria-hidden", "false");
    cartBackdrop.hidden = false;
    document.body.classList.add("store-cart-open");
    cartPanel.querySelector("[data-close-cart]").focus();
  }

  function closeCart() {
    cartPanel.classList.remove("is-open");
    cartPanel.setAttribute("aria-hidden", "true");
    cartBackdrop.hidden = true;
    document.body.classList.remove("store-cart-open");
    document.querySelector("[data-open-cart]").focus();
  }

  document.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      document.querySelectorAll("[data-category]").forEach((categoryButton) => {
        const selected = categoryButton === button;
        categoryButton.classList.toggle("is-active", selected);
        categoryButton.setAttribute("aria-pressed", String(selected));
      });
      renderProducts();
    });
  });

  searchInput.addEventListener("input", renderProducts);
  sortSelect.addEventListener("change", renderProducts);
  document.querySelector("[data-clear-filters]").addEventListener("click", () => {
    activeCategory = "all";
    searchInput.value = "";
    document.querySelector('[data-category="all"]').click();
  });

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-product]");
    if (!button) return;
    const productId = button.dataset.addProduct;
    const existing = cart.find((item) => item.id === productId);
    if (existing) existing.quantity += 1;
    else cart.push({ id: productId, quantity: 1 });
    renderCart();
    showToast("Added to your local demo bag.");
  });

  cartItems.addEventListener("click", (event) => {
    const quantityButton = event.target.closest("[data-quantity]");
    const removeButton = event.target.closest("[data-remove-product]");
    if (removeButton) {
      cart = cart.filter((item) => item.id !== removeButton.dataset.removeProduct);
      renderCart();
      return;
    }
    if (!quantityButton) return;
    const item = cart.find((entry) => entry.id === quantityButton.dataset.quantity);
    if (!item) return;
    item.quantity += Number(quantityButton.dataset.change);
    if (item.quantity <= 0) cart = cart.filter((entry) => entry !== item);
    renderCart();
  });

  document.querySelector("[data-clear-cart]").addEventListener("click", () => {
    cart = [];
    renderCart();
  });
  document.querySelectorAll("[data-open-cart]").forEach((button) => button.addEventListener("click", openCart));
  document.querySelectorAll("[data-close-cart]").forEach((button) => button.addEventListener("click", closeCart));
  cartBackdrop.addEventListener("click", closeCart);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && cartPanel.classList.contains("is-open")) closeCart();
  });

  renderProducts();
  renderCart();
})();
