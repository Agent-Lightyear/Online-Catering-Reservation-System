import { appConfig } from "../config/appConfig.js";

function formatPrice(amount) {
  return `${appConfig.currency} ${Number(amount || 0).toFixed(2)}`;
}

const thumbCache = new Map();
let remoteImageObserver = null;
const ALLOW_REMOTE_PRODUCT_IMAGES = false;

const LOCAL_PRODUCT_IMAGES = new Map(
  [
    ["classic chicken biryani", "assets/img/products/classic-chicken-biryani.jpg"],
    ["beef rendang", "assets/img/products/beef-rendang.jpg"],
    ["paneer butter masala", "assets/img/products/paneer-butter-masala.jpg"],
    ["masala dosa platter", "assets/img/products/masala-dosa-platter.jpg"],
    ["veg hakka noodles", "assets/img/products/veg-hakka-noodles.jpg"],
    ["tandoori chicken platter", "assets/img/products/tandoori-chicken-platter.jpeg"],
    ["butter chicken", "assets/img/products/butter-chicken.jpg"],
    ["veg pulao", "assets/img/products/veg-pulao.jpg"],
    ["jeera rice", "assets/img/products/jeera-rice.jpg"],
    ["vegetable fried rice", "assets/img/products/vegetable-fried-rice.jpg"],
    ["margherita pasta bake", "assets/img/products/margherita-pasta-bake.jpg"],
    ["pasta alfredo", "assets/img/products/pasta-alfredo.jpg"],
    ["pesto penne veg", "assets/img/products/pesto-penne-veg.png"],
    ["vegetarian pasta primavera", "assets/img/products/vegetarian-pasta-primavera.jpg"],
    ["schezwan noodles", "assets/img/products/schezwan-noodles.jpeg"],
    ["chicken chow mein", "assets/img/products/chicken-chow-mein.jpg"],
    ["samosa (2 pcs)", "assets/img/products/samosa-2pcs.jpg"],
    ["hummus & pita", "assets/img/products/hummus-pita.jpg"],
    ["veggie salad bowl", "assets/img/products/veggie-salad-bowl.jpg"],
    ["gulab jamun (2 pcs)", "assets/img/products/gulab-jamun-2pcs.jpg"],
    ["rasgulla (2 pcs)", "assets/img/products/rasgulla-2pcs.jpg"],
    ["chocolate brownie", "assets/img/products/chocolate-brownie.jpg"],
    ["vanilla ice cream cup", "assets/img/products/vanilla-ice-cream-cup.jpg"],
    ["fresh lime soda", "assets/img/products/fresh-lime-soda.jpg"],
    ["mojito", "assets/img/products/mojito.jpg"],
    ["mango lassi", "assets/img/products/mango-lassi.jpg"],
    ["masala chai", "assets/img/products/masala-chai.jpg"],
    ["iced coffee", "assets/img/products/iced-coffee.svg"]
  ].map(([k, v]) => [String(k).trim().toLowerCase(), v])
);

function normalizeProductNameKey(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, " ");
}

function resolveLocalProductImage(product) {
  const key = normalizeProductNameKey(product?.name);
  return LOCAL_PRODUCT_IMAGES.get(key) || "";
}

function hashString(input) {
  const str = String(input || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getThumbKey(product) {
  return String(hashString(`${product?.name || ""}|${product?.type || ""}|${product?.catererName || ""}|${product?.price || ""}`));
}

function typeAccent(type) {
  const t = String(type || "").toLowerCase();
  if (t === "drinks") return "#0ea5e9";
  if (t === "dessert") return "#ec4899";
  if (t === "noodles") return "#f97316";
  if (t === "pasta") return "#a855f7";
  if (t === "vegetarian") return "#22c55e";
  if (t === "rice") return "#0b6e4f";
  return "#64748b";
}

function makeProductThumbDataUri(product) {
  const name = String(product?.name || "Food").slice(0, 40);
  const type = String(product?.type || "Menu").slice(0, 18);
  const caterer = String(product?.catererName || "").slice(0, 26);
  const accent = typeAccent(type);
  const badge = product?.veg === true ? "VEG" : product?.veg === false ? "NON-VEG" : "ITEM";

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#f8fafc"/>
      <stop offset="1" stop-color="#eef2ff"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.92"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0.35"/>
    </linearGradient>
  </defs>
  <rect width="900" height="600" fill="url(#bg)"/>
  <rect x="54" y="54" width="792" height="492" rx="30" fill="#ffffff" opacity="0.92"/>
  <rect x="54" y="54" width="792" height="492" rx="30" fill="url(#accent)" opacity="0.18"/>
  <rect x="54" y="54" width="792" height="492" rx="30" fill="none" stroke="#d4d9e2" stroke-width="2"/>

  <g font-family="Segoe UI, system-ui, -apple-system, sans-serif" fill="#0f172a">
    <text x="104" y="190" font-size="34" font-weight="800">${escapeXml(name)}</text>
    <text x="104" y="238" font-size="22" font-weight="700" fill="#334155">${escapeXml(type)}</text>
    ${caterer ? `<text x="104" y="280" font-size="18" fill="#475569">${escapeXml(caterer)}</text>` : ""}
  </g>

  <g>
    <rect x="104" y="334" rx="999" ry="999" width="150" height="44" fill="${accent}" opacity="0.16"/>
    <text x="179" y="364" text-anchor="middle" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="#0f172a">${escapeXml(badge)}</text>
  </g>

  <g opacity="0.22">
    <circle cx="705" cy="230" r="110" fill="${accent}"/>
    <circle cx="705" cy="230" r="82" fill="#ffffff"/>
    <circle cx="705" cy="230" r="60" fill="${accent}"/>
  </g>
</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe) {
  return String(unsafe)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function ensureGlobalImageFallback() {
  if (window.__ocrsImgFallback) return;
  window.__ocrsImgFallback = (imgEl) => {
    try {
      if (!imgEl || !imgEl.dataset) return;
      const stage = Number(imgEl.dataset.fallbackStage || "0");
      if (stage >= 2) return;

      const key = imgEl.dataset.thumbKey;
      const thumb = key ? thumbCache.get(key) : null;

      imgEl.dataset.fallbackStage = String(stage + 1);
      if (stage === 0 && thumb) {
        imgEl.src = thumb;
        return;
      }
      imgEl.src = "assets/img/placeholder-food.svg";
    } catch {
      // ignore
    }
  };
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function isInlineImageUrl(value) {
  const v = String(value || "").trim().toLowerCase();
  return v.startsWith("data:image/") || v.startsWith("blob:");
}

function getRemoteObserver() {
  if (remoteImageObserver) return remoteImageObserver;
  if (typeof IntersectionObserver === "undefined") return null;

  remoteImageObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const imgEl = entry.target;
        remoteImageObserver.unobserve(imgEl);
        loadRemoteImageInto(imgEl);
      }
    },
    { rootMargin: "250px 0px" }
  );

  return remoteImageObserver;
}

function loadRemoteImageInto(imgEl) {
  try {
    if (!imgEl?.dataset) return;
    const remote = String(imgEl.dataset.remoteSrc || "").trim();
    if (!remote) return;
    if (imgEl.dataset.remoteLoaded === "1") return;
    imgEl.dataset.remoteLoaded = "1";

    const preloader = new Image();
    try {
      preloader.referrerPolicy = "no-referrer";
    } catch {
      // ignore
    }
    preloader.onload = () => {
      imgEl.src = remote;
    };
    preloader.onerror = () => {
      // keep thumb (already shown)
    };
    preloader.src = remote;
  } catch {
    // ignore
  }
}

function hydrateRemoteImages(rootEl) {
  const observer = getRemoteObserver();
  const imgs = Array.from(rootEl.querySelectorAll("img[data-remote-src]"));
  if (!imgs.length) return;

  if (!observer) {
    imgs.forEach((img) => loadRemoteImageInto(img));
    return;
  }

  imgs.forEach((img) => observer.observe(img));
}

export function renderProducts(products, onAddToCart) {
  ensureGlobalImageFallback();
  const root = document.getElementById("products-list");
  if (!products.length) {
    root.innerHTML = `<p class="muted">No products yet.</p>`;
    return;
  }

  const imageCounts = new Map();
  const imageUsed = new Map();
  for (const p of products) {
    const url = String(p?.image || "").trim();
    if (!url) continue;
    imageCounts.set(url, (imageCounts.get(url) || 0) + 1);
  }

  root.innerHTML = products
    .map((p) => {
      const nameKey = normalizeProductNameKey(p?.name);
      const outOfStock = p?.inStock === false || p?.outOfStock === true || nameKey === "mojito";
      const hasVegFlag = typeof p?.veg !== "undefined" || nameKey === "mojito";
      const vegValue = nameKey === "mojito" ? true : p?.veg;
      const thumbKey = getThumbKey(p);
      if (!thumbCache.has(thumbKey)) thumbCache.set(thumbKey, makeProductThumbDataUri(p));

      const thumb = thumbCache.get(thumbKey);
      let rawImage = String(p?.image || "").trim();
      const localOverride = resolveLocalProductImage(p);
      if (localOverride) rawImage = localOverride;

      let remoteSrc = "";
      let src = thumb;

      if (rawImage && isInlineImageUrl(rawImage)) {
        src = rawImage;
      } else if (rawImage && isHttpUrl(rawImage)) {
        if (ALLOW_REMOTE_PRODUCT_IMAGES) {
          const count = imageCounts.get(rawImage) || 0;
          if (count > 1) {
            const used = (imageUsed.get(rawImage) || 0) + 1;
            imageUsed.set(rawImage, used);
            if (used === 1) remoteSrc = rawImage;
          } else {
            remoteSrc = rawImage;
          }
        }
      } else if (rawImage) {
        // Allow relative/local URLs (e.g. assets/...) directly.
        src = rawImage;
      }
      return `
       <article class="item-card product-card">
         <div class="product-media">
           <img
              src="${src}"
              alt="${p.name}"
              loading="lazy"
              referrerpolicy="no-referrer"
              data-thumb-key="${thumbKey}"
              data-fallback-stage="0"
              ${remoteSrc ? `data-remote-src="${remoteSrc}"` : ""}
              onerror="window.__ocrsImgFallback && window.__ocrsImgFallback(this)"
            />
            ${outOfStock ? `<span class="stock-badge out">Out of stock</span>` : ""}
         </div>
          <div class="product-body">
            <h4>${p.name}</h4>
            ${p.catererName ? `<div class="product-shop">${p.catererName}</div>` : ""}
            ${p.type ? `<div class="product-type">${p.type}</div>` : ""}
           ${hasVegFlag ? `<div class="product-veg ${vegValue ? 'veg' : 'nonveg'}">${vegValue ? 'Veg' : 'Non-Veg'}</div>` : ""}
            <p class="product-desc">${p.description}</p>
            <div class="product-meta">
              <strong class="price">${formatPrice(p.price)}</strong>
             <div class="qty-wrap">
               <label>Qty <input type="number" min="1" value="1" class="qty-input" data-qty-id="${p.id}" ${outOfStock ? "disabled" : ""} /></label>
             </div>
           </div>
           <button class="btn btn-primary" data-add-id="${p.id}" ${outOfStock ? "disabled" : ""}>${outOfStock ? "Unavailable" : "Add to Cart"}</button>
         </div>
       </article>
      `;
    })
    .join("");

  hydrateRemoteImages(root);

  root.querySelectorAll("button[data-add-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.addId;
      const qtyInput = root.querySelector(`input[data-qty-id="${id}"]`);
      const qty = qtyInput ? Math.max(1, Number(qtyInput.value || 1)) : 1;
      onAddToCart(id, qty);
    });
  });
}

export function renderCart(cart, onRemove) {
  const root = document.getElementById("cart-list");
  const totalEl = document.getElementById("cart-total");

  if (!cart.length) {
    root.innerHTML = `<li class="muted">Cart is empty.</li>`;
    totalEl.textContent = formatPrice(0);
    return;
  }

  root.innerHTML = cart
    .map((item) => `
      <li>
        <span>${item.name} x ${item.qty}</span>
        <span>
          ${formatPrice(item.price * item.qty)}
          <button class="btn" data-remove-id="${item.id}">-</button>
        </span>
      </li>
    `)
    .join("");

  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
  totalEl.textContent = formatPrice(total);

  root.querySelectorAll("button[data-remove-id]").forEach((btn) => {
    btn.addEventListener("click", () => onRemove(btn.dataset.removeId));
  });
}

export function renderMyOrders(orders, onPay, highlightId) {
  const root = document.getElementById("my-orders-list");
  if (!orders.length) {
    root.innerHTML = `<p class="muted">No orders yet.</p>`;
    return;
  }

  root.innerHTML = orders
    .map((o) => {
      const items = (o.items || []).map((i) => `${i.name} x ${i.qty}`).join(", ");
      const status = o.status || "Placed";
      const payBtn = status === "Placed" ? `<button class="btn btn-primary btn-sm" data-pay-id="${o.id}">Pay Now</button>` : "";
      const payInfo = o.paymentMethod ? `<p>Paid via <em>${o.paymentMethod}</em></p>` : "";
      // attach id attribute to allow scrolling/highlighting
      const isHighlighted = highlightId && highlightId === o.id;
      return `
        <article id="order-${o.id}" class="item-card order-card${isHighlighted ? ' highlight' : ''}">
          <h4>Order ${o.id}</h4>
          <p>${items}</p>
          <p>Total: <strong>${formatPrice(o.total)}</strong></p>
          <p>Status: ${status} ${payBtn}</p>
          ${payInfo}
        </article>
      `;
    })
    .join("");

  if (onPay) {
    root.querySelectorAll("button[data-pay-id]").forEach((btn) => {
      btn.addEventListener("click", () => onPay(btn.dataset.payId));
    });
  }

  // if we rendered a highlight, scroll it into view
  if (highlightId) {
    const el = document.getElementById(`order-${highlightId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

export function renderAllOrders(orders, onStatusChange) {
  const root = document.getElementById("admin-orders-list");
  if (!orders.length) {
    root.innerHTML = `<p class="muted">No orders available.</p>`;
    return;
  }

  // basic report summary
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const count = orders.length;
  let html = `<div class="orders-report">
      <p><strong>Orders:</strong> ${count}</p>
      <p><strong>Revenue:</strong> ${formatPrice(totalRevenue)}</p>
    </div>`;

  html += orders
    .map((o) => {
      const items = (o.items || []).map((i) => `${i.name} x ${i.qty}`).join(", ");
      const status = o.status || "Placed";
      const payInfo = o.paymentMethod ? `<p>Paid via <em>${o.paymentMethod}</em></p>` : "";
      let next = "";
      if (status === "Placed") next = "Paid";
      else if (status === "Paid") next = "Completed";
      const actionBtn = next
        ? `<button class="btn btn-secondary btn-sm" data-status-id="${o.id}" data-next-status="${next}">Mark ${next}</button>`
        : "";
      return `
        <article class="item-card order-card">
          <h4>Order ${o.id}</h4>
          <p>User: ${o.userName || "N/A"} (${o.userEmail || "N/A"})</p>
          <p>${items}</p>
          <p>Total: <strong>${formatPrice(o.total)}</strong></p>
          <p>Status: ${status} ${actionBtn}</p>
          ${payInfo}
        </article>
      `;
    })
    .join("");

  root.innerHTML = html;

  if (onStatusChange) {
    root.querySelectorAll("button[data-status-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.statusId;
        const next = btn.dataset.nextStatus;
        onStatusChange(id, next);
      });
    });
  }
}

export function renderMyReservations(reservations) {
  const root = document.getElementById("my-reservations-list");
  if (!root) return;
  if (!reservations.length) {
    root.innerHTML = `<p class="muted">No reservations yet.</p>`;
    return;
  }

  root.innerHTML = reservations
    .map((r) => {
      const status = r.status || "Requested";
      return `
        <article class="item-card reservation-card">
          <h4>Reservation ${r.id}</h4>
          <p><strong>Shop:</strong> ${r.catererName || "—"}</p>
          <p><strong>Event:</strong> ${r.eventType || "—"} • ${r.eventDate || "—"} ${r.eventTime ? `at ${r.eventTime}` : ""}</p>
          <p><strong>Guests:</strong> ${r.guests || "—"}</p>
          <p><strong>Status:</strong> ${status}</p>
        </article>
      `;
    })
    .join("");
}

export function renderAllReservations(reservations, onStatusChange) {
  const root = document.getElementById("all-reservations-list");
  if (!root) return;
  if (!reservations.length) {
    root.innerHTML = `<p class="muted">No reservations available.</p>`;
    return;
  }

  root.innerHTML = reservations
    .map((r) => {
      const status = r.status || "Requested";
      const approveBtn =
        status === "Requested"
          ? `<button class="btn btn-secondary btn-sm" data-resv-status="${r.id}" data-next="Approved">Approve</button>`
          : "";
      const rejectBtn =
        status === "Requested"
          ? `<button class="btn danger btn-sm" data-resv-status="${r.id}" data-next="Rejected">Reject</button>`
          : "";
      const completeBtn =
        status === "Approved"
          ? `<button class="btn btn-secondary btn-sm" data-resv-status="${r.id}" data-next="Completed">Mark Completed</button>`
          : "";
      return `
        <article class="item-card reservation-card">
          <h4>Reservation ${r.id}</h4>
          <p>User: ${r.userName || "N/A"} (${r.userEmail || "N/A"})</p>
          <p><strong>Shop:</strong> ${r.catererName || "—"}</p>
          <p><strong>Event:</strong> ${r.eventType || "—"} • ${r.eventDate || "—"} ${r.eventTime ? `at ${r.eventTime}` : ""}</p>
          <p><strong>Guests:</strong> ${r.guests || "—"}</p>
          <p><strong>Status:</strong> ${status} ${approveBtn} ${rejectBtn} ${completeBtn}</p>
        </article>
      `;
    })
    .join("");

  if (onStatusChange) {
    root.querySelectorAll("button[data-resv-status]").forEach((btn) => {
      btn.addEventListener("click", () => onStatusChange(btn.dataset.resvStatus, btn.dataset.next));
    });
  }
}

export function renderProfile(profile) {
  const root = document.getElementById("profile-card");
  if (!profile) {
    root.innerHTML = `<p class="muted">Profile unavailable.</p>`;
    return;
  }

  root.innerHTML = `
    <p><strong>Name:</strong> ${profile.name || "-"}</p>
    <p><strong>Email:</strong> ${profile.email || "-"}</p>
    <p><strong>Phone:</strong> ${profile.phone || "-"}</p>
  `;
}

export function renderCaterers(caterers, onViewMenu) {
  const root = document.getElementById("caterers-list");
  if (!root) return;
  if (!caterers.length) {
    root.innerHTML = `<p class="muted">No catering shops yet.</p>`;
    return;
  }

  root.innerHTML = caterers
    .map((c) => {
      const tags = Array.isArray(c.tags) ? c.tags.slice(0, 6) : [];
      const rating = Number(c.rating || 0);
      const minOrder = Number(c.minOrder || 0);
      return `
        <article class="item-card caterer-card">
          <div class="caterer-media">
            <img
              src="${c.image || "assets/img/placeholder-food.svg"}"
              alt="${c.name}"
              loading="lazy"
              referrerpolicy="no-referrer"
              onerror="this.onerror=null;this.src='assets/img/placeholder-food.svg';"
            />
          </div>
          <div class="caterer-body">
            <div class="caterer-top">
              <h4>${c.name}</h4>
              ${rating ? `<span class="rating-badge" title="Rating">${rating.toFixed(1)}</span>` : ""}
            </div>
            <p class="caterer-meta">
              ${c.city ? `<span>${c.city}</span>` : ""}
              ${c.phone ? `<span>• ${c.phone}</span>` : ""}
              ${minOrder ? `<span>• Min order: <strong>${formatPrice(minOrder)}</strong></span>` : ""}
            </p>
            ${tags.length ? `<div class="tag-row">${tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>` : ""}
            <div class="caterer-actions">
              <button class="btn btn-secondary btn-sm" data-view-menu="${c.id}">View Menu</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  if (onViewMenu) {
    root.querySelectorAll("button[data-view-menu]").forEach((btn) => {
      btn.addEventListener("click", () => onViewMenu(btn.dataset.viewMenu));
    });
  }
}

export function setMessage(targetId, message) {
  const el = document.getElementById(targetId);
  el.textContent = message || "";
}

let toastCounter = 0;
let toastCleanupTimer = null;

function getToastRoot() {
  return document.getElementById("toast-root");
}

function cleanupToasts(root) {
  if (!root) return;
  const children = Array.from(root.children || []);
  if (children.length <= 6) return;
  children.slice(0, children.length - 6).forEach((n) => n.remove());
}

export function showToast({ title = "", message = "", type = "info", timeoutMs = 3200 } = {}) {
  const root = getToastRoot();
  if (!root) return;

  const safeType = ["success", "error", "warning", "info"].includes(type) ? type : "info";
  const toastId = `toast-${Date.now()}-${toastCounter++}`;
  const wrap = document.createElement("div");
  wrap.className = `toast ${safeType}`;
  wrap.setAttribute("role", "status");
  wrap.dataset.toastId = toastId;

  const content = document.createElement("div");
  const h = document.createElement("p");
  h.className = "toast-title";
  h.textContent = title || (safeType === "success" ? "Success" : safeType === "error" ? "Error" : "Notice");

  const p = document.createElement("p");
  p.className = "toast-msg";
  p.textContent = String(message || "");

  content.appendChild(h);
  if (p.textContent) content.appendChild(p);

  const actions = document.createElement("div");
  actions.className = "toast-actions";
  const closeBtn = document.createElement("button");
  closeBtn.className = "toast-close";
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close notification");
  closeBtn.textContent = "×";

  actions.appendChild(closeBtn);
  wrap.appendChild(content);
  wrap.appendChild(actions);

  const removeToast = () => {
    wrap.classList.remove("show");
    window.setTimeout(() => wrap.remove(), 180);
  };

  closeBtn.addEventListener("click", removeToast);
  wrap.addEventListener("click", (e) => {
    // click anywhere on toast closes it (except selection)
    if (e.target === closeBtn) return;
    removeToast();
  });

  root.appendChild(wrap);
  cleanupToasts(root);

  // animate in
  window.requestAnimationFrame(() => wrap.classList.add("show"));

  if (toastCleanupTimer) window.clearTimeout(toastCleanupTimer);
  toastCleanupTimer = window.setTimeout(() => cleanupToasts(root), 400);

  if (timeoutMs > 0) window.setTimeout(removeToast, timeoutMs);
}

export function setSessionBox(profile) {
  const box = document.getElementById("session-box");
  const userEl = document.getElementById("session-user");
  const roleEl = document.getElementById("session-role");

  if (!profile) {
    box.classList.add("hidden");
    userEl.textContent = "";
    if (roleEl) roleEl.textContent = "";
    return;
  }

  // show user's name in the header
  userEl.textContent = profile.name || "";
  // show role as a small badge after the name
  if (roleEl) roleEl.textContent = (profile.role || "user").toUpperCase();
  box.classList.remove("hidden");
}

export function setAuthVisibility(isLoggedIn) {
  document.getElementById("auth-section").classList.toggle("hidden", isLoggedIn);
  document.getElementById("app-section").classList.toggle("hidden", !isLoggedIn);
}

export function setRoleVisibility(role) {
  const isAdmin = role === "admin";
  document.getElementById("admin-products-tab").classList.toggle("hidden", !isAdmin);
  document.getElementById("admin-orders-tab").classList.toggle("hidden", !isAdmin);
  const myOrdersTab = document.getElementById("orders-tab");
  if (myOrdersTab) myOrdersTab.classList.toggle("hidden", isAdmin);
  const myOrdersPanel = document.getElementById("orders");
  if (myOrdersPanel) myOrdersPanel.classList.toggle("hidden", isAdmin);
  const profileTab = document.querySelector('.tab[data-tab="profile"]');
  if (profileTab) profileTab.classList.toggle("hidden", isAdmin);
  const profilePanel = document.getElementById("profile");
  if (profilePanel) profilePanel.classList.toggle("hidden", isAdmin);
  const reservationsTab = document.querySelector('.tab[data-tab="reservations"]');
  if (reservationsTab) reservationsTab.classList.toggle("hidden", isAdmin);
  const reservationsPanel = document.getElementById("reservations");
  if (reservationsPanel) reservationsPanel.classList.toggle("hidden", isAdmin);
  const adminCaterersTools = document.getElementById("admin-caterers-tools");
  if (adminCaterersTools) adminCaterersTools.classList.toggle("hidden", !isAdmin);
  const adminReservationsBox = document.getElementById("admin-reservations-box");
  if (adminReservationsBox) adminReservationsBox.classList.toggle("hidden", !isAdmin);
}

export function activateTab(tabId) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabId);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });
}
