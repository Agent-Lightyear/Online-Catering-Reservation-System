export const state = {
  user: null,
  profile: null,
  role: null,
  products: [],
  caterers: [],
  cart: [],
  myOrders: [],
  allOrders: [],
  myReservations: [],
  allReservations: [],
  // used to signal which order (if any) should be highlighted when rendering
  highlightOrder: null,
  unsubscribers: [],

  // filtering/search
  searchTerm: "",
  typeFilter: "",
  catererFilter: "",
  vegFilter: "",
  priceMin: null,
  priceMax: null
};

export function resetState() {
  state.user = null;
  state.profile = null;
  state.role = null;
  state.products = [];
  state.caterers = [];
  state.cart = [];
  state.myOrders = [];
  state.allOrders = [];
  state.myReservations = [];
  state.allReservations = [];
  state.highlightOrder = null;

  // reset filters too
  state.searchTerm = "";
  state.typeFilter = "";
  state.catererFilter = "";
  state.vegFilter = "";
  state.priceMin = null;
  state.priceMax = null;

  state.unsubscribers.forEach((fn) => {
    if (typeof fn === "function") {
      fn();
    }
  });
  state.unsubscribers = [];
}
