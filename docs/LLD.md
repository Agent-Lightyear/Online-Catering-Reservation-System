# LLD (Low Level Design)

## 1. Modules

### 1.1 Config Layer
- `src/config/firebase.js`: Firebase initialization and exports (`auth`, `db`).
- `src/config/appConfig.js`: app-level constants (currency).

### 1.2 State Layer
- `src/state/store.js`
  - Central in-memory state for session, products, cart, orders.
  - Handles subscription cleanup via `resetState()`.

### 1.3 Service Layer
- `authService.js`
  - register/login/logout/auth observer/profile fetch.
- `productService.js`
  - product subscription and product upload.
- `orderService.js`
  - place order, subscribe my orders, subscribe all orders, log view order.
- `loggingService.js`
  - centralized log write to Firestore `logs` collection.

### 1.4 UI Layer
- `ui/renderers.js`
  - all rendering and DOM update helpers.

### 1.5 App Orchestration
- `src/app.js`
  - event binding, role-based rendering, cart management, and module coordination.

## 2. Data Models

### 2.1 User (`users/{uid}`)
- `uid: string`
- `name: string`
- `phone: string`
- `email: string`
- `role: "user" | "admin"`
- `createdAt: timestamp`

### 2.2 Product (`products/{id}`)
- `name: string`
- `description: string`
- `price: number`
- `createdBy: uid`
- `createdAt: timestamp`

### 2.3 Order (`orders/{id}`)
- `userId: uid`
- `userName: string`
- `userEmail: string`
- `items: [{id, name, price, qty}]`
- `total: number`
- `status: string`
- `createdAt: timestamp`

### 2.4 Log (`logs/{id}`)
- `userId: uid | null`
- `role: string`
- `action: string`
- `details: object`
- `createdAt: timestamp`

## 3. Key Flows

### 3.1 Register
1. User submits register form.
2. `authService.registerAccount()` creates auth user and profile doc.
3. Role is selected at registration (`user` or `admin`).
4. Writes `REGISTER` log.

### 3.2 Login
1. User submits login form.
2. `authService.loginAccount()` authenticates and loads profile.
3. Writes `LOGIN` log.
4. Auth observer initializes role-based views and subscriptions.

### 3.3 Add to Cart and Place Order
1. Product add button calls `addToCart()`.
2. Cart state updates.
3. `ADD_TO_CART` log written.
4. Place order calls `orderService.placeOrder()`.
5. Order saved and `PLACE_ORDER` log written.

### 3.4 Admin Upload Product
1. Admin submits product form.
2. `productService.uploadProduct()` creates product.
3. `UPLOAD_PRODUCT` log written.

### 3.5 View Orders
1. On orders tab open, `VIEW_ORDER` is logged.
2. User sees own orders; admin can view all orders.

## 4. Error Handling
- All async actions are wrapped with `try/catch` in `app.js` event handlers.
- Message banners (`auth-msg`, `app-msg`) display user-facing errors.

## 5. Extensibility Points
- Add server-side invitation flow for admin accounts.
- Add order status transitions for admin.
- Add product categories/images.
- Add pagination for large datasets.
