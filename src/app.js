import { state, resetState } from "./state/store.js";
import { registerAccount, loginAccount, logoutAccount, observeAuth, getProfile } from "./services/authService.js";
import { subscribeProducts, uploadProduct } from "./services/productService.js";
import { subscribeCaterers, createCaterer } from "./services/catererService.js";
import { placeOrder, subscribeMyOrders, subscribeAllOrders, logViewOrder, updateOrder } from "./services/orderService.js";
import {
  createReservation,
  subscribeMyReservations,
  subscribeAllReservations,
  updateReservation
} from "./services/reservationService.js";
import { logAction } from "./services/loggingService.js";
import {
  renderProducts,
  renderCaterers,
  renderCart,
  renderMyOrders,
  renderAllOrders,
  renderMyReservations,
  renderAllReservations,
  renderProfile,
  setMessage,
  showToast,
  setSessionBox,
  setAuthVisibility,
  setRoleVisibility,
  activateTab
} from "./ui/renderers.js";

function setAuthMode(mode) {
  const loginBtn = document.getElementById("auth-mode-login");
  const registerBtn = document.getElementById("auth-mode-register");
  const loginPanel = document.getElementById("auth-login-panel");
  const registerPanel = document.getElementById("auth-register-panel");

  const isLogin = mode === "login";
  if (loginBtn) {
    loginBtn.classList.toggle("active", isLogin);
    loginBtn.setAttribute("aria-selected", isLogin ? "true" : "false");
  }
  if (registerBtn) {
    registerBtn.classList.toggle("active", !isLogin);
    registerBtn.setAttribute("aria-selected", !isLogin ? "true" : "false");
  }
  if (loginPanel) loginPanel.classList.toggle("active", isLogin);
  if (registerPanel) registerPanel.classList.toggle("active", !isLogin);

  try {
    sessionStorage.setItem("authMode", isLogin ? "login" : "register");
  } catch {
    // ignore
  }
}

function getCartTotal() {
  return state.cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
}

function addToCart(productId, qty = 1) {
  const product = state.products.find((p) => p.id === productId);
  if (!product || !state.profile) return;
  if (product.inStock === false || product.outOfStock === true || String(product.name || "").trim().toLowerCase() === "mojito") {
    showToast({ type: "warning", title: "Out of stock", message: "This item is currently unavailable." });
    return;
  }

  const quantity = Math.max(1, Number(qty) || 1);
  const existing = state.cart.find((item) => item.id === productId);
  if (existing) existing.qty += quantity;
  else state.cart.push({ id: product.id, name: product.name, price: Number(product.price), qty: quantity });

  renderCart(state.cart, removeFromCart);
  logAction({
    userId: state.profile.uid,
    role: state.profile.role,
    action: "ADD_TO_CART",
    details: { productId, productName: product.name, qty: quantity }
  }).catch(() => {});
}

function removeFromCart(productId) {
  state.cart = state.cart
    .map((item) => (item.id === productId ? { ...item, qty: item.qty - 1 } : item))
    .filter((item) => item.qty > 0);
  renderCart(state.cart, removeFromCart);
}

function populateCatererSelects() {
  const filterSelect = document.getElementById("product-shop-filter");
  const reservationSelect = document.getElementById("reservation-caterer");

  const options = (state.caterers || [])
    .map((c) => ({ id: c.id, name: c.name }))
    .filter((c) => c.id && c.name);

  if (filterSelect) {
    const current = filterSelect.value || "";
    filterSelect.innerHTML =
      `<option value="">All Shops</option>` + options.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
    filterSelect.value = options.some((c) => c.id === current) ? current : "";
  }

  if (reservationSelect) {
    const current = reservationSelect.value || "";
    reservationSelect.innerHTML =
      `<option value="">Select a shop</option>` + options.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
    reservationSelect.value = options.some((c) => c.id === current) ? current : "";
  }
}

function viewMenuForCaterer(catererId) {
  // When a user comes from a caterer card, show that menu cleanly instead of
  // leaving old search/type/price filters active and accidentally hiding items.
  state.searchTerm = "";
  state.typeFilter = "";
  state.catererFilter = catererId || "";
  state.vegFilter = "";
  state.priceMin = null;
  state.priceMax = null;

  const searchInput = document.getElementById("product-search");
  const typeSelect = document.getElementById("product-type-filter");
  const filterSelect = document.getElementById("product-shop-filter");
  const vegToggle = document.getElementById("product-veg-toggle");
  const vegAllBtn = document.getElementById("product-veg-all");
  const minInput = document.getElementById("price-min");
  const maxInput = document.getElementById("price-max");

  if (searchInput) searchInput.value = "";
  if (typeSelect) typeSelect.value = "";
  if (filterSelect) filterSelect.value = state.catererFilter;
  if (vegToggle) {
    vegToggle.dataset.state = "";
    vegToggle.setAttribute("aria-checked", "false");
    const wrap = vegToggle.closest(".veg-toggle");
    if (wrap) wrap.dataset.state = "";
  }
  if (vegAllBtn) vegAllBtn.classList.add("active");
  if (minInput) minInput.value = "";
  if (maxInput) maxInput.value = "";

  activateTab("products");
  renderProducts(getFilteredProducts(), addToCart);

  const selectedCaterer = state.caterers.find((c) => c.id === state.catererFilter);
  showToast({
    type: "info",
    title: "Menu opened",
    message: selectedCaterer ? `Showing products from ${selectedCaterer.name}.` : "Showing selected catering shop menu."
  });
}

async function handlePlaceOrder() {
  if (!state.profile) {
    setMessage("app-msg", "Please login first.");
    showToast({ type: "warning", title: "Login required", message: "Please login to place an order." });
    return;
  }
  if (!state.cart.length) {
    setMessage("app-msg", "Cart is empty.");
    showToast({ type: "info", title: "Cart empty", message: "Add at least one item to place an order." });
    return;
  }

  const items = state.cart.map((i) => ({ ...i }));
  const total = getCartTotal();
  const orderId = await placeOrder({ user: state.profile, items, total });

  state.cart = [];
  renderCart(state.cart, removeFromCart);

  const payNow = confirm("Would you like to pay now by card? (OK = yes, Cancel = pay on delivery)");
  if (payNow) await payOrder(orderId);

  window.location.replace("order-success.html?orderId=" + encodeURIComponent(orderId));
}

function attachRealtimeSubscriptions() {
  const unsubProducts = subscribeProducts((rows) => {
    state.products = rows;
    renderProducts(getFilteredProducts(), addToCart);
    populateFilterOptions();
  });

  const unsubCaterers = subscribeCaterers((rows) => {
    state.caterers = rows;
    renderCaterers(rows, viewMenuForCaterer);
    populateCatererSelects();
  });

  const unsubMyOrders = subscribeMyOrders(state.user.uid, (rows) => {
    state.myOrders = rows;
    renderMyOrders(rows, payOrder, state.highlightOrder);
    state.highlightOrder = null;
  });

  const unsubMyReservations = subscribeMyReservations(state.user.uid, (rows) => {
    state.myReservations = rows;
    renderMyReservations(rows);
  });

  state.unsubscribers.push(unsubProducts, unsubCaterers, unsubMyOrders, unsubMyReservations);

  if (state.role === "admin") {
    const unsubAllOrders = subscribeAllOrders((rows) => {
      state.allOrders = rows;
      renderAllOrders(rows, changeOrderStatus);
    });
    state.unsubscribers.push(unsubAllOrders);

    const unsubAllReservations = subscribeAllReservations((rows) => {
      state.allReservations = rows;
      renderAllReservations(rows, changeReservationStatus);
    });
    state.unsubscribers.push(unsubAllReservations);
  } else {
    renderAllOrders([]);
    renderAllReservations([]);
  }
}

function setupTabs() {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const tabId = btn.dataset.tab;
      activateTab(tabId);
      if (!state.profile) return;

      if (tabId === "orders") {
        await logViewOrder({ userId: state.profile.uid, role: state.profile.role, scope: "my_orders" });
      }

      if (tabId === "admin-orders" && state.profile.role === "admin") {
        await logViewOrder({ userId: state.profile.uid, role: state.profile.role, scope: "all_orders" });
      }

      if (tabId === "reservations") {
        await logAction({
          userId: state.profile.uid,
          role: state.profile.role,
          action: "VIEW_RESERVATIONS",
          details: { scope: state.profile.role === "admin" ? "all" : "mine" }
        });
      }
    });
  });
}

function setupRegister() {
  const form = document.getElementById("register-form");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("auth-msg", "");

    try {
      await registerAccount({
        name: document.getElementById("reg-name").value.trim(),
        phone: document.getElementById("reg-phone").value.trim(),
        email: document.getElementById("reg-email").value.trim(),
        password: document.getElementById("reg-password").value,
        role: document.getElementById("reg-role").value
      });
      form.reset();
      setMessage("auth-msg", "");
      showToast({ type: "success", title: "Registered", message: "Account created successfully. Please login to continue." });
      setAuthMode("login");
    } catch (error) {
      setMessage("auth-msg", "");
      showToast({ type: "error", title: "Registration failed", message: error.message || "Could not create account." });
    }
  });
}

function setupLogin() {
  const form = document.getElementById("login-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("auth-msg", "");

    try {
      await loginAccount({
        email: document.getElementById("login-email").value.trim(),
        password: document.getElementById("login-password").value
      });
      form.reset();
      setMessage("auth-msg", "");
      showToast({ type: "success", title: "Logged in", message: "Welcome back! You are now signed in." });
    } catch (error) {
      setMessage("auth-msg", "");
      showToast({ type: "error", title: "Login failed", message: error.message || "Invalid credentials." });
    }
  });
}

function setupAuthSwitch() {
  const loginBtn = document.getElementById("auth-mode-login");
  const registerBtn = document.getElementById("auth-mode-register");
  const linkToRegister = document.getElementById("auth-link-to-register");
  const linkToLogin = document.getElementById("auth-link-to-login");

  const saved = (() => {
    try { return sessionStorage.getItem("authMode") || "login"; } catch { return "login"; }
  })();
  setAuthMode(saved === "register" ? "register" : "login");

  if (loginBtn) loginBtn.addEventListener("click", () => setAuthMode("login"));
  if (registerBtn) registerBtn.addEventListener("click", () => setAuthMode("register"));
  if (linkToRegister) linkToRegister.addEventListener("click", () => setAuthMode("register"));
  if (linkToLogin) linkToLogin.addEventListener("click", () => setAuthMode("login"));
}

function setupLogout() {
  document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
      await logoutAccount();
      showToast({ type: "info", title: "Logged out", message: "You have been signed out." });
    } catch (err) {
      showToast({ type: "error", title: "Logout failed", message: err?.message || "Could not sign out." });
    }
  });
}

function windUpSessionUi() {
  clearFilters();
  setMessage("auth-msg", "");
  setMessage("app-msg", "");
  setAuthMode("login");
  activateTab("products");

  const registerForm = document.getElementById("register-form");
  const loginForm = document.getElementById("login-form");
  if (registerForm) registerForm.reset();
  if (loginForm) loginForm.reset();

  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("view");
    url.searchParams.delete("orderId");
    window.history.replaceState({}, "", url.toString());
  } catch {
    // ignore URL cleanup errors
  }
}

function setupProductUpload() {
  const form = document.getElementById("product-form");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("app-msg", "");

    if (!state.profile || state.profile.role !== "admin") {
      setMessage("app-msg", "Only admin can upload products.");
      showToast({ type: "warning", title: "Admin only", message: "Only admin can upload products." });
      return;
    }

    try {
      const imgInput = document.getElementById("product-image");
      let imageData = "";
      if (imgInput && imgInput.files && imgInput.files[0]) {
        const file = imgInput.files[0];
        imageData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }

      await uploadProduct({
        name: document.getElementById("product-name").value.trim(),
        type: document.getElementById("product-type").value,
        veg: document.getElementById("product-veg").checked,
        catererId: "",
        catererName: "",
        description: document.getElementById("product-desc").value.trim(),
        price: Number(document.getElementById("product-price").value),
        image: imageData,
        actor: state.profile
      });

      form.reset();
      showToast({ type: "success", title: "Product uploaded", message: "Your product is now available in the menu." });
      activateTab("products");
    } catch (error) {
      setMessage("app-msg", error.message || "Upload failed.");
      showToast({ type: "error", title: "Upload failed", message: error.message || "Could not upload product." });
    }
  });

  const seedBtn = document.getElementById("seed-products-btn");
  seedBtn.addEventListener("click", async () => {
    state.searchTerm = "";
    state.typeFilter = "";
    state.catererFilter = "";
    state.vegFilter = "";
    state.priceMin = null;
    state.priceMax = null;

    const si = document.getElementById("product-search"); if (si) si.value = "";
    const tf = document.getElementById("product-type-filter"); if (tf) tf.value = "";
    const sf = document.getElementById("product-shop-filter"); if (sf) sf.value = "";

    const vegToggleReset = document.getElementById("product-veg-toggle");
    const vegAllReset = document.getElementById("product-veg-all");
    if (vegToggleReset) {
      vegToggleReset.dataset.state = "";
      const wrap = vegToggleReset.closest(".veg-toggle");
      if (wrap) wrap.dataset.state = "";
      vegToggleReset.setAttribute("aria-checked", "false");
    }
    if (vegAllReset) vegAllReset.classList.add("active");

    const pmin = document.getElementById("price-min"); if (pmin) pmin.value = "";
    const pmax = document.getElementById("price-max"); if (pmax) pmax.value = "";

    if (!state.profile || state.profile.role !== "admin") return;
    setMessage("app-msg", "Seeding products...");

    try {
      const fallback = [
        { id: "sample-caterer-1", name: "Spice Garden Caterers" },
        { id: "sample-caterer-2", name: "Royal Feast Catering" },
        { id: "sample-caterer-3", name: "Green Leaf Veg Caterers" }
      ];
      const pickCaterer = (idx) => state.caterers[idx] || fallback[idx] || fallback[0];

      const keyOf = (p) => {
        const norm = (value) =>
          String(value || "")
            .trim()
            .toLowerCase()
            .replaceAll(/\s+/g, " ");
        const catererKey = norm(p.catererId) || norm(p.catererName);
        const vegKey = typeof p.veg === "boolean" ? (p.veg ? "veg" : "nonveg") : "";
        const price = Number(p.price || 0);
        const priceKey = String(Math.round(price * 100) / 100);
        return [norm(p.name), norm(p.type), catererKey, vegKey, priceKey].join("|");
      };

      const existing = new Set((state.products || []).map((p) => keyOf(p)));
      const nameKeyOf = (name) =>
        String(name || "")
          .trim()
          .toLowerCase()
          .replaceAll(/\s+/g, " ");
      const specialNames = new Set([nameKeyOf("Classic Chicken Biryani"), nameKeyOf("Beef Rendang")]);
      const existingNames = new Set((state.products || []).map((p) => nameKeyOf(p.name)));

      const samples = [
        {
          name: "Classic Chicken Biryani",
          type: "Rice",
          veg: false,
          catererId: pickCaterer(0).id,
          catererName: pickCaterer(0).name,
          description: "Fragrant basmati rice layered with tender marinated chicken, aromatic spices, and caramelized onions.",
          price: 85,
          image: "assets/img/products/classic-chicken-biryani.jpg"
        },
        {
          name: "Beef Rendang",
          type: "Rice",
          veg: false,
          catererId: pickCaterer(1).id,
          catererName: pickCaterer(1).name,
          description: "Slow-cooked beef in rich coconut gravy and traditional spices — an all-time favorite.",
          price: 120,
          image: "assets/img/products/beef-rendang.jpg"
        },
        {
          name: "Paneer Butter Masala",
          type: "Vegetarian",
          veg: true,
          catererId: pickCaterer(1).id,
          catererName: pickCaterer(1).name,
          description: "Creamy tomato gravy with soft paneer cubes, finished with butter and kasuri methi.",
          price: 140,
          image: "assets/img/products/paneer-butter-masala.jpg"
        },
        {
          name: "Masala Dosa Platter",
          type: "Vegetarian",
          veg: true,
          catererId: pickCaterer(2).id,
          catererName: pickCaterer(2).name,
          description: "Crispy dosa with potato masala, served with chutneys and sambar.",
          price: 90,
          image: "assets/img/products/masala-dosa-platter.jpg"
        },
        {
          name: "Veg Hakka Noodles",
          type: "Noodles",
          veg: true,
          catererId: pickCaterer(0).id,
          catererName: pickCaterer(0).name,
          description: "Smoky wok-tossed noodles with crunchy veggies and signature sauces.",
          price: 110,
          image: "assets/img/products/veg-hakka-noodles.jpg"
        },
        {
          name: "Tandoori Chicken Platter",
          type: "Rice",
          veg: false,
          catererId: pickCaterer(1).id,
          catererName: pickCaterer(1).name,
          description: "Juicy tandoori chicken served with salad, mint chutney, and naan wedges.",
          price: 220,
          image: "assets/img/products/tandoori-chicken-platter.jpeg"
        },
        {
          name: "Butter Chicken",
          type: "Rice",
          veg: false,
          catererId: pickCaterer(0).id,
          catererName: pickCaterer(0).name,
          description: "Tandoor-roasted chicken simmered in a buttery tomato gravy with cream.",
          price: 210,
          image: "assets/img/products/butter-chicken.jpg"
        },
        {
          name: "Veg Pulao",
          type: "Rice",
          veg: true,
          catererId: pickCaterer(2).id,
          catererName: pickCaterer(2).name,
          description: "Aromatic rice cooked with seasonal vegetables, whole spices, and herbs.",
          price: 75,
          image: "assets/img/products/veg-pulao.jpg"
        },
        {
          name: "Jeera Rice",
          type: "Rice",
          veg: true,
          catererId: pickCaterer(1).id,
          catererName: pickCaterer(1).name,
          description: "Fluffy basmati rice tempered with cumin and ghee.",
          price: 55,
          image: "assets/img/products/jeera-rice.jpg"
        },
        {
          name: "Vegetable Fried Rice",
          type: "Rice",
          veg: true,
          catererId: pickCaterer(2).id,
          catererName: pickCaterer(2).name,
          description: "Wok-fried rice with mixed vegetables, soy sauce, and sesame.",
          price: 105,
          image: "assets/img/products/vegetable-fried-rice.jpg"
        },
        {
          name: "Margherita Pasta Bake",
          type: "Pasta",
          veg: true,
          catererId: pickCaterer(1).id,
          catererName: pickCaterer(1).name,
          description: "Cheesy baked pasta with basil, tomato sauce, and a golden crust.",
          price: 175,
          image: "assets/img/products/margherita-pasta-bake.jpg"
        },
        {
          name: "Pasta Alfredo",
          type: "Pasta",
          veg: true,
          catererId: pickCaterer(1).id,
          catererName: pickCaterer(1).name,
          description: "Creamy Alfredo sauce with herbs, parmesan, and perfectly cooked pasta.",
          price: 160,
          image: "assets/img/products/pasta-alfredo.jpg"
        },
        {
          name: "Pesto Penne Veg",
          type: "Pasta",
          veg: true,
          catererId: pickCaterer(2).id,
          catererName: pickCaterer(2).name,
          description: "Penne tossed in basil pesto with cherry tomatoes and olives.",
          price: 165,
          image: "assets/img/products/pesto-penne-veg.png"
        },
        {
          name: "Schezwan Noodles",
          type: "Noodles",
          veg: true,
          catererId: pickCaterer(0).id,
          catererName: pickCaterer(0).name,
          description: "Spicy schezwan noodles with bell peppers, spring onions, and garlic.",
          price: 125,
          image: "assets/img/products/schezwan-noodles.jpeg"
        },
        {
          name: "Chicken Chow Mein",
          type: "Noodles",
          veg: false,
          catererId: pickCaterer(1).id,
          catererName: pickCaterer(1).name,
          description: "Classic chow mein with chicken strips, veggies, and soy-garlic glaze.",
          price: 155,
          image: "assets/img/products/chicken-chow-mein.jpg"
        },
        {
          name: "Samosa (2 pcs)",
          type: "Vegetarian",
          veg: true,
          catererId: pickCaterer(0).id,
          catererName: pickCaterer(0).name,
          description: "Crispy pastry stuffed with spiced potato and peas, served with chutney.",
          price: 35,
          image: "assets/img/products/samosa-2pcs.jpg"
        },
        {
          name: "Hummus & Pita",
          type: "Vegetarian",
          veg: true,
          catererId: pickCaterer(1).id,
          catererName: pickCaterer(1).name,
          description: "Creamy hummus served with warm pita wedges and olive oil drizzle.",
          price: 120,
          image: "assets/img/products/hummus-pita.jpg"
        },
        {
          name: "Veggie Salad Bowl",
          type: "Vegetarian",
          veg: true,
          catererId: pickCaterer(2).id,
          catererName: pickCaterer(2).name,
          description: "Fresh greens with corn, cucumber, beans, and a light lemon dressing.",
          price: 95,
          image: "assets/img/products/veggie-salad-bowl.jpg"
        },
        {
          name: "Gulab Jamun (2 pcs)",
          type: "Dessert",
          veg: true,
          catererId: pickCaterer(2).id,
          catererName: pickCaterer(2).name,
          description: "Soft milk-solid dumplings soaked in warm cardamom sugar syrup.",
          price: 60,
          image: "assets/img/products/gulab-jamun-2pcs.jpg"
        },
        {
          name: "Rasgulla (2 pcs)",
          type: "Dessert",
          veg: true,
          catererId: pickCaterer(0).id,
          catererName: pickCaterer(0).name,
          description: "Spongy cottage-cheese balls soaked in chilled sugar syrup.",
          price: 65,
          image: "assets/img/products/rasgulla-2pcs.jpg"
        },
        {
          name: "Chocolate Brownie",
          type: "Dessert",
          veg: true,
          catererId: pickCaterer(0).id,
          catererName: pickCaterer(0).name,
          description: "Rich chocolate brownie with a crisp top and soft fudgy center.",
          price: 95,
          image: "assets/img/products/chocolate-brownie.jpg"
        },
        {
          name: "Fresh Lime Soda",
          type: "Drinks",
          veg: true,
          catererId: pickCaterer(0).id,
          catererName: pickCaterer(0).name,
          description: "Chilled lime soda with mint and a hint of black salt.",
          price: 45,
          image: "assets/img/products/fresh-lime-soda.jpg",
          inStock: true
        },
        {
          name: "Mojito",
          type: "Drinks",
          veg: true,
          catererId: pickCaterer(0).id,
          catererName: pickCaterer(0).name,
          description: "Refreshing mint mojito served chilled with lime and soda.",
          price: 65,
          image: "assets/img/products/mojito.jpg",
          inStock: false
        },
        {
          name: "Mango Lassi",
          type: "Drinks",
          veg: true,
          catererId: pickCaterer(2).id,
          catererName: pickCaterer(2).name,
          description: "Thick yogurt-based mango drink, perfectly sweet and refreshing.",
          price: 70,
          image: "assets/img/products/mango-lassi.jpg",
          inStock: true
        },
        {
          name: "Masala Chai",
          type: "Drinks",
          veg: true,
          catererId: pickCaterer(1).id,
          catererName: pickCaterer(1).name,
          description: "Hot masala chai brewed with ginger and cardamom.",
          price: 30,
          image: "assets/img/products/masala-chai.jpg",
          inStock: true
        },
        {
          name: "Iced Coffee",
          type: "Drinks",
          veg: true,
          catererId: pickCaterer(1).id,
          catererName: pickCaterer(1).name,
          description: "Creamy iced coffee with a smooth finish and cocoa notes.",
          price: 85,
          image: "assets/img/products/iced-coffee.svg",
          inStock: true
        }
      ];

      let added = 0;
      let skipped = 0;
      for (const p of samples) {
        const k = keyOf(p);
        const nk = nameKeyOf(p.name);
        if (existing.has(k)) {
          skipped++;
          continue;
        }
        if (specialNames.has(nk) && existingNames.has(nk)) {
          skipped++;
          continue;
        }
        await uploadProduct({ ...p, actor: state.profile });
        existing.add(k);
        existingNames.add(nk);
        added++;
      }
      setMessage("app-msg", `Seed complete. Added ${added}, skipped ${skipped} duplicates.`);
    } catch (err) {
      setMessage("app-msg", err.message || "Seeding failed.");
    }
  });
}

function setupSearch() {
  const searchInput = document.getElementById("product-search");
  const typeSelect = document.getElementById("product-type-filter");
  const shopSelect = document.getElementById("product-shop-filter");
  const vegToggle = document.getElementById("product-veg-toggle");
  const vegAllBtn = document.getElementById("product-veg-all");
  const minInput = document.getElementById("price-min");
  const maxInput = document.getElementById("price-max");
  const vegWrap = vegToggle ? vegToggle.closest(".veg-toggle") : null;

  function setVegState(next) {
    if (!vegToggle) return;
    const normalized = next || "";
    vegToggle.dataset.state = normalized;
    if (vegWrap) vegWrap.dataset.state = normalized;
    vegToggle.setAttribute("aria-checked", normalized === "nonveg" ? "true" : "false");
    if (vegAllBtn) vegAllBtn.classList.toggle("active", normalized === "");
  }

  function applyFilters() {
    state.searchTerm = searchInput.value.trim().toLowerCase();
    state.typeFilter = typeSelect.value;
    state.catererFilter = shopSelect ? shopSelect.value : "";
    state.vegFilter = vegToggle ? (vegToggle.dataset.state || "") : "";
    state.priceMin = minInput.value ? Number(minInput.value) : null;
    state.priceMax = maxInput.value ? Number(maxInput.value) : null;
    renderProducts(getFilteredProducts(), addToCart);
  }

  [searchInput, typeSelect, shopSelect, minInput, maxInput]
    .filter(Boolean)
    .forEach((el) => el.addEventListener("input", applyFilters));

  if (vegToggle) {
    vegToggle.addEventListener("click", () => {
      const cur = vegToggle.dataset.state || "";
      const next = cur === "veg" ? "nonveg" : "veg";
      setVegState(next);
      applyFilters();
    });
  }

  if (vegAllBtn) {
    vegAllBtn.addEventListener("click", () => {
      setVegState("");
      applyFilters();
    });
  }

  const clearBtn = document.getElementById("clear-filters-btn");
  if (clearBtn) clearBtn.addEventListener("click", clearFilters);

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") clearFilters();
  });
}

function populateFilterOptions() {
  const typeSelect = document.getElementById("product-type-filter");
  if (!typeSelect) return;
  const types = Array.from(new Set(state.products.map((p) => p.type).filter(Boolean))).sort();
  const current = typeSelect.value || "";
  typeSelect.innerHTML = `<option value="">All Types</option>` + types.map((t) => `<option value="${t}">${t}</option>`).join("");
  typeSelect.value = types.includes(current) ? current : "";

  populateCatererSelects();
}

function clearFilters() {
  state.searchTerm = "";
  state.typeFilter = "";
  state.catererFilter = "";
  state.vegFilter = "";
  state.priceMin = null;
  state.priceMax = null;

  const si = document.getElementById("product-search"); if (si) si.value = "";
  const tf = document.getElementById("product-type-filter"); if (tf) tf.value = "";
  const sf = document.getElementById("product-shop-filter"); if (sf) sf.value = "";

  const vf = document.getElementById("product-veg-toggle");
  if (vf) {
    vf.dataset.state = "";
    const wrap = vf.closest(".veg-toggle");
    if (wrap) wrap.dataset.state = "";
    vf.setAttribute("aria-checked", "false");
    const allBtn = document.getElementById("product-veg-all");
    if (allBtn) allBtn.classList.add("active");
  }

  const pmin = document.getElementById("price-min"); if (pmin) pmin.value = "";
  const pmax = document.getElementById("price-max"); if (pmax) pmax.value = "";

  renderProducts(getFilteredProducts(), addToCart);
}

function getFilteredProducts() {
  return state.products.filter((p) => {
    if (state.searchTerm) {
      const txt = `${p.name} ${p.description}`.toLowerCase();
      if (!txt.includes(state.searchTerm)) return false;
    }
    if (state.typeFilter && p.type !== state.typeFilter) return false;
    if (state.catererFilter) {
      const selectedCaterer = state.caterers.find((c) => c.id === state.catererFilter || c.name === state.catererFilter);
      const selectedId = selectedCaterer?.id || state.catererFilter;
      const selectedName = selectedCaterer?.name || state.catererFilter;
      const productCatererId = String(p.catererId || "").trim();
      const productCatererName = String(p.catererName || "").trim();
      const matchesSelectedCaterer =
        productCatererId === selectedId ||
        productCatererName === selectedName ||
        productCatererName === selectedId;
      if (!matchesSelectedCaterer) return false;
    }
    if (state.vegFilter) {
      if (state.vegFilter === "veg" && !p.veg) return false;
      if (state.vegFilter === "nonveg" && p.veg) return false;
    }
    if (state.priceMin != null && Number(p.price) < state.priceMin) return false;
    if (state.priceMax != null && Number(p.price) > state.priceMax) return false;
    return true;
  });
}

function setupOrderPlacement() {
  document.getElementById("place-order-btn").addEventListener("click", () => {
    handlePlaceOrder().catch((error) => {
      setMessage("app-msg", error.message || "Order placement failed.");
    });
  });
}

async function payOrder(orderId) {
  const method = prompt("Enter payment method (e.g. card, cash)", "card") || "card";
  await updateOrder(orderId, { status: "Paid", paymentMethod: method }, state.profile);
}

async function changeOrderStatus(orderId, status) {
  await updateOrder(orderId, { status }, state.profile);
}

async function changeReservationStatus(reservationId, status) {
  await updateReservation(reservationId, { status }, state.profile);
}

function setupCatererSeeding() {
  const btn = document.getElementById("seed-caterers-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (!state.profile || state.profile.role !== "admin") return;
    setMessage("app-msg", "Seeding catering shops...");
    try {
      const samples = [
        {
          name: "Spice Garden Caterers",
          city: "Mumbai",
          phone: "+91 98765 43210",
          rating: 4.6,
          minOrder: 2500,
          tags: ["Indian", "Mughlai", "Biryani"],
          image: "assets/img/caterers/spice-garden-caterers.jpg"
        },
        {
          name: "Royal Feast Catering",
          city: "Delhi",
          phone: "+91 98111 22334",
          rating: 4.4,
          minOrder: 4000,
          tags: ["North Indian", "Tandoor", "Live Counters"],
          image: "assets/img/products/tandoori-chicken-platter.jpeg"
        },
        {
          name: "Green Leaf Veg Caterers",
          city: "Bengaluru",
          phone: "+91 99000 11223",
          rating: 4.7,
          minOrder: 3000,
          tags: ["Vegetarian", "South Indian", "Jain"],
          image: "assets/img/products/veg-pulao.jpg"
        }
      ];
      for (const c of samples) await createCaterer({ ...c, actor: state.profile });
      setMessage("app-msg", "Sample shops seeded.");
    } catch (err) {
      setMessage("app-msg", err.message || "Seeding shops failed.");
    }
  });
}

function setupReservations() {
  const form = document.getElementById("reservation-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.profile) {
      setMessage("app-msg", "Please login first.");
      return;
    }

    setMessage("app-msg", "");
    try {
      const catererId = document.getElementById("reservation-caterer").value;
      const catererName = state.caterers.find((c) => c.id === catererId)?.name || "";

      const payload = {
        catererId,
        catererName,
        eventType: document.getElementById("reservation-type").value,
        eventDate: document.getElementById("reservation-date").value,
        eventTime: document.getElementById("reservation-time").value,
        guests: Number(document.getElementById("reservation-guests").value),
        venue: document.getElementById("reservation-venue").value.trim(),
        notes: document.getElementById("reservation-notes").value.trim()
      };

      await createReservation({ actor: state.profile, payload });
      form.reset();
      setMessage("app-msg", "Reservation submitted.");
    } catch (err) {
      setMessage("app-msg", err.message || "Reservation failed.");
    }
  });
}

function setupAuthObserver() {
  observeAuth(async (firebaseUser) => {
    resetState();

    if (!firebaseUser) {
      windUpSessionUi();
      setAuthVisibility(false);
      setSessionBox(null);
      renderCart([], removeFromCart);
      renderProducts([], addToCart);
      renderCaterers([]);
      renderMyOrders([]);
      renderAllOrders([]);
      renderMyReservations([]);
      renderAllReservations([]);
      renderProfile(null);
      return;
    }

    const profile = await getProfile(firebaseUser.uid);
    if (!profile) {
      setMessage("app-msg", "Profile not found.");
      return;
    }

    state.user = firebaseUser;
    state.profile = profile;
    state.role = profile.role;

    setSessionBox(profile);
    setRoleVisibility(profile.role);

    setAuthVisibility(true);
    renderProfile(profile);
    renderCart(state.cart, removeFromCart);

    activateTab("products");

    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    const orderIdParam = params.get("orderId");
    if (orderIdParam) state.highlightOrder = orderIdParam;

    if (view) {
      const base = ["products", "caterers", "reservations", "orders", "profile", "admin-products", "admin-orders"];
      const valid = state.role === "admin" ? base.filter((t) => t !== "profile" && t !== "orders" && t !== "reservations") : base;
      if (valid.includes(view)) activateTab(view);
    }

    attachRealtimeSubscriptions();
  });
}

function init() {
  setupTabs();
  setupAuthSwitch();
  setupRegister();
  setupLogin();
  setupLogout();
  setupProductUpload();
  setupCatererSeeding();
  setupReservations();
  setupSearch();
  setupOrderPlacement();
  setupAuthObserver();
}

init();
