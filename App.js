import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

const API_BASE_URL = "http://localhost:4000/api";
const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "YOUR_GOOGLE_WEB_CLIENT_ID";
const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
  "YOUR_GOOGLE_ANDROID_CLIENT_ID";
const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "YOUR_GOOGLE_IOS_CLIENT_ID";
const GOOGLE_CLIENT_IDS_READY =
  !GOOGLE_WEB_CLIENT_ID.startsWith("YOUR_") ||
  !GOOGLE_ANDROID_CLIENT_ID.startsWith("YOUR_") ||
  !GOOGLE_IOS_CLIENT_ID.startsWith("YOUR_");


const approvedVendors = [
  {
    id: "shop-1",
    name: "Maya Fresh Mart",
    category: "Groceries",
    distanceKm: 0.8,
    eta: "8 min",
    rating: 4.8,
    address: "18 Lake Road, Indiranagar",
    accent: "#00A86B"
  },
  {
    id: "shop-2",
    name: "Daily Basket",
    category: "Fruits",
    distanceKm: 1.1,
    eta: "11 min",
    rating: 4.7,
    address: "7 Market Street, Domlur",
    accent: "#FF7A1A"
  },
  {
    id: "shop-3",
    name: "Urban Bloom",
    category: "Flowers",
    distanceKm: 1.4,
    eta: "13 min",
    rating: 4.6,
    address: "42 Temple Lane, HAL",
    accent: "#7C4DFF"
  }
];

const categories = [
  { id: "all", label: "All", icon: "grid-outline", color: "#1F2937" },
  { id: "grocery", label: "Grocery", icon: "basket-outline", color: "#00A86B" },
  { id: "fruits", label: "Fruits", icon: "nutrition-outline", color: "#FF7A1A" },
  { id: "snacks", label: "Snacks", icon: "fast-food-outline", color: "#E11D48" },
  { id: "drinks", label: "Drinks", icon: "cafe-outline", color: "#2563EB" },
  { id: "daily", label: "Daily", icon: "home-outline", color: "#7C4DFF" }
];

const products = [
  {
    id: "p1",
    name: "Farm Fresh Bananas",
    category: "fruits",
    shop: "Daily Basket",
    price: 48,
    mrp: 60,
    eta: "9 min",
    unit: "6 pcs",
    badge: "20% off",
    color: "#FFE8B5",
    icon: "nutrition"
  },
  {
    id: "p2",
    name: "Amul Butter",
    category: "daily",
    shop: "Maya Fresh Mart",
    price: 58,
    mrp: 64,
    eta: "8 min",
    unit: "100 g",
    badge: "Fast",
    color: "#DDF7E8",
    icon: "cube"
  },
  {
    id: "p3",
    name: "Classic Salted Chips",
    category: "snacks",
    shop: "Maya Fresh Mart",
    price: 35,
    mrp: 40,
    eta: "10 min",
    unit: "52 g",
    badge: "Deal",
    color: "#FFE2E8",
    icon: "fast-food"
  },
  {
    id: "p4",
    name: "Cold Coffee",
    category: "drinks",
    shop: "Daily Basket",
    price: 95,
    mrp: 110,
    eta: "12 min",
    unit: "250 ml",
    badge: "Chilled",
    color: "#DCEBFF",
    icon: "cafe"
  },
  {
    id: "p5",
    name: "Brown Bread",
    category: "grocery",
    shop: "Maya Fresh Mart",
    price: 45,
    mrp: 50,
    eta: "8 min",
    unit: "400 g",
    badge: "Fresh",
    color: "#FFF2D7",
    icon: "restaurant"
  },
  {
    id: "p6",
    name: "Rose Bouquet",
    category: "daily",
    shop: "Urban Bloom",
    price: 299,
    mrp: 349,
    eta: "13 min",
    unit: "1 pack",
    badge: "Gift",
    color: "#F4E6FF",
    icon: "rose"
  }
];

const pendingVendorsSeed = [
  {
    id: "vendor-101",
    ownerName: "Aarav Mehta",
    phone: "+91 98765 43210",
    shopName: "Aarav Dairy",
    address: "12 Palm Grove, Koramangala, Bengaluru"
  },
  {
    id: "vendor-102",
    ownerName: "Neha Rao",
    phone: "+91 99887 76655",
    shopName: "Neha Home Bakes",
    address: "55 Silver Street, HSR Layout, Bengaluru"
  }
];

export default function App() {
  const [screen, setScreen] = useState("start");
  const [pendingVendors, setPendingVendors] = useState(pendingVendorsSeed);
  const [cart, setCart] = useState({});
  const [favorites, setFavorites] = useState({});
  const [session, setSession] = useState(null);
  const [googleRole, setGoogleRole] = useState(null);
  const [authNotice, setAuthNotice] = useState("");
  const [authForm, setAuthForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: ""
  });
  const [vendorForm, setVendorForm] = useState({
    ownerName: "",
    phone: "",
    shopName: "",
    address: ""
  });
  const [googleRequest, googleResponse, promptGoogle] = Google.useAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ["openid", "profile", "email"],
    selectAccount: true
  });

  const sortedVendors = useMemo(
    () => [...approvedVendors].sort((a, b) => a.distanceKm - b.distanceKm),
    []
  );

  const cartItems = Object.entries(cart).reduce((total, [, quantity]) => {
    return total + quantity;
  }, 0);

  const cartTotal = products.reduce((total, product) => {
    return total + (cart[product.id] || 0) * product.price;
  }, 0);

  useEffect(() => {
    if (googleResponse?.type !== "success" || !googleRole) {
      return;
    }

    const accessToken = googleResponse.authentication?.accessToken;

    if (!accessToken) {
      setAuthNotice("Google did not return a login token. Please try again.");
      return;
    }

    completeGoogleLogin(googleRole, accessToken);
  }, [googleResponse, googleRole]);

  function updateQuantity(productId, change) {
    setCart((current) => {
      const nextQuantity = Math.max(0, (current[productId] || 0) + change);
      const next = { ...current };
      if (nextQuantity === 0) {
        delete next[productId];
      } else {
        next[productId] = nextQuantity;
      }
      return next;
    });
  }

  function toggleFavorite(productId) {
    setFavorites((current) => ({ ...current, [productId]: !current[productId] }));
  }

  async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
  }

  function normalizeVendorRequest(vendor) {
    return {
      id: vendor._id || vendor.id,
      ownerName: vendor.ownerName,
      phone: vendor.phone,
      shopName: vendor.shopName,
      address: vendor.fullAddress || vendor.address,
      email: vendor.email,
      submittedAt: vendor.submittedAt || "Just now"
    };
  }

  async function loginToBackend(role, values) {
    try {
      const data = await fetch(`${API_BASE_URL}/auth/demo-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, role })
      });

      if (!data.ok) {
        throw new Error("Login failed");
      }

      const payload = await data.json();
      return { ...payload.user, token: payload.token };
    } catch (error) {
      return {
        role,
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        token: null
      };
    }
  }

  async function loginWithGoogle(role, accessToken) {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, role })
    });

    if (!response.ok) {
      throw new Error("Google backend login failed");
    }

    const payload = await response.json();
    return { ...payload.user, token: payload.token };
  }

  async function fallbackGoogleSession(role, accessToken) {
    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!profileResponse.ok) {
      throw new Error("Unable to read Google profile");
    }

    const profile = await profileResponse.json();
    return {
      role,
      name: profile.name || "Google User",
      phone: "",
      email: profile.email || "",
      token: null
    };
  }

  async function completeGoogleLogin(role, accessToken) {
    try {
      setAuthNotice("Signing in with Google...");
      let nextSession;

      try {
        nextSession = await loginWithGoogle(role, accessToken);
      } catch (error) {
        nextSession = await fallbackGoogleSession(role, accessToken);
      }

      setSession(nextSession);
      setAuthNotice("");
      setGoogleRole(null);

      if (role === "vendor") {
        setVendorForm((current) => ({
          ...current,
          ownerName: nextSession.name,
          phone: nextSession.phone || current.phone
        }));
        setScreen("vendorSignup");
      } else if (role === "admin") {
        if (nextSession.token) {
          await loadAdminVendors(nextSession.token);
        }
        setScreen("admin");
      } else {
        setScreen("customerFeed");
      }
    } catch (error) {
      setAuthNotice("Google login failed. Check OAuth setup and try again.");
      setGoogleRole(null);
    }
  }

  async function startGoogleLogin(role) {
    if (!GOOGLE_CLIENT_IDS_READY) {
      setAuthNotice("Add your Google OAuth client IDs first, then restart Expo.");
      return;
    }

    setAuthNotice("");
    setGoogleRole(role);
    await promptGoogle();
  }

  async function loadAdminVendors(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/vendors/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("Unable to load admin vendors");
      }

      const data = await response.json();
      setPendingVendors(data.vendors.map(normalizeVendorRequest));
    } catch (error) {
      setPendingVendors((vendors) => vendors);
    }
  }

  async function submitVendor() {
    const request = {
      id: `vendor-${Date.now()}`,
      ownerName: vendorForm.ownerName.trim(),
      phone: vendorForm.phone.trim(),
      shopName: vendorForm.shopName.trim(),
      address: vendorForm.address.trim(),
      email: session?.email || "vendor@example.com",
      submittedAt: "Just now"
    };

    try {
      const data = await apiRequest("/vendor-applications", {
        method: "POST",
        body: JSON.stringify({
          ownerName: request.ownerName,
          phone: request.phone,
          shopName: request.shopName,
          fullAddress: request.address
        })
      });
      setPendingVendors((vendors) => [
        normalizeVendorRequest(data.vendor),
        ...vendors
      ]);
    } catch (error) {
      setPendingVendors((vendors) => [request, ...vendors]);
    }

    setScreen("vendorPending");
  }

  async function approveVendor(vendorId) {
    try {
      await apiRequest(`/admin/vendors/${vendorId}/approve`, {
        method: "PATCH"
      });
    } catch (error) {
      // Keep the prototype responsive even when the backend is offline.
    }

    setPendingVendors((vendors) =>
      vendors.filter((vendor) => vendor.id !== vendorId)
    );
  }

  function logout() {
    setSession(null);
    setCart({});
    setFavorites({});
    setScreen("start");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        {screen === "start" && <StartScreen onRoute={setScreen} />}
        {screen === "vendorAuth" && (
          <RoleAuth
            form={authForm}
            role="vendor"
            title="Vendor access"
            subtitle="Create your vendor profile first, then submit shop details for approval."
            buttonLabel="Continue to vendor form"
            onBack={() => setScreen("start")}
            onChange={setAuthForm}
            onGoogleLogin={() => startGoogleLogin("vendor")}
            authNotice={authNotice}
            googleReady={GOOGLE_CLIENT_IDS_READY && !!googleRequest}
            onSubmit={async (values) => {
              const nextSession = await loginToBackend("vendor", values);
              setSession(nextSession);
              setVendorForm((current) => ({
                ...current,
                ownerName: nextSession.name,
                phone: nextSession.phone
              }));
              setScreen("vendorSignup");
            }}
          />
        )}
        {screen === "userAuth" && (
          <RoleAuth
            form={authForm}
            role="user"
            title="User login"
            subtitle="Enter your details to unlock nearby shops, instant search, and cart actions."
            buttonLabel="Start shopping"
            onBack={() => setScreen("start")}
            onChange={setAuthForm}
            onGoogleLogin={() => startGoogleLogin("customer")}
            authNotice={authNotice}
            googleReady={GOOGLE_CLIENT_IDS_READY && !!googleRequest}
            onSubmit={async (values) => {
              const nextSession = await loginToBackend("customer", values);
              setSession(nextSession);
              setScreen("customerFeed");
            }}
          />
        )}
        {screen === "adminAuth" && (
          <RoleAuth
            form={authForm}
            role="admin"
            title="Admin access"
            subtitle="Secure team-only entry for vendor approval and marketplace controls."
            buttonLabel="Open admin dashboard"
            onBack={() => setScreen("start")}
            onChange={setAuthForm}
            onGoogleLogin={() => startGoogleLogin("admin")}
            authNotice={authNotice}
            googleReady={GOOGLE_CLIENT_IDS_READY && !!googleRequest}
            onSubmit={async (values) => {
              const nextSession = await loginToBackend("admin", values);
              setSession(nextSession);
              if (nextSession.token) {
                await loadAdminVendors(nextSession.token);
              }
              setScreen("admin");
            }}
          />
        )}
        {screen === "vendorSignup" && (
          <VendorSignup
            form={vendorForm}
            onBack={() => setScreen("start")}
            onChange={setVendorForm}
            onLogout={logout}
            onSubmit={submitVendor}
          />
        )}
        {screen === "vendorPending" && (
          <VendorPending onBack={() => setScreen("start")} onLogout={logout} />
        )}
        {screen === "customerFeed" && (
          <CustomerFeed
            cart={cart}
            cartItems={cartItems}
            cartTotal={cartTotal}
            favorites={favorites}
            onNavigate={setScreen}
            onQuantity={updateQuantity}
            onToggleFavorite={toggleFavorite}
            onLogout={logout}
            session={session}
            vendors={sortedVendors}
          />
        )}
        {screen === "admin" && (
          <AdminPanel
            onApprove={approveVendor}
            onBack={() => setScreen("start")}
            onLogout={logout}
            pendingVendors={pendingVendors}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CustomerFeed({
  cart,
  cartItems,
  cartTotal,
  favorites,
  onNavigate,
  onLogout,
  onQuantity,
  onToggleFavorite,
  session,
  vendors
}) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "all" || product.category === activeCategory;
    const searchText = `${product.name} ${product.shop}`.toLowerCase();
    return matchesCategory && searchText.includes(search.toLowerCase());
  });

  return (
    <>
      <View style={styles.topBar}>
        <View style={styles.locationWrap}>
          <View style={styles.locationIcon}>
            <Ionicons name="flash" size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.deliveryText}>Delivering in 10 minutes</Text>
            <Text style={styles.addressText}>
              {session?.name ? `Hi ${session.name}, ` : ""}Indiranagar, Bengaluru
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          activeOpacity={0.75}
          onPress={onLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchShell}>
        <Ionicons name="search" size={20} color="#667085" />
        <TextInput
          placeholder="Search milk, fruits, chips, flowers..."
          placeholderTextColor="#8A94A6"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={20} color="#8A94A6" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.hero}>
        <View style={styles.heroTextArea}>
          <Text style={styles.heroLabel}>Street picks today</Text>
          <Text style={styles.heroScore}>Fresh finds before the kettle boils.</Text>
          <Text style={styles.heroCopy}>
            Curated from verified stores around you, packed for the everyday rush.
          </Text>
          <TouchableOpacity
            activeOpacity={0.82}
            style={styles.heroButton}
            onPress={() => onQuantity("p2", 1)}
          >
            <Text style={styles.heroButtonText}>Add butter</Text>
            <Ionicons name="add" size={18} color="#111827" />
          </TouchableOpacity>
        </View>
        <View style={styles.heroBasket}>
          <Ionicons name="basket" size={54} color="#111827" />
          <Text style={styles.heroBasketText}>10 min</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroller}
      >
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              activeOpacity={0.78}
              onPress={() => setActiveCategory(category.id)}
              style={[
                styles.categoryChip,
                isActive && { backgroundColor: category.color }
              ]}
            >
              <Ionicons
                name={category.icon}
                size={18}
                color={isActive ? "#FFFFFF" : category.color}
              />
              <Text
                style={[
                  styles.categoryText,
                  isActive && styles.categoryTextActive
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.offerRow}>
        <OfferCard
          icon="pricetag"
          label="Local saver"
          text="Great prices from stores around your lane"
        />
        <OfferCard
          icon="shield-checkmark"
          label="Verified only"
          text="Pending shops never appear for users"
        />
      </View>

      <View style={styles.promiseBand}>
        <View style={styles.promiseItem}>
          <Ionicons name="timer-outline" size={18} color="#00A86B" />
          <Text style={styles.promiseText}>Fast ETA</Text>
        </View>
        <View style={styles.promiseDivider} />
        <View style={styles.promiseItem}>
          <Ionicons name="bag-check-outline" size={18} color="#00A86B" />
          <Text style={styles.promiseText}>Fresh stock</Text>
        </View>
        <View style={styles.promiseDivider} />
        <View style={styles.promiseItem}>
          <Ionicons name="shield-outline" size={18} color="#00A86B" />
          <Text style={styles.promiseText}>Admin checked</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>People nearby are buying</Text>
        <Text style={styles.sectionAction}>{filteredProducts.length} items</Text>
      </View>

      <View style={styles.productGrid}>
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            favorite={favorites[product.id]}
            product={product}
            quantity={cart[product.id] || 0}
            onQuantity={onQuantity}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Trusted stores near you</Text>
        <Text style={styles.sectionAction}>Sorted by ETA</Text>
      </View>
      {vendors.map((vendor) => (
        <VendorCard key={vendor.id} vendor={vendor} />
      ))}

      <View style={styles.managerStrip}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.managerButton}
          onPress={() => onNavigate("vendorSignup")}
        >
          <Ionicons name="storefront-outline" size={19} color="#111827" />
          <Text style={styles.managerButtonText}>Become a vendor</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.managerButton}
          onPress={() => onNavigate("admin")}
        >
          <Ionicons name="shield-checkmark-outline" size={19} color="#111827" />
          <Text style={styles.managerButtonText}>Admin</Text>
        </TouchableOpacity>
      </View>

      {cartItems > 0 ? (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartTitle}>{cartItems} items in cart</Text>
            <Text style={styles.cartMeta}>Total Rs. {cartTotal}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.82} style={styles.checkoutButton}>
            <Text style={styles.checkoutText}>View cart</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );
}

function ProductCard({
  favorite,
  product,
  quantity,
  onQuantity,
  onToggleFavorite
}) {
  return (
    <View style={styles.productCard}>
      <View style={[styles.productImage, { backgroundColor: product.color }]}>
        <Text style={styles.productBadge}>{product.badge}</Text>
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.favoriteButton}
          onPress={() => onToggleFavorite(product.id)}
        >
          <Ionicons
            name={favorite ? "heart" : "heart-outline"}
            size={18}
            color={favorite ? "#E11D48" : "#111827"}
          />
        </TouchableOpacity>
        <Ionicons name={product.icon} size={46} color="#111827" />
      </View>
      <Text numberOfLines={2} style={styles.productName}>
        {product.name}
      </Text>
      <Text style={styles.productUnit}>{product.unit} - {product.eta}</Text>
      <Text style={styles.productShop}>{product.shop}</Text>
      <View style={styles.priceRow}>
        <View>
          <Text style={styles.priceText}>Rs. {product.price}</Text>
          <Text style={styles.mrpText}>Rs. {product.mrp}</Text>
        </View>
        {quantity === 0 ? (
          <TouchableOpacity
            activeOpacity={0.78}
            style={styles.addButton}
            onPress={() => onQuantity(product.id, 1)}
          >
            <Text style={styles.addButtonText}>ADD</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.stepper}>
            <TouchableOpacity onPress={() => onQuantity(product.id, -1)}>
              <Ionicons name="remove" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.stepperText}>{quantity}</Text>
            <TouchableOpacity onPress={() => onQuantity(product.id, 1)}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

function OfferCard({ icon, label, text }) {
  return (
    <View style={styles.offerCard}>
      <Ionicons name={icon} size={22} color="#111827" />
      <Text style={styles.offerLabel}>{label}</Text>
      <Text style={styles.offerText}>{text}</Text>
    </View>
  );
}

function VendorCard({ vendor }) {
  return (
    <View style={styles.shopCard}>
      <View style={[styles.shopIcon, { backgroundColor: vendor.accent }]}>
        <Ionicons name="storefront" size={23} color="#FFFFFF" />
      </View>
      <View style={styles.shopBody}>
        <Text style={styles.shopName}>{vendor.name}</Text>
        <Text style={styles.shopAddress}>{vendor.address}</Text>
        <View style={styles.shopMeta}>
          <Text style={styles.metaPill}>{vendor.eta}</Text>
          <Text style={styles.metaPill}>{vendor.distanceKm} km</Text>
          <Text style={styles.metaPill}>{vendor.rating} rating</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#98A2B3" />
    </View>
  );
}

function StartScreen({ onRoute }) {
  return (
    <>
      <View style={styles.startTopBar}>
        <View>
          <Text style={styles.eyebrow}>Hyperlocal commerce</Text>
          <View style={styles.brandRow}>
            <Text style={styles.brandTitle}>Street </Text>
            <Text style={styles.brandTitleAccent}>Connect</Text>
          </View>
        </View>
        <View style={styles.logoMark}>
          <Ionicons name="flash" size={24} color="#111827" />
        </View>
      </View>

      <View style={styles.startHero}>
        <View style={styles.heroTextArea}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live marketplace preview</Text>
          </View>
          <Text style={styles.startHeroTitle}>Your street, delivered smarter.</Text>
          <Text style={styles.heroCopy}>
            Shop trusted local vendors, bring real stores online, and keep every
            approval under control.
          </Text>
          <View style={styles.startStats}>
            <MiniStat value="10m" label="Delivery" />
            <MiniStat value="3" label="Roles" />
            <MiniStat value="24/7" label="Control" />
          </View>
        </View>
        <View style={styles.heroStoreStack}>
          <View style={styles.storeBubbleTop}>
            <Ionicons name="basket" size={30} color="#111827" />
          </View>
          <View style={styles.storeBubbleBottom}>
            <Ionicons name="storefront" size={28} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <View style={styles.storyStrip}>
        <View style={styles.storyIcon}>
          <Ionicons name="sparkles" size={18} color="#111827" />
        </View>
        <Text style={styles.storyText}>
          Built for Indian streets: fast carts, verified shops, and admin-first safety.
        </Text>
      </View>

      <Text style={styles.chooseTitle}>Choose your doorway</Text>
      <RoleButton
        color="#FF7A1A"
        icon="business-outline"
        label="Vendor"
        meta="Approval required"
        onPress={() => onRoute("vendorAuth")}
        preview="Apply with shop details and track approval before your store goes live."
        text="Start selling"
      />
      <RoleButton
        color="#00A86B"
        icon="person-outline"
        label="User"
        meta="Quick commerce"
        onPress={() => onRoute("userAuth")}
        preview="Discover nearby approved shops, add essentials, and checkout quickly."
        text="Shop in minutes"
      />
      <RoleButton
        color="#7C4DFF"
        icon="shield-checkmark-outline"
        label="Admin"
        meta="Secure dashboard"
        onPress={() => onRoute("adminAuth")}
        preview="Review vendors, protect customers, and keep marketplace quality high."
        text="Manage app"
      />
    </>
  );
}

function MiniStat({ label, value }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

function RoleAuth({
  authNotice,
  buttonLabel,
  form,
  googleReady,
  onBack,
  onChange,
  onGoogleLogin,
  onSubmit,
  role,
  subtitle,
  title
}) {
  const isReady = form.name && form.phone && form.email && form.password;
  const accent =
    role === "vendor" ? "#FF7A1A" : role === "admin" ? "#7C4DFF" : "#00A86B";
  const icon =
    role === "vendor"
      ? "business"
      : role === "admin"
        ? "shield-checkmark"
        : "person";

  function submit() {
    onSubmit({
      role,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      password: form.password
    });
    onChange({ name: "", phone: "", email: "", password: "" });
  }

  return (
    <>
      <ScreenHeader title={title} onBack={onBack} />
      <View style={[styles.authHero, { borderTopColor: accent }]}>
        <View style={[styles.authIcon, { backgroundColor: accent }]}>
          <Ionicons name={icon} size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.authTitle}>{title}</Text>
        <Text style={styles.authCopy}>{subtitle}</Text>
      </View>
      <View style={styles.panel}>
        <TouchableOpacity
          activeOpacity={0.82}
          disabled={!googleReady}
          onPress={onGoogleLogin}
          style={[styles.googleButton, !googleReady && styles.googleButtonDisabled]}
        >
          <View style={styles.googleLogo}>
            <Text style={styles.googleLogoText}>G</Text>
          </View>
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>
        {authNotice ? <Text style={styles.authNotice}>{authNotice}</Text> : null}
        <View style={styles.authDivider}>
          <View style={styles.authDividerLine} />
          <Text style={styles.authDividerText}>or use details</Text>
          <View style={styles.authDividerLine} />
        </View>
        <FormInput
          label="Full name"
          value={form.name}
          onChangeText={(value) => onChange({ ...form, name: value })}
        />
        <FormInput
          label="Phone"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(value) => onChange({ ...form, phone: value })}
        />
        <FormInput
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email"
          value={form.email}
          onChangeText={(value) => onChange({ ...form, email: value })}
        />
        <FormInput
          label="Password"
          secureTextEntry
          value={form.password}
          onChangeText={(value) => onChange({ ...form, password: value })}
        />
        <TouchableOpacity
          activeOpacity={0.82}
          disabled={!isReady}
          onPress={submit}
          style={[styles.primaryButton, { backgroundColor: accent }, !isReady && styles.disabledButton]}
        >
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function RoleButton({ color, icon, label, meta, onPress, preview, text }) {
  return (
    <TouchableOpacity style={styles.roleButton} activeOpacity={0.82} onPress={onPress}>
      <View style={styles.roleTop}>
        <View style={[styles.roleIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={15} color="#FFFFFF" />
        </View>
        <View style={styles.roleTextWrap}>
          <Text style={styles.roleLabel}>{label}</Text>
          <Text style={[styles.roleMeta, { color }]}>{meta}</Text>
        </View>
        <View style={styles.roleArrow}>
          <Ionicons name="arrow-forward" size={18} color="#111827" />
        </View>
      </View>
      <Text style={styles.rolePreview}>{preview}</Text>
      <View style={[styles.roleAction, { backgroundColor: color }]}>
        <Text style={styles.roleActionText}>{text}</Text>
        <Ionicons name="sparkles" size={15} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}

function VendorSignup({ form, onBack, onChange, onLogout, onSubmit }) {
  const isReady = form.ownerName && form.phone && form.shopName && form.address;

  return (
    <>
      <ScreenHeader title="Vendor onboarding" onBack={onBack} />
      <LogoutStrip onLogout={onLogout} />
      <View style={styles.vendorHero}>
        <View style={styles.vendorHeroIcon}>
          <Ionicons name="storefront" size={34} color="#111827" />
        </View>
        <Text style={styles.statusTitle}>Open a store after approval</Text>
        <Text style={styles.statusCopy}>
          Fill the basics. Your shop stays locked until admin verification is done.
        </Text>
      </View>
      <View style={styles.panel}>
        <FormInput
          label="Owner name"
          value={form.ownerName}
          onChangeText={(value) => onChange({ ...form, ownerName: value })}
        />
        <FormInput
          label="Phone"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(value) => onChange({ ...form, phone: value })}
        />
        <FormInput
          label="Shop name"
          value={form.shopName}
          onChangeText={(value) => onChange({ ...form, shopName: value })}
        />
        <FormInput
          label="Full address"
          multiline
          value={form.address}
          onChangeText={(value) => onChange({ ...form, address: value })}
        />
        <TouchableOpacity
          activeOpacity={0.82}
          disabled={!isReady}
          onPress={onSubmit}
          style={[styles.primaryButton, !isReady && styles.disabledButton]}
        >
          <Ionicons name="send" size={16} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Submit for review</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function FormInput({ label, ...props }) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="#98A2B3"
        style={[styles.input, props.multiline && styles.textArea]}
        {...props}
      />
    </View>
  );
}

function VendorPending({ onBack, onLogout }) {
  return (
    <>
      <ScreenHeader title="Pending review" onBack={onBack} />
      <LogoutStrip onLogout={onLogout} />
      <View style={styles.statusPanel}>
        <View style={styles.statusIcon}>
          <Ionicons name="time-outline" size={34} color="#FF7A1A" />
        </View>
        <Text style={styles.pendingTitle}>Application submitted</Text>
        <Text style={styles.pendingCopy}>
          This vendor account cannot add products, open a shop, or appear in
          customer feeds until the backend status changes to approved.
        </Text>
      </View>
    </>
  );
}

function AdminPanel({ onApprove, onBack, onLogout, pendingVendors }) {
  return (
    <>
      <ScreenHeader title="Admin dashboard" onBack={onBack} />
      <LogoutStrip onLogout={onLogout} />
      <View style={styles.adminStats}>
        <Stat label="Pending" value={pendingVendors.length} color="#FF7A1A" />
        <Stat label="Approved" value={approvedVendors.length} color="#00A86B" />
        <Stat label="Roles" value="3" color="#7C4DFF" />
      </View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Vendor approvals</Text>
        <Text style={styles.sectionAction}>Secure route</Text>
      </View>
      {pendingVendors.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.roleLabel}>All clear</Text>
          <Text style={styles.roleText}>No vendor applications are waiting.</Text>
        </View>
      ) : (
        pendingVendors.map((vendor) => (
          <View key={vendor.id} style={styles.pendingCard}>
            <View style={styles.pendingTop}>
              <View style={styles.shopIcon}>
                <Ionicons name="storefront" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.roleTextWrap}>
                <Text style={styles.shopName}>{vendor.shopName}</Text>
                <Text style={styles.mutedText}>{vendor.ownerName}</Text>
              </View>
            </View>
            <Text style={styles.shopAddress}>{vendor.phone}</Text>
            {vendor.email ? (
              <Text style={styles.shopAddress}>{vendor.email}</Text>
            ) : null}
            <Text style={styles.shopAddress}>{vendor.address}</Text>
            {vendor.submittedAt ? (
              <Text style={styles.pendingTime}>Submitted {vendor.submittedAt}</Text>
            ) : null}
            <View style={styles.adminActions}>
              <TouchableOpacity
                activeOpacity={0.78}
                style={styles.approveButton}
                onPress={() => onApprove(vendor.id)}
              >
                <Ionicons name="checkmark" size={17} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.78} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={18} color="#E11D48" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </>
  );
}

function Stat({ label, value, color }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ScreenHeader({ onBack, title }) {
  return (
    <View style={styles.screenHeader}>
      <TouchableOpacity style={styles.profileButton} activeOpacity={0.75} onPress={onBack}>
        <Ionicons name="arrow-back" size={22} color="#111827" />
      </TouchableOpacity>
      <Text style={styles.screenTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function LogoutStrip({ onLogout }) {
  return (
    <TouchableOpacity
      activeOpacity={0.78}
      style={styles.logoutStrip}
      onPress={onLogout}
    >
      <Ionicons name="log-out-outline" size={18} color="#E11D48" />
      <Text style={styles.logoutText}>Log out</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F7F1"
  },
  container: {
    alignSelf: "center",
    maxWidth: 430,
    padding: 12,
    paddingBottom: 96,
    width: "100%"
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14
  },
  startTopBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14
  },
  locationWrap: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row"
  },
  locationIcon: {
    alignItems: "center",
    backgroundColor: "#00A86B",
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    marginRight: 10,
    width: 38
  },
  deliveryText: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "800"
  },
  addressText: {
    color: "#667085",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2
  },
  profileButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    width: 42
  },
  logoutStrip: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "#FFF1F3",
    borderColor: "#FFE4E8",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  logoutText: {
    color: "#E11D48",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6
  },
  searchShell: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 50,
    paddingHorizontal: 12,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2
  },
  searchInput: {
    color: "#111827",
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    paddingHorizontal: 10
  },
  hero: {
    backgroundColor: "#111827",
    borderRadius: 8,
    flexDirection: "row",
    marginTop: 12,
    overflow: "hidden",
    padding: 14
  },
  startHero: {
    backgroundColor: "#101820",
    borderRadius: 8,
    flexDirection: "row",
    marginTop: 8,
    minHeight: 214,
    overflow: "hidden",
    padding: 14,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 4
  },
  heroTextArea: {
    flex: 1
  },
  heroLabel: {
    color: "#B7F7D8",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  heroScore: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "800",
    lineHeight: 34,
    marginTop: 8
  },
  heroCopy: {
    color: "#D0D5DD",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21,
    marginTop: 8
  },
  storyStrip: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 12,
    padding: 12,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1
  },
  storyIcon: {
    alignItems: "center",
    backgroundColor: "#B7F7D8",
    borderRadius: 8,
    height: 34,
    justifyContent: "center",
    marginRight: 10,
    width: 34
  },
  storyText: {
    color: "#344054",
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19
  },
  livePill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#223126",
    borderColor: "#3EE087",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  liveDot: {
    backgroundColor: "#3EE087",
    borderRadius: 4,
    height: 8,
    marginRight: 7,
    width: 8
  },
  liveText: {
    color: "#B7F7D8",
    fontSize: 12,
    fontWeight: "700"
  },
  startHeroTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 35,
    marginTop: 14
  },
  startStats: {
    flexDirection: "row",
    gap: 6,
    marginTop: 12
  },
  miniStat: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    minWidth: 58,
    paddingHorizontal: 7,
    paddingVertical: 8
  },
  miniStatValue: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800"
  },
  miniStatLabel: {
    color: "#667085",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2
  },
  heroStoreStack: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    width: 78
  },
  storeBubbleTop: {
    alignItems: "center",
    backgroundColor: "#B7F7D8",
    borderRadius: 8,
    height: 66,
    justifyContent: "center",
    marginBottom: -8,
    transform: [{ rotate: "-5deg" }],
    width: 66
  },
  storeBubbleBottom: {
    alignItems: "center",
    backgroundColor: "#FF7A1A",
    borderColor: "#111827",
    borderRadius: 8,
    borderWidth: 3,
    height: 62,
    justifyContent: "center",
    transform: [{ rotate: "6deg" }],
    width: 62
  },
  heroButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#B7F7D8",
    borderRadius: 8,
    flexDirection: "row",
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  heroButtonText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "800",
    marginRight: 6
  },
  heroBasket: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    height: 96,
    justifyContent: "center",
    marginLeft: 10,
    width: 78
  },
  heroBasketText: {
    color: "#00A86B",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4
  },
  categoryScroller: {
    marginTop: 14
  },
  categoryChip: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginRight: 8,
    minHeight: 42,
    paddingHorizontal: 12
  },
  categoryText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6
  },
  categoryTextActive: {
    color: "#FFFFFF"
  },
  offerRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  offerCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 12,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1
  },
  offerLabel: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 8
  },
  offerText: {
    color: "#667085",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
    marginTop: 3
  },
  promiseBand: {
    alignItems: "center",
    backgroundColor: "#ECFDF3",
    borderColor: "#C7F6D9",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 11
  },
  promiseItem: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "center"
  },
  promiseText: {
    color: "#075E3B",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 5
  },
  promiseDivider: {
    backgroundColor: "#BFEFD1",
    height: 22,
    width: 1
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "800"
  },
  sectionAction: {
    color: "#00A86B",
    fontSize: 13,
    fontWeight: "700"
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    padding: 8,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 7,
    elevation: 2,
    width: "49%"
  },
  productImage: {
    alignItems: "center",
    borderRadius: 8,
    height: 104,
    justifyContent: "center",
    marginBottom: 10,
    overflow: "hidden"
  },
  productBadge: {
    backgroundColor: "#111827",
    borderRadius: 8,
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: "absolute",
    top: 8
  },
  favoriteButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    height: 30,
    justifyContent: "center",
    position: "absolute",
    right: 8,
    top: 8,
    width: 30
  },
  productName: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
    minHeight: 36
  },
  productUnit: {
    color: "#667085",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4
  },
  productShop: {
    color: "#00A86B",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5
  },
  priceRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10
  },
  priceText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800"
  },
  mrpText: {
    color: "#98A2B3",
    fontSize: 12,
    fontWeight: "500",
    textDecorationLine: "line-through"
  },
  addButton: {
    alignItems: "center",
    backgroundColor: "#ECFDF3",
    borderColor: "#00A86B",
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 58,
    paddingVertical: 8
  },
  addButtonText: {
    color: "#008A58",
    fontSize: 13,
    fontWeight: "800"
  },
  stepper: {
    alignItems: "center",
    backgroundColor: "#00A86B",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    minWidth: 76,
    paddingHorizontal: 8,
    paddingVertical: 8
  },
  stepperText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginHorizontal: 8
  },
  shopCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 10,
    padding: 12,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 1
  },
  shopIcon: {
    alignItems: "center",
    backgroundColor: "#00A86B",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  shopBody: {
    flex: 1,
    paddingHorizontal: 12
  },
  shopName: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800"
  },
  shopAddress: {
    color: "#667085",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 5
  },
  pendingTime: {
    color: "#FF7A1A",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    textTransform: "uppercase"
  },
  shopMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 9
  },
  metaPill: {
    backgroundColor: "#F2F4F7",
    borderRadius: 8,
    color: "#111827",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  managerStrip: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18
  },
  managerButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 48
  },
  managerButtonText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 7
  },
  cartBar: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 8,
    bottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 12,
    padding: 12,
    position: "absolute",
    right: 12
  },
  cartTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800"
  },
  cartMeta: {
    color: "#D0D5DD",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2
  },
  checkoutButton: {
    alignItems: "center",
    backgroundColor: "#00A86B",
    borderRadius: 8,
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  checkoutText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginRight: 6
  },
  eyebrow: {
    color: "#667085",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  title: {
    color: "#111827",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 3
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "nowrap",
    marginTop: 2
  },
  brandTitle: {
    color: "#111827",
    fontSize: 30,
    fontStyle: "italic",
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 34
  },
  brandTitleAccent: {
    color: "#00A86B",
    fontSize: 30,
    fontStyle: "italic",
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 34
  },
  logoMark: {
    alignItems: "center",
    backgroundColor: "#B7F7D8",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  chooseTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 16
  },
  roleButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    minHeight: 126,
    padding: 12,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 9,
    elevation: 2
  },
  roleTop: {
    alignItems: "center",
    flexDirection: "row"
  },
  roleIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  roleTextWrap: {
    flex: 1
  },
  roleLabel: {
    color: "#111827",
    fontSize: 19,
    fontWeight: "800"
  },
  roleMeta: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
    textTransform: "uppercase"
  },
  roleText: {
    color: "#667085",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 3
  },
  roleArrow: {
    alignItems: "center",
    backgroundColor: "#F2F4F7",
    borderRadius: 8,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  rolePreview: {
    color: "#667085",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    marginTop: 9
  },
  roleAction: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 8,
    flexDirection: "row",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  roleActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginRight: 6
  },
  screenHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16
  },
  screenTitle: {
    color: "#111827",
    flex: 1,
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center"
  },
  headerSpacer: {
    width: 42
  },
  vendorHero: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 8,
    marginBottom: 12,
    padding: 20
  },
  vendorHeroIcon: {
    alignItems: "center",
    backgroundColor: "#B7F7D8",
    borderRadius: 8,
    height: 66,
    justifyContent: "center",
    width: 66
  },
  authHero: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderTopWidth: 5,
    borderWidth: 1,
    marginBottom: 12,
    padding: 20
  },
  authIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 58,
    justifyContent: "center",
    width: 58
  },
  authTitle: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 14,
    textAlign: "center"
  },
  authCopy: {
    color: "#667085",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21,
    marginTop: 7,
    textAlign: "center"
  },
  panel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16
  },
  googleButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#D0D5DD",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 50,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1
  },
  googleButtonDisabled: {
    opacity: 0.55
  },
  googleLogo: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    height: 28,
    justifyContent: "center",
    marginRight: 10,
    width: 28
  },
  googleLogoText: {
    color: "#4285F4",
    fontSize: 16,
    fontWeight: "800"
  },
  googleButtonText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700"
  },
  authNotice: {
    color: "#B54708",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 10,
    textAlign: "center"
  },
  authDivider: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 16
  },
  authDividerLine: {
    backgroundColor: "#E4E7EC",
    flex: 1,
    height: 1
  },
  authDividerText: {
    color: "#98A2B3",
    fontSize: 12,
    fontWeight: "600",
    marginHorizontal: 10,
    textTransform: "uppercase"
  },
  inputWrap: {
    marginTop: 14
  },
  inputLabel: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12
  },
  textArea: {
    minHeight: 88,
    paddingTop: 12,
    textAlignVertical: "top"
  },
  primaryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#00A86B",
    borderRadius: 8,
    flexDirection: "row",
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  disabledButton: {
    backgroundColor: "#98A2B3"
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 8
  },
  statusPanel: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    padding: 24
  },
  statusIcon: {
    alignItems: "center",
    backgroundColor: "#FFF1E7",
    borderRadius: 8,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  statusTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 18,
    textAlign: "center"
  },
  statusCopy: {
    color: "#D0D5DD",
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center"
  },
  pendingTitle: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 18,
    textAlign: "center"
  },
  pendingCopy: {
    color: "#667085",
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center"
  },
  adminStats: {
    flexDirection: "row",
    gap: 10
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 14
  },
  statDot: {
    borderRadius: 5,
    height: 10,
    width: 10
  },
  metricValue: {
    color: "#111827",
    fontSize: 23,
    fontWeight: "800",
    marginTop: 12
  },
  metricLabel: {
    color: "#667085",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2
  },
  pendingCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 14
  },
  pendingTop: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 8
  },
  mutedText: {
    color: "#667085",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    marginTop: 4
  },
  adminActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 14
  },
  approveButton: {
    alignItems: "center",
    backgroundColor: "#00A86B",
    borderRadius: 8,
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#FFF1F3",
    borderRadius: 8,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 18
  }
});
