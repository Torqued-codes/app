import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.join(__dirname, "../../.env");
const backendEnvPath = path.join(__dirname, "../.env");

// Prefer one project-level .env. Keep backend/.env as a fallback for older setups.
dotenv.config({
  path: fs.existsSync(rootEnvPath) ? rootEnvPath : backendEnvPath
});

const app = express();
const port = process.env.PORT || 4000;

function normalizePrivateKey(privateKey = "") {
  return privateKey
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n");
}

function getServiceAccountFromEnv() {
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  const credential = {
    projectId: process.env.FIREBASE_PROJECT_ID?.trim(),
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID?.trim().replace(/^["']|["']$/g, ""),
    privateKey,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.trim(),
    clientId: process.env.FIREBASE_CLIENT_ID?.trim().replace(/^["']|["']$/g, ""),
    authUri: process.env.FIREBASE_AUTH_URI?.trim(),
    tokenUri: process.env.FIREBASE_TOKEN_URI?.trim()
  };

  const missingFields = Object.entries(credential)
    .filter(([, value]) => !value || value.startsWith("your-"))
    .map(([key]) => key);

  if (missingFields.length > 0) {
    throw new Error(
      `Missing Firebase Admin credentials: ${missingFields.join(", ")}. ` +
        "Use a Firebase Admin SDK service-account JSON, not google-services.json."
    );
  }

  if (
    !privateKey.includes("-----BEGIN PRIVATE KEY-----") ||
    !privateKey.includes("-----END PRIVATE KEY-----")
  ) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY is not a valid PEM private key. " +
        `Current value length is ${privateKey.length}. ` +
        "Copy the full private_key from a Firebase Admin SDK service-account JSON."
    );
  }

  return credential;
}

// Initialize Firebase Admin SDK
try {
  const serviceAccountPath = path.join(__dirname, "../firebase-service-account.json");
  
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    // Alternative: Initialize using environment variables
    admin.initializeApp({
      credential: admin.credential.cert(getServiceAccountFromEnv())
    });
  }
  
  console.log("Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("Failed to initialize Firebase Admin SDK:", error);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

app.use(cors());
app.use(express.json());

/**
 * Middleware: Verify Firebase ID token
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    
    // Get user document from Firestore
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    if (!userDoc.exists()) {
      return res.status(401).json({ message: "User not found" });
    }
    
    req.userData = userDoc.data();
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

/**
 * Middleware: Check user role
 */
function requireRole(role) {
  return (req, res, next) => {
    if (req.userData.role !== role) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }
    next();
  };
}

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Server is running" });
});

/**
 * Get current user data
 */
app.get("/api/users/me", verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    if (!userDoc.exists()) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      user: {
        id: userDoc.id,
        ...userDoc.data()
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Create vendor profile with address
 */
app.post("/api/vendors", verifyToken, requireRole("vendor"), async (req, res) => {
  try {
    const { ownerName, phone, shopName, fullAddress, postalCode, pincode, city, state, landmark } = req.body;

    if (!shopName || !fullAddress || !city) {
      return res.status(400).json({ message: "Missing required vendor fields" });
    }

    // Create vendor document
    const vendorRef = db.collection("vendors").doc(req.user.uid);
    await vendorRef.set({
      userId: req.user.uid,
      email: req.user.email || "",
      ownerName: ownerName || "",
      phone: phone || "",
      shopName,
      primaryPostalCode: pincode || postalCode,
      primaryCity: city,
      approvalStatus: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create address sub-collection
    const addressRef = vendorRef.collection("addresses").doc();
    await addressRef.set({
      shopName,
      fullAddress,
      postalCode: pincode || postalCode,
      pincode: pincode || postalCode,
      city,
      state: state || "",
      landmark: landmark || "",
      isDefault: true,
      coordinates: {
        latitude: null,
        longitude: null
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
      message: "Vendor profile created successfully",
      vendor: {
        id: req.user.uid,
        shopName,
        approvalStatus: "pending"
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get vendor profile
 */
app.get("/api/vendors/:vendorId", verifyToken, async (req, res) => {
  try {
    const vendorDoc = await db.collection("vendors").doc(req.params.vendorId).get();
    
    if (!vendorDoc.exists) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Get addresses
    const addressesSnapshot = await vendorDoc.ref.collection("addresses").get();
    const addresses = addressesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      vendor: {
        id: vendorDoc.id,
        ...vendorDoc.data(),
        addresses
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Add address to vendor
 */
app.post("/api/vendors/:vendorId/addresses", verifyToken, async (req, res) => {
  try {
    // Check authorization
    if (req.user.uid !== req.params.vendorId && req.userData.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { shopName, fullAddress, postalCode, pincode, city, state, landmark } = req.body;

    if (!fullAddress || !city) {
      return res.status(400).json({ message: "Missing required address fields" });
    }

    const addressRef = db.collection("vendors").doc(req.params.vendorId).collection("addresses").doc();
    
    await addressRef.set({
      shopName: shopName || "",
      fullAddress,
      postalCode: pincode || postalCode,
      pincode: pincode || postalCode,
      city,
      state: state || "",
      landmark: landmark || "",
      isDefault: false,
      coordinates: {
        latitude: null,
        longitude: null
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update vendor's primary postal code
    await db.collection("vendors").doc(req.params.vendorId).update({
      primaryPostalCode: pincode || postalCode,
      primaryCity: city,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
      message: "Address added successfully",
      addressId: addressRef.id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get nearby vendors by postal code
 */
app.get("/api/vendors/nearby/postal/:postalCode", verifyToken, async (req, res) => {
  try {
    const { city } = req.query;
    const { postalCode } = req.params;

    let query = db.collection("vendors")
      .where("primaryPostalCode", "==", postalCode)
      .where("approvalStatus", "==", "approved");

    if (city) {
      query = query.where("primaryCity", "==", city);
    }

    const snapshot = await query.limit(20).get();
    
    const vendors = [];
    for (const doc of snapshot.docs) {
      const addresses = await doc.ref.collection("addresses").get();
      vendors.push({
        id: doc.id,
        ...doc.data(),
        addresses: addresses.docs.map((addrDoc) => ({
          id: addrDoc.id,
          ...addrDoc.data()
        }))
      });
    }

    res.json({ vendors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get pending vendor applications (admin only)
 */
app.get("/api/admin/vendors/pending", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const snapshot = await db.collection("vendors")
      .where("approvalStatus", "==", "pending")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const vendors = [];
    for (const doc of snapshot.docs) {
      const addresses = await doc.ref.collection("addresses").get();
      vendors.push({
        id: doc.id,
        ...doc.data(),
        addresses: addresses.docs.map((addrDoc) => ({
          id: addrDoc.id,
          ...addrDoc.data()
        }))
      });
    }

    res.json({ vendors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Approve vendor (admin only)
 */
app.patch("/api/admin/vendors/:vendorId/approve", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    await db.collection("vendors").doc(req.params.vendorId).update({
      approvalStatus: "approved",
      approvedBy: req.user.uid,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const vendorDoc = await db.collection("vendors").doc(req.params.vendorId).get();
    res.json({
      message: "Vendor approved successfully",
      vendor: {
        id: vendorDoc.id,
        ...vendorDoc.data()
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Reject vendor (admin only)
 */
app.patch("/api/admin/vendors/:vendorId/reject", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { reason } = req.body;

    await db.collection("vendors").doc(req.params.vendorId).update({
      approvalStatus: "rejected",
      rejectionReason: reason || "",
      rejectedBy: req.user.uid,
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const vendorDoc = await db.collection("vendors").doc(req.params.vendorId).get();
    res.json({
      message: "Vendor rejected successfully",
      vendor: {
        id: vendorDoc.id,
        ...vendorDoc.data()
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Street Connect API running on http://localhost:${port}`);
});
