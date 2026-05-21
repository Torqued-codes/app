import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";

/**
 * Create or update vendor profile
 */
export const createVendorProfile = async (userId, vendorData) => {
  try {
    await setDoc(doc(db, "vendors", userId), {
      userId: userId,
      email: vendorData.email || "",
      ownerName: vendorData.ownerName || "",
      phone: vendorData.phone || "",
      shopName: vendorData.shopName || "",
      approvalStatus: "pending", // "pending", "approved", "rejected"
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Add address to vendor profile
 */
export const addVendorAddress = async (vendorId, addressData) => {
  try {
    const addressRef = doc(collection(db, "vendors", vendorId, "addresses"));
    
    await setDoc(addressRef, {
      shopName: addressData.shopName || "",
      fullAddress: addressData.fullAddress || "",
      postalCode: addressData.postalCode || "",
      pincode: addressData.pincode || addressData.postalCode || "",
      city: addressData.city || "",
      state: addressData.state || "",
      landmark: addressData.landmark || "",
      isDefault: addressData.isDefault || false,
      coordinates: addressData.coordinates || {
        latitude: null,
        longitude: null
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // Update main vendor document with postal code for locality matching
    await updateDoc(doc(db, "vendors", vendorId), {
      primaryPostalCode: addressData.pincode || addressData.postalCode,
      primaryCity: addressData.city,
      updatedAt: Timestamp.now()
    });
    
    return addressRef.id;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Get vendor profile
 */
export const getVendorProfile = async (vendorId) => {
  try {
    const vendorDoc = await getDoc(doc(db, "vendors", vendorId));
    if (vendorDoc.exists()) {
      return { id: vendorDoc.id, ...vendorDoc.data() };
    }
    return null;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Get all vendor addresses
 */
export const getVendorAddresses = async (vendorId) => {
  try {
    const addressesSnapshot = await getDocs(
      collection(db, "vendors", vendorId, "addresses")
    );
    
    return addressesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Update vendor address
 */
export const updateVendorAddress = async (vendorId, addressId, addressData) => {
  try {
    await updateDoc(doc(db, "vendors", vendorId, "addresses", addressId), {
      ...addressData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Get nearby vendors by postal code/pincode
 */
export const getNearbyVendors = async (postalCode, city, limit_count = 20) => {
  try {
    let q;
    
    // Query by postal code and city
    if (city) {
      q = query(
        collection(db, "vendors"),
        where("primaryPostalCode", "==", postalCode),
        where("primaryCity", "==", city),
        where("approvalStatus", "==", "approved"),
        limit(limit_count)
      );
    } else {
      q = query(
        collection(db, "vendors"),
        where("primaryPostalCode", "==", postalCode),
        where("approvalStatus", "==", "approved"),
        limit(limit_count)
      );
    }
    
    const vendorsSnapshot = await getDocs(q);
    const vendors = [];
    
    for (const vendorDoc of vendorsSnapshot.docs) {
      const vendorData = vendorDoc.data();
      // Get addresses for each vendor
      const addresses = await getVendorAddresses(vendorDoc.id);
      vendors.push({
        id: vendorDoc.id,
        ...vendorData,
        addresses: addresses
      });
    }
    
    return vendors;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Get nearby vendors by coordinates (latitude, longitude)
 * Note: For production, consider using Cloud Functions for advanced geospatial queries
 */
export const getNearbyVendorsByCoordinates = async (latitude, longitude, radiusKm = 5) => {
  try {
    // Get all approved vendors
    const q = query(
      collection(db, "vendors"),
      where("approvalStatus", "==", "approved")
    );
    
    const vendorsSnapshot = await getDocs(q);
    const vendors = [];
    
    // Filter vendors within radius
    for (const vendorDoc of vendorsSnapshot.docs) {
      const vendorData = vendorDoc.data();
      const addresses = await getVendorAddresses(vendorDoc.id);
      
      // Calculate distance for each address
      const addressesWithDistance = addresses.map((addr) => ({
        ...addr,
        distance: calculateDistance(
          latitude,
          longitude,
          addr.coordinates?.latitude,
          addr.coordinates?.longitude
        )
      }));
      
      // Filter addresses within radius
      const nearbyAddresses = addressesWithDistance.filter(
        (addr) => addr.distance !== null && addr.distance <= radiusKm
      );
      
      if (nearbyAddresses.length > 0) {
        vendors.push({
          id: vendorDoc.id,
          ...vendorData,
          addresses: nearbyAddresses,
          minDistance: Math.min(...nearbyAddresses.map((a) => a.distance))
        });
      }
    }
    
    // Sort by minimum distance
    vendors.sort((a, b) => a.minDistance - b.minDistance);
    
    return vendors;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

/**
 * Get pending vendor applications (for admin)
 */
export const getPendingVendorApplications = async () => {
  try {
    const q = query(
      collection(db, "vendors"),
      where("approvalStatus", "==", "pending"),
      orderBy("createdAt", "desc")
    );
    
    const vendorsSnapshot = await getDocs(q);
    const vendors = [];
    
    for (const vendorDoc of vendorsSnapshot.docs) {
      const vendorData = vendorDoc.data();
      const addresses = await getVendorAddresses(vendorDoc.id);
      vendors.push({
        id: vendorDoc.id,
        ...vendorData,
        addresses: addresses
      });
    }
    
    return vendors;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Approve vendor application (admin only)
 */
export const approveVendor = async (vendorId, adminId) => {
  try {
    await updateDoc(doc(db, "vendors", vendorId), {
      approvalStatus: "approved",
      approvedBy: adminId,
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Reject vendor application (admin only)
 */
export const rejectVendor = async (vendorId, adminId, reason = "") => {
  try {
    await updateDoc(doc(db, "vendors", vendorId), {
      approvalStatus: "rejected",
      rejectionReason: reason,
      rejectedBy: adminId,
      rejectedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Update vendor profile
 */
export const updateVendorProfile = async (vendorId, updates) => {
  try {
    await updateDoc(doc(db, "vendors", vendorId), {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    throw new Error(error.message);
  }
};
