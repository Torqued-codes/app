import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const jwtSecret = process.env.JWT_SECRET || "dev-only-secret";
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/street-connect";

app.use(cors());
app.use(express.json());

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "vendor", "admin"],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "active"
    }
  },
  { timestamps: true }
);

userSchema.index({ email: 1, role: 1 }, { unique: true });

const vendorProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    shopName: { type: String, required: true, trim: true },
    fullAddress: { type: String, required: true, trim: true },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date
  },
  { timestamps: true }
);

vendorProfileSchema.index({ userId: 1, approvalStatus: 1 });

const User = mongoose.model("User", userSchema);
const VendorProfile = mongoose.model("VendorProfile", vendorProfileSchema);

function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email
    },
    jwtSecret,
    { expiresIn: "7d" }
  );
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.sub);

    if (!user || user.status === "suspended") {
      return res.status(401).json({ message: "Invalid user" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
}

function serializeVendor(vendor) {
  return {
    _id: vendor._id,
    ownerName: vendor.ownerName,
    phone: vendor.phone,
    shopName: vendor.shopName,
    fullAddress: vendor.fullAddress,
    email: vendor.email,
    approvalStatus: vendor.approvalStatus,
    submittedAt: vendor.createdAt ? vendor.createdAt.toLocaleString() : "Just now"
  };
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/demo-login", async (req, res) => {
  const { email, name, password, phone, role } = req.body;

  if (!email || !name || !password || !phone || !role) {
    return res.status(400).json({ message: "Missing login fields" });
  }

  if (!["customer", "vendor", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase(), role },
    {
      email,
      name,
      phone,
      passwordHash: `demo:${password}`,
      role,
      status: "active"
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json({
    token: signToken(user),
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role
    }
  });
});

app.post("/api/auth/google", async (req, res) => {
  const { accessToken, role } = req.body;

  if (!accessToken || !role) {
    return res.status(400).json({ message: "Missing Google login fields" });
  }

  if (!["customer", "vendor", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!profileResponse.ok) {
    return res.status(401).json({ message: "Invalid Google token" });
  }

  const profile = await profileResponse.json();

  if (!profile.email) {
    return res.status(400).json({ message: "Google account email is required" });
  }

  const user = await User.findOneAndUpdate(
    { email: profile.email.toLowerCase(), role },
    {
      email: profile.email,
      name: profile.name || profile.email,
      phone: "",
      passwordHash: `google:${profile.sub}`,
      role,
      status: "active"
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json({
    token: signToken(user),
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role
    }
  });
});

app.post("/api/vendor-applications", requireAuth, requireRole("vendor"), async (req, res) => {
  const { fullAddress, ownerName, phone, shopName } = req.body;

  if (!fullAddress || !ownerName || !phone || !shopName) {
    return res.status(400).json({ message: "Missing vendor application fields" });
  }

  const vendor = await VendorProfile.create({
    userId: req.user._id,
    email: req.user.email,
    ownerName,
    phone,
    shopName,
    fullAddress,
    approvalStatus: "pending"
  });

  res.status(201).json({ vendor: serializeVendor(vendor) });
});

app.get(
  "/api/admin/vendors/pending",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const vendors = await VendorProfile.find({ approvalStatus: "pending" })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ vendors: vendors.map(serializeVendor) });
  }
);

app.patch(
  "/api/admin/vendors/:id/approve",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const vendor = await VendorProfile.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus: "approved",
        approvedBy: req.user._id,
        approvedAt: new Date()
      },
      { new: true }
    );

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.json({ vendor: serializeVendor(vendor) });
  }
);

mongoose
  .connect(mongoUri)
  .then(() => {
    app.listen(port, () => {
      console.log(`Street Connect API running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  });
