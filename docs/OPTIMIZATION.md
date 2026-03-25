# Optimization Explanation

## Current Optimizations

1. Modular separation
- Clear split between UI rendering, services, and state reduces coupling and improves maintainability.

2. Realtime subscriptions
- Firestore `onSnapshot` updates only changed datasets, avoiding full-page reload patterns.

3. Local in-memory cart
- Cart state is maintained client-side for fast interactions and minimal writes.

4. Centralized logging service
- Single entry point for logs prevents repeated code and inconsistent payloads.

5. Subscription cleanup
- `resetState()` unsubscribes active listeners on auth changes, reducing memory leaks and duplicate listeners.

## Potential Future Optimizations

1. Add pagination/infinite scroll for products and orders.
2. Add Firestore indexes for frequent compound queries.
3. Add client-side caching layer (e.g., IndexedDB) for offline-first behavior.
4. Debounce repeated UI-triggered logs if required by policy.
5. Minify/bundle JS modules for production deployment.
