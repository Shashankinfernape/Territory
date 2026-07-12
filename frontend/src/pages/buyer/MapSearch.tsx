import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip, Polygon, GeoJSON, useMapEvents, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api, getToken } from '../../lib/api';
import type { Property } from '../../lib/types';
import { getPropertyImageUrl } from '../../lib/types';
import { TAMIL_NADU_GEOJSON as OFFLINE_GEOJSON } from '../../components/common/tamilnadu_geojson';
import TAMIL_NADU_CITY_DIVISIONS from '../../components/common/tamilnadu_city_divisions.json';

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

// Maps old 2011 Census district/taluk pairs to modern 38 districts
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
  [normalizeName("Ariyalur")]: [
    { name: "Ariyalur", coords: [11.1401, 79.0747] },
    { name: "Jayankondam", coords: [11.2119861, 79.3648642] },
    { name: "Sendurai", coords: [11.2720093, 79.1865576] },
    { name: "Udayarpalayam", coords: [11.1588136, 79.3444131] }
  ],
  [normalizeName("Chengalpattu")]: [
    { name: "Chengalpattu", coords: [12.6841, 79.9836] },
    { name: "Tambaram", coords: [12.9229, 80.1275] },
    { name: "Pallavaram", coords: [12.9675, 80.1849] },
    { name: "Guduvancheri", coords: [12.8452303, 80.0576503] },
    { name: "Maraimalai Nagar", coords: [12.7958223, 80.0269097] },
    { name: "Mahabalipuram", coords: [12.6208, 80.1945] },
    { name: "Madurantakam", coords: [12.5081836, 79.8882285] }
  ],
  [normalizeName("Chennai")]: [
    { name: "Chennai", coords: [13.0836939, 80.270186] }
  ],
  [normalizeName("Coimbatore")]: [
    { name: "Coimbatore", coords: [11.0168, 76.9558] },
    { name: "Pollachi", coords: [10.6589, 77.0091] },
    { name: "Mettupalayam", coords: [11.3006, 76.9407] },
    { name: "Valparai", coords: [10.3279931, 76.9557258] },
    { name: "Sulur", coords: [10.9890536, 77.1014971] },
    { name: "Kinathukadavu", coords: [10.8284322, 77.0254459] }
  ],
  [normalizeName("Cuddalore")]: [
    { name: "Cuddalore", coords: [11.748, 79.7714] },
    { name: "Neyveli", coords: [11.6053, 79.4862] },
    { name: "Chidambaram", coords: [11.3984, 79.6954] },
    { name: "Panruti", coords: [11.7722823, 79.5518978] },
    { name: "Virudhachalam", coords: [11.5478752, 79.38454] },
    { name: "Vadalur", coords: [11.5551872, 79.555067] }
  ],
  [normalizeName("Dharmapuri")]: [
    { name: "Dharmapuri", coords: [12.1278, 78.1579] },
    { name: "Harur", coords: [12.0624, 78.4908] },
    { name: "Palacode", coords: [12.3041231, 78.0728817] },
    { name: "Pennagaram", coords: [12.1125277, 77.8677247] },
    { name: "Pappireddipatti", coords: [11.9138178, 78.3671093] }
  ],
  [normalizeName("Dindigul")]: [
    { name: "Dindigul", coords: [10.3673, 77.9803] },
    { name: "Palani", coords: [10.4492, 77.5218] },
    { name: "Kodaikanal", coords: [10.2381, 77.4892] },
    { name: "Nilakottai", coords: [10.2436869, 77.872736] },
    { name: "Vedasandur", coords: [10.5990268, 78.0016771] },
    { name: "Oddanchatram", coords: [10.4851135, 77.7460054] },
    { name: "Natham", coords: [10.2689998, 78.2507119] }
  ],
  [normalizeName("Erode")]: [
    { name: "Erode", coords: [11.341, 77.7172] },
    { name: "Gobichettipalayam", coords: [11.4533, 77.4385] },
    { name: "Bhavani", coords: [11.4429, 77.6797] },
    { name: "Sathyamangalam", coords: [11.5523741, 77.2653758] },
    { name: "Perundurai", coords: [11.2539029, 77.6288316] },
    { name: "Anthiyur", coords: [11.7144457, 77.5679387] }
  ],
  [normalizeName("Kallakurichi")]: [
    { name: "Kallakurichi", coords: [11.7381, 78.9625] },
    { name: "Sankarapuram", coords: [11.8555913, 78.9857967] },
    { name: "Chinnasalem", coords: [11.6354866, 78.8809891] },
    { name: "Ulundurpet", coords: [11.6896, 79.2903] },
    { name: "Kalvarayan Hills", coords: [10.9271, 78.4569] }
  ],
  [normalizeName("Kancheepuram")]: [
    { name: "Kanchipuram", coords: [12.8342, 79.7036] },
    { name: "Sriperumbudur", coords: [12.9712, 79.9515] },
    { name: "Kundrathur", coords: [12.9959652, 80.0975672] },
    { name: "Uthiramerur", coords: [12.8055871, 79.708619] },
    { name: "Walajabad", coords: [12.7918106, 79.828395] }
  ],
  [normalizeName("Kanyakumari")]: [
    { name: "Nagercoil", coords: [8.183, 77.4119] },
    { name: "Kanyakumari", coords: [8.0883, 77.5385] },
    { name: "Colachel", coords: [8.1752656, 77.2519232] },
    { name: "Kuzhithurai", coords: [8.315526, 77.2068841] },
    { name: "Padmanabhapuram", coords: [8.2522582, 77.3264881] },
    { name: "Marthandam", coords: [8.3122492, 77.2473348] }
  ],
  [normalizeName("Karur")]: [
    { name: "Karur", coords: [10.9601, 78.0766] },
    { name: "Kulithalai", coords: [10.9333, 78.4167] },
    { name: "Aravakurichi", coords: [10.8505925, 77.9260843] },
    { name: "Krishnarayapuram", coords: [10.8358561, 78.351929] }
  ],
  [normalizeName("Krishnagiri")]: [
    { name: "Krishnagiri", coords: [12.5186, 78.2138] },
    { name: "Hosur", coords: [12.7409, 77.8253] },
    { name: "Denkanikottai", coords: [12.5128321, 77.761123] },
    { name: "Uthangarai", coords: [12.2752798, 78.4938829] },
    { name: "Bargur", coords: [12.5425826, 78.3567173] }
  ],
  [normalizeName("Madurai")]: [
    { name: "Madurai", coords: [9.9252, 78.1198] },
    { name: "Melur", coords: [10.0447, 78.3377] },
    { name: "Tirumangalam", coords: [9.8238241, 77.9862243] },
    { name: "Usilampatti", coords: [9.9706372, 77.7939864] },
    { name: "Vadipatti", coords: [10.0790057, 78.0360014] }
  ],
  [normalizeName("Mayiladuthurai")]: [
    { name: "Mayiladuthurai", coords: [11.1018, 79.6522] },
    { name: "Sirkazhi", coords: [11.2367, 79.7333] },
    { name: "Kuthalam", coords: [11.0382345, 79.5915282] },
    { name: "Tharangambadi", coords: [11.029929, 79.852196] }
  ],
  [normalizeName("Nagapattinam")]: [
    { name: "Nagapattinam", coords: [10.7672, 79.8449] },
    { name: "Velankanni", coords: [10.6868771, 79.8461807] },
    { name: "Vedaranyam", coords: [10.3754, 79.7849] },
    { name: "Kilvelur", coords: [10.689433, 79.7171793] }
  ],
  [normalizeName("Namakkal")]: [
    { name: "Namakkal", coords: [11.2189, 78.1673] },
    { name: "Tiruchengode", coords: [11.3789, 77.8937] },
    { name: "Rasipuram", coords: [11.4537338, 78.1784576] },
    { name: "Paramathi Velur", coords: [11.1864537, 77.95902] },
    { name: "Kumarapalayam", coords: [11.3882525, 77.7778376] },
    { name: "Sendamangalam", coords: [11.262066, 78.2461298] }
  ],
  [normalizeName("Nilgiris")]: [
    { name: "Ooty", coords: [11.4102, 76.695] },
    { name: "Coonoor", coords: [11.353, 76.7959] },
    { name: "Kotagiri", coords: [11.4230431, 76.8658211] },
    { name: "Gudalur", coords: [11.4992417, 76.4923903] },
    { name: "Wellington", coords: [11.3560782, 76.7861039] }
  ],
  [normalizeName("Perambalur")]: [
    { name: "Perambalur", coords: [11.2342, 78.8821] },
    { name: "Kunnam", coords: [11.2942727, 79.0144972] },
    { name: "Veppanthattai", coords: [11.3994219, 78.8868756] }
  ],
  [normalizeName("Pudukkottai")]: [
    { name: "Pudukkottai", coords: [10.3797, 78.8208] },
    { name: "Aranthangi", coords: [10.1652, 78.9959] },
    { name: "Alangudi", coords: [10.3603703, 78.9778724] },
    { name: "Illuppur", coords: [10.5136995, 78.6215544] },
    { name: "Keeranur", coords: [10.5733857, 78.7842652] }
  ],
  [normalizeName("Ramanathapuram")]: [
    { name: "Ramanathapuram", coords: [9.3639, 78.8394] },
    { name: "Rameswaram", coords: [9.2876, 79.3129] },
    { name: "Paramakudi", coords: [9.4867151, 78.6722718] },
    { name: "Keelakarai", coords: [10.0308721, 79.1272366] },
    { name: "Mandapam", coords: [9.282701, 79.1526713] }
  ],
  [normalizeName("Ranipet")]: [
    { name: "Ranipet", coords: [12.9272, 79.3328] },
    { name: "Arcot", coords: [12.8996, 79.3339] },
    { name: "Arakkonam", coords: [13.085, 79.6677] },
    { name: "Walajah", coords: [12.9254734, 79.3637892] },
    { name: "Sholinghur", coords: [13.1151925, 79.4231084] }
  ],
  [normalizeName("Salem")]: [
    { name: "Salem", coords: [11.6643, 78.146] },
    { name: "Mettur", coords: [11.7862, 77.8012] },
    { name: "Attur", coords: [11.5976, 78.5971] },
    { name: "Edappadi", coords: [11.5838413, 77.8347612] },
    { name: "Sankagiri", coords: [11.4760857, 77.8704045] },
    { name: "Omalur", coords: [11.7428538, 78.0472667] },
    { name: "Yercaud", coords: [11.7852074, 78.2075392] }
  ],
  [normalizeName("Sivaganga")]: [
    { name: "Sivaganga", coords: [9.8486881, 78.4870461] },
    { name: "Karaikudi", coords: [10.0734, 78.7733] },
    { name: "Devakottai", coords: [9.9504, 78.813747] },
    { name: "Tiruppathur", coords: [10.110361, 78.5930852] },
    { name: "Manamadurai", coords: [9.8565738, 78.4857017] }
  ],
  [normalizeName("Tenkasi")]: [
    { name: "Tenkasi", coords: [8.9593, 77.3139] },
    { name: "Courtallam", coords: [8.9328828, 77.2714628] },
    { name: "Sengottai", coords: [8.9872613, 77.242167] },
    { name: "Kadayanallur", coords: [9.0842049, 77.3461957] },
    { name: "Alangulam", coords: [8.859726, 77.4882218] }
  ],
  [normalizeName("Thanjavur")]: [
    { name: "Thanjavur", coords: [10.787, 79.1378] },
    { name: "Kumbakonam", coords: [10.9617, 79.3881] },
    { name: "Pattukkottai", coords: [10.4162901, 79.3205603] },
    { name: "Orathanadu", coords: [10.5752663, 79.2970596] },
    { name: "Thiruvaiyaru", coords: [10.8797198, 79.1039298] }
  ],
  [normalizeName("Theni")]: [
    { name: "Theni", coords: [10.0104, 77.4777] },
    { name: "Periyakulam", coords: [10.1198663, 77.5467069] },
    { name: "Bodinayakanur", coords: [10.0104, 77.3486] },
    { name: "Cumbum", coords: [9.7394057, 77.2853013] },
    { name: "Uthamapalayam", coords: [9.7662548, 77.3299043] }
  ],
  [normalizeName("Thoothukudi")]: [
    { name: "Thoothukudi", coords: [8.7642, 78.1348] },
    { name: "Kovilpatti", coords: [9.1779, 77.8687] },
    { name: "Tiruchendur", coords: [8.495568, 78.123324] },
    { name: "Kayalpattinam", coords: [8.5677868, 78.1003644] },
    { name: "Ettayapuram", coords: [9.1806106, 78.0230534] }
  ],
  [normalizeName("Tiruchirappalli")]: [
    { name: "Tiruchirappalli", coords: [10.8071144, 78.6880939] },
    { name: "Srirangam", coords: [10.8622, 78.6882] },
    { name: "Manapparai", coords: [10.6074, 78.4172] },
    { name: "Thuraiyur", coords: [11.2302028, 78.5650695] },
    { name: "Lalgudi", coords: [10.8754197, 78.8153244] },
    { name: "Musiri", coords: [11.0488173, 78.5282293] }
  ],
  [normalizeName("Tirunelveli")]: [
    { name: "Tirunelveli", coords: [8.7139, 77.7567] },
    { name: "Ambasamudram", coords: [8.7027, 77.4565] },
    { name: "Cheranmahadevi", coords: [8.6793185, 77.5617186] },
    { name: "Nanguneri", coords: [8.4892568, 77.6596709] },
    { name: "Thisayanvilai", coords: [8.3355721, 77.8668199] }
  ],
  [normalizeName("Tirupattur")]: [
    { name: "Tirupattur", coords: [12.4918, 78.5676] },
    { name: "Vaniyambadi", coords: [12.6845, 78.6186] },
    { name: "Ambur", coords: [12.7909, 78.7166] },
    { name: "Natrampalli", coords: [12.5937269, 78.5140944] }
  ],
  [normalizeName("Tiruppur")]: [
    { name: "Tiruppur", coords: [11.1085, 77.3411] },
    { name: "Dharapuram", coords: [10.7369082, 77.5260968] },
    { name: "Udumalaipettai", coords: [10.5847, 77.2431] },
    { name: "Avinashi", coords: [11.1900066, 77.2679915] },
    { name: "Palladam", coords: [10.9882, 77.2755] },
    { name: "Kangeyam", coords: [10.9902543, 77.6282496] }
  ],
  [normalizeName("Tiruvallur")]: [
    { name: "Tiruvallur", coords: [13.1422, 79.9077] },
    { name: "Avadi", coords: [13.1187, 80.1047] },
    { name: "Ponneri", coords: [13.3710903, 80.2428419] },
    { name: "Tiruttani", coords: [13.1775621, 79.6115074] },
    { name: "Gummidipoondi", coords: [13.4308848, 80.0821379] },
    { name: "Poonamallee", coords: [13.0492031, 80.1010677] }
  ],
  [normalizeName("Tiruvannamalai")]: [
    { name: "Tiruvannamalai", coords: [12.2253, 79.0747] },
    { name: "Arani", coords: [12.6711, 79.2842] },
    { name: "Chengam", coords: [12.3502311, 78.8767964] },
    { name: "Vandavasi", coords: [12.5056013, 79.6049607] },
    { name: "Polur", coords: [12.5937689, 79.1385342] },
    { name: "Cheyyar", coords: [12.6563891, 79.5404577] }
  ],
  [normalizeName("Tiruvarur")]: [
    { name: "Tiruvarur", coords: [10.7716, 79.6385] },
    { name: "Mannargudi", coords: [10.6657, 79.4449] },
    { name: "Thiruthuraipoondi", coords: [10.5317373, 79.6400749] },
    { name: "Needamangalam", coords: [10.7249596, 79.4700426] },
    { name: "Koothanallur", coords: [10.7187756, 79.5237309] }
  ],
  [normalizeName("Vellore")]: [
    { name: "Vellore", coords: [12.9165, 79.1325] },
    { name: "Gudiyatham", coords: [12.9463, 78.8711] },
    { name: "Pernambut", coords: [12.9378, 78.7186] },
    { name: "Katpadi", coords: [12.9818, 79.1396] }
  ],
  [normalizeName("Viluppuram")]: [
    { name: "Viluppuram", coords: [11.9401, 79.4861] },
    { name: "Tindivanam", coords: [12.2359, 79.65] },
    { name: "Gingee", coords: [12.2544154, 79.4157756] },
    { name: "Kottakuppam", coords: [11.9676624, 79.8378289] },
    { name: "Marakkanam", coords: [12.1959326, 79.9441819] }
  ],
  [normalizeName("Virudhunagar")]: [
    { name: "Virudhunagar", coords: [9.5872, 77.957] },
    { name: "Sivakasi", coords: [9.4533, 77.8016] },
    { name: "Rajapalayam", coords: [9.4031584, 77.5182644] },
    { name: "Srivilliputtur", coords: [9.4977534, 77.6450726] },
    { name: "Sattur", coords: [9.322676, 77.9418465] },
    { name: "Aruppukottai", coords: [9.581648, 77.925947] }
  ]
};

// Format pricing helper
const formatPrice = (price: number) => {
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  }
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(1)} L`;
  }
  return `₹${price.toLocaleString('en-IN')}`;
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

export default function MapSearch() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [geoJsonData, setGeoJsonData] = useState<any | null>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');

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


  // Map viewport states
  const [mapCenter, setMapCenter] = useState<[number, number]>(TN_CENTER);
  const [mapZoom, setMapZoom] = useState(TN_ZOOM);
  const [selectedBounds, setSelectedBounds] = useState<L.LatLngBounds | null>(null);

  // Active district and city filters
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  

  
  // Other Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  const [visibleCount, setVisibleCount] = useState(12);
  useEffect(() => {
    setVisibleCount(12);
  }, [searchTerm, filterType, minPrice, maxPrice, selectedDistrict, selectedCity]);

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

      return true;
    });
  }, [properties, selectedDistrict, selectedCity, searchTerm, filterType, minPrice, maxPrice]);

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
      return;
    }
    setSelectedCity(cityName);
  };

  const handleMapBackgroundClick = () => {
    setSelectedDistrict(null);
    setSelectedCity(null);
    setSelectedBounds(null);
    setMapCenter(TN_CENTER);
    setMapZoom(TN_ZOOM);
  };

  const activeCityDivisions = useMemo(() => {
    if (!selectedDistrict) return [];
    const keys = Object.keys(TAMIL_NADU_CITY_DIVISIONS);
    const matchedKey = keys.find(k => normalizeName(k) === normalizeName(selectedDistrict)) || selectedDistrict;
    return (TAMIL_NADU_CITY_DIVISIONS as any)[matchedKey] || [];
  }, [selectedDistrict]);

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
    
    // Outer frame coordinates wrapping India/Asia bounds safely
    const worldBounds = [
      [-180, -90],
      [180, -90],
      [180, 90],
      [-180, 90],
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



  // GeoJSON style handler
  const getFeatureStyle = (feature: any) => {
    const distName = feature.properties.Dist_Name || '';
    const isSelected = selectedDistrict && normalizeName(distName) === normalizeName(selectedDistrict);
    return {
      color: isSelected ? '#eab308' : 'rgba(16, 16, 16, 0.15)', // bold yellow outline for selected district
      weight: isSelected ? 3.5 : 1.5,
      fillColor: isSelected ? '#facc15' : 'transparent',
      fillOpacity: isSelected ? 0.05 : 0, // soft yellow wash inside selected district
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
    <div className="map-search-page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden', background: 'transparent' }}>
      <style>{`
        /* ── FILTER BAR ── */
        .filters-container::-webkit-scrollbar { display: none !important; }
        .filters-container { -ms-overflow-style: none; scrollbar-width: none; }

        .filter-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.42rem 1rem;
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
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
        .search-pill {
          padding-left: 2.2rem !important;
        }

        /* ── MAP CARD ── */
        .leaflet-control-attribution { font-size: 0.6rem !important; }

        /* ── LISTING CARD ── */
        .listings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.875rem;
        }
        .listing-card {
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .listing-card:hover {
          transform: translateY(-3px);
          border-color: #1a6b45;
          box-shadow: 0 10px 25px rgba(26,107,69,0.08);
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
            height: calc(100vh - 60px) !important;
            overflow: hidden !important;
          }
          .filters-container {
            padding: 0.5rem 0.875rem !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
          }
          .split-view-container {
            grid-template-columns: 1fr !important;
            grid-template-rows: 1fr !important;
            height: 100% !important;
            overflow: hidden !important;
            padding: 0 !important;
            gap: 0 !important;
            position: relative !important;
          }
          .map-card-col {
            position: absolute !important;
            top: 0; left: 0; right: 0; bottom: 0;
            height: 100% !important;
            z-index: 1 !important;
            border-radius: 0 !important;
            opacity: var(--map-opacity, 1) !important;
            pointer-events: var(--map-pointer, auto) !important;
            transition: opacity 0.3s ease !important;
          }
          .listings-card-col {
            position: absolute !important;
            top: 0; left: 0; right: 0; bottom: 0;
            height: 100% !important;
            overflow-y: auto !important;
            z-index: 2 !important;
            background: rgba(250, 250, 250, 0.95) !important;
            backdrop-filter: blur(16px) !important;
            border-top: none !important;
            opacity: var(--list-opacity, 0) !important;
            pointer-events: var(--list-pointer, none) !important;
            transition: opacity 0.3s ease !important;
            padding-bottom: 5rem !important;
          }
          .listings-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .mobile-view-toggle {
            display: flex !important;
          }
        }
      `}</style>
      

      {/* ── TOP FILTER BAR ── */}
      <div className="filters-container" style={{
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        padding: '0.6rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        zIndex: 1000,
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        {/* Search */}
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
            style={{ minWidth: '160px' }}
          />
        </div>

        <div className="filter-divider" />

        {/* District */}
        <select
          className={`filter-pill filter-pill-select${selectedDistrict ? ' active' : ''}`}
          value={selectedDistrict || ''}
          onChange={e => handleDistrictChange(e.target.value)}
        >
          <option value="">District</option>
          {TAMIL_NADU_DISTRICTS.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* City — only shown when district selected */}
        {selectedDistrict && (
          <select
            className={`filter-pill filter-pill-select${selectedCity ? ' active' : ''}`}
            value={selectedCity || ''}
            onChange={e => handleCityChange(e.target.value)}
          >
            <option value="">All of {selectedDistrict}</option>
            {sortedTaluksList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}

        <div className="filter-divider" />

        {/* Type */}
        <select
          className={`filter-pill filter-pill-select${filterType ? ' active' : ''}`}
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">Plot Type</option>
          <option>Agricultural Land</option>
          <option>Flat Plot</option>
          <option>Farm Land</option>
          <option>Residential Plot</option>
          <option>Commercial Plot</option>
        </select>

        <div className="filter-divider" />

        {/* Price range */}
        <input
          type="number"
          className="filter-pill"
          placeholder="Min ₹"
          value={minPrice}
          onChange={e => setMinPrice(e.target.value)}
          style={{ width: '90px' }}
        />
        <input
          type="number"
          className="filter-pill"
          placeholder="Max ₹"
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
          style={{ width: '90px' }}
        />

        {/* Reset if any active filter */}
        {(selectedDistrict || selectedCity || filterType || minPrice || maxPrice || searchTerm) && (
          <>
            <div className="filter-divider" />
            <button
              className="filter-pill"
              onClick={() => {
                handleMapBackgroundClick();
                setFilterType('');
                setMinPrice('');
                setMaxPrice('');
                setSearchTerm('');
              }}
              style={{ color: '#ef4444', borderColor: '#fca5a5', background: 'rgba(254, 226, 226, 0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', fontWeight: 600 }}
            >
              ✕ Clear
            </button>
          </>
        )}
      </div>

      {/* ── SPLIT VIEW CONTAINER ── */}
      <div className="split-view-container" style={{
        display: 'grid',
        gridTemplateColumns: '1.35fr 1fr',
        flex: 1,
        overflow: 'hidden',
        padding: '0.875rem',
        gap: '0.875rem',
        background: 'transparent',
        '--map-opacity': mobileView === 'map' ? 1 : 0,
        '--map-pointer': mobileView === 'map' ? 'auto' : 'none',
        '--list-opacity': mobileView === 'list' ? 1 : 0,
        '--list-pointer': mobileView === 'list' ? 'auto' : 'none'
      } as React.CSSProperties}>
        
        {/* LEFT COLUMN: Map Card */}
        <div className="map-card-col" style={{
          borderRadius: '16px',
          overflow: 'hidden',
          height: '100%',
          position: 'relative',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)'
        }}>
          <div style={{ height: '100%', width: '100%', overflow: 'hidden', position: 'relative' }}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              zoomControl={false}
              attributionControl={false}
              maxBounds={[[5, 68], [24, 88]]} // locks viewport bounds to India space
              minZoom={6}
              style={{ height: '100%', width: '100%' }}
            >
            {/* Fly to active center or bounds */}
            <MapFlyController center={mapCenter} zoom={mapZoom} bounds={selectedBounds} />

            {/* Click listener to deselect selected district */}
            <MapEventsHandler onMapClick={handleMapBackgroundClick} />

            {/* Styled Google Maps Standard Tile Layer (Hides all roads and labels) */}
            <TileLayer
              url={MAP_TILES}
              subdomains={['0', '1', '2', '3']}
              attribution='&copy; Google Maps'
            />

            {/* GTA V Style Lock Mask (Darkens all states/ocean outside Tamil Nadu) */}
            {maskGeoJson && (
              <GeoJSON
                key="tn-gta-mask"
                data={maskGeoJson}
                style={{
                  fillColor: '#090c15', // dark charcoal-slate
                  fillOpacity: 0.76,
                  color: 'transparent',
                  weight: 0
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

        {/* RIGHT COLUMN: Listings */}
        <div className="listings-card-col" style={{
          height: '100%',
          overflowY: 'auto',
          padding: '1rem 0.875rem',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.125rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                {selectedDistrict 
                  ? (selectedCity ? selectedCity : selectedDistrict)
                  : 'Tamil Nadu'
                }
              </h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>
                {filteredProperties.length} land{filteredProperties.length !== 1 ? 's' : ''} listed
              </p>
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
                  background: '#101010',
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
            <>
              <div className="listings-grid">
                {filteredProperties.slice(0, visibleCount).map(p => (
                  <Link
                    key={p.id}
                    to={`/property/${p.id}`}
                    className="listing-card"
                  >
                    {/* Image Container with overlays */}
                    <div style={{ width: '100%', position: 'relative', aspectRatio: '16/9', background: '#f3f4f6', overflow: 'hidden' }}>
                      <img
                        src={getPropertyImageUrl(p)}
                        alt="land"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      
                      {/* Showcase Pill */}
                      <div style={{
                        position: 'absolute', top: '0.625rem', left: '0.625rem',
                        background: '#ffffff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                        borderRadius: '4px', padding: '3px 8px',
                        fontSize: '0.625rem', fontWeight: 800, color: '#111827',
                        letterSpacing: '0.03em', textTransform: 'uppercase'
                      }}>
                        Active
                      </div>

                      {/* Wishlist Heart Overlay */}
                      <button
                        onClick={(e) => toggleWishlist(e, p.id)}
                        disabled={togglingId === p.id}
                        style={{
                          position: 'absolute', top: '0.625rem', right: '0.625rem',
                          background: 'transparent',
                          border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: 0,
                          transition: 'transform 0.15s ease',
                          outline: 'none',
                          zIndex: 10
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        <svg
                          width="26"
                          height="26"
                          viewBox="0 0 24 24"
                          style={{
                            filter: 'drop-shadow(0 1.5px 3.5px rgba(0,0,0,0.7))',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <path
                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                            fill={wishlist.includes(p.id) ? '#101010' : 'none'}
                            stroke="#ffffff"
                            strokeWidth="2.2"
                          />
                        </svg>
                      </button>

                      {/* Zillow style pagination dots */}
                      <div style={{
                        position: 'absolute', bottom: '0.625rem', left: '50%', transform: 'translateX(-50%)',
                        display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.22)', padding: '3px 6px', borderRadius: '99px'
                      }}>
                        {[1, 2, 3, 4, 5].map((dot, i) => (
                          <div key={dot} style={{
                            width: '5px', height: '5px', borderRadius: '50%',
                            background: i === 0 ? '#ffffff' : 'rgba(255,255,255,0.5)'
                          }} />
                        ))}
                      </div>
                    </div>

                    {/* Details Body */}
                    <div style={{ padding: '0.45rem 0.65rem 0.55rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', background: 'transparent', minHeight: '85px' }}>
                      <div>
                        {/* Price & Options row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: '#111827', fontFamily: "'Poppins', sans-serif" }}>
                            {formatPrice(p.price)}
                          </p>
                          {/* Three dots icon */}
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </div>

                        {/* Property specs row */}
                        <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: '#1f2937', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.area} {p.area_unit.replace('_', ' ')} <span style={{ color: '#d1d5db', margin: '0 3px' }}>|</span> {p.type.replace(' Land', '').replace(' Plot', '')} <span style={{ color: '#d1d5db', margin: '0 3px' }}>|</span> <span style={{ color: '#16a34a' }}>Deed</span>
                        </p>

                        {/* Address row */}
                        <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: '#4b5563', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {p.city}{p.district ? `, ${p.district}` : ''}
                        </p>
                      </div>

                      {/* Broker/Seller name */}
                      <div style={{ marginTop: '0.28rem' }}>
                        <p style={{ margin: 0, fontSize: '0.6rem', color: '#9ca3af', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          Territory Premium
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              
              {visibleCount < filteredProperties.length && (
                <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 12)}
                    style={{
                      padding: '0.6rem 1.5rem',
                      background: 'rgba(255,255,255,0.75)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '99px',
                      color: '#101010',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                  >
                    Load More Lands
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </div>
      
      {/* ── MOBILE VIEW TOGGLE ── */}
      <div className="mobile-view-toggle" style={{
        display: 'none',
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2000,
        background: '#101010',
        borderRadius: '99px',
        padding: '4px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        alignItems: 'center',
        gap: '4px'
      }}>
        <button
          onClick={() => setMobileView('map')}
          style={{
            background: mobileView === 'map' ? '#374151' : 'transparent',
            color: mobileView === 'map' ? '#ffffff' : '#9ca3af',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '99px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Map
        </button>
        <button
          onClick={() => setMobileView('list')}
          style={{
            background: mobileView === 'list' ? '#374151' : 'transparent',
            color: mobileView === 'list' ? '#ffffff' : '#9ca3af',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '99px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          List
        </button>
      </div>

    </div>
  );
}
