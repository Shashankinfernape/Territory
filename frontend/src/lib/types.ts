export interface DocumentItem {
  type: string;  // e.g. "Patta", "Chitta", "FMB Sketch"
  url: string;   // relative path on backend
}

export interface Property {
  id: string;
  seller_id: string;
  city: string;
  district: string;
  state: string;
  area: number;
  area_unit: string;
  price: number;
  type: string;
  keywords: string[];
  description?: string;
  documents: DocumentItem[];
  images?: string[];
  status: string;
  view_count: number;
  soil_type?: string;
  water_source?: string;
  road_access?: string;
  fencing?: string;
  electricity: boolean;
  irrigation: boolean;
  nearby_town?: string;
  distance_from_town_km?: number;
  taluk?: string;
}

export interface User {
  id: string;
  phone_number: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  full_name?: string;
}

export interface PlatformStats {
  total_users: number;
  total_properties: number;
  active_properties: number;
  pending_properties: number;
  total_transactions: number;
  total_revenue: number;
}

export interface AdminTransaction {
  id: string;
  buyer_id: string;
  buyer_phone: string;
  property_id: string;
  property_city: string;
  property_district: string;
  amount: number;
  status: string;
  created_at?: string;
}

export interface AdminUser {
  id: string;
  phone_number: string;
  role: string;
  full_name?: string;
  kyc_details?: { status: string; aadhaar_number?: string; pan_number?: string; };
  created_at?: string;
}

export interface AdminProperty {
  id: string;
  seller_id: string;
  city: string;
  district?: string;
  type?: string;
  price?: number;
  area?: number;
  area_unit?: string;
  status: string;
  view_count: number;
  created_at?: string;
  documents?: DocumentItem[];
  images?: string[];
}

export const LAND_TYPES = [
  'Agricultural Land',
  'Farm Land',
  'Flat Plot',
  'Residential Plot',
  'Commercial Plot',
] as const;

export type LandType = typeof LAND_TYPES[number];

export const AREA_UNITS = ['acres', 'sq_ft', 'cents', 'hectares'] as const;
export const SOIL_TYPES = ['Red Soil', 'Black Soil', 'Alluvial Soil', 'Laterite Soil', 'Sandy Soil', 'Clay Soil'] as const;
export const WATER_SOURCES = ['Borewell', 'Open Well', 'Canal', 'River', 'Rainfed', 'None'] as const;
export const ROAD_ACCESS_TYPES = ['National Highway', 'State Highway', 'District Road', 'Village Road', 'Mud Road', 'No Road'] as const;
export const FENCING_TYPES = ['Compound Wall', 'Wire Fence', 'Partial', 'None'] as const;

export const PROPERTY_IMAGES: Record<string, string> = {
  'Agricultural Land': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
  'Farm Land': 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80',
  'Flat Plot': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
  'Residential Plot': 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80',
  'Commercial Plot': 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
};

export const getPropertyImageUrl = (property: Property | AdminProperty) => {
  if (property.images && property.images.length > 0) {
    const firstImg = property.images[0];
    if (firstImg.startsWith('http')) return firstImg;
    // Map relative uploads path to backend root
    const rootUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api/v1', '') 
      : 'http://localhost:8000';
    return `${rootUrl}${firstImg}`;
  }
  return PROPERTY_IMAGES[property.type || ''] ?? PROPERTY_IMAGES.default;
};

export const getAllPropertyImageUrls = (property: Property | AdminProperty): string[] => {
  if (property.images && property.images.length > 0) {
    const rootUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api/v1', '') 
      : 'http://localhost:8000';
    return property.images.map(img => {
      if (img.startsWith('http')) return img;
      return `${rootUrl}${img}`;
    });
  }
  return [PROPERTY_IMAGES[property.type || ''] ?? PROPERTY_IMAGES.default];
};
