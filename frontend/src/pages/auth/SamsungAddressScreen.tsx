import { useState } from 'react';
import { motion } from 'framer-motion';
import SamsungTextField from '../../components/samsung/SamsungTextField';
import SamsungDropdownField from '../../components/samsung/SamsungDropdownField';
import SamsungRadioGroup from '../../components/samsung/SamsungRadioGroup';
import SamsungButton from '../../components/samsung/SamsungButton';

interface AddressData {
  first_name: string;
  last_name: string;
  mobile_number: string;
  alternate_number: string;
  email: string;
  pincode: string;
  flat_house_no: string;
  floor: string;
  street_locality: string;
  city: string;
  district: string;
  state: string;
  landmark: string;
  address_type: string;
}

interface SamsungAddressScreenProps {
  initialData?: Partial<AddressData>;
  onSave: (data: AddressData) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const FLOOR_OPTIONS = [
  { label: 'Ground Floor', value: 'Ground Floor' },
  { label: '1st Floor', value: '1st Floor' },
  { label: '2nd Floor', value: '2nd Floor' },
  { label: '3rd Floor', value: '3rd Floor' },
  { label: '4th Floor & Above', value: '4th Floor & Above' },
  { label: 'Custom', value: 'Custom' },
];

const STANDARD_FLOORS = FLOOR_OPTIONS.map(o => o.value).filter(v => v !== 'Custom');

export default function SamsungAddressScreen({ initialData, onSave, onCancel: _onCancel, isSaving }: SamsungAddressScreenProps) {
  const [formData, setFormData] = useState<AddressData>({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    mobile_number: initialData?.mobile_number || '',
    alternate_number: initialData?.alternate_number || '',
    email: initialData?.email || '',
    pincode: initialData?.pincode || '',
    flat_house_no: initialData?.flat_house_no || '',
    floor: initialData?.floor || '',
    street_locality: initialData?.street_locality || '',
    city: initialData?.city || '',
    district: initialData?.district || '',
    state: initialData?.state || 'Tamil Nadu',
    landmark: initialData?.landmark || '',
    address_type: initialData?.address_type || 'Home',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AddressData, string>>>({});

  const handleChange = (field: keyof AddressData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on type
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof AddressData, string>> = {};
    
    if (!formData.first_name.trim()) newErrors.first_name = 'First Name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last Name is required';
    
    if (!formData.mobile_number.trim()) {
      newErrors.mobile_number = 'Mobile Number is required';
    } else if (!/^\d{10}$/.test(formData.mobile_number)) {
      newErrors.mobile_number = 'Enter exactly 10 digits';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Enter exactly 6 digits';
    }

    if (!formData.flat_house_no.trim()) newErrors.flat_house_no = 'Flat / House No is required';
    if (!formData.floor.trim()) newErrors.floor = 'Floor is required';
    if (!formData.street_locality.trim()) newErrors.street_locality = 'Street / Locality is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.district.trim()) newErrors.district = 'District is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex flex-col h-full bg-transparent"
    >
      <h2 className="text-[22px] font-semibold text-black tracking-tight" style={{ marginBottom: '24px' }}>
        Contact Details
      </h2>

      <div className="flex flex-col" style={{ gap: '24px' }}>
        
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '24px' }}>
          <SamsungTextField 
            label="First Name*" 
            required 
            value={formData.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            onClear={() => handleChange('first_name', '')}
            error={errors.first_name}
          />
          <SamsungTextField 
            label="Last Name*" 
            required 
            value={formData.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            onClear={() => handleChange('last_name', '')}
            error={errors.last_name}
          />
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '24px' }}>
          <SamsungTextField 
            label="Mobile Number*" 
            required 
            type="tel"
            maxLength={10}
            value={formData.mobile_number}
            onChange={(e) => handleChange('mobile_number', e.target.value.replace(/\D/g, ''))}
            onClear={() => handleChange('mobile_number', '')}
            error={errors.mobile_number}
          />
          <SamsungTextField 
            label="Alternate Number" 
            type="tel"
            maxLength={10}
            value={formData.alternate_number}
            onChange={(e) => handleChange('alternate_number', e.target.value.replace(/\D/g, ''))}
            onClear={() => handleChange('alternate_number', '')}
          />
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1" style={{ gap: '24px' }}>
          <SamsungTextField 
            label="Email Address*" 
            required 
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onClear={() => handleChange('email', '')}
            error={errors.email}
            readOnly={!!initialData?.email}
            className={initialData?.email ? 'opacity-80' : ''}
          />
        </div>

        {/* Row 4 */}
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '24px' }}>
          <SamsungTextField 
            label="Pincode*" 
            required 
            maxLength={6}
            value={formData.pincode}
            onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, ''))}
            onClear={() => handleChange('pincode', '')}
            error={errors.pincode}
          />
          <SamsungTextField 
            label="Flat / House No*" 
            required 
            value={formData.flat_house_no}
            onChange={(e) => handleChange('flat_house_no', e.target.value)}
            onClear={() => handleChange('flat_house_no', '')}
            error={errors.flat_house_no}
          />
        </div>

        {/* Row 5 */}
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '24px', position: 'relative', zIndex: 1000 }}>
          {(!STANDARD_FLOORS.includes(formData.floor) && formData.floor !== '') ? (
            <SamsungTextField 
              label="Floor*" 
              value={formData.floor === 'Custom' ? '' : formData.floor} 
              onChange={(e) => handleChange('floor', e.target.value)} 
              onClear={() => handleChange('floor', '')}
              error={errors.floor}
              autoFocus
            />
          ) : (
            <SamsungDropdownField 
              label="Floor*" 
              required 
              options={FLOOR_OPTIONS}
              value={formData.floor}
              onChange={(e) => handleChange('floor', e.target.value)}
              error={errors.floor}
            />
          )}
          <SamsungTextField 
            label="Street / Locality*" 
            required 
            value={formData.street_locality}
            onChange={(e) => handleChange('street_locality', e.target.value)}
            onClear={() => handleChange('street_locality', '')}
            error={errors.street_locality}
          />
        </div>

        {/* Row 6: City, District, State */}
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '24px' }}>
          <SamsungTextField 
            label="City*" 
            required 
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            onClear={() => handleChange('city', '')}
            error={errors.city}
          />
          <SamsungTextField 
            label="District*" 
            required 
            value={formData.district}
            onChange={(e) => handleChange('district', e.target.value)}
            onClear={() => handleChange('district', '')}
            error={errors.district}
          />
          <SamsungTextField 
            label="State*" 
            required 
            value={formData.state}
            onChange={(e) => handleChange('state', e.target.value)}
            onClear={() => handleChange('state', '')}
            error={errors.state}
          />
        </div>

        {/* Row 8 */}
        <div className="grid grid-cols-1 pt-2" style={{ gap: '24px' }}>
          <SamsungTextField 
            label="Landmark" 
            value={formData.landmark}
            onChange={(e) => handleChange('landmark', e.target.value)}
            onClear={() => handleChange('landmark', '')}
          />
        </div>

      </div>

      <div style={{ marginTop: '32px', marginBottom: '12px' }}>
        <SamsungRadioGroup 
          label="Address Type"
          required
          options={[
            { label: 'Home', value: 'Home' },
            { label: 'Work', value: 'Work' },
          ]}
          value={formData.address_type}
          onChange={(val) => handleChange('address_type', val)}
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end items-center pt-12 pb-4">
        <SamsungButton 
          variant="primary" 
          onClick={handleSubmit}
          className="w-full sm:w-[200px]"
          disabled={isSaving}
        >
          {isSaving ? 'Processing...' : 'Continue'}
        </SamsungButton>
      </div>

    </motion.div>
  );
}
