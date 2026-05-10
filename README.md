# Street Connect

A React Native marketplace starter built with Expo. It models three entry
paths: customers, vendors waiting for approval, and admins who approve and
manage shops.

## App Flow

- Vendors sign up through an onboarding form with owner name, phone, shop name,
  and full address. New vendor accounts are saved as `pending` and cannot list
  items or appear in the customer feed.
- Customers sign up or log in normally, grant location permission, and see
  approved vendors sorted by proximity.
- Admins use a protected dashboard to approve vendors, edit shops, delete
  suspicious listings, and manage app settings.

## MongoDB Schema

Use MongoDB with role-based permissions. Keep auth identity separate from shop
approval so a vendor can log in but still be blocked from selling.

```js
// users
{
  _id: ObjectId,
  email: String,
  passwordHash: String,
  role: "customer" | "vendor" | "admin",
  status: "active" | "pending" | "suspended",
  phone: String,
  createdAt: Date,
  updatedAt: Date
}

// vendor_profiles
{
  _id: ObjectId,
  userId: ObjectId,
  ownerName: String,
  phone: String,
  shopName: String,
  fullAddress: String,
  approvalStatus: "pending" | "approved" | "rejected",
  approvedBy: ObjectId,
  approvedAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// shops
{
  _id: ObjectId,
  vendorId: ObjectId,
  name: String,
  description: String,
  category: String,
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  location: {
    type: "Point",
    coordinates: [Number, Number] // [longitude, latitude]
  },
  status: "draft" | "live" | "hidden" | "deleted",
  createdAt: Date,
  updatedAt: Date
}

// products
{
  _id: ObjectId,
  shopId: ObjectId,
  vendorId: ObjectId,
  name: String,
  price: Number,
  inventory: Number,
  status: "active" | "hidden" | "deleted",
  createdAt: Date,
  updatedAt: Date
}
```

Create a `2dsphere` index for location search:

```js
db.shops.createIndex({ location: "2dsphere" });
db.users.createIndex({ email: 1 }, { unique: true });
db.vendor_profiles.createIndex({ userId: 1 }, { unique: true });
db.vendor_profiles.createIndex({ approvalStatus: 1 });
```

## Permission Rules

- `customer`: can view only `shops.status = "live"` from approved vendors,
  place orders, and manage their own account.
- `vendor`: can manage only their own shop and products after
  `approvalStatus = "approved"`. Pending vendors can only view their onboarding
  status.
- `admin`: can approve vendors, hide or delete shops, edit listings, and manage
  settings.

Backend route guards should check both `role` and resource ownership. For
example, `POST /shops` requires `role = "vendor"` and an approved vendor
profile; `PATCH /admin/vendors/:id/approve` requires `role = "admin"`.

## Location Plan

1. Ask customers for GPS permission after login.
2. Convert vendor addresses to coordinates through a geocoding provider when an
   admin approves the vendor.
3. Save the result in `shops.location`.
4. Query nearby shops with MongoDB `$near` or `$geoNear` and return approved,
   live shops first.

## Run

Install mobile dependencies:

```powershell
npm.cmd install
```

Start the React Native app:

```powershell
npm.cmd start -- --clear
```

Then scan the QR code with Expo Go.

## MongoDB Backend

The mobile app does not connect directly to MongoDB. Vendor applications go
through a backend API, and pending vendors are only returned from protected admin
routes.

Create `backend/.env` from `backend/.env.example`:

```powershell
cd backend
copy .env.example .env
```

Set `MONGODB_URI` to your MongoDB connection string. This can be local MongoDB or
MongoDB Atlas.

Install and run the backend:

```powershell
cd backend
npm.cmd install
npm.cmd run dev
```

The API runs on `http://localhost:4000`.

For Expo Go on a physical phone, replace `API_BASE_URL` in `App.js` with your
computer's LAN IP, for example:

```js
const API_BASE_URL = "http://192.168.1.25:4000/api";
```

Protected backend routes:

- `POST /api/vendor-applications`: vendor-only, saves a pending vendor in
  MongoDB.
- `GET /api/admin/vendors/pending`: admin-only, returns pending vendors.
- `PATCH /api/admin/vendors/:id/approve`: admin-only, approves a vendor.

## Google Login

Vendor, User, and Admin login screens include **Continue with Google**. To make
it work on your phone, create OAuth client IDs in Google Cloud Console and set
them before starting Expo:

```powershell
$env:EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID="your-web-client-id.apps.googleusercontent.com"
$env:EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID="your-android-client-id.apps.googleusercontent.com"
$env:EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID="your-ios-client-id.apps.googleusercontent.com"
npm.cmd start -- --clear
```

The backend route `POST /api/auth/google` verifies the Google access token with
Google, then creates or logs in the user with the selected role.

For Expo Go and local backend testing, also set `API_BASE_URL` in `App.js` to
your laptop's Wi-Fi IP instead of `localhost`.
