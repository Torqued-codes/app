import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert
} from "react-native";
import { onAuthStateChange, signInWithGoogle, signInWithEmail, logoutUser, getCurrentUserWithData, signUpWithEmail } from "./services/authService";
import { getNearbyVendors } from "./services/vendorService";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "YOUR_GOOGLE_WEB_CLIENT_ID";
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "YOUR_GOOGLE_ANDROID_CLIENT_ID";
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "YOUR_GOOGLE_IOS_CLIENT_ID";

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
  }
];

const categories = [
  { id: "all", label: "All", icon: "grid-outline", color: "#1F2937" },
  { id: "grocery", label: "Grocery", icon: "basket-outline", color: "#00A86B" },
  { id: "fruits", label: "Fruits", icon: "nutrition-outline", color: "#FF7A1A" }
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
  }
];

export default function App() {
  // Google Auth Setup
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    scopes: ["profile", "email"]
  });

  // Authentication States
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  // Login States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState("customer");
  const [loginLoading, setLoginLoading] = useState(false);

  // Vendor Portal States
  const [vendorTab, setVendorTab] = useState("home");
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [landmark, setLandmark] = useState("");

  // Customer Portal States
  const [customerTab, setCustomerTab] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [nearbyVendors, setNearbyVendors] = useState(approvedVendors);
  const [vendorLoading, setVendorLoading] = useState(false);

  // Admin Portal States
  const [adminTab, setAdminTab] = useState("vendors");
  const [pendingVendors, setPendingVendors] = useState([]);

  // Check authentication on app load
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        
        // Get user role from Firestore
        const userData = await getCurrentUserWithData();
        if (userData) {
          setUserRole(userData.role);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle Google login
  useEffect(() => {
    if (googleResponse?.type === "success" && googleResponse.authentication) {
      handleGoogleLoginComplete(googleResponse.authentication);
    }
  }, [googleResponse]);

  const handleGoogleLoginComplete = async (authentication) => {
    try {
      setLoginLoading(true);
      setAuthError("");
      await signInWithGoogle(authentication, selectedRole);
    } catch (error) {
      setAuthError(error.message || "Google login failed");
      Alert.alert("Login Error", error.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!googleRequest) return;

    try {
      await googlePromptAsync();
    } catch (error) {
      setAuthError(error.message || "Google login failed");
      Alert.alert("Login Error", error.message);
    }
  };

  // Handle Email login
  const handleEmailLogin = async () => {
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
      Alert.alert("Error", error.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setUserRole(null);
      setEmail("");
      setPassword("");
      setName("");
      setIsSignUp(false);
    } catch (error) {
      Alert.alert("Logout Error", error.message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.loginHeader}>
            <Ionicons name="storefront" size={60} color="#2563EB" />
            <Text style={styles.appTitle}>StreetConnect</Text>
            <Text style={styles.appSubtitle}>Local Delivery, Your Way</Text>
          </View>

          <View style={styles.roleSelector}>
            <Text style={styles.roleLabel}>Select Portal:</Text>
            <View style={styles.roleButtons}>
              {["customer", "vendor", "admin"].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleButton, selectedRole === role && styles.roleButtonActive]}
                  onPress={() => setSelectedRole(role)}
                >
                  <Ionicons
                    name={role === "customer" ? "person" : role === "vendor" ? "store" : "shield"}
                    size={20}
                    color={selectedRole === role ? "#FFF" : "#666"}
                  />
                  <Text style={[styles.roleButtonText, selectedRole === role && styles.roleButtonTextActive]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formContainer}>
            {isSignUp && (
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                editable={!loginLoading}
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              editable={!loginLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loginLoading}
            />

            {authError && <Text style={styles.errorText}>{authError}</Text>}

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, loginLoading && styles.buttonDisabled]}
              onPress={handleEmailLogin}
              disabled={loginLoading}
            >
              {loginLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>{isSignUp ? "Sign Up" : "Login"}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setIsSignUp(!isSignUp)}
              disabled={loginLoading}
            >
              <Text style={styles.secondaryButtonText}>
                {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.googleButton, loginLoading && styles.buttonDisabled]}
              onPress={handleGoogleLogin}
              disabled={!googleRequest || loginLoading}
            >
              <Ionicons name="logo-google" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Sign in with Google</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F4EE" />
      </SafeAreaView>
    );
  }

  // CUSTOMER PORTAL
  if (userRole === "customer") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>👋 Welcome</Text>
            <Text style={styles.headerSubtitle}>{user.displayName || user.email}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out" size={24} color="#E11D48" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.scrollContent}>
            <View style={styles.searchSection}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.filterButton}>
                <Ionicons name="options" size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat.id && styles.categoryButtonActive
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Ionicons
                    name={cat.icon}
                    size={24}
                    color={selectedCategory === cat.id ? "#FFF" : cat.color}
                  />
                  <Text
                    style={[
                      styles.categoryButtonText,
                      selectedCategory === cat.id && styles.categoryButtonTextActive
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🛍️ Nearby Shops</Text>
              {vendorLoading && <ActivityIndicator size="small" color="#2563EB" />}
            </View>

            {nearbyVendors.map((vendor) => (
              <View key={vendor.id} style={styles.vendorCard}>
                <View style={[styles.vendorCardColor, { backgroundColor: vendor.accent || "#2563EB" }]} />
                <View style={styles.vendorCardContent}>
                  <Text style={styles.vendorName}>{vendor.shopName || vendor.name}</Text>
                  <Text style={styles.vendorAddress}>{vendor.address}</Text>
                  <View style={styles.vendorMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="location" size={14} color="#666" />
                      <Text style={styles.metaText}>{vendor.distanceKm} km</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time" size={14} color="#666" />
                      <Text style={styles.metaText}>{vendor.eta}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="star" size={14} color="#FF7A1A" />
                      <Text style={styles.metaText}>{vendor.rating}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⭐ Featured Products</Text>
            </View>

            {products.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <View style={[styles.productColor, { backgroundColor: product.color }]}>
                  <Ionicons name={product.icon} size={32} color="#FFF" />
                </View>
                <View style={styles.productContent}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productShop}>{product.shop}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>₹{product.price}</Text>
                    <Text style={styles.mrp}>₹{product.mrp}</Text>
                  </View>
                </View>
                <View style={styles.productBadge}>
                  <Text style={styles.badgeText}>{product.badge}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F4EE" />
      </SafeAreaView>
    );
  }

  // VENDOR PORTAL
  if (userRole === "vendor") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>🏪 Vendor Portal</Text>
            <Text style={styles.headerSubtitle}>{user.displayName || user.email}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out" size={24} color="#E11D48" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          {["home", "profile", "address"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, vendorTab === tab && styles.tabActive]}
              onPress={() => setVendorTab(tab)}
            >
              <Ionicons name={tab === "home" ? "home" : tab === "profile" ? "person" : "location"} size={20} color={vendorTab === tab ? "#2563EB" : "#999"} />
              <Text style={[styles.tabText, vendorTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {vendorTab === "home" && (
            <View>
              <Text style={styles.sectionTitle}>Welcome to Your Shop Dashboard</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Ionicons name="bag-check" size={32} color="#00A86B" />
                  <Text style={styles.statNumber}>12</Text>
                  <Text style={styles.statLabel}>Active Orders</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="star" size={32} color="#FF7A1A" />
                  <Text style={styles.statNumber}>4.8</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
              </View>
            </View>
          )}

          {vendorTab === "profile" && (
            <View>
              <Text style={styles.sectionTitle}>Your Business Profile</Text>
              <View style={styles.formContainer}>
                <View style={styles.infoBox}>
                  <Ionicons name="checkmark-circle" size={20} color="#00A86B" />
                  <Text style={styles.infoText}>Status: Pending Approval</Text>
                </View>
              </View>
            </View>
          )}

          {vendorTab === "address" && (
            <View>
              <Text style={styles.sectionTitle}>Business Address</Text>
              <View style={styles.formContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Shop Name"
                  value={shopName}
                  onChangeText={setShopName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Full Address"
                  value={fullAddress}
                  onChangeText={setFullAddress}
                  multiline
                />
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                    placeholder="Postal Code"
                    value={postalCode}
                    onChangeText={setPostalCode}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Pincode"
                    value={postalCode}
                    onChangeText={setPostalCode}
                  />
                </View>
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                    placeholder="City"
                    value={city}
                    onChangeText={setCity}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="State"
                    value={state}
                    onChangeText={setState}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Landmark (Optional)"
                  value={landmark}
                  onChangeText={setLandmark}
                />
                <TouchableOpacity style={[styles.button, styles.primaryButton]}>
                  <Text style={styles.buttonText}>Save Address</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F4EE" />
      </SafeAreaView>
    );
  }

  // ADMIN PORTAL
  if (userRole === "admin") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>🛡️ Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>{user.displayName || user.email}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out" size={24} color="#E11D48" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          {["vendors", "users", "orders"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, adminTab === tab && styles.tabActive]}
              onPress={() => setAdminTab(tab)}
            >
              <Ionicons name={tab === "vendors" ? "store" : tab === "users" ? "people" : "receipt"} size={20} color={adminTab === tab ? "#2563EB" : "#999"} />
              <Text style={[styles.tabText, adminTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {adminTab === "vendors" && (
            <View>
              <Text style={styles.sectionTitle}>Pending Vendor Applications</Text>
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color="#00A86B" />
                <Text style={styles.emptyStateText}>No pending applications</Text>
              </View>
            </View>
          )}

          {adminTab === "users" && (
            <View>
              <Text style={styles.sectionTitle}>Users Management</Text>
              <View style={styles.emptyState}>
                <Ionicons name="people" size={48} color="#CCC" />
                <Text style={styles.emptyStateText}>Users list coming soon</Text>
              </View>
            </View>
          )}

          {adminTab === "orders" && (
            <View>
              <Text style={styles.sectionTitle}>Orders Management</Text>
              <View style={styles.emptyState}>
                <Ionicons name="receipt" size={48} color="#CCC" />
                <Text style={styles.emptyStateText}>Orders list coming soon</Text>
              </View>
            </View>
          )}
        </ScrollView>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F4EE" />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F4EE"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontWeight: "500"
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32
  },
  loginHeader: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 32
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 12
  },
  appSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4
  },
  roleSelector: {
    marginBottom: 24
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12
  },
  roleButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8
  },
  roleButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFF"
  },
  roleButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB"
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginTop: 6
  },
  roleButtonTextActive: {
    color: "#FFF"
  },
  formContainer: {
    marginBottom: 24
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: "#FFF",
    color: "#1F2937"
  },
  errorText: {
    color: "#E11D48",
    fontSize: 12,
    marginBottom: 12,
    textAlign: "center"
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    flexDirection: "row",
    gap: 8
  },
  primaryButton: {
    backgroundColor: "#2563EB"
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#2563EB"
  },
  googleButton: {
    backgroundColor: "#DB4437"
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600"
  },
  secondaryButtonText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "600"
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 12
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB"
  },
  dividerText: {
    color: "#999",
    fontSize: 12,
    fontWeight: "600"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFF"
  },
  headerGreeting: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937"
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FFF5F7"
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFF"
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
    alignItems: "center",
    gap: 4
  },
  tabActive: {
    borderBottomColor: "#2563EB"
  },
  tabText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500"
  },
  tabTextActive: {
    color: "#2563EB",
    fontWeight: "600"
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12
  },
  searchSection: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: "#FFF"
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center"
  },
  categoriesContainer: {
    marginBottom: 20,
    paddingHorizontal: 0
  },
  categoryButton: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  categoryButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB"
  },
  categoryButtonText: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
    fontWeight: "500"
  },
  categoryButtonTextActive: {
    color: "#FFF"
  },
  vendorCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  vendorCardColor: {
    width: 80,
    height: 80
  },
  vendorCardContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between"
  },
  vendorName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937"
  },
  vendorAddress: {
    fontSize: 12,
    color: "#666",
    marginTop: 4
  },
  vendorMeta: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  metaText: {
    fontSize: 11,
    color: "#666"
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 8,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  productColor: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12
  },
  productContent: {
    flex: 1
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937"
  },
  productShop: {
    fontSize: 11,
    color: "#666",
    marginTop: 2
  },
  priceContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00A86B"
  },
  mrp: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through"
  },
  productBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#FEE2E2",
    borderRadius: 4
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#E11D48"
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32
  },
  emptyStateText: {
    fontSize: 14,
    color: "#999",
    marginTop: 12
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 8
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 4
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8
  },
  infoText: {
    fontSize: 13,
    color: "#00A86B",
    fontWeight: "600"
  },
  row: {
    flexDirection: "row",
    gap: 8
  },
  adminCard: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  adminCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12
  },
  adminCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937"
  },
  adminCardSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4
  },
  statusBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#E11D48"
  },
  adminCardText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6
  },
  adminCardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  approveButton: {
    flex: 1,
    backgroundColor: "#00A86B",
    flexDirection: "row",
    justifyContent: "center"
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#E11D48",
    flexDirection: "row",
    justifyContent: "center"
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F4EE"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontWeight: "500"
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32
  },
  // ==================== LOGIN SCREEN ====================
  loginHeader: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 32
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 12
  },
  appSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4
  },
  roleSelector: {
    marginBottom: 24
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12
  },
  roleButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8
  },
  roleButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFF"
  },
  roleButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB"
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginTop: 6
  },
  roleButtonTextActive: {
    color: "#FFF"
  },
  formContainer: {
    marginBottom: 24
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: "#FFF",
    color: "#1F2937"
  },
  errorText: {
    color: "#E11D48",
    fontSize: 12,
    marginBottom: 12,
    textAlign: "center"
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    flexDirection: "row",
    gap: 8
  },
  primaryButton: {
    backgroundColor: "#2563EB"
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#2563EB"
  },
  googleButton: {
    backgroundColor: "#DB4437"
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600"
  },
  secondaryButtonText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "600"
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 12
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB"
  },
  dividerText: {
    color: "#999",
    fontSize: 12,
    fontWeight: "600"
  },
  // ==================== COMMON HEADER ====================
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFF"
  },
  headerGreeting: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937"
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FFF5F7"
  },
  // ==================== TABS ====================
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFF"
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
    alignItems: "center",
    gap: 4
  },
  tabActive: {
    borderBottomColor: "#2563EB"
  },
  tabText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500"
  },
  tabTextActive: {
    color: "#2563EB",
    fontWeight: "600"
  },
  // ==================== SECTIONS ====================
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12
  },
  // ==================== CUSTOMER PORTAL ====================
  searchSection: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: "#FFF"
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center"
  },
  categoriesContainer: {
    marginBottom: 20,
    paddingHorizontal: 0
  },
  categoryButton: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  categoryButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB"
  },
  categoryButtonText: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
    fontWeight: "500"
  },
  categoryButtonTextActive: {
    color: "#FFF"
  },
  vendorCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  vendorCardColor: {
    width: 80,
    height: 80
  },
  vendorCardContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between"
  },
  vendorName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937"
  },
  vendorAddress: {
    fontSize: 12,
    color: "#666",
    marginTop: 4
  },
  vendorMeta: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  metaText: {
    fontSize: 11,
    color: "#666"
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 8,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  productColor: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12
  },
  productContent: {
    flex: 1
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937"
  },
  productShop: {
    fontSize: 11,
    color: "#666",
    marginTop: 2
  },
  priceContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00A86B"
  },
  mrp: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through"
  },
  productBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#FEE2E2",
    borderRadius: 4
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#E11D48"
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32
  },
  emptyStateText: {
    fontSize: 14,
    color: "#999",
    marginTop: 12
  },
  // ==================== VENDOR PORTAL ====================
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 8
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 4
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8
  },
  infoText: {
    fontSize: 13,
    color: "#00A86B",
    fontWeight: "600"
  },
  row: {
    flexDirection: "row",
    gap: 8
  },
  // ==================== ADMIN PORTAL ====================
  adminCard: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  adminCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12
  },
  adminCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937"
  },
  adminCardSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4
  },
  statusBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#E11D48"
  },
  adminCardText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6
  },
  adminCardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  approveButton: {
    flex: 1,
    backgroundColor: "#00A86B",
    flexDirection: "row",
    justifyContent: "center"
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#E11D48",
    flexDirection: "row",
    justifyContent: "center"
  }
});
