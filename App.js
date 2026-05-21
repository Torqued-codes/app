import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import {
  confirmPhoneVerificationCode,
  getCurrentUserWithData,
  logoutUser,
  onAuthStateChange,
  sendPhoneVerificationCode,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail
} from "./services/authService";
import {
  addVendorAddress,
  approveVendor as approveVendorApplication,
  createVendorProfile,
  getNearbyVendors,
  getPendingVendorApplications,
  rejectVendor as rejectVendorApplication
} from "./services/vendorService";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "YOUR_GOOGLE_WEB_CLIENT_ID";
const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
  "YOUR_GOOGLE_ANDROID_CLIENT_ID";
const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "YOUR_GOOGLE_IOS_CLIENT_ID";

const approvedVendors = [
  {
    id: "shop-1",
    name: "Maya Fresh Mart",
    shopName: "Maya Fresh Mart",
    category: "Groceries",
    distanceKm: 0.8,
    eta: "8 min",
    rating: 4.8,
    address: "18 Lake Road, Indiranagar",
    accent: "#00A86B",
    postalCode: "560038"
  },
  {
    id: "shop-2",
    name: "Daily Basket",
    shopName: "Daily Basket",
    category: "Fruits",
    distanceKm: 1.1,
    eta: "11 min",
    rating: 4.7,
    address: "7 Market Street, Domlur",
    accent: "#FF7A1A",
    postalCode: "560038"
  },
  {
    id: "shop-3",
    name: "Urban Bloom",
    shopName: "Urban Bloom",
    category: "Flowers",
    distanceKm: 1.4,
    eta: "13 min",
    rating: 4.6,
    address: "42 Temple Lane, HAL",
    accent: "#7C4DFF",
    postalCode: "560038"
  }
];

const categories = [
  { id: "all", label: "All", icon: "grid-outline", color: "#111827" },
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

const pendingVendorFallback = [
  {
    id: "vendor-101",
    ownerName: "Aarav Mehta",
    phone: "+91 98765 43210",
    shopName: "Aarav Dairy",
    address: "12 Palm Grove, Koramangala, Bengaluru",
    approvalStatus: "pending"
  },
  {
    id: "vendor-102",
    ownerName: "Neha Rao",
    phone: "+91 99887 76655",
    shopName: "Neha Home Bakes",
    address: "55 Silver Street, HSR Layout, Bengaluru",
    approvalStatus: "pending"
  }
];

export default function App() {
  const [googleRequest, googleResponse, googlePromptAsync] =
    Google.useAuthRequest({
      clientId: GOOGLE_WEB_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      scopes: ["openid", "profile", "email"]
    });

  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState("customer");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const recaptchaRef = useRef(null);

  const [vendorTab, setVendorTab] = useState("home");
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [landmark, setLandmark] = useState("");
  const [savingVendor, setSavingVendor] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [nearbyVendors, setNearbyVendors] = useState(approvedVendors);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({});
  const [favorites, setFavorites] = useState({});

  const [adminTab, setAdminTab] = useState("vendors");
  const [pendingVendors, setPendingVendors] = useState(pendingVendorFallback);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        const nextUserData = await getCurrentUserWithData();
        setUserData(nextUserData);
        setUserRole(nextUserData?.role || null);
      } else {
        setUser(null);
        setUserData(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (googleResponse?.type === "success" && googleResponse.authentication) {
      handleGoogleLoginComplete(googleResponse.authentication);
    }
  }, [googleResponse]);

  useEffect(() => {
    if (userRole === "customer") {
      loadNearbyVendors();
    }
    if (userRole === "admin") {
      loadPendingVendors();
    }
  }, [userRole]);

  const displayName =
    userData?.name || user?.displayName || user?.email?.split("@")[0] || "Friend";

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      const query = `${product.name} ${product.shop}`.toLowerCase();
      return matchesCategory && query.includes(search.toLowerCase());
    });
  }, [search, selectedCategory]);

  const cartItems = Object.values(cart).reduce((total, quantity) => {
    return total + quantity;
  }, 0);

  const cartTotal = products.reduce((total, product) => {
    return total + (cart[product.id] || 0) * product.price;
  }, 0);

  async function handleGoogleLoginComplete(authentication) {
    try {
      setLoginLoading(true);
      setAuthError("");
      await signInWithGoogle(authentication, selectedRole);
    } catch (error) {
      setAuthError(error.message || "Google login failed");
      Alert.alert("Login Error", error.message || "Google login failed");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (!googleRequest) {
      setAuthError("Google sign in is still preparing. Try again in a moment.");
      return;
    }

    try {
      setAuthError("");
      await googlePromptAsync();
    } catch (error) {
      setAuthError(error.message || "Google login failed");
      Alert.alert("Login Error", error.message || "Google login failed");
    }
  }

  async function handleSendPhoneOTP() {
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      setAuthError("Please enter a valid phone number");
      return;
    }

    try {
      setPhoneLoading(true);
      setAuthError("");
      const formattedPhone = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+91${phoneNumber.replace(/\D/g, "").slice(-10)}`;
      const nextVerificationId = await sendPhoneVerificationCode(
        formattedPhone,
        recaptchaRef.current
      );
      setVerificationId(nextVerificationId);
      Alert.alert("OTP Sent", "Check your phone for the verification code");
    } catch (error) {
      setAuthError(error.message || "Failed to send OTP");
      Alert.alert("Error", error.message || "Failed to send OTP");
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleVerifyPhoneOTP() {
    if (!verificationCode || verificationCode.trim().length < 6) {
      setAuthError("Please enter the 6-digit OTP");
      return;
    }

    try {
      setPhoneLoading(true);
      setAuthError("");
      const formattedPhone = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+91${phoneNumber.replace(/\D/g, "").slice(-10)}`;
      await confirmPhoneVerificationCode(
        verificationId,
        verificationCode,
        formattedPhone,
        selectedRole
      );
      setPhoneNumber("");
      setVerificationCode("");
      setVerificationId(null);
    } catch (error) {
      setAuthError(error.message || "Verification failed");
      Alert.alert("Error", error.message || "Verification failed");
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleEmailLogin() {
    if (!email || !password || (isSignUp && !name)) {
      setAuthError("Please fill in all required fields");
      return;
    }

    try {
      setLoginLoading(true);
      setAuthError("");
      if (isSignUp) {
        await signUpWithEmail(email, password, name, selectedRole);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error) {
      setAuthError(error.message || "Authentication failed");
      Alert.alert("Error", error.message || "Authentication failed");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutUser();
      setEmail("");
      setPassword("");
      setName("");
      setIsSignUp(false);
      setCart({});
      setFavorites({});
    } catch (error) {
      Alert.alert("Logout Error", error.message || "Unable to log out");
    }
  }

  async function loadNearbyVendors() {
    try {
      setVendorLoading(true);
      const vendors = await getNearbyVendors("560038", "Bengaluru");
      if (vendors.length > 0) {
        setNearbyVendors(vendors.map(normalizeVendor));
      }
    } catch (error) {
      setNearbyVendors(approvedVendors);
    } finally {
      setVendorLoading(false);
    }
  }

  async function loadPendingVendors() {
    try {
      setAdminLoading(true);
      const vendors = await getPendingVendorApplications();
      setPendingVendors(vendors.length > 0 ? vendors.map(normalizeVendor) : []);
    } catch (error) {
      setPendingVendors(pendingVendorFallback);
    } finally {
      setAdminLoading(false);
    }
  }

  function normalizeVendor(vendor) {
    const firstAddress = vendor.addresses?.[0];
    return {
      id: vendor.id,
      ownerName: vendor.ownerName || vendor.name || "Vendor",
      phone: vendor.phone || "",
      shopName: vendor.shopName || vendor.name || firstAddress?.shopName || "Local store",
      name: vendor.shopName || vendor.name || firstAddress?.shopName || "Local store",
      address:
        vendor.address ||
        firstAddress?.fullAddress ||
        `${firstAddress?.city || "Bengaluru"} ${firstAddress?.postalCode || ""}`.trim(),
      accent: vendor.accent || "#00A86B",
      distanceKm: vendor.distanceKm || vendor.minDistance?.toFixed?.(1) || 1.2,
      eta: vendor.eta || "10 min",
      rating: vendor.rating || 4.7,
      approvalStatus: vendor.approvalStatus || "pending"
    };
  }

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

  async function saveVendorProfile() {
    if (!shopName || !ownerName || !phone || !fullAddress || !postalCode || !city || !state) {
      Alert.alert("Missing details", "Please complete the required shop and address fields.");
      return;
    }

    try {
      setSavingVendor(true);
      await createVendorProfile(user.uid, {
        email: user.email,
        ownerName,
        phone,
        shopName
      });
      await addVendorAddress(user.uid, {
        shopName,
        fullAddress,
        postalCode,
        pincode: postalCode,
        city,
        state,
        landmark,
        isDefault: true
      });
      Alert.alert("Submitted", "Your vendor profile is pending admin approval.");
      setVendorTab("home");
    } catch (error) {
      Alert.alert("Save failed", error.message || "Unable to save vendor details.");
    } finally {
      setSavingVendor(false);
    }
  }

  async function handleApproveVendor(vendorId) {
    try {
      await approveVendorApplication(vendorId, user.uid);
    } catch (error) {
      // The local prototype still updates so the UI remains useful offline.
    }
    setPendingVendors((vendors) => vendors.filter((vendor) => vendor.id !== vendorId));
  }

  async function handleRejectVendor(vendorId) {
    try {
      await rejectVendorApplication(vendorId, user.uid, "Rejected from admin dashboard");
    } catch (error) {
      // The local prototype still updates so the UI remains useful offline.
    }
    setPendingVendors((vendors) => vendors.filter((vendor) => vendor.id !== vendorId));
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A86B" />
          <Text style={styles.loadingText}>Preparing Street Connect...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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

          <View style={styles.panel}>
            <Text style={styles.chooseTitle}>Choose your doorway</Text>
            <View style={styles.roleButtons}>
              {[
                { id: "customer", label: "User", icon: "person-outline", color: "#00A86B" },
                { id: "vendor", label: "Vendor", icon: "business-outline", color: "#FF7A1A" },
                { id: "admin", label: "Admin", icon: "shield-checkmark-outline", color: "#7C4DFF" }
              ].map((role) => {
                const active = selectedRole === role.id;
                return (
                  <TouchableOpacity
                    key={role.id}
                    activeOpacity={0.82}
                    onPress={() => setSelectedRole(role.id)}
                    style={[
                      styles.roleButton,
                      active && { backgroundColor: role.color, borderColor: role.color }
                    ]}
                  >
                    <Ionicons
                      name={role.icon}
                      size={18}
                      color={active ? "#FFFFFF" : role.color}
                    />
                    <Text style={[styles.roleButtonText, active && styles.roleButtonTextActive]}>
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.loginMethodTabs}>
              {[
                { id: "email", label: "Email", icon: "mail-outline" },
                { id: "phone", label: "Phone", icon: "call-outline" },
                { id: "google", label: "Google", icon: "logo-google" }
              ].map((method) => (
                <TouchableOpacity
                  key={method.id}
                  activeOpacity={0.78}
                  style={[styles.methodTab, loginMethod === method.id && styles.methodTabActive]}
                  onPress={() => {
                    setLoginMethod(method.id);
                    setAuthError("");
                    setVerificationCode("");
                  }}
                >
                  <Ionicons
                    name={method.icon}
                    size={16}
                    color={loginMethod === method.id ? "#111827" : "#667085"}
                  />
                  <Text
                    style={[
                      styles.methodTabText,
                      loginMethod === method.id && styles.methodTabTextActive
                    ]}
                  >
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {loginMethod === "email" && (
              <>
                {isSignUp ? (
                  <FormInput
                    label="Full name"
                    value={name}
                    onChangeText={setName}
                    editable={!loginLoading}
                  />
                ) : null}
                <FormInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  editable={!loginLoading}
                />
                <FormInput
                  label="Password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  editable={!loginLoading}
                />
                {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
                <ActionButton
                  label={isSignUp ? "Create account" : "Login"}
                  loading={loginLoading}
                  onPress={handleEmailLogin}
                />
                <TouchableOpacity
                  activeOpacity={0.78}
                  style={styles.secondaryButton}
                  onPress={() => setIsSignUp(!isSignUp)}
                  disabled={loginLoading}
                >
                  <Text style={styles.secondaryButtonText}>
                    {isSignUp ? "Already have an account? Login" : "Do not have an account? Sign up"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {loginMethod === "phone" && (
              <>
                {!verificationId ? (
                  <>
                    <Text style={styles.inputLabel}>Phone number</Text>
                    <View style={styles.phoneInputContainer}>
                      <Text style={styles.countryCode}>+91</Text>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="Mobile Number"
                        placeholderTextColor="#98A2B3"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        editable={!phoneLoading}
                        maxLength={10}
                      />
                    </View>
                    {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
                    <ActionButton
                      label="Send OTP"
                      icon="send"
                      loading={phoneLoading}
                      onPress={handleSendPhoneOTP}
                    />
                  </>
                ) : (
                  <>
                    <FormInput
                      keyboardType="number-pad"
                      label={`OTP sent to +91${phoneNumber.slice(-10)}`}
                      maxLength={6}
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      editable={!phoneLoading}
                    />
                    {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
                    <ActionButton
                      label="Verify and login"
                      icon="checkmark"
                      loading={phoneLoading}
                      onPress={handleVerifyPhoneOTP}
                    />
                    <TouchableOpacity
                      activeOpacity={0.78}
                      style={styles.secondaryButton}
                      onPress={() => {
                        setVerificationId(null);
                        setVerificationCode("");
                        setPhoneNumber("");
                      }}
                    >
                      <Text style={styles.secondaryButtonText}>Use a different number</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {loginMethod === "google" && (
              <>
                <View style={styles.storyStrip}>
                  <Ionicons name="information-circle-outline" size={20} color="#111827" />
                  <Text style={styles.storyText}>
                    Continue with Google as the selected role above.
                  </Text>
                </View>
                {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
                <ActionButton
                  color="#111827"
                  disabled={!googleRequest}
                  icon="logo-google"
                  label="Continue with Google"
                  loading={loginLoading}
                  onPress={handleGoogleLogin}
                />
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (userRole === "customer") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.containerWithCart} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <View style={styles.locationWrap}>
              <View style={styles.locationIcon}>
                <Ionicons name="flash" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.headerTextWrap}>
                <Text style={styles.deliveryText}>Delivering in 10 minutes</Text>
                <Text style={styles.addressText}>Hi {displayName}, Indiranagar, Bengaluru</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.profileButton} activeOpacity={0.75} onPress={handleLogout}>
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
                onPress={() => updateQuantity("p2", 1)}
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroller}>
            {categories.map((category) => {
              const active = selectedCategory === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  activeOpacity={0.78}
                  onPress={() => setSelectedCategory(category.id)}
                  style={[styles.categoryChip, active && { backgroundColor: category.color }]}
                >
                  <Ionicons
                    name={category.icon}
                    size={18}
                    color={active ? "#FFFFFF" : category.color}
                  />
                  <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.offerRow}>
            <OfferCard icon="pricetag" label="Local saver" text="Great prices from stores around your lane" />
            <OfferCard icon="shield-checkmark" label="Verified only" text="Pending shops never appear for users" />
          </View>

          <View style={styles.promiseBand}>
            <PromiseItem icon="timer-outline" label="Fast ETA" />
            <View style={styles.promiseDivider} />
            <PromiseItem icon="bag-check-outline" label="Fresh stock" />
            <View style={styles.promiseDivider} />
            <PromiseItem icon="shield-outline" label="Admin checked" />
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
                onQuantity={updateQuantity}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trusted stores near you</Text>
            <Text style={styles.sectionAction}>{vendorLoading ? "Loading" : "Sorted by ETA"}</Text>
          </View>
          {nearbyVendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={normalizeVendor(vendor)} />
          ))}
        </ScrollView>

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
      </SafeAreaView>
    );
  }

  if (userRole === "vendor") {
    const vendorPending = userData?.status === "pending";
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <ScreenHeader
          subtitle={user?.email}
          title="Vendor Portal"
          onLogout={handleLogout}
        />
        <View style={styles.tabContainer}>
          {[
            { id: "home", label: "Home", icon: "home-outline" },
            { id: "profile", label: "Profile", icon: "person-outline" },
            { id: "address", label: "Address", icon: "location-outline" }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, vendorTab === tab.id && styles.tabActive]}
              onPress={() => setVendorTab(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={19}
                color={vendorTab === tab.id ? "#00A86B" : "#98A2B3"}
              />
              <Text style={[styles.tabText, vendorTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {vendorTab === "home" && (
            <>
              <View style={styles.vendorHero}>
                <View style={styles.vendorHeroIcon}>
                  <Ionicons name="storefront" size={34} color="#111827" />
                </View>
                <Text style={styles.statusTitle}>
                  {vendorPending ? "Open a store after approval" : "Your shop is ready"}
                </Text>
                <Text style={styles.statusCopy}>
                  {vendorPending
                    ? "Your shop stays locked until admin verification is done."
                    : "Manage nearby customers, addresses, and incoming marketplace demand."}
                </Text>
              </View>
              <View style={styles.adminStats}>
                <Stat label="Orders" value="12" color="#00A86B" />
                <Stat label="Rating" value="4.8" color="#FF7A1A" />
                <Stat label="Status" value={vendorPending ? "Pending" : "Live"} color="#7C4DFF" />
              </View>
            </>
          )}

          {vendorTab === "profile" && (
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Business profile</Text>
              <View style={styles.infoBox}>
                <Ionicons name="time-outline" size={20} color="#FF7A1A" />
                <Text style={styles.infoText}>
                  Status: {vendorPending ? "Pending Approval" : "Approved"}
                </Text>
              </View>
              <FormInput label="Owner name" value={ownerName} onChangeText={setOwnerName} />
              <FormInput label="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
              <FormInput label="Shop name" value={shopName} onChangeText={setShopName} />
            </View>
          )}

          {vendorTab === "address" && (
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Business address</Text>
              <FormInput label="Shop name" value={shopName} onChangeText={setShopName} />
              <FormInput
                label="Full address"
                multiline
                value={fullAddress}
                onChangeText={setFullAddress}
              />
              <View style={styles.row}>
                <FormInput
                  containerStyle={styles.rowInput}
                  label="Pincode"
                  keyboardType="number-pad"
                  value={postalCode}
                  onChangeText={setPostalCode}
                />
                <FormInput
                  containerStyle={styles.rowInput}
                  label="City"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <FormInput label="State" value={state} onChangeText={setState} />
              <FormInput label="Landmark" value={landmark} onChangeText={setLandmark} />
              <ActionButton
                icon="save-outline"
                label="Save and submit"
                loading={savingVendor}
                onPress={saveVendorProfile}
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (userRole === "admin") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <ScreenHeader subtitle={user?.email} title="Admin Dashboard" onLogout={handleLogout} />
        <View style={styles.tabContainer}>
          {[
            { id: "vendors", label: "Vendors", icon: "storefront-outline" },
            { id: "users", label: "Users", icon: "people-outline" },
            { id: "orders", label: "Orders", icon: "receipt-outline" }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, adminTab === tab.id && styles.tabActive]}
              onPress={() => setAdminTab(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={19}
                color={adminTab === tab.id ? "#00A86B" : "#98A2B3"}
              />
              <Text style={[styles.tabText, adminTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {adminTab === "vendors" && (
            <>
              <View style={styles.adminStats}>
                <Stat label="Pending" value={pendingVendors.length} color="#FF7A1A" />
                <Stat label="Approved" value={approvedVendors.length} color="#00A86B" />
                <Stat label="Roles" value="3" color="#7C4DFF" />
              </View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Vendor approvals</Text>
                <Text style={styles.sectionAction}>{adminLoading ? "Loading" : "Secure route"}</Text>
              </View>
              {pendingVendors.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-circle" size={42} color="#00A86B" />
                  <Text style={styles.roleLabel}>All clear</Text>
                  <Text style={styles.rolePreview}>No vendor applications are waiting.</Text>
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
                    <Text style={styles.shopAddress}>{vendor.address}</Text>
                    <View style={styles.adminActions}>
                      <TouchableOpacity
                        activeOpacity={0.78}
                        style={styles.approveButton}
                        onPress={() => handleApproveVendor(vendor.id)}
                      >
                        <Ionicons name="checkmark" size={17} color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.78}
                        style={styles.rejectButton}
                        onPress={() => handleRejectVendor(vendor.id)}
                      >
                        <Ionicons name="close" size={17} color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {adminTab === "users" && (
            <PlaceholderState icon="people-outline" title="Users management" text="User list controls can plug into this view next." />
          )}

          {adminTab === "orders" && (
            <PlaceholderState icon="receipt-outline" title="Orders management" text="Order moderation and dispute tools can live here." />
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>We could not find a role for this account.</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
          <Text style={styles.secondaryButtonText}>Log out and choose a role</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ActionButton({ color = "#00A86B", disabled, icon = "arrow-forward", label, loading, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={disabled || loading}
      onPress={onPress}
      style={[styles.primaryButton, { backgroundColor: color }, (disabled || loading) && styles.disabledButton]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Ionicons name={icon} size={16} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function FormInput({ containerStyle, label, multiline, ...props }) {
  return (
    <View style={[styles.inputWrap, containerStyle]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="#98A2B3"
        style={[styles.input, multiline && styles.textArea]}
        multiline={multiline}
        {...props}
      />
    </View>
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

function OfferCard({ icon, label, text }) {
  return (
    <View style={styles.offerCard}>
      <Ionicons name={icon} size={22} color="#111827" />
      <Text style={styles.offerLabel}>{label}</Text>
      <Text style={styles.offerText}>{text}</Text>
    </View>
  );
}

function PromiseItem({ icon, label }) {
  return (
    <View style={styles.promiseItem}>
      <Ionicons name={icon} size={18} color="#00A86B" />
      <Text style={styles.promiseText}>{label}</Text>
    </View>
  );
}

function ProductCard({ favorite, product, quantity, onQuantity, onToggleFavorite }) {
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
      <Text style={styles.productUnit}>
        {product.unit} - {product.eta}
      </Text>
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

function VendorCard({ vendor }) {
  return (
    <View style={styles.shopCard}>
      <View style={[styles.shopIcon, { backgroundColor: vendor.accent }]}>
        <Ionicons name="storefront" size={23} color="#FFFFFF" />
      </View>
      <View style={styles.shopBody}>
        <Text style={styles.shopName}>{vendor.shopName || vendor.name}</Text>
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

function ScreenHeader({ onLogout, subtitle, title }) {
  return (
    <View style={styles.appHeader}>
      <View>
        <Text style={styles.headerGreeting}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>
      <TouchableOpacity onPress={onLogout} style={styles.profileButton}>
        <Ionicons name="log-out-outline" size={20} color="#111827" />
      </TouchableOpacity>
    </View>
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

function PlaceholderState({ icon, text, title }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={44} color="#98A2B3" />
      <Text style={styles.roleLabel}>{title}</Text>
      <Text style={styles.rolePreview}>{text}</Text>
    </View>
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
    paddingBottom: 32,
    width: "100%"
  },
  containerWithCart: {
    alignSelf: "center",
    maxWidth: 430,
    padding: 12,
    paddingBottom: 110,
    width: "100%"
  },
  loadingContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  loadingText: {
    color: "#667085",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center"
  },
  startTopBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14
  },
  eyebrow: {
    color: "#667085",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase"
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
  heroCopy: {
    color: "#D0D5DD",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21,
    marginTop: 8
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
  panel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 16
  },
  chooseTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12
  },
  roleButtons: {
    flexDirection: "row",
    gap: 8
  },
  roleButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 58,
    justifyContent: "center",
    paddingHorizontal: 8
  },
  roleButtonText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 5
  },
  roleButtonTextActive: {
    color: "#FFFFFF"
  },
  loginMethodTabs: {
    backgroundColor: "#F2F4F7",
    borderRadius: 8,
    flexDirection: "row",
    gap: 6,
    marginTop: 16,
    padding: 5
  },
  methodTab: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 38
  },
  methodTabActive: {
    backgroundColor: "#FFFFFF"
  },
  methodTabText: {
    color: "#667085",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 5
  },
  methodTabTextActive: {
    color: "#111827"
  },
  inputWrap: {
    marginTop: 14
  },
  inputLabel: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 2
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
  phoneInputContainer: {
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 50,
    paddingHorizontal: 12
  },
  countryCode: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
    marginRight: 8
  },
  phoneInput: {
    color: "#111827",
    flex: 1,
    fontSize: 16
  },
  primaryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
    minHeight: 46,
    minWidth: 150,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 8
  },
  disabledButton: {
    opacity: 0.6
  },
  secondaryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderColor: "#D0D5DD",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  secondaryButtonText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "800"
  },
  errorText: {
    color: "#E11D48",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 10
  },
  storyStrip: {
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 14,
    padding: 12
  },
  storyText: {
    color: "#344054",
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
    marginLeft: 8
  },
  topBar: {
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
  headerTextWrap: {
    flex: 1
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
  cartBar: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#111827",
    borderRadius: 8,
    bottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    maxWidth: 406,
    padding: 12,
    position: "absolute",
    width: "94%"
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
  appHeader: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    maxWidth: 430,
    padding: 12,
    width: "100%"
  },
  headerGreeting: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "800"
  },
  headerSubtitle: {
    color: "#667085",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2
  },
  tabContainer: {
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 2,
    maxWidth: 406,
    overflow: "hidden",
    width: "94%"
  },
  tab: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10
  },
  tabActive: {
    backgroundColor: "#ECFDF3"
  },
  tabText: {
    color: "#667085",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3
  },
  tabTextActive: {
    color: "#00A86B"
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
    fontSize: 21,
    fontWeight: "800",
    marginTop: 12
  },
  metricLabel: {
    color: "#667085",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2
  },
  infoBox: {
    alignItems: "center",
    backgroundColor: "#FFF8E8",
    borderColor: "#FFE3A3",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 12,
    padding: 12
  },
  infoText: {
    color: "#B54708",
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 8
  },
  row: {
    flexDirection: "row",
    gap: 10
  },
  rowInput: {
    flex: 1
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E7EC",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 20
  },
  roleLabel: {
    color: "#111827",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 10
  },
  rolePreview: {
    color: "#667085",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center"
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
  roleTextWrap: {
    flex: 1,
    paddingLeft: 12
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
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  rejectButton: {
    alignItems: "center",
    backgroundColor: "#E11D48",
    borderRadius: 8,
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 11
  }
});
