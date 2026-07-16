import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip, Polygon, GeoJSON, useMapEvents, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api, getToken } from '../../lib/api';
import type { Property } from '../../lib/types';
import { useSettings } from '../../contexts/SettingsContext';
import { PropertyCard } from '../../components/ui/PropertyCard';
import { TAMIL_NADU_GEOJSON as OFFLINE_GEOJSON } from '../../components/common/tamilnadu_geojson';



// Styled Google Maps Tile Server (Hides all roads, highways, and place labels)
const MAP_TILES = 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&apistyle=s.t:0|s.e:l|p.v:off,s.t:3|p.v:off';

// Tamil Nadu center coordinates
const TN_CENTER: [number, number] = [11.1271, 78.6569];
const TN_ZOOM = 7.5;

interface MajorCity {
  name: string;
  coords: [number, number];
}

// Helper to normalize spellings across GeoJSON and directory keys
const getModernDistrict = (talukName: string, originalDistrict: string): string => {
  const t = normalizeName(talukName);
  const d = normalizeName(originalDistrict);


  // 1. Tirupattur (from Vellore)
  if (d === 'velore' && (t === 'tirupattur' || t === 'tirupatur' || t === 'vaniiambadi' || t === 'vaniambadi' || t === 'ambur' || t === 'natrampali')) {
    return 'Tirupattur';
  }
  // 2. Ranipet (from Vellore)
  if (d === 'velore' && (t === 'arakkonam' || t === 'arakonam' || t === 'arcot' || t === 'walajapet' || t === 'walajapeta' || t === 'walaja' || t === 'nemili' || t === 'sholinghur' || t === 'solingur' || t === 'kalavai')) {
    return 'Ranipet';
  }
  // 3. Chengalpattu (from Kancheepuram)
  if (d === 'kancipuram' && (t === 'cengalpatu' || t === 'ceiiur' || t === 'madurantakam' || t === 'tambaram' || t === 'pallavaram' || t === 'palavaram' || t === 'tirukalukundram' || t === 'tiruporur' || t === 'vandalur' || t === 'solinganallur' || t === 'solinganalur' || t === 'alandur')) {
    return 'Chengalpattu';
  }
  // 4. Tenkasi (from Tirunelveli)
  if (d === 'tirunelvelikatabo' && (t === 'tenkasi' || t === 'sankarankovil' || t === 'sankarankoil' || t === 'senkota' || t === 'sengota' || t === 'sivagiri' || t === 'kadayanallur' || t === 'kadaianalur' || t === 'tiruvengadam' || t === 'veerakeralamputhur' || t === 'virakeralamputur')) {
    return 'Tenkasi';
  }
  // 5. Kallakurichi (from Villupuram)
  if (d === 'vilupuram' && (t === 'kallakurichi' || t === 'kallakuricici' || t === 'kalakuricici' || t === 'tirukkoiilur' || t === 'sankarapuram' || t === 'chinnasalem' || t === 'cinnasalem' || t === 'ulundurpet' || t === 'ulundurpeta' || t === 'kalvarayanhills')) {
    return 'Kallakurichi';
  }
  // 6. Mayiladuthurai (from Nagapattinam)
  if (d === 'nagapatinam' && (t === 'mayiladuthurai' || t === 'maiiladutura' || t === 'sirkazi' || t === 'sirkali' || t === 'kuthalam' || t === 'kutalam' || t === 'tharangambadi' || t === 'tarangambadi')) {
    return 'Mayiladuthurai';
  }
  // 7. Krishnagiri (from Dharmapuri)
  if (d === 'darmapuri' && (t === 'krisnagiri' || t === 'osur' || t === 'denkanikota' || t === 'utangara' || t === 'pocampali' || t === 'sulagiri' || t === 'anceti')) {
    return 'Krishnagiri';
  }
  // 8. Tiruppur (from Coimbatore & Erode)
  if (d === 'coimbatore' && (t === 'tirupur' || t === 'avanasi' || t === 'udumalaipeta' || t === 'palladam')) {
    return 'Tiruppur';
  }
  if (d === 'erode' && (t === 'darapuram' || t === 'kangeyam')) {
    return 'Tiruppur';
  }

  // Fallbacks for spelling variations of main districts
  if (d === 'tirunelvelikatabo') return 'Tirunelveli';
  if (d === 'sivaganga') return 'Sivagangai';
  if (d === 'tiruchirappalli') return 'Tiruchirappalli (Trichy)';
  if (d === 'tiruvalur') return 'Tiruvallur';
  if (d === 'vilupuram') return 'Viluppuram';

  // Match based on name similarity or return original
  for (const target of TAMIL_NADU_DISTRICTS) {
    if (normalizeName(target) === d) {
      return target;
    }
  }

  return originalDistrict;
};

// Helper to normalize spellings across GeoJSON and directory keys
const normalizeName = (name: string): string => {
  let n = name.trim().toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\(.*\)/g, '')
    .replace(/h/g, '')
    .replace(/ee/g, 'i')
    .replace(/pp/g, 'p')
    .replace(/tt/g, 't')
    .replace(/ll/g, 'l')
    .replace(/ch/g, 'c')
    .replace(/ai$/g, 'a')
    .replace(/y/g, 'i');
  
  // Custom alias checks
  if (n === 'tiruppattur' || n === 'tirupatur') return 'tirupattur';
  if (n === 'kalakkuricici' || n === 'kallakuricici' || n === 'kalakuricici' || n === 'kallakkuricici') return 'kallakurichi';
  if (n === 'mayuram') return 'mayiladuthurai';
  if (n === 'nagappattinam' || n === 'nagapatinam') return 'nagapattinam';
  if (n === 'walajapet' || n === 'walajah') return 'ranipet';
  if (n === 'udaiyarpalaiyam') return 'ariyalur';
  if (n === 'kanniiakumari' || n === 'kanniakumari' || n === 'kaniakumari') return 'kanyakumari';
  if (n === 'tenilgiris' || n === 'nilgiris') return 'nilgiris';
  if (n === 'tiruccirapali' || n === 'tirucirapali') return 'tiruchirappalli';
  if (n === 'tuticorin' || n === 'tootukudi' || n === 'tutucorin') return 'thoothukudi';
  return n;
};

// Official 38 districts of Tamil Nadu
const TAMIL_NADU_DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri",
  "Dindigul", "Erode", "Kallakurichi", "Kancheepuram", "Kanniyakumari", "Karur",
  "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris",
  "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivagangai",
  "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli (Trichy)", "Tirunelveli",
  "Tirupattur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore",
  "Viluppuram", "Virudhunagar"
];

// Thorough mapping of all districts to their curated major/big cities
const DISTRICT_CITIES: Record<string, MajorCity[]> = {
  [normalizeName("Chennai")]: [
    { name: "Chennai City", coords: [13.0827, 80.2707] },
    { name: "Adyar", coords: [13.0012, 80.2565] },
    { name: "Anna Nagar", coords: [13.0850, 80.2101] }
  ],
  [normalizeName("Chengalpattu")]: [
    { name: "Chengalpattu", coords: [12.6841, 79.9836] },
    { name: "Tambaram", coords: [12.9229, 80.1275] },
    { name: "Pallavaram", coords: [12.9675, 80.1849] },
    { name: "Mahabalipuram", coords: [12.6208, 80.1945] }
  ],
  [normalizeName("Kanchipuram")]: [
    { name: "Kanchipuram", coords: [12.8342, 79.7036] },
    { name: "Sriperumbudur", coords: [12.9712, 79.9515] }
  ],
  [normalizeName("Kancheepuram")]: [
    { name: "Kanchipuram", coords: [12.8342, 79.7036] },
    { name: "Sriperumbudur", coords: [12.9712, 79.9515] }
  ],
  [normalizeName("Vellore")]: [
    { name: "Vellore", coords: [12.9165, 79.1325] },
    { name: "Katpadi", coords: [12.9818, 79.1396] },
    { name: "Gudiyatham", coords: [12.9463, 78.8711] },
    { name: "Pernambut", coords: [12.9378, 78.7186] }
  ],
  [normalizeName("Tirupattur")]: [
    { name: "Tirupattur", coords: [12.4918, 78.5676] },
    { name: "Ambur", coords: [12.7909, 78.7166] },
    { name: "Vaniyambadi", coords: [12.6845, 78.6186] }
  ],
  [normalizeName("Ranipet")]: [
    { name: "Ranipet", coords: [12.9272, 79.3328] },
    { name: "Arcot", coords: [12.8996, 79.3339] },
    { name: "Arakkonam", coords: [13.0850, 79.6677] }
  ],
  [normalizeName("Coimbatore")]: [
    { name: "Coimbatore", coords: [11.0168, 76.9558] },
    { name: "Pollachi", coords: [10.6589, 77.0091] },
    { name: "Mettupalayam", coords: [11.3006, 76.9407] }
  ],
  [normalizeName("Madurai")]: [
    { name: "Madurai", coords: [9.9252, 78.1198] },
    { name: "Melur", coords: [10.0447, 78.3377] },
    { name: "Thirumangalam", coords: [9.8236, 77.9894] }
  ],
  [normalizeName("Salem")]: [
    { name: "Salem", coords: [11.6643, 78.1460] },
    { name: "Mettur", coords: [11.7862, 77.8012] },
    { name: "Attur", coords: [11.5976, 78.5971] }
  ],
  [normalizeName("Tiruchirappalli")]: [
    { name: "Trichy", coords: [10.7905, 78.7047] },
    { name: "Srirangam", coords: [10.8622, 78.6882] },
    { name: "Manapparai", coords: [10.6074, 78.4172] }
  ],
  [normalizeName("Tiruchirappalli (Trichy)")]: [
    { name: "Trichy", coords: [10.7905, 78.7047] },
    { name: "Srirangam", coords: [10.8622, 78.6882] },
    { name: "Manapparai", coords: [10.6074, 78.4172] }
  ],
  [normalizeName("Tiruppur")]: [
    { name: "Tiruppur", coords: [11.1085, 77.3411] },
    { name: "Palladam", coords: [10.9882, 77.2755] },
    { name: "Udumalaipettai", coords: [10.5847, 77.2431] }
  ],
  [normalizeName("Erode")]: [
    { name: "Erode", coords: [11.3410, 77.7172] },
    { name: "Gobichettipalayam", coords: [11.4533, 77.4385] },
    { name: "Bhavani", coords: [11.4429, 77.6797] }
  ],
  [normalizeName("Kanyakumari")]: [
    { name: "Nagercoil", coords: [8.1830, 77.4119] },
    { name: "Kanyakumari", coords: [8.0883, 77.5385] }
  ],
  [normalizeName("Kanniyakumari")]: [
    { name: "Nagercoil", coords: [8.1830, 77.4119] },
    { name: "Kanyakumari", coords: [8.0883, 77.5385] }
  ],
  [normalizeName("Ariyalur")]: [
    { name: "Ariyalur", coords: [11.1401, 79.0747] },
    { name: "Jayamkondam", coords: [11.2132, 79.3496] }
  ],
  [normalizeName("Cuddalore")]: [
    { name: "Cuddalore", coords: [11.7480, 79.7714] },
    { name: "Chidambaram", coords: [11.3984, 79.6954] },
    { name: "Neyveli", coords: [11.6053, 79.4862] }
  ],
  [normalizeName("Dharmapuri")]: [
    { name: "Dharmapuri", coords: [12.1278, 78.1579] },
    { name: "Harur", coords: [12.0624, 78.4908] }
  ],
  [normalizeName("Dindigul")]: [
    { name: "Dindigul", coords: [10.3673, 77.9803] },
    { name: "Palani", coords: [10.4492, 77.5218] },
    { name: "Kodaikanal", coords: [10.2381, 77.4892] }
  ],
  [normalizeName("Kallakurichi")]: [
    { name: "Kallakurichi", coords: [11.7381, 78.9625] },
    { name: "Ulundurpet", coords: [11.6896, 79.2903] }
  ],
  [normalizeName("Karur")]: [
    { name: "Karur", coords: [10.9601, 78.0766] },
    { name: "Kulithalai", coords: [10.9333, 78.4167] }
  ],
  [normalizeName("Krishnagiri")]: [
    { name: "Krishnagiri", coords: [12.5186, 78.2138] },
    { name: "Hosur", coords: [12.7409, 77.8253] }
  ],
  [normalizeName("Mayiladuthurai")]: [
    { name: "Mayiladuthurai", coords: [11.1018, 79.6522] },
    { name: "Sirkazhi", coords: [11.2367, 79.7333] }
  ],
  [normalizeName("Nagapattinam")]: [
    { name: "Nagapattinam", coords: [10.7672, 79.8449] },
    { name: "Vedaranyam", coords: [10.3754, 79.7849] }
  ],
  [normalizeName("Namakkal")]: [
    { name: "Namakkal", coords: [11.2189, 78.1673] },
    { name: "Tiruchengode", coords: [11.3789, 77.8937] }
  ],
  [normalizeName("Nilgiris")]: [
    { name: "Ooty", coords: [11.4102, 76.6950] },
    { name: "Coonoor", coords: [11.3530, 76.7959] }
  ],
  [normalizeName("Perambalur")]: [
    { name: "Perambalur", coords: [11.2342, 78.8821] }
  ],
  [normalizeName("Pudukkottai")]: [
    { name: "Pudukkottai", coords: [10.3797, 78.8208] },
    { name: "Aranthangi", coords: [10.1652, 78.9959] }
  ],
  [normalizeName("Ramanathapuram")]: [
    { name: "Ramanathapuram", coords: [9.3639, 78.8394] },
    { name: "Rameswaram", coords: [9.2876, 79.3129] }
  ],
  [normalizeName("Sivagangai")]: [
    { name: "Sivagangai", coords: [9.8433, 78.4809] },
    { name: "Karaikudi", coords: [10.0734, 78.7733] }
  ],
  [normalizeName("Tenkasi")]: [
    { name: "Tenkasi", coords: [8.9593, 77.3139] },
    { name: "Sankarankovil", coords: [9.1725, 77.5332] }
  ],
  [normalizeName("Thanjavur")]: [
    { name: "Thanjavur", coords: [10.7870, 79.1378] },
    { name: "Kumbakonam", coords: [10.9617, 79.3881] }
  ],
  [normalizeName("Theni")]: [
    { name: "Theni", coords: [10.0104, 77.4777] },
    { name: "Bodinayakanur", coords: [10.0104, 77.3486] }
  ],
  [normalizeName("Thoothukudi")]: [
    { name: "Thoothukudi", coords: [8.7642, 78.1348] },
    { name: "Kovilpatti", coords: [9.1779, 77.8687] }
  ],
  [normalizeName("Tirunelveli")]: [
    { name: "Tirunelveli", coords: [8.7139, 77.7567] },
    { name: "Ambasamudram", coords: [8.7027, 77.4565] }
  ],
  [normalizeName("Tiruvallur")]: [
    { name: "Tiruvallur", coords: [13.1422, 79.9077] },
    { name: "Avadi", coords: [13.1187, 80.1047] }
  ],
  [normalizeName("Tiruvannamalai")]: [
    { name: "Tiruvannamalai", coords: [12.2253, 79.0747] },
    { name: "Arani", coords: [12.6711, 79.2842] }
  ],
  [normalizeName("Tiruvarur")]: [
    { name: "Tiruvarur", coords: [10.7716, 79.6385] },
    { name: "Mannargudi", coords: [10.6657, 79.4449] }
  ],
  [normalizeName("Viluppuram")]: [
    { name: "Viluppuram", coords: [11.9401, 79.4861] },
    { name: "Tindivanam", coords: [12.2359, 79.6500] }
  ],
  [normalizeName("Virudhunagar")]: [
    { name: "Virudhunagar", coords: [9.5872, 77.9570] },
    { name: "Sivakasi", coords: [9.4533, 77.8016] }
  ]
};



// Map Controller for panning and flying animations
import { useMap } from 'react-leaflet';
function MapFlyController({ center, zoom, bounds }: { center: [number, number]; zoom: number; bounds?: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { animate: true, duration: 1.0 });
    } else {
      map.setView(center, zoom, { animate: true, duration: 1.0 });
    }
  }, [center, zoom, bounds, map]);
  return null;
}

// Map Click Listener to deselect district when clicking base map
function MapEventsHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({
    click: (e) => {
      const target = e.originalEvent.target as HTMLElement;
      if (target && (target.classList.contains('leaflet-container') || target.classList.contains('leaflet-layer'))) {
        onMapClick();
      }
    }
  });
  return null;
}

// ── Samsung One UI segmented picker ──
function SegmentPicker({ label, options, value, onChange }: {
  label: string;
  options: { label: string; value: string }[];
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: '1.1rem' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7a7a7a', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Inter', system-ui, sans-serif", marginBottom: '0.7rem' }}>{label}</div>
      <div style={{ display: 'flex', background: '#e4e4e4', borderRadius: '12px', padding: '3px', gap: '2px' }}>
        {[{ label: 'Any', value: '' }, ...options].map(opt => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                flex: 1,
                padding: '0.45rem 0.2rem',
                borderRadius: '9px',
                border: 'none',
                background: active ? '#f5f5f5' : 'transparent',
                color: active ? '#2C2C2C' : '#6b6b6b',
                fontSize: '0.76rem',
                fontWeight: active ? 700 : 500,
                fontFamily: "'Inter', system-ui, sans-serif",
                cursor: 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease',
                boxShadow: active ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Samsung One UI range row ──
function RangeSection({ label, unit, minVal, setMin, maxVal, setMax }: {
  label: string; unit: string;
  minVal: string; setMin: (v: string) => void;
  maxVal: string; setMax: (v: string) => void;
}) {
  const inputBase: React.CSSProperties = {
    flex: 1, height: '46px',
    background: '#e4e4e4',
    border: '1.5px solid transparent',
    borderRadius: '12px',
    padding: '0 0.9rem',
    fontSize: '0.88rem',
    fontFamily: "'Inter', system-ui, sans-serif",
    color: '#2C2C2C',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
    letterSpacing: '-0.01em',
    transition: 'border-color 0.15s ease',
  };
  return (
    <div style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: '1.1rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.7rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7a7a7a', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Inter', system-ui, sans-serif" }}>{label}</span>
        <span style={{ fontSize: '0.65rem', color: '#9a9a9a', fontFamily: "'Inter', system-ui, sans-serif" }}>{unit}</span>
      </div>
      <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center' }}>
        <input
          type="number"
          placeholder="Min"
          value={minVal}
          onChange={e => setMin(e.target.value)}
          onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#2C2C2C'}
          onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'transparent'}
          style={inputBase}
        />
        <div style={{ width: '12px', height: '1.5px', background: '#b8b8b8', flexShrink: 0 }} />
        <input
          type="number"
          placeholder="Max"
          value={maxVal}
          onChange={e => setMax(e.target.value)}
          onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#2C2C2C'}
          onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'transparent'}
          style={inputBase}
        />
      </div>
    </div>
  );
}

// ── Shared filter inputs renderer ──
function filterInputs({ minPrice, setMinPrice, maxPrice, setMaxPrice, minArea, setMinArea, maxArea, setMaxArea, waterSource, setWaterSource, roadAccess, setRoadAccess, soilType, setSoilType, compact = false }: {
  minPrice: string; setMinPrice: (v: string) => void;
  maxPrice: string; setMaxPrice: (v: string) => void;
  minArea: string; setMinArea: (v: string) => void;
  maxArea: string; setMaxArea: (v: string) => void;
  waterSource: string; setWaterSource: (v: string) => void;
  roadAccess: string; setRoadAccess: (v: string) => void;
  soilType: string; setSoilType: (v: string) => void;
  compact?: boolean;
}) {
  if (compact) {
    const h = '30px'; const fs = '0.74rem'; const lfs = '0.7rem';
    const labelStyle: React.CSSProperties = { fontSize: lfs, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'block', marginBottom: '0.25rem' };
    const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', height: h, fontSize: fs, padding: '0 0.6rem', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', fontFamily: "'Inter', system-ui, sans-serif", background: '#f9fafb', color: '#111827' };
    const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
    return (
      <>
        <div><label style={labelStyle}>Price (₹)</label><div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}><input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} style={inputStyle} /><span style={{ color: '#9ca3af', fontSize: lfs }}>–</span><input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={inputStyle} /></div></div>
        <div><label style={labelStyle}>Area (Cent/Sq ft)</label><div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}><input type="number" placeholder="Min" value={minArea} onChange={e => setMinArea(e.target.value)} style={inputStyle} /><span style={{ color: '#9ca3af', fontSize: lfs }}>–</span><input type="number" placeholder="Max" value={maxArea} onChange={e => setMaxArea(e.target.value)} style={inputStyle} /></div></div>
        <div><label style={labelStyle}>Water Source</label><select value={waterSource} onChange={e => setWaterSource(e.target.value)} style={selectStyle}><option value="">Any</option><option value="Open Well">Open Well</option><option value="Borewell">Borewell</option><option value="River">River</option><option value="Canal">Canal</option><option value="None">None</option></select></div>
        <div><label style={labelStyle}>Road Access</label><select value={roadAccess} onChange={e => setRoadAccess(e.target.value)} style={selectStyle}><option value="">Any</option><option value="Tar Road">Tar Road</option><option value="Gravel Road">Gravel Road</option><option value="Dirt Road">Dirt Road</option><option value="No Road">No Road</option></select></div>
        <div><label style={labelStyle}>Soil Type</label><select value={soilType} onChange={e => setSoilType(e.target.value)} style={selectStyle}><option value="">Any</option><option value="Red Soil">Red Soil</option><option value="Black Soil">Black Soil</option><option value="Clay">Clay</option><option value="Sandy">Sandy</option><option value="Alluvial">Alluvial</option></select></div>
      </>
    );
  }
  return (
    <>
      <RangeSection label="Price" unit="₹" minVal={minPrice} setMin={setMinPrice} maxVal={maxPrice} setMax={setMaxPrice} />
      <RangeSection label="Area" unit="Cent / Sq ft" minVal={minArea} setMin={setMinArea} maxVal={maxArea} setMax={setMaxArea} />
      <SegmentPicker label="Water Source" value={waterSource} onChange={setWaterSource} options={[
        { label: 'Open Well', value: 'Open Well' },
        { label: 'Borewell', value: 'Borewell' },
        { label: 'River', value: 'River' },
        { label: 'Canal', value: 'Canal' },
        { label: 'None', value: 'None' },
      ]} />
      <SegmentPicker label="Road Access" value={roadAccess} onChange={setRoadAccess} options={[
        { label: 'Tar Road', value: 'Tar Road' },
        { label: 'Gravel', value: 'Gravel Road' },
        { label: 'Dirt Road', value: 'Dirt Road' },
        { label: 'No Road', value: 'No Road' },
      ]} />
      <SegmentPicker label="Soil Type" value={soilType} onChange={setSoilType} options={[
        { label: 'Red', value: 'Red Soil' },
        { label: 'Black', value: 'Black Soil' },
        { label: 'Clay', value: 'Clay' },
        { label: 'Sandy', value: 'Sandy' },
        { label: 'Alluvial', value: 'Alluvial' },
      ]} />
    </>
  );
}

// ── Draggable Mobile Filter Bottom Sheet ──
function FilterSheet({ onClose, minPrice, setMinPrice, maxPrice, setMaxPrice, minArea, setMinArea, maxArea, setMaxArea, waterSource, setWaterSource, roadAccess, setRoadAccess, soilType, setSoilType }: {
  onClose: () => void;
  minPrice: string; setMinPrice: (v: string) => void;
  maxPrice: string; setMaxPrice: (v: string) => void;
  minArea: string; setMinArea: (v: string) => void;
  maxArea: string; setMaxArea: (v: string) => void;
  waterSource: string; setWaterSource: (v: string) => void;
  roadAccess: string; setRoadAccess: (v: string) => void;
  soilType: string; setSoilType: (v: string) => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const isDragging = useRef(false);

  const onDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStartY.current = e.clientY;
    dragCurrentY.current = 0;
    isDragging.current = true;
  };
  const onMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dy = e.clientY - dragStartY.current;
    dragCurrentY.current = dy;
    if (sheetRef.current && dy > 0) sheetRef.current.style.transform = `translateY(${dy}px)`;
  };
  const onUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    if (dragCurrentY.current > 100) { onClose(); }
    else if (sheetRef.current) sheetRef.current.style.transform = '';
    dragCurrentY.current = 0;
  };

  const activeCount = [minPrice, maxPrice, minArea, maxArea, waterSource, roadAccess, soilType].filter(Boolean).length;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div ref={sheetRef} style={{ position: 'relative', background: '#f5f5f5', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 32px rgba(0,0,0,0.15)', animation: 'slideUp 0.26s cubic-bezier(0.16, 1, 0.3, 1)', transition: 'transform 0.12s ease' }}>
        {/* Handle */}
        <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem 0 0.35rem', flexShrink: 0, cursor: 'grab', touchAction: 'none', userSelect: 'none' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '99px', background: '#d0d0d0' }} />
        </div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1.25rem 0.9rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2C2C2C', fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '-0.03em' }}>Filter</span>
            {activeCount > 0 && (
              <span style={{ background: '#2C2C2C', color: '#ffffff', borderRadius: '5px', padding: '1px 7px', fontSize: '0.68rem', fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '0.02em' }}>{activeCount}</span>
            )}
          </div>
          <button
            onClick={() => { setMinPrice(''); setMaxPrice(''); setMinArea(''); setMaxArea(''); setWaterSource(''); setRoadAccess(''); setSoilType(''); }}
            style={{ background: 'none', border: 'none', fontSize: '0.78rem', fontWeight: 600, color: '#7a7a7a', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '-0.01em', padding: '4px 0' }}
          >
            Reset all
          </button>
        </div>
        <div style={{ height: '1px', background: '#e5e5e5', flexShrink: 0 }} />
        {/* Content */}
        <div
          style={{ overflowY: 'auto', padding: '1rem 1.25rem 0', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.1rem' }}
          onWheel={e => e.stopPropagation()}
          onTouchMove={e => e.stopPropagation()}
        >
          {filterInputs({ minPrice, setMinPrice, maxPrice, setMaxPrice, minArea, setMinArea, maxArea, setMaxArea, waterSource, setWaterSource, roadAccess, setRoadAccess, soilType, setSoilType })}
          <div style={{ height: '0.25rem' }} />
        </div>
        {/* Footer */}
        <div style={{ padding: '0.85rem 1.25rem 2rem', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ width: '100%', height: '52px', background: '#2C2C2C', border: 'none', borderRadius: '14px', fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '-0.02em' }}
          >
            {activeCount > 0 ? `Show results` : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Custom Select Component for Samsung UI aesthetics
function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  disabled = false,
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: { label: string; value: string }[]; 
  placeholder: string; 
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetDragStartY = useRef(0);
  const sheetDragCurrentY = useRef(0);
  const sheetIsDragging = useRef(false);

  const onSheetPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    sheetDragStartY.current = e.clientY;
    sheetDragCurrentY.current = 0;
    sheetIsDragging.current = true;
  };
  const onSheetPointerMove = (e: React.PointerEvent) => {
    if (!sheetIsDragging.current) return;
    const dy = e.clientY - sheetDragStartY.current;
    sheetDragCurrentY.current = dy;
    if (sheetRef.current && dy > 0) sheetRef.current.style.transform = `translateY(${dy}px)`;
  };
  const onSheetPointerUp = (e: React.PointerEvent) => {
    if (!sheetIsDragging.current) return;
    sheetIsDragging.current = false;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    if (sheetDragCurrentY.current > 100) { setIsOpen(false); setSearch(''); }
    else if (sheetRef.current) sheetRef.current.style.transform = '';
    sheetDragCurrentY.current = 0;
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const isMobileDevice = window.innerWidth <= 768;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (containerRef.current && !containerRef.current.contains(target) && !target.closest('.custom-select-menu')) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMobileDevice && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }
    setIsOpen(!isOpen);
  };

  const selectedLabel = value ? options.find(o => o.value === value)?.label : placeholder;
  const isActive = !!value;
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  const optionsList = (
    <>
      {filtered.length === 0 && (
        <div style={{ padding: '1rem', fontSize: '0.82rem', color: '#9ca3af', textAlign: 'center' }}>No results</div>
      )}
      {filtered.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <div
            key={opt.value}
            onClick={(e) => {
              e.stopPropagation();
              onChange(opt.value);
              setIsOpen(false);
              setSearch('');
            }}
            style={{
              padding: '0.75rem 1rem',
              fontSize: '0.88rem',
              fontWeight: isSelected ? 700 : 500,
              fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
              color: isSelected ? '#2C2C2C' : '#374151',
              background: isSelected ? 'rgba(0,0,0,0.05)' : 'transparent',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'background 0.12s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.03)'; }}
            onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
          >
            <span style={{ pointerEvents: 'none' }}>{opt.label}</span>
            {isSelected && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2C2C2C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none', flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        );
      })}
    </>
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: isMobileDevice ? 1 : '0 0 auto', width: isMobileDevice ? undefined : (placeholder === 'District' ? '160px' : placeholder === 'City' ? '160px' : '170px'), minWidth: 0 }}>
      <button
        type="button"
        disabled={disabled}
        onClick={openMenu}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '36px',
          padding: '0 0.85rem',
          background: isActive ? '#ffffff' : '#f9f9f9',
          border: isActive ? '1.5px solid #b8963e' : '1px solid #2C2C2C',
          borderRadius: '24px',
          fontSize: '0.82rem',
          fontWeight: isActive ? 700 : 600,
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          letterSpacing: '-0.01em',
          color: isActive ? '#2C2C2C' : '#4b5563',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.06)' : 'inset 0 1px 3px rgba(0,0,0,0.04)',
          outline: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none' }}>{selectedLabel}</span>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: '4px', pointerEvents: 'none', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)' }}>
          <polyline points="5 8 10 13 15 8" />
        </svg>
      </button>

      {isOpen && !disabled && createPortal(
        isMobileDevice ? (
          /* ── MOBILE: Full bottom sheet ── */
          <div
            className="custom-select-menu"
            style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
            onClick={(e) => { if (e.target === e.currentTarget) { setIsOpen(false); setSearch(''); } }}
          >
            {/* Backdrop */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />
            {/* Sheet */}
            <div
              ref={sheetRef}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                background: '#ffffff',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                maxHeight: '82vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
                animation: 'slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                transition: 'transform 0.1s ease',
              }}
            >
              {/* Draggable Handle */}
              <div
                onPointerDown={onSheetPointerDown}
                onPointerMove={onSheetPointerMove}
                onPointerUp={onSheetPointerUp}
                style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.75rem', paddingBottom: '0.5rem', flexShrink: 0, cursor: 'grab', touchAction: 'none', userSelect: 'none' }}
              >
                <div style={{ width: '40px', height: '4px', borderRadius: '99px', background: '#d1d5db' }} />
              </div>
              {/* Title + close */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 1.25rem 0.75rem', flexShrink: 0 }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#2C2C2C', fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '-0.03em' }}>{placeholder}</span>
                <button onClick={() => { setIsOpen(false); setSearch(''); }} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              {/* Search */}
              <div style={{ padding: '0 1rem 0.75rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#FDFBF7', borderRadius: '14px', padding: '0 0.85rem', gap: '0.5rem', height: '42px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    autoFocus
                    type="text"
                    placeholder={`Search ${placeholder.toLowerCase()}…`}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ background: 'transparent', border: 'none', outline: 'none', flex: 1, fontSize: '0.88rem', color: '#2C2C2C', fontFamily: "'Inter', system-ui, sans-serif" }}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#9ca3af' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              </div>
              {/* Options list */}
              <div style={{ overflowY: 'auto', padding: '0 0.65rem 1.5rem', flex: 1 }}>
                {optionsList}
              </div>
            </div>
          </div>
        ) : (
          /* ── DESKTOP: Floating dropdown ── */
          <div
            className="custom-select-menu"
            onWheel={(e) => { e.stopPropagation(); }}
            onTouchMove={(e) => { e.stopPropagation(); }}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${Math.max(coords.width, 180)}px`,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: '16px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)',
              border: '1px solid rgba(255,255,255,0.4)',
              zIndex: 999999,
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '0.35rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              animation: 'fadeInUp 0.15s cubic-bezier(0.25, 0.8, 0.25, 1)',
              pointerEvents: 'auto',
              touchAction: 'pan-y'
            }}
          >
            <style>{`
              .custom-select-menu::-webkit-scrollbar { width: 6px !important; display: block !important; }
              .custom-select-menu::-webkit-scrollbar-track { background: transparent !important; }
              .custom-select-menu::-webkit-scrollbar-thumb { background: #d4cfc8 !important; border-radius: 99px !important; }
              .custom-select-menu::-webkit-scrollbar-thumb:hover { background: #b8b2a9 !important; }
            `}</style>
            {optionsList}
          </div>
        ),
        document.body
      )}
    </div>
  );
}


export default function MapSearch() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [geoJsonData, setGeoJsonData] = useState<any | null>(OFFLINE_GEOJSON);
  const [cityDivisions, setCityDivisions] = useState<any>({});
  const { animationSetting } = useSettings();

  useEffect(() => {
    fetch('/tamilnadu_city_divisions.json?v=3')
      .then(res => res.json())
      .then(data => setCityDivisions(data))
      .catch(err => console.error('Failed to load city divisions:', err));
  }, []);

  // Wishlist states
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const isLoggedIn = !!getToken();

  useEffect(() => {
    if (!isLoggedIn) return;
    api.get('/auth/wishlist').then(r => setWishlist(r.data.wishlist)).catch(() => {});
  }, [isLoggedIn]);

  const toggleWishlist = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!isLoggedIn) {
      window.location.href = '/login';
      return;
    }
    setTogglingId(id);
    try {
      const r = await api.post(`/auth/wishlist/${id}`);
      setWishlist(r.data.wishlist);
    } catch { /* silent */ }
    finally { setTogglingId(null); }
  };
  const renderSamsungDropdowns = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      width: '100%',
      boxSizing: 'border-box',
      flexShrink: 0,
      overflowX: 'auto',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      padding: '0.15rem 0'
    }}>
      {/* Refresh / Reset Filters Button (Left) */}
      <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
        <button
          onClick={() => {
            setSelectedDistrict(null);
            setSelectedCity(null);
            setFilterType('');
            setMinPrice(''); setMaxPrice('');
            setMinArea(''); setMaxArea('');
            setWaterSource(''); setRoadAccess(''); setSoilType('');
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: '#ffffff',
            height: '36px',
            width: '36px',
            minWidth: '36px',
            padding: 0,
            boxSizing: 'border-box',
            borderRadius: '50%',
            border: '1px solid rgba(0,0,0,0.06)',
            color: '#2C2C2C',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'background 0.2s'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>

      {/* District Select */}
      <CustomSelect
        value={selectedDistrict || ''}
        onChange={(val) => handleDistrictChange(val)}
        placeholder="District"
        options={TAMIL_NADU_DISTRICTS.map(d => ({ label: d, value: d }))}
      />

      {/* City Select */}
      <CustomSelect
        value={selectedCity || ''}
        onChange={(val) => handleCityChange(val)}
        placeholder="City"
        options={selectedDistrict ? sortedTaluksList.map(name => ({ label: name, value: name })) : []}
        disabled={!selectedDistrict}
      />

      {/* Plot Type Select */}
      <CustomSelect
        value={filterType}
        onChange={(val) => setFilterType(val)}
        placeholder="Type"
        options={[
          { label: 'Agricultural Land', value: 'Agricultural Land' },
          { label: 'Flat Plot', value: 'Flat Plot' },
          { label: 'Farm Land', value: 'Farm Land' },
          { label: 'Residential Plot', value: 'Residential Plot' },
          { label: 'Commercial Plot', value: 'Commercial Plot' }
        ]}
      />

      {/* Filters popup toggler (Right) - Samsung sliders icon */}
      <div className="filters-popup-anchor" style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
        <button
          onClick={handleFiltersButtonClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: activeFiltersCount > 0 ? '#2C2C2C' : '#ffffff',
            color: activeFiltersCount > 0 ? '#ffffff' : '#2C2C2C',
            height: '36px',
            width: '36px',
            minWidth: '36px',
            padding: 0,
            boxSizing: 'border-box',
            borderRadius: '50%',
            border: activeFiltersCount > 0 ? '1.5px solid #b8963e' : '1px solid #2C2C2C',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
          </svg>
          {activeFiltersCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444', color: '#ffffff', borderRadius: '50%',
              width: '14px', height: '14px', fontSize: '0.58rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
            }}>
              {activeFiltersCount}
            </span>
          )}
        </button>

        {showFiltersPopup && (
          isMobile ? (
            createPortal(
              <FilterSheet
                onClose={() => setShowFiltersPopup(false)}
                minPrice={minPrice} setMinPrice={setMinPrice}
                maxPrice={maxPrice} setMaxPrice={setMaxPrice}
                minArea={minArea} setMinArea={setMinArea}
                maxArea={maxArea} setMaxArea={setMaxArea}
                waterSource={waterSource} setWaterSource={setWaterSource}
                roadAccess={roadAccess} setRoadAccess={setRoadAccess}
                soilType={soilType} setSoilType={setSoilType}
              />,
              document.body
            )
          ) : (
            filterButtonCoords && createPortal(
              <>
                <div onClick={() => setShowFiltersPopup(false)} style={{ position: 'fixed', inset: 0, zIndex: 999998 }} />
                <div style={{
                  position: 'fixed',
                  top: `${filterButtonCoords.top + 8}px`,
                  left: `${filterButtonCoords.right - 260}px`,
                  width: '260px',
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                  padding: '1.25rem',
                  zIndex: 999999,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  boxSizing: 'border-box'
                }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#111827', fontFamily: "'Poppins', sans-serif" }}>Filters</h4>
                  {filterInputs({ minPrice, setMinPrice, maxPrice, setMaxPrice, minArea, setMinArea, maxArea, setMaxArea, waterSource, setWaterSource, roadAccess, setRoadAccess, soilType, setSoilType, compact: true })}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
                    <button onClick={() => { setMinPrice(''); setMaxPrice(''); setMinArea(''); setMaxArea(''); setWaterSource(''); setRoadAccess(''); setSoilType(''); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Reset All</button>
                    <button onClick={() => setShowFiltersPopup(false)} style={{ background: '#2C2C2C', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '5px 14px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Apply</button>
                  </div>
                </div>
              </>,
              document.body
            )
          )
        )}
      </div>
    </div>
  );



  // Map viewport states
  const [mapCenter, setMapCenter] = useState<[number, number]>(TN_CENTER);
  const [mapZoom, setMapZoom] = useState(TN_ZOOM);
  const [selectedBounds, setSelectedBounds] = useState<L.LatLngBounds | null>(null);

  // Active district and city filters
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  

  
  // Other Filter States
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  const setSearchTerm = (val: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set('search', val);
    else newParams.delete('search');
    setSearchParams(newParams);
  };

    const [filterType, setFilterType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [soilType, setSoilType] = useState('');
  const [waterSource, setWaterSource] = useState('');
  const [roadAccess, setRoadAccess] = useState('');

  // Mobile layout and popup states
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showFiltersPopup, setShowFiltersPopup] = useState(false);
  const [filterButtonCoords, setFilterButtonCoords] = useState<{ top: number; right: number } | null>(null);
  const [mobileActiveTab, setMobileActiveTab] = useState<'map' | 'lands'>('map');
  const [drawerState, setDrawerState] = useState<'collapsed' | 'expanded'>('collapsed');

  const handleFiltersButtonClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setFilterButtonCoords({
      top: rect.bottom,
      right: rect.right
    });
    setShowFiltersPopup(prev => !prev);
  };
  
  // Real-time touch drag states using dragY state to prevent tap glitching
  const [dragY, setDragY] = useState<number | null>(null);
  const isDraggingActiveRef = useRef(false);
  const startYRef = useRef(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  const activeFiltersCount = [
    minPrice, maxPrice, minArea, maxArea, soilType, waterSource, roadAccess
  ].filter(Boolean).length;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleMobileSearchFocus = () => {
      if (isMobile) {
        setDrawerState('expanded');
      }
    };
    window.addEventListener('mobile-search-focus', handleMobileSearchFocus);
    return () => {
      window.removeEventListener('mobile-search-focus', handleMobileSearchFocus);
    };
  }, [isMobile]);

  // Sync tab with drawerState
  useEffect(() => {
    setMobileActiveTab(drawerState === 'collapsed' ? 'map' : 'lands');
  }, [drawerState]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startYRef.current = e.clientY;
    isDraggingActiveRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingActiveRef.current) return;
    const deltaY = e.clientY - startYRef.current;
    // Set state to trigger UI update
    setDragY(deltaY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingActiveRef.current) return;
    isDraggingActiveRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}

    const deltaY = dragY || 0;
    if (drawerState === 'collapsed') {
      // Dragged up enough -> Expand
      if (deltaY < -75) {
        setDrawerState('expanded');
      }
    } else {
      // Dragged down enough -> Collapse
      if (deltaY > 100) {
        setDrawerState('collapsed');
        window.dispatchEvent(new CustomEvent('blur-mobile-search'));
      }
    }
    setDragY(null);
  };

  // Fetch updated 38-district GeoJSON from GitHub raw link (CORS enabled)
  useEffect(() => {
    const fetchGeoJson = async () => {
      try {
        const res = await fetch('https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/STATES/TAMIL%20NADU/TAMIL%20NADU_DISTRICTS.geojson');
        if (!res.ok) throw new Error("Network response not ok");
        const data = await res.json();
        
        // Normalize properties so Dist_Name is guaranteed to be mapped cleanly
        data.features.forEach((feature: any) => {
          const props = feature.properties;
          props.Dist_Name = props.dtname || props.dist || props.district || props.Dist_Name || props.DISTRICT || props.NAME_2;
        });
        setGeoJsonData(data);
      } catch (err) {
        console.warn("Fallback to offline 32-district GeoJSON:", err);
        setGeoJsonData(OFFLINE_GEOJSON);
      }
    };
    fetchGeoJson();
  }, []);

  // Fetch approved active properties
  useEffect(() => {
    const fetchProps = async () => {
      try {
        setLoading(true);
        const r = await api.get<Property[]>('/properties');
        setProperties(r.data.filter(p => p.status === 'ACTIVE'));
      } catch (err) {
        console.error('Failed to load map listings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProps();
  }, []);

  // Pre-warm tile cache: silently fetch all TN tiles at zoom 6-11 into browser cache
  // Staggered: low zoom first (fast, few tiles), then high zoom (more tiles, deferred)
  useEffect(() => {
    const TN_BOUNDS = { minLat: 7.5, maxLat: 14.0, minLng: 75.5, maxLng: 81.5 };
    const SUBDOMAINS = ['0', '1', '2', '3'];

    const toTileX = (lng: number, z: number) =>
      Math.floor((lng + 180) / 360 * Math.pow(2, z));

    const toTileY = (lat: number, z: number) => {
      const rad = lat * Math.PI / 180;
      return Math.floor(
        (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * Math.pow(2, z)
      );
    };

    const prewarmZoom = (zoom: number) => {
      const minX = toTileX(TN_BOUNDS.minLng, zoom);
      const maxX = toTileX(TN_BOUNDS.maxLng, zoom);
      const minY = toTileY(TN_BOUNDS.maxLat, zoom);
      const maxY = toTileY(TN_BOUNDS.minLat, zoom);
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          const s = SUBDOMAINS[(x + y) % SUBDOMAINS.length];
          const img = new Image();
          img.src = `https://mt${s}.google.com/vt/lyrs=m&x=${x}&y=${y}&z=${zoom}&apistyle=s.t:0|s.e:l|p.v:off,s.t:3|p.v:off`;
        }
      }
    };

    // Stagger: low zoom immediately, higher zoom deferred so they don't compete
    const delays: Record<number, number> = { 6: 500, 7: 1000, 8: 2000, 9: 3500, 10: 5000, 11: 7000 };
    Object.entries(delays).forEach(([zoom, delay]) => {
      setTimeout(() => prewarmZoom(Number(zoom)), delay);
    });
  }, []);

  // Filter properties by selected district/city and active filters
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      // 1. District filter (if selected)
      if (selectedDistrict) {
        const propDist = p.district || '';
        const propCity = p.city || '';
        const propTaluk = p.taluk || '';
        const propModernDist = getModernDistrict(propTaluk || propCity, propDist);
        if (normalizeName(propModernDist) !== normalizeName(selectedDistrict) && normalizeName(propDist) !== normalizeName(selectedDistrict)) {
          return false;
        }
      }

      // 2. City sub-filter (if selected)
      if (selectedCity) {
        const propCity = p.city || '';
        const propTaluk = p.taluk || '';
        const matchValue = propTaluk || propCity;
        if (normalizeName(matchValue) !== normalizeName(selectedCity)) {
          return false;
        }
      }

      // 3. Search term query
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const city = p.city.toLowerCase();
        const dist = (p.district || '').toLowerCase();
        const type = p.type.toLowerCase();
        const desc = (p.description || '').toLowerCase();
        if (!city.includes(query) && !dist.includes(query) && !type.includes(query) && !desc.includes(query)) {
          return false;
        }
      }

      // 4. Type filter
      if (filterType && p.type !== filterType) {
        return false;
      }

      // 5. Price filters
      if (minPrice && p.price < parseFloat(minPrice)) return false;
      if (maxPrice && p.price > parseFloat(maxPrice)) return false;

      // 6. Area filters
      if (minArea && p.area < parseFloat(minArea)) return false;
      if (maxArea && p.area > parseFloat(maxArea)) return false;

      // 7. Soil Type filter
      if (soilType && p.soil_type !== soilType) return false;

      // 8. Water Source filter
      if (waterSource && p.water_source !== waterSource) return false;

      // 9. Road Access filter
      if (roadAccess && p.road_access !== roadAccess) return false;

      return true;
    });
  }, [properties, selectedDistrict, selectedCity, searchTerm, filterType, minPrice, maxPrice, minArea, maxArea, soilType, waterSource, roadAccess]);

  // Handle manual select from District Select dropdown
  const handleDistrictChange = (districtName: string) => {
    if (!districtName) {
      handleMapBackgroundClick();
      return;
    }

    setSelectedDistrict(districtName);
    setSelectedCity(null);
    
    // Zoom/pan map dynamically to that district in our loaded GeoJSON
    if (geoJsonData) {
      const match = geoJsonData.features.find((f: any) => normalizeName(f.properties.Dist_Name) === normalizeName(districtName));
      if (match) {
        // Build bounds for fitBounds
        const layer = L.geoJSON(match);
        setSelectedBounds(layer.getBounds());
        return;
      }
    }

    // Coordinate fallback
    const key = normalizeName(districtName);
    const mainCityInDist = DISTRICT_CITIES[key];
    if (mainCityInDist && mainCityInDist.length > 0) {
      setMapCenter(mainCityInDist[0].coords);
      setMapZoom(10);
    }
    setSelectedBounds(null);
  };

  const handleCityChange = (cityName: string) => {
    if (!cityName) {
      setSelectedCity(null);
      setDrawerState('collapsed');
      window.dispatchEvent(new CustomEvent('blur-mobile-search'));
      return;
    }
    setSelectedCity(cityName);
    setDrawerState('expanded');
  };

  const handleMapBackgroundClick = () => {
    setSelectedDistrict(null);
    setSelectedCity(null);
    setSelectedBounds(null);
    setMapCenter(TN_CENTER);
    setMapZoom(TN_ZOOM);
    setDrawerState('collapsed');
    window.dispatchEvent(new CustomEvent('blur-mobile-search'));
  };

  const activeCityDivisions = useMemo(() => {
    if (!selectedDistrict || !cityDivisions) return [];
    const keys = Object.keys(cityDivisions);
    const matchedKey = keys.find(k => normalizeName(k) === normalizeName(selectedDistrict)) || selectedDistrict;
    return (cityDivisions as any)[matchedKey] || [];
  }, [selectedDistrict, cityDivisions]);

  // Get active taluks/divisions list for selected district, sorted alphabetically
  const sortedTaluksList = useMemo(() => {
    return [...activeCityDivisions].map((d: any) => d.name).sort((a, b) => a.localeCompare(b));
  }, [activeCityDivisions]);

  // Calculate centroids of each district polygon dynamically for map labels
  const districtCenters = useMemo(() => {
    if (!geoJsonData) return [];
    return geoJsonData.features.map((f: any) => {
      const name = f.properties.Dist_Name;
      if (!name) return null;
      try {
        const layer = L.geoJSON(f);
        const center = layer.getBounds().getCenter();
        return {
          name,
          coords: [center.lat, center.lng] as [number, number]
        };
      } catch (e) {
        return null;
      }
    }).filter((x: any): x is { name: string; coords: [number, number] } => x !== null);
  }, [geoJsonData]);

  // GTA V Style Negative Polygon Mask: covers the entire world except Tamil Nadu
  const maskGeoJson = useMemo(() => {
    if (!geoJsonData) return null;
    
    // GeoJSON coords are [lng, lat]. Use full world bounds so the dark mask
    // covers EVERYTHING no matter how far the user pans — no blue tiles ever.
    const worldBounds = [
      [-180, -90],
      [ 180, -90],
      [ 180,  90],
      [-180,  90],
      [-180, -90]
    ];
    
    const holes: any[] = [];
    
    geoJsonData.features.forEach((feature: any) => {
      const geom = feature.geometry;
      if (geom.type === 'Polygon') {
        holes.push(geom.coordinates[0]);
      } else if (geom.type === 'MultiPolygon') {
        geom.coordinates.forEach((poly: any) => {
          holes.push(poly[0]);
        });
      }
    });
    
    return {
      type: 'Feature',
      properties: { isMask: true },
      geometry: {
        type: 'Polygon',
        coordinates: [worldBounds, ...holes]
      }
    } as any;
  }, [geoJsonData]);

  // SVG renderer with giant padding so the mask is pre-drawn 10x beyond
  // the visible viewport — eliminates blue flashing when panning
  const maskRenderer = useMemo(() => L.svg({ padding: 10 }), []);


  // GeoJSON style handler
  const getFeatureStyle = (feature: any) => {
    const distName = feature.properties.Dist_Name || '';
    const isSelected = selectedDistrict && normalizeName(distName) === normalizeName(selectedDistrict);
    return {
      color: isSelected ? '#eab308' : 'rgba(16, 16, 16, 0.15)',
      weight: isSelected ? 3.5 : 1.5,
      fillColor: isSelected ? '#facc15' : 'transparent',
      fillOpacity: isSelected ? 0.05 : 0,
      transition: 'all 0.18s ease-out'
    };
  };

  // GeoJSON interactions per feature
  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      mouseover: (e: any) => {
        const distName = feature.properties.Dist_Name || '';
        const isSelected = selectedDistrict && normalizeName(distName) === normalizeName(selectedDistrict);
        if (!isSelected) {
          e.target.setStyle({
            color: '#eab308',
            weight: 2,
            fillColor: '#facc15',
            fillOpacity: 0.05
          });
        }
      },
      mouseout: (e: any) => {
        const distName = feature.properties.Dist_Name || '';
        const isSelected = selectedDistrict && normalizeName(distName) === normalizeName(selectedDistrict);
        if (!isSelected) {
          e.target.setStyle({
            color: 'rgba(16, 16, 16, 0.15)',
            weight: 1.5,
            fillColor: 'transparent',
            fillOpacity: 0
          });
        }
      },
      click: (e: any) => {
        const distName = feature.properties.Dist_Name || '';
        setSelectedDistrict(distName);
        setSelectedCity(null);
        setSelectedBounds(e.target.getBounds());
      }
    });

  };

  return (
    <div className="map-search-page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden', background: '#f0f0ef' }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        /* ── FILTER BAR ── */
        .filters-container::-webkit-scrollbar { display: none !important; }
        .filters-container { -ms-overflow-style: none; scrollbar-width: none; }

        .filter-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.42rem 1rem;
          background: #ffffff;
          border: 1.5px solid #e4e4e3;
          border-radius: 99px;
          font-size: 0.8rem;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          appearance: none;
          background-image: none;
        }
        .filter-pill:hover { border-color: #b0b0ae; }
        .filter-pill:focus { border-color: #1a6b45; box-shadow: 0 0 0 3px rgba(26,107,69,0.1); }
        .filter-pill.active {
          border-color: #1a6b45;
          background: #f0faf5;
          color: #1a6b45;
          font-weight: 600;
        }
        .filter-pill-select {
          appearance: none !important;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='5 8 10 13 15 8'%3e%3c/polyline%3e%3c/svg%3e") !important;
          background-repeat: no-repeat !important;
          background-position: right 0.7rem center !important;
          background-size: 0.85rem !important;
          padding-right: 2rem !important;
        }
        .filter-pill-select.active {
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%231a6b45' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='5 8 10 13 15 8'%3e%3c/polyline%3e%3c/svg%3e") !important;
          background-color: #f0faf5 !important;
        }
        .filter-divider {
          width: 1px;
          height: 20px;
          background: #e4e4e3;
          flex-shrink: 0;
        }
        .search-pill-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .search-pill-wrap svg {
          position: absolute;
          left: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .search-pill {
          padding-left: 2.2rem !important;
        }

        /* ── MAP CARD ── */
        .leaflet-control-attribution { font-size: 0.6rem !important; }

        /* ── LISTING CARD ── */
        .listings-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          box-sizing: border-box;
        }
        @media (max-width: 1400px) {
          .listings-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 1100px) {
          .listings-grid {
            grid-template-columns: 1fr;
          }
        }
        .listing-card {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #dddde1;
          overflow: hidden;
          transition: border-color 0.2s ease;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          box-shadow: none;
        }
        .listing-card:hover {
          border-color: #a1a1aa;
        }

        /* ── DISTRICT TOOLTIP ── */
        .district-tooltip {
          background: rgba(16,16,16,0.88) !important;
          backdrop-filter: blur(6px);
          color: #ffffff !important;
          border: none !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          font-size: 0.7rem !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.2) !important;
          padding: 4px 9px !important;
          font-family: 'Inter', sans-serif !important;
          letter-spacing: 0.02em !important;
        }
        .district-tooltip::before { border-top-color: rgba(16,16,16,0.88) !important; }
        .city-division-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .city-division-tooltip::before { display: none !important; }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .map-search-page-container {
            height: auto !important;
            overflow-y: visible !important;
            margin-top: 0px !important;
          }
          .filters-container {
            padding: 0.5rem 0.5rem !important;
          }
          .split-view-container {
            grid-template-columns: 1fr !important;
            height: auto !important;
            overflow-y: visible !important;
            padding: 0px 0.35rem 0.35rem 0.35rem !important;
            gap: 0.5rem !important;
          }
          .map-card-col {
            height: calc(100vh - 180px) !important;
            border-radius: 12px !important;
            border: 1px solid rgba(0,0,0,0.08) !important;
            order: 1 !important;
          }
          .listings-card-col {
            height: auto !important;
            overflow-y: visible !important;
            order: 2 !important;
          }
        }
        .navbar {
          margin-bottom: 4px !important;
        }
      `}</style>
      

      
      {/* Premium CSS for tooltips */}
      <style>{`
        .district-tooltip {
          background: #2C2C2C !important;
          color: #ffffff !important;
          border: none !important;
          border-radius: 4px !important;
          font-weight: 700 !important;
          font-size: 0.72rem !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          padding: 4px 8px !important;
          font-family: 'Inter', sans-serif !important;
        }
        .district-tooltip::before {
          border-top-color: #2C2C2C !important;
        }
        .city-division-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .city-division-tooltip::before {
          display: none !important;
        }
      `}</style>

      {/* ── TOP FILTER BAR ── */}
      <div className="filters-container" style={{
        background: '#ffffff',
        borderBottom: '1px solid #e8e8e7',
        padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        zIndex: 50,
        overflowX: isMobile ? 'auto' : 'visible',
        whiteSpace: 'nowrap'
      }}>
        {/* Desktop Search (Hidden on Mobile, moved to first line in Navbar) */}
        {!isMobile && (
          <>
            <div className="search-pill-wrap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                className="filter-pill search-pill"
                placeholder="Search lands..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ minWidth: '260px' }}
              />
            </div>
            <div className="filter-divider" />
          </>
        )}

        {renderSamsungDropdowns()}



        {/* Reset if any active filter */}
        {(selectedDistrict || selectedCity || filterType || minPrice || maxPrice || searchTerm || minArea || maxArea || soilType || waterSource || roadAccess) && (
          <>
            {!isMobile && <div className="filter-divider" />}
            <button
              className="filter-pill"
              onClick={() => {
                handleMapBackgroundClick();
                setFilterType('');
                setMinPrice('');
                setMaxPrice('');
                setSearchTerm('');
                setMinArea('');
                setMaxArea('');
                setSoilType('');
                setWaterSource('');
                setRoadAccess('');
              }}
              style={isMobile ? { height: '30px', fontSize: '0.74rem', padding: '0 0.5rem', color: '#ef4444', borderColor: '#fca5a5', background: '#fff5f5', fontWeight: 600 } : { color: '#ef4444', borderColor: '#fca5a5', background: '#fff5f5', fontWeight: 600 }}
            >
              ✕ Clear
            </button>
          </>
        )}
      </div>

      {/* ── SPLIT VIEW CONTAINER ── */}
      <div className="split-view-container" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        flex: 1,
        overflow: 'hidden',
        padding: '0 0.875rem 0.875rem 0.875rem',
        gap: '0.875rem',
        background: '#f0f0ef'
      }}>
        
        {/* LEFT COLUMN: Map Card */}
        {(!isMobile || mobileActiveTab === 'map') && (
          <div className="map-card-col" style={{
          borderRadius: '36px',
          overflow: 'hidden',
          height: '100%',
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          border: '1.5px solid rgba(0,0,0,0.1)'
        }}>
          <div style={{ height: '100%', width: '100%', overflow: 'hidden', position: 'relative' }}>
            {/* Floating Map/Lands Toggle Button for Mobile - Top Over Map */}
            {isMobile && (
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 999,
                background: 'rgba(255, 255, 255, 0.82)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '99px',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
                border: '1.5px solid rgba(255,255,255,0.4)',
                height: '40px',
                boxSizing: 'border-box'
              }}>
                <button
                  onClick={() => {
                    setMobileActiveTab('map');
                    setDrawerState('collapsed');
                    window.dispatchEvent(new CustomEvent('blur-mobile-search'));
                  }}
                  style={{
                    background: drawerState === 'collapsed' ? '#2C2C2C' : 'transparent',
                    color: drawerState === 'collapsed' ? '#ffffff' : '#374151',
                    border: 'none',
                    borderRadius: '99px',
                    padding: '0 20px',
                    height: '32px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                    outline: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    WebkitTapHighlightColor: 'transparent',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    letterSpacing: '-0.01em'
                  }}
                >
                  Map
                </button>
                <button
                  onClick={() => {
                    setMobileActiveTab('lands');
                    setDrawerState('expanded');
                  }}
                  style={{
                    background: drawerState === 'expanded' ? '#2C2C2C' : 'transparent',
                    color: drawerState === 'expanded' ? '#ffffff' : '#374151',
                    border: 'none',
                    borderRadius: '99px',
                    padding: '0 20px',
                    height: '32px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                    outline: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    WebkitTapHighlightColor: 'transparent',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    letterSpacing: '-0.01em'
                  }}
                >
                  Lands
                </button>
              </div>
            )}
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              zoomControl={false}
              maxBounds={[[4, 64], [25, 92]]}
              minZoom={6}
              maxZoom={14}
              zoomAnimation={true}
              zoomAnimationThreshold={4}
              fadeAnimation={true}
              markerZoomAnimation={true}
              preferCanvas={false}
              style={{ height: '100%', width: '100%' }}
            >
            {/* Fly to active center or bounds */}
            <MapFlyController center={mapCenter} zoom={mapZoom} bounds={selectedBounds} />

            {/* Click listener to deselect selected district */}
            <MapEventsHandler onMapClick={handleMapBackgroundClick} />

            {/* Styled Google Maps Standard Tile Layer — keepBuffer prefetches tiles far outside viewport */}
            <TileLayer
              url={MAP_TILES}
              subdomains={['0', '1', '2', '3']}
              attribution='&copy; Google Maps'
              keepBuffer={8}
              updateWhenIdle={false}
              updateWhenZooming={false}
            />

            {/* Permanent dark mask outside Tamil Nadu — pre-rendered far beyond viewport */}
            {maskGeoJson && (
              <GeoJSON
                key="tn-gta-mask"
                data={maskGeoJson}
                pathOptions={{
                  fillColor: '#090c15',
                  fillOpacity: 0.76,
                  color: 'transparent',
                  weight: 0,
                  renderer: maskRenderer
                }}
                interactive={false}
              />
            )}

            {/* Tamil Nadu Districts GeoJSON boundaries */}
            {geoJsonData && (
              <GeoJSON
                key={selectedDistrict || 'tn-districts-terrain'}
                data={geoJsonData}
                style={getFeatureStyle}
                onEachFeature={onEachFeature}
              />
            )}
          
            {/* District Name Labels rendered as desaturated text on the map */}
            {districtCenters.map((dc: { name: string; coords: [number, number] }) => {
              const isSelected = selectedDistrict && normalizeName(dc.name) === normalizeName(selectedDistrict);
              if (isSelected) return null; // hide only the selected district's label to prevent duplicate overlapping
              
              return (
                <Marker
                  key={`label-${dc.name}`}
                  position={dc.coords}
                  icon={L.divIcon({
                    className: 'district-map-label',
                    html: `<div style="
                      font-family: 'Inter', sans-serif;
                      font-size: 0.72rem;
                      font-weight: 800;
                      color: #374151;
                      text-shadow: -1.5px -1.5px 0 #fff, 1.5px -1.5px 0 #fff, -1.5px 1.5px 0 #fff, 1.5px 1.5px 0 #fff;
                      text-align: center;
                      white-space: nowrap;
                      text-transform: uppercase;
                      letter-spacing: 0.05em;
                      pointer-events: none;
                    ">${dc.name}</div>`,
                    iconSize: [100, 20],
                    iconAnchor: [50, 10]
                  })}
                  eventHandlers={{
                    click: () => {
                      handleDistrictChange(dc.name);
                    }
                  }}
                />
              );
            })}

            {selectedDistrict && activeCityDivisions.map((div: any, idx: number) => {
              const isHighlighted = selectedCity && normalizeName(div.name) === normalizeName(selectedCity);
              const bounds = L.polygon(div.polygons).getBounds();
              const center = bounds.isValid() ? bounds.getCenter() : null;
              
              return (
                <div key={`city-div-wrapper-${div.name}-${idx}`}>
                  <Polygon
                    positions={div.polygons}
                    pathOptions={{
                      color: isHighlighted ? '#eab308' : 'rgba(16, 16, 16, 0.22)',
                      weight: isHighlighted ? 2.5 : 1.25,
                      fillColor: '#facc15', // premium yellow wash for all divisions in selected district
                      fillOpacity: isHighlighted ? 0.35 : 0.04 // soft wash for unhighlighted, solid highlight for selected
                    }}
                    eventHandlers={{
                      click: (e) => {
                        L.DomEvent.stopPropagation(e);
                        handleCityChange(div.name);
                      }
                    }}
                  />
                  {center && (
                    <CircleMarker
                      center={center}
                      radius={0}
                      pathOptions={{ stroke: false, fill: false }}
                      interactive={false}
                    >
                      <Tooltip
                        permanent
                        direction="center"
                        className="city-division-tooltip"
                      >
                        <span style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          color: isHighlighted ? '#b45309' : '#4b5563',
                          textShadow: '-1.5px -1.5px 0 #fff, 1.5px -1.5px 0 #fff, -1.5px 1.5px 0 #fff, 1.5px 1.5px 0 #fff',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          pointerEvents: 'none'
                        }}>
                          {div.name}
                        </span>
                      </Tooltip>
                    </CircleMarker>
                  )}
                </div>
              );
            })}
            </MapContainer>


          </div>
        </div>
      )}

        {/* RIGHT COLUMN: Listings */}
        {(!isMobile || mobileActiveTab === 'lands') && (
          <div className="listings-card-col" style={{
          height: '100%',
          overflowY: 'auto',
          padding: '1rem 20px 2rem',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '0.75rem', marginBottom: '0.5rem', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#111827', fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {selectedDistrict 
                  ? (selectedCity ? `${selectedDistrict}, ${selectedCity} Lands For Sale` : `${selectedDistrict} Lands For Sale`)
                  : 'Tamil Nadu Lands For Sale'
                }
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#111827', fontWeight: 700, fontFamily: "'Inter', sans-serif", marginTop: '0.15rem' }}>
                {filteredProperties.length.toLocaleString()} results
              </span>
            </div>
            
            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.8rem', fontWeight: 700, color: '#006aff', cursor: 'pointer', fontFamily: "'Inter', sans-serif", marginTop: '3px' }}>
              <span>Sort: Lands for You</span>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="5 8 10 13 15 8" />
              </svg>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '14px' }} />
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌾</div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500, margin: '0 0 0.5rem' }}>
                {selectedDistrict 
                  ? `No lands listed in ${selectedCity || selectedDistrict} yet.`
                  : 'No lands match your filters.'
                }
              </p>
              <p style={{ color: '#9ca3af', fontSize: '0.78rem', margin: '0 0 1.25rem' }}>Try adjusting or clearing your filters.</p>
              <button
                onClick={() => {
                  handleMapBackgroundClick();
                  setFilterType('');
                  setMinPrice('');
                  setMaxPrice('');
                  setSearchTerm('');
                }}
                style={{
                  background: '#2C2C2C',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '99px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.01em'
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="listings-grid">
              {filteredProperties.map(p => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  isWishlisted={wishlist.includes(p.id)}
                  onToggleWishlist={toggleWishlist}
                  isTogglingWishlist={togglingId === p.id}
                  animationSetting={animationSetting}
                />
              ))}
            </div>
          )}
        </div>
      )}
      </div>

      {/* Mobile Draggable bottom sheet drawer (Google/Apple Maps comment sheet style) */}
      {isMobile && createPortal(
        <>
          {/* Backdrop blur overlay - only shown when expanded */}
          {drawerState === 'expanded' && (
            <div 
              onClick={() => {
                setDrawerState('collapsed');
                setSelectedCity(null);
                window.dispatchEvent(new CustomEvent('blur-mobile-search'));
              }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                zIndex: 999
              }}
            />
          )}

          {/* Slide-up bottom sheet drawer */}
          <div 
            ref={drawerRef}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '89vh',
              transform: `translateY(${
                dragY !== null
                  ? Math.max(0, (drawerState === 'expanded' ? 0 : (window.innerHeight * 0.89 - 75)) + dragY)
                  : (drawerState === 'expanded' ? 0 : (window.innerHeight * 0.89 - 75))
              }px)`,
              background: '#faf9f7',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
              zIndex: 1000,
              overflowY: drawerState === 'expanded' ? 'auto' : 'hidden',
              padding: '0.75rem 1.25rem 1.25rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              transition: dragY !== null ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              boxSizing: 'border-box'
            }}
          >
            {/* Header Drag Wrapper (captures pointer events) */}
            <div 
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{ 
                width: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                cursor: 'grab', 
                userSelect: 'none',
                paddingTop: '4px',
                paddingBottom: '8px',
                flexShrink: 0
              }}
            >
              {/* Sleek Horizontal Drag Handle Line */}
              <div 
                style={{
                  width: '40px',
                  height: '4.5px',
                  background: '#d1d5db',
                  borderRadius: '99px',
                  margin: '0 auto 0.45rem auto'
                }}
              />

              {/* Centered Header & Close Button */}
              <div style={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                <div style={{ textAlign: 'center', width: '100%', padding: '0 2rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#2C2C2C', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", letterSpacing: '-0.04em' }}>
                    {selectedDistrict ? (selectedCity ? `${selectedDistrict}, ${selectedCity} Lands!` : `${selectedDistrict} Lands!`) : 'Tamil Nadu Lands!'}
                  </h3>
                  <span style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 700, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", letterSpacing: '0.02em', textTransform: 'uppercase', display: 'block', marginTop: '0.15rem' }}>
                    {filteredProperties.length} found results
                  </span>
                </div>
                {drawerState === 'expanded' && (
                  <button 
                    onClick={() => {
                      setDrawerState('collapsed');
                      setSelectedCity(null);
                      window.dispatchEvent(new CustomEvent('blur-mobile-search'));
                    }}
                    style={{
                      position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: '#f3f4f6', border: 'none', color: '#6b7280',
                      fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Content Only */}
            {drawerState === 'expanded' && (
              <>
                {/* Same dropdown panel as map view */}
                <div style={{
                  padding: '0.25rem 0 0.5rem 0',
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                  width: '100%',
                  boxSizing: 'border-box',
                  flexShrink: 0
                }}>
                  {renderSamsungDropdowns()}
                </div>

                {/* List Body */}
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '1rem 0' }}>
                    {[1, 2].map(i => (
                      <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '14px' }} />
                    ))}
                  </div>
                ) : filteredProperties.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌾</div>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500, margin: '0 0 0.5rem' }}>
                      No lands listed here yet.
                    </p>
                    <p style={{ color: '#9ca3af', fontSize: '0.78rem', margin: '0 0 1.25rem' }}>Try adjusting or clearing your filters.</p>
                    <button
                      onClick={() => {
                        setDrawerState('collapsed');
                        setSelectedCity(null);
                        window.dispatchEvent(new CustomEvent('blur-mobile-search'));
                      }}
                      style={{
                        background: '#2C2C2C',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.5rem 1.25rem',
                        borderRadius: '99px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Close drawer
                    </button>
                  </div>
                ) : (
                    <div className="listings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', paddingBottom: '2.5rem' }}>
                      {filteredProperties.map(p => (
                        <PropertyCard
                          key={p.id}
                          property={p}
                          isWishlisted={wishlist.includes(p.id)}
                          onToggleWishlist={toggleWishlist}
                          isTogglingWishlist={togglingId === p.id}
                          animationSetting={animationSetting}
                        />
                      ))}
                    </div>
                )}
              </>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
