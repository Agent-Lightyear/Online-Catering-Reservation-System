const storageKeys = {
  reservations: "ocrs_reservations",
  orders: "ocrs_orders"
};

const menuData = [
  { id: 1, name: "Nasi Lemak Set", desc: "Coconut rice, chicken rendang, sambal", price: 12.0 },
  { id: 2, name: "Fried Meehoon Tray", desc: "Serves 8-10 people", price: 55.0 },
  { id: 3, name: "Mini Sandwich Platter", desc: "24 assorted pieces", price: 42.0 },
  { id: 4, name: "Fruit Punch", desc: "5 liter dispenser", price: 28.0 },
  { id: 5, name: "Dessert Bites", desc: "30 mixed mini desserts", price: 48.0 }
];

let cart = [];

function formatPrice(value) {
  return `₹ ${value.toFixed(2)}`;
}

function readData(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function renderMenu() {
  const list = document.getElementById("menu-list");
  list.innerHTML = menuData
    .map(
      (item) => `
      <article class="menu-item">
        <div>
          <strong>${item.name}</strong>
          <p>${item.desc}</p>
          <p>${formatPrice(item.price)}</p>
        </div>
        <button type="button" class="btn" data-id="${item.id}">Add</button>
      </article>
    `
    )
    .join("");

  list.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      addToCart(id);
    });
  });
}

function addToCart(id) {
  const item = menuData.find((m) => m.id === id);
  if (!item) return;

  const existing = cart.find((c) => c.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  renderCart();
}

function removeFromCart(id) {
  cart = cart
    .map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item))
    .filter((item) => item.qty > 0);
  renderCart();
}

function renderCart() {
  const cartItems = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");

  if (cart.length === 0) {
    cartItems.innerHTML = `<li class="empty">No items in cart.</li>`;
    totalEl.textContent = formatPrice(0);
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item) => `
      <li>
        <span>${item.name} x ${item.qty}</span>
        <span>
          ${formatPrice(item.price * item.qty)}
          <button type="button" class="btn" data-remove="${item.id}">-</button>
        </span>
      </li>
    `
    )
    .join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  totalEl.textContent = formatPrice(total);

  cartItems.querySelectorAll("button[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => removeFromCart(Number(btn.dataset.remove)));
  });
}

function setupReservationForm() {
  const form = document.getElementById("reservation-form");
  const msg = document.getElementById("reservation-msg");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const reservation = {
      id: Date.now(),
      name: document.getElementById("name").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      email: document.getElementById("email").value.trim(),
      eventDate: document.getElementById("eventDate").value,
      eventTime: document.getElementById("eventTime").value,
      eventType: document.getElementById("eventType").value,
      guestCount: Number(document.getElementById("guestCount").value),
      venue: document.getElementById("venue").value.trim(),
      notes: document.getElementById("notes").value.trim(),
      createdAt: new Date().toISOString()
    };

    const all = readData(storageKeys.reservations);
    all.push(reservation);
    writeData(storageKeys.reservations, all);

    form.reset();
    msg.textContent = "Reservation saved successfully.";
    renderReservations();
  });
}

function setupOrderPlacement() {
  const btn = document.getElementById("place-order");
  const msg = document.getElementById("order-msg");

  btn.addEventListener("click", () => {
    if (cart.length === 0) {
      msg.textContent = "Please add at least one menu item.";
      return;
    }

    const order = {
      id: Date.now(),
      items: cart,
      total: cart.reduce((sum, item) => sum + item.price * item.qty, 0),
      createdAt: new Date().toISOString(),
      status: "Pending"
    };

    const all = readData(storageKeys.orders);
    all.push(order);
    writeData(storageKeys.orders, all);

    cart = [];
    renderCart();
    msg.textContent = "Order placed successfully.";
    renderOrders();
  });
}

function renderReservations() {
  const root = document.getElementById("reservation-list");
  const data = readData(storageKeys.reservations);

  if (data.length === 0) {
    root.innerHTML = `<p class="empty">No reservations yet.</p>`;
    return;
  }

  root.innerHTML = data
    .slice()
    .reverse()
    .map(
      (r) => `
      <article class="list-item">
        <strong>${r.name}</strong>
        <p>${r.eventType} | ${r.eventDate} ${r.eventTime}</p>
        <p>Guests: ${r.guestCount}</p>
        <p>${r.phone} | ${r.email}</p>
      </article>
    `
    )
    .join("");
}

function renderOrders() {
  const root = document.getElementById("order-list");
  const data = readData(storageKeys.orders);

  if (data.length === 0) {
    root.innerHTML = `<p class="empty">No orders yet.</p>`;
    return;
  }

  root.innerHTML = data
    .slice()
    .reverse()
    .map((o) => {
      const items = o.items.map((item) => `${item.name} x ${item.qty}`).join(", ");
      return `
      <article class="list-item">
        <strong>Order #${o.id}</strong>
        <p>${items}</p>
        <p>Total: ${formatPrice(o.total)}</p>
        <p>Status: ${o.status}</p>
      </article>
    `;
    })
    .join("");
}

function setupClearData() {
  const btn = document.getElementById("clear-data");
  btn.addEventListener("click", () => {
    localStorage.removeItem(storageKeys.reservations);
    localStorage.removeItem(storageKeys.orders);
    cart = [];
    renderCart();
    renderReservations();
    renderOrders();
  });
}

function init() {
  renderMenu();
  renderCart();
  setupReservationForm();
  setupOrderPlacement();
  setupClearData();
  renderReservations();
  renderOrders();
}

init();
