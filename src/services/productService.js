import { db } from "../config/firebase.js";
import { collection, addDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { logAction } from "./loggingService.js";

const demoProducts = [
  {
    id: "sample-1",
    name: "Classic Chicken Biryani",
    veg: false,
    type: "Rice",
    catererId: "sample-caterer-1",
    catererName: "Spice Garden Caterers",
    description: "Fragrant basmati rice layered with tender marinated chicken, aromatic spices, and caramelized onions.",
    price: 85.0,
    image: "assets/img/products/classic-chicken-biryani.jpg",
    createdAt: null
  },
  {
    id: "sample-2",
    name: "Beef Rendang",
    veg: false,
    type: "Rice",
    catererId: "sample-caterer-2",
    catererName: "Royal Feast Catering",
    description: "Slow-cooked beef in rich coconut gravy and traditional spices — an all-time favorite.",
    price: 120.0,
    image: "assets/img/products/beef-rendang.jpg",
    createdAt: null
  },
  {
    id: "sample-3",
    name: "Paneer Butter Masala",
    veg: true,
    type: "Vegetarian",
    catererId: "sample-caterer-2",
    catererName: "Royal Feast Catering",
    description: "Creamy tomato gravy with soft paneer cubes, finished with butter and kasuri methi.",
    price: 140.0,
    image: "assets/img/products/paneer-butter-masala.jpg",
    createdAt: null
  },
  {
    id: "sample-4",
    name: "Masala Dosa Platter",
    veg: true,
    type: "Vegetarian",
    catererId: "sample-caterer-3",
    catererName: "Green Leaf Veg Caterers",
    description: "Crispy dosa with potato masala, served with chutneys and sambar.",
    price: 90.0,
    image: "assets/img/products/masala-dosa-platter.jpg",
    createdAt: null
  },
  {
    id: "sample-5",
    name: "Veg Hakka Noodles",
    veg: true,
    type: "Noodles",
    catererId: "sample-caterer-1",
    catererName: "Spice Garden Caterers",
    description: "Smoky wok-tossed noodles with crunchy veggies and signature sauces.",
    price: 110.0,
    image: "assets/img/products/veg-hakka-noodles.jpg",
    createdAt: null
  },
  {
    id: "sample-6",
    name: "Tandoori Chicken Platter",
    veg: false,
    type: "Rice",
    catererId: "sample-caterer-2",
    catererName: "Royal Feast Catering",
    description: "Juicy tandoori chicken served with salad, mint chutney, and naan wedges.",
    price: 220.0,
    image: "assets/img/products/tandoori-chicken-platter.jpeg",
    createdAt: null
  },
  {
    id: "sample-7",
    name: "Butter Chicken",
    veg: false,
    type: "Rice",
    catererId: "sample-caterer-1",
    catererName: "Spice Garden Caterers",
    description: "Tandoor-roasted chicken simmered in a buttery tomato gravy with cream.",
    price: 210.0,
    image: "assets/img/products/butter-chicken.jpg",
    createdAt: null
  },
  {
    id: "sample-8",
    name: "Veg Pulao",
    veg: true,
    type: "Rice",
    catererId: "sample-caterer-3",
    catererName: "Green Leaf Veg Caterers",
    description: "Aromatic rice cooked with seasonal vegetables, whole spices, and herbs.",
    price: 75.0,
    image: "assets/img/products/veg-pulao.jpg",
    createdAt: null
  },
  {
    id: "sample-9",
    name: "Jeera Rice",
    veg: true,
    type: "Rice",
    catererId: "sample-caterer-2",
    catererName: "Royal Feast Catering",
    description: "Fluffy basmati rice tempered with cumin and ghee.",
    price: 55.0,
    image: "assets/img/products/jeera-rice.jpg",
    createdAt: null
  },
  {
    id: "sample-10",
    name: "Vegetable Fried Rice",
    veg: true,
    type: "Rice",
    catererId: "sample-caterer-3",
    catererName: "Green Leaf Veg Caterers",
    description: "Wok-fried rice with mixed vegetables, soy sauce, and sesame.",
    price: 105.0,
    image: "assets/img/products/vegetable-fried-rice.jpg",
    createdAt: null
  },
  {
    id: "sample-11",
    name: "Margherita Pasta Bake",
    veg: true,
    type: "Pasta",
    catererId: "sample-caterer-2",
    catererName: "Royal Feast Catering",
    description: "Cheesy baked pasta with basil, tomato sauce, and a golden crust.",
    price: 175.0,
    image: "assets/img/products/margherita-pasta-bake.jpg",
    createdAt: null
  },
  {
    id: "sample-12",
    name: "Pasta Alfredo",
    veg: true,
    type: "Pasta",
    catererId: "sample-caterer-2",
    catererName: "Royal Feast Catering",
    description: "Creamy Alfredo sauce with herbs, parmesan, and perfectly cooked pasta.",
    price: 160.0,
    image: "assets/img/products/pasta-alfredo.jpg",
    createdAt: null
  },
  {
    id: "sample-13",
    name: "Pesto Penne Veg",
    veg: true,
    type: "Pasta",
    catererId: "sample-caterer-3",
    catererName: "Green Leaf Veg Caterers",
    description: "Penne tossed in basil pesto with cherry tomatoes and olives.",
    price: 165.0,
    image: "assets/img/products/pesto-penne-veg.png",
    createdAt: null
  },
  {
    id: "sample-14",
    name: "Schezwan Noodles",
    veg: true,
    type: "Noodles",
    catererId: "sample-caterer-1",
    catererName: "Spice Garden Caterers",
    description: "Spicy schezwan noodles with bell peppers, spring onions, and garlic.",
    price: 125.0,
    image: "assets/img/products/schezwan-noodles.jpeg",
    createdAt: null
  },
  {
    id: "sample-15",
    name: "Chicken Chow Mein",
    veg: false,
    type: "Noodles",
    catererId: "sample-caterer-2",
    catererName: "Royal Feast Catering",
    description: "Classic chow mein with chicken strips, veggies, and soy-garlic glaze.",
    price: 155.0,
    image: "assets/img/products/chicken-chow-mein.jpg",
    createdAt: null
  },
  {
    id: "sample-16",
    name: "Samosa (2 pcs)",
    veg: true,
    type: "Vegetarian",
    catererId: "sample-caterer-1",
    catererName: "Spice Garden Caterers",
    description: "Crispy pastry stuffed with spiced potato and peas, served with chutney.",
    price: 35.0,
    image: "assets/img/products/samosa-2pcs.jpg",
    createdAt: null
  },
  {
    id: "sample-17",
    name: "Hummus & Pita",
    veg: true,
    type: "Vegetarian",
    catererId: "sample-caterer-2",
    catererName: "Royal Feast Catering",
    description: "Creamy hummus served with warm pita wedges and olive oil drizzle.",
    price: 120.0,
    image: "assets/img/products/hummus-pita.jpg",
    createdAt: null
  },
  {
    id: "sample-18",
    name: "Veggie Salad Bowl",
    veg: true,
    type: "Vegetarian",
    catererId: "sample-caterer-3",
    catererName: "Green Leaf Veg Caterers",
    description: "Fresh greens with corn, cucumber, beans, and a light lemon dressing.",
    price: 95.0,
    image: "assets/img/products/veggie-salad-bowl.jpg",
    createdAt: null
  },
  {
    id: "sample-19",
    name: "Gulab Jamun (2 pcs)",
    veg: true,
    type: "Dessert",
    catererId: "sample-caterer-3",
    catererName: "Green Leaf Veg Caterers",
    description: "Soft milk-solid dumplings soaked in warm cardamom sugar syrup.",
    price: 60.0,
    image: "assets/img/products/gulab-jamun-2pcs.jpg",
    createdAt: null
  },
  {
    id: "sample-20",
    name: "Rasgulla (2 pcs)",
    veg: true,
    type: "Dessert",
    catererId: "sample-caterer-1",
    catererName: "Spice Garden Caterers",
    description: "Spongy cottage-cheese balls soaked in chilled sugar syrup.",
    price: 65.0,
    image: "assets/img/products/rasgulla-2pcs.jpg",
    createdAt: null
  },
  {
    id: "sample-21",
    name: "Chocolate Brownie",
    veg: true,
    type: "Dessert",
    catererId: "sample-caterer-1",
    catererName: "Spice Garden Caterers",
    description: "Rich chocolate brownie with a crisp top and soft fudgy center.",
    price: 95.0,
    image: "assets/img/products/chocolate-brownie.jpg",
    createdAt: null
  },
  {
    id: "sample-22",
    name: "Vanilla Ice Cream Cup",
    veg: true,
    type: "Dessert",
    catererId: "sample-caterer-2",
    catererName: "Royal Feast Catering",
    description: "Classic vanilla ice cream cup with a smooth creamy texture.",
    price: 55.0,
    image: "assets/img/products/vanilla-ice-cream-cup.jpg",
    createdAt: null
  },
  {
    id: "sample-23",
    name: "Fresh Lime Soda",
    veg: true,
    type: "Drinks",
    catererId: "sample-caterer-1",
    catererName: "Spice Garden Caterers",
    description: "Chilled lime soda with mint and a hint of black salt.",
    price: 45.0,
    image: "assets/img/products/fresh-lime-soda.jpg",
    inStock: true,
    createdAt: null
  },
  {
    id: "sample-23b",
    name: "Mojito",
    veg: true,
    type: "Drinks",
    catererId: "sample-caterer-1",
    catererName: "Spice Garden Caterers",
    description: "Refreshing mint mojito served chilled with lime and soda.",
    price: 65.0,
    image: "assets/img/products/mojito.jpg",
    inStock: false,
    createdAt: null
  },
  {
    id: "sample-24",
    name: "Mango Lassi",
    veg: true,
    type: "Drinks",
    catererId: "sample-caterer-3",
    catererName: "Green Leaf Veg Caterers",
    description: "Thick yogurt-based mango drink, perfectly sweet and refreshing.",
    price: 70.0,
    image: "assets/img/products/mango-lassi.jpg",
    inStock: true,
    createdAt: null
  },
  {
    id: "sample-25",
    name: "Masala Chai",
    veg: true,
    type: "Drinks",
    catererId: "sample-caterer-2",
    catererName: "Royal Feast Catering",
    description: "Hot masala chai brewed with ginger and cardamom.",
    price: 30.0,
    image: "assets/img/products/masala-chai.jpg",
    inStock: true,
    createdAt: null
  }
];

function keyOf(p) {
  const norm = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replaceAll(/\s+/g, " ");
  const catererKey = norm(p.catererId) || norm(p.catererName);
  const vegKey = typeof p.veg === "boolean" ? (p.veg ? "veg" : "nonveg") : "";
  const price = Number(p.price || 0);
  const priceKey = String(Math.round(price * 100) / 100);
  return [
    norm(p.name),
    norm(p.type),
    catererKey,
    vegKey,
    priceKey
  ].join("|");
}

function dedupeProducts(products) {
  const seen = new Set();
  const out = [];
  for (const p of products) {
    const key = keyOf(p);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

function dedupeByName(products, namesToUniq) {
  const targets = new Set(
    (namesToUniq || []).map((n) =>
      String(n || "")
        .trim()
        .toLowerCase()
        .replaceAll(/\s+/g, " ")
    )
  );
  if (!targets.size) return products;

  const seen = new Set();
  const out = [];
  for (const p of products) {
    const nameKey = String(p?.name || "")
      .trim()
      .toLowerCase()
      .replaceAll(/\s+/g, " ");
    if (targets.has(nameKey)) {
      if (seen.has(nameKey)) continue;
      seen.add(nameKey);
    }
    out.push(p);
  }
  return out;
}

export function subscribeProducts(callback) {
  return onSnapshot(collection(db, "products"), (snapshot) => {
    let rows = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

    if (!rows.length) {
      callback(demoProducts);
      return;
    }

    rows.sort((a, b) => {
      const aMs = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
      const bMs = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
      return bMs - aMs;
    });

    rows = dedupeProducts(rows);

    // If Firestore has fewer than 25 items, append demo items so the UI always shows a full menu.
    if (rows.length < 25) {
      const demo = demoProducts.map((p) => ({ ...p, id: `demo-${p.id}` }));
      rows = dedupeProducts(rows.concat(demo));
    }

    // Some projects end up with duplicate seeded classics; keep only one of each by name (latest wins due to sort).
    rows = dedupeByName(rows, ["Classic Chicken Biryani", "Beef Rendang"]);

    callback(rows);
  });
}

export async function uploadProduct({
  name,
  type,
  veg = false,
  catererId = "",
  catererName = "",
  description,
  price,
  image = "",
  inStock = true,
  actor
}) {
  await addDoc(collection(db, "products"), {
    name,
    type: type || "",
    veg: !!veg,
    catererId: catererId || "",
    catererName: catererName || "",
    description,
    price,
    image: image || "",
    inStock: inStock !== false,
    createdBy: actor.uid,
    createdAt: serverTimestamp()
  });

  await logAction({
    userId: actor.uid,
    role: actor.role,
    action: "UPLOAD_PRODUCT",
    details: { name, price, type, veg: !!veg, catererId: catererId || "", catererName: catererName || "" }
  });
}
