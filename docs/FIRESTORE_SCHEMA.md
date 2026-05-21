# Firestore Database Schema

## Collection Structure

### 1. users
Stores user profile information for all roles (customer, vendor, admin)

```
users/{uid}
├── uid: string (Firebase Auth UID)
├── email: string
├── name: string
├── phone: string (optional)
├── role: string (customer | vendor | admin)
├── status: string (active | pending | suspended)
├── photoURL: string (optional)
├── createdAt: timestamp
└── updatedAt: timestamp
```

**Indexes:**
- Single field: role, status
- Composite: email + role (for unique constraint)

**Firestore Rules:**
- Users can read/write their own documents
- Admins can read all users
- Email + role should be unique

---

### 2. vendors
Stores vendor business information

```
vendors/{vendorId}
├── userId: string (Reference to user UID)
├── email: string
├── ownerName: string
├── phone: string
├── shopName: string
├── primaryPostalCode: string (for locality matching)
├── primaryCity: string
├── approvalStatus: string (pending | approved | rejected)
├── approvedBy: string (Admin UID who approved)
├── approvedAt: timestamp
├── rejectionReason: string (optional)
├── rejectedBy: string (Admin UID who rejected)
├── rejectedAt: timestamp
├── createdAt: timestamp
└── updatedAt: timestamp
```

**Sub-collections:**
- `addresses/{addressId}` - Vendor addresses (see below)

**Indexes:**
- Single field: approvalStatus, primaryPostalCode, primaryCity
- Composite: primaryPostalCode + approvalStatus + createdAt

**Firestore Rules:**
- Vendors can read/write their own vendor document
- Admins can read all vendors
- Only users with vendor role can create vendor documents

---

### 3. vendors/{vendorId}/addresses
Stores multiple addresses for each vendor (sub-collection)

```
vendors/{vendorId}/addresses/{addressId}
├── shopName: string
├── fullAddress: string
├── postalCode: string
├── pincode: string (same as postalCode)
├── city: string
├── state: string
├── landmark: string (optional)
├── isDefault: boolean
├── coordinates: {
│   ├── latitude: number (nullable)
│   └── longitude: number (nullable)
├── createdAt: timestamp
└── updatedAt: timestamp
```

**Indexes:**
- Single field: isDefault
- Composite: postalCode + city

**Firestore Rules:**
- Vendors can read/write addresses for their own vendor document
- Customers can read vendor addresses
- Admins can read all addresses

---

### 4. products (For Future Use)
Stores product information

```
products/{productId}
├── vendorId: string (Reference to vendor)
├── name: string
├── description: string
├── category: string
├── price: number
├── originalPrice: number
├── image: string (Firebase Storage URL)
├── unit: string (e.g., "6 pcs", "1 kg")
├── stock: number
├── badge: string (optional)
├── createdAt: timestamp
└── updatedAt: timestamp
```

**Indexes:**
- Single field: vendorId, category
- Composite: vendorId + category

---

### 5. orders (For Future Use)
Stores customer orders

```
orders/{orderId}
├── userId: string (Customer UID)
├── vendorId: string (Vendor UID)
├── items: array [{
│   ├── productId: string
│   ├── name: string
│   ├── price: number
│   └── quantity: number
├── ]
├── totalPrice: number
├── status: string (pending | confirmed | delivered | cancelled)
├── deliveryAddress: string
├── createdAt: timestamp
└── updatedAt: timestamp
```

**Indexes:**
- Composite: userId + createdAt (desc)
- Composite: vendorId + status

---

## Collection Relationships

```
┌─────────────────────────────────────────────┐
│              Firestore Database             │
├─────────────────────────────────────────────┤
│                    users                    │
│  (Customers, Vendors, Admins)             │
└────────────────┬──────────────────────────┘
                 │
                 ├─→ vendors (with userId reference)
                 │   └─→ addresses (sub-collection)
                 │
                 └─→ orders (with userId reference)
                     └─→ items (array in order doc)
```

---

## Locality/Postal Code Matching Strategy

### For Finding Nearby Vendors:

1. **By Postal Code & City (Recommended)**
   ```javascript
   const query = db.collection('vendors')
     .where('primaryPostalCode', '==', userPostalCode)
     .where('primaryCity', '==', userCity)
     .where('approvalStatus', '==', 'approved');
   ```

2. **By Coordinates (Future Enhancement)**
   - Store latitude/longitude in addresses
   - Implement Cloud Function for geospatial queries
   - Use `geopoint` field type for advanced queries

3. **Hybrid Approach**
   - Query by postal code first
   - Calculate distance using coordinates
   - Sort by distance

---

## Sample Data for Testing

### Sample User (Customer)
```json
{
  "uid": "cust-123",
  "email": "customer@example.com",
  "name": "John Doe",
  "phone": "+919876543210",
  "role": "customer",
  "status": "active",
  "createdAt": "2024-05-01T10:00:00Z",
  "updatedAt": "2024-05-01T10:00:00Z"
}
```

### Sample Vendor
```json
{
  "userId": "vendor-456",
  "email": "vendor@example.com",
  "ownerName": "Raj Kumar",
  "phone": "+919876543211",
  "shopName": "Fresh Market",
  "primaryPostalCode": "560038",
  "primaryCity": "Bangalore",
  "approvalStatus": "approved",
  "approvedBy": "admin-789",
  "approvedAt": "2024-05-02T15:30:00Z",
  "createdAt": "2024-05-01T11:00:00Z",
  "updatedAt": "2024-05-02T15:30:00Z"
}
```

### Sample Vendor Address
```json
{
  "shopName": "Fresh Market Main",
  "fullAddress": "18 Lake Road, Indiranagar, Bangalore",
  "postalCode": "560038",
  "pincode": "560038",
  "city": "Bangalore",
  "state": "Karnataka",
  "landmark": "Near Indiranagar Metro Station",
  "isDefault": true,
  "coordinates": {
    "latitude": 13.3428,
    "longitude": 77.6394
  },
  "createdAt": "2024-05-01T11:00:00Z",
  "updatedAt": "2024-05-01T11:00:00Z"
}
```

---

## Best Practices

1. **Postal Code Indexing**: Always index `primaryPostalCode` and `primaryCity` for fast queries
2. **Pagination**: Use limit() and offset for large result sets
3. **Denormalization**: Store vendor name in order items to avoid join queries
4. **Timestamps**: Always use server timestamp from Firestore
5. **Validation**: Validate data at both client and backend
6. **Security**: Use Firestore Rules to enforce data access (see firebaseRulesExample.txt)

---

## Migration Notes

- All MongoDB collections (User, VendorProfile) have been migrated to Firestore
- MongoDB ObjectIds replaced with Firebase Auth UIDs and Firestore document IDs
- JWT tokens replaced with Firebase ID tokens
- Timestamps use Firestore Timestamp objects
