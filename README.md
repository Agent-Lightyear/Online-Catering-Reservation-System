# Online Catering Reservation System

A Firebase-based catering reservation and ordering website with role-based access (User/Admin), catering shops, products, cart ordering, reservations, and activity logging.

## Features

### User
- Register + Login (toast notifications for success/errors)
- View Catering Shops + “View Menu” shortcut
- Browse Products with search/filters
- Add to Cart + Place Order
- Create Reservations

### Admin
- Register + Login (select Role = `admin` at registration)
- Upload Product (clean form; no “Catering Shop” field)
- View All Orders

### Extras
- Local product images in `assets/img/products/` (no online product images)
- Out-of-stock support (example: **Mojito** is Out of stock)
- Toast notifications for key actions (login/register/upload)

## Run Locally

Serve the project with a local static server (don’t open via `file://`).

```bash
npx serve . -l 8000
```

Open `http://localhost:8000/index.html`.

or use Live server

## Firebase Setup

1. Create a Firebase project.
2. Enable Authentication → Email/Password.
3. Create a Firestore database.
4. Update Firebase config in `src/config/firebase.js`.
5. Add `localhost` to Authentication → Authorized domains (if required).

## Firestore Collections

- `users` (profile + role)
- `caterers` (catering shops)
- `products` (menu items, optional `inStock`)
- `orders`
- `reservations`
- `logs` (activity logs)

