# Test Cases

## Scope
Manual and integration-level tests for auth, role access, ordering, and logging.

## Test Matrix

1. Register user
- Steps: submit register form.
- Expected: account created, user doc created, `REGISTER` log exists.

2. Register admin
- Steps: register a new account with role `admin`.
- Expected: profile has role `admin`.

3. Login
- Steps: submit login with valid credentials.
- Expected: user session active, tabs visible by role, `LOGIN` log created.

4. View products
- Steps: login and open products tab.
- Expected: products list visible.

5. Add to cart
- Steps: click Add on product.
- Expected: cart item/qty increments, `ADD_TO_CART` log exists.

6. Place order
- Steps: add product, click Place Order.
- Expected: order created in Firestore, cart reset, `PLACE_ORDER` log.

7. My Orders (user)
- Steps: open My Orders tab.
- Expected: only current user orders visible, `VIEW_ORDER` log with `my_orders`.

8. Upload product (admin)
- Steps: admin submits product form.
- Expected: new product appears, `UPLOAD_PRODUCT` log.

9. View all orders (admin)
- Steps: admin opens View Orders tab.
- Expected: all orders visible, `VIEW_ORDER` log with `all_orders`.

10. Role enforcement in UI
- Steps: login as user.
- Expected: admin tabs hidden.

11. Logout
- Steps: click logout.
- Expected: auth section shown, app section hidden, state cleared.
