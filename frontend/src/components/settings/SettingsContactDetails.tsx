import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import SamsungTextField from '../samsung/SamsungTextField';
import SamsungDropdownField from '../samsung/SamsungDropdownField';
import SamsungRadioGroup from '../samsung/SamsungRadioGroup';
import SamsungButton from '../samsung/SamsungButton';
import { Trash2, Pencil } from 'lucide-react';

interface AddressData {
  id?: string;
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

const FLOOR_OPTIONS = [
  { label: 'Ground Floor', value: 'Ground Floor' },
  { label: '1st Floor', value: '1st Floor' },
  { label: '2nd Floor', value: '2nd Floor' },
  { label: '3rd Floor', value: '3rd Floor' },
  { label: '4th Floor & Above', value: '4th Floor & Above' },
  { label: 'Custom', value: 'Custom' },
];

const STANDARD_FLOORS = FLOOR_OPTIONS.map(o => o.value).filter(v => v !== 'Custom');

const emptyAddress: AddressData = {
  first_name: '',
  last_name: '',
  mobile_number: '',
  alternate_number: '',
  email: '',
  pincode: '',
  flat_house_no: '',
  floor: '',
  street_locality: '',
  city: '',
  district: '',
  state: 'Tamil Nadu',
  landmark: '',
  address_type: 'Home',
};

export default function SettingsContactDetails() {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [activeAddressId, setActiveAddressId] = useState<string | null>(null);
  const [mode, setMode] = useState<'saved' | 'new'>('saved');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<AddressData>(emptyAddress);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressData, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      let saved = res.data.saved_addresses || [];
      const active = res.data.address;
      if (active && active.id) {
        const found = saved.find((a: AddressData) => a.id === active.id);
        if (!found) {
          saved = [active, ...saved];
        }
      }
      setAddresses(saved);
      if (active && active.id) {
        setActiveAddressId(active.id);
        setSelectedAddressId(active.id);
        setFormData(active);
      } else if (saved.length > 0) {
        setActiveAddressId(saved[0].id);
        setSelectedAddressId(saved[0].id);
        setFormData(saved[0]);
      }
    } catch (err) {
      console.error("Failed to fetch addresses", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof AddressData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof AddressData, string>> = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'Required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Required';
    if (!formData.mobile_number.trim()) newErrors.mobile_number = 'Required';
    else if (!/^\d{10}$/.test(formData.mobile_number)) newErrors.mobile_number = '10 digits';
    if (!formData.email.trim()) newErrors.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.pincode.trim()) newErrors.pincode = 'Required';
    else if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = '6 digits';
    if (!formData.flat_house_no.trim()) newErrors.flat_house_no = 'Required';
    if (!formData.floor.trim()) newErrors.floor = 'Required';
    if (!formData.street_locality.trim()) newErrors.street_locality = 'Required';
    if (!formData.city.trim()) newErrors.city = 'Required';
    if (!formData.district.trim()) newErrors.district = 'Required';
    if (!formData.state.trim()) newErrors.state = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      // POST /auth/me/address acts as upsert to saved_addresses
      await api.post('/auth/me/address', formData);
      await fetchAddresses();
      if (mode === 'new') {
        setMode('saved');
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save address", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (addresses.length <= 1) return;
    try {
      await api.delete(`/auth/me/addresses/${id}`);
      setDeleteConfirmId(null);
      await fetchAddresses();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const selectSavedAddress = async (addr: AddressData) => {
    setSelectedAddressId(addr.id || null);
    setFormData(addr);
    
    // Automatically set as active address on the backend if clicked
    if (addr.id && addr.id !== activeAddressId) {
      try {
        await api.put(`/auth/me/addresses/${addr.id}/active`);
        setActiveAddressId(addr.id);
      } catch (err) {
        console.error("Failed to set active address", err);
      }
    }
  };

  if (loading) return <div>Loading...</div>;



  if (!isEditing) {
    return (
      <div style={{ fontFamily: "'SamsungOne', sans-serif" }}>
        <div style={{ 
          background: '#fff', 
          padding: '24px 28px', 
        }}>
          
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ 
              fontFamily: "'SamsungOne', 'Inter', 'Roboto', sans-serif",
              fontSize: '18px', 
              fontWeight: 700, 
              lineHeight: '26px',
              letterSpacing: '-0.2px',
              color: '#000000', 
              margin: 0 
            }}>1. Contact Details</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {addresses.length > 0 ? (
              addresses.map((addr, _index) => (
                <React.Fragment key={addr.id || Math.random()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      {/* Radio Button */}
                      <div 
                        onClick={() => selectSavedAddress(addr)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: '5px'
                        }}
                      >
                        <input 
                          type="radio" 
                          checked={addr.id === activeAddressId}
                          onChange={() => selectSavedAddress(addr)}
                          style={{ width: '18px', height: '18px', accentColor: '#1259c3', cursor: 'pointer', margin: 0 }}
                        />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ 
                          fontFamily: "'SamsungOne', sans-serif",
                          fontSize: '20px', 
                          fontWeight: 400, 
                          lineHeight: '28px',
                          letterSpacing: '0px',
                          color: '#000000', 
                          marginBottom: '14px', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }}>
                          {addr.first_name} {addr.last_name}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 400, color: '#000', marginBottom: '4px' }}>
                          {addr.flat_house_no}, {addr.floor}, {addr.street_locality}, {addr.city}, {addr.state} - {addr.pincode}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 400, color: '#000' }}>
                          {addr.email}, {addr.mobile_number}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
                      {deleteConfirmId === addr.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', minWidth: '130px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626' }}>Delete address?</div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => setDeleteConfirmId(null)} style={{ padding: '6px 12px', borderRadius: '16px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                            <button onClick={() => handleDelete(addr.id!)} style={{ padding: '6px 12px', borderRadius: '16px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>Delete</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div 
                            onClick={() => {
                              setMode('saved');
                              setSelectedAddressId(addr.id || null);
                              setFormData(addr);
                              setIsEditing(true);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#000', cursor: 'pointer', padding: '6px' }}
                          >
                            <Pencil size={18} />
                            <span style={{ fontSize: '16px', fontWeight: 600 }}>Edit</span>
                          </div>
                          {addresses.length > 1 && (
                            <div 
                              onClick={() => setDeleteConfirmId(addr.id!)}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', cursor: 'pointer', padding: '6px' }}
                            >
                              <Trash2 size={18} />
                              <span style={{ fontSize: '16px', fontWeight: 600 }}>Delete</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ height: '1px', backgroundColor: '#BDBDBD', margin: '16px 0' }} />
                </React.Fragment>
              ))
            ) : (
              <div style={{ fontSize: '15px', color: '#555' }}>No address saved yet.</div>
            )}
          </div>
        </div>
        <div style={{ height: '1px', backgroundColor: '#ECECEC', margin: '0 28px' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '0', fontFamily: "'SamsungOne', sans-serif" }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem' }}>Contact Details</h2>

      {/* Radio Switcher */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input 
            type="radio" 
            name="addressMode" 
            checked={mode === 'saved'}
            onChange={() => {
              setMode('saved');
              if (selectedAddressId) {
                const addr = addresses.find(a => a.id === selectedAddressId);
                if (addr) setFormData(addr);
              } else if (addresses.length > 0) {
                 setFormData(addresses[0]);
                 setSelectedAddressId(addresses[0].id || null);
              }
            }}
            style={{ width: '18px', height: '18px', accentColor: '#1259c3' }}
          />
          <span style={{ fontSize: '1rem', color: '#000' }}>Saved address</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input 
            type="radio" 
            name="addressMode" 
            checked={mode === 'new'}
            onChange={() => {
              setMode('new');
              setFormData(emptyAddress);
              setErrors({});
            }}
            style={{ width: '18px', height: '18px', accentColor: '#1259c3' }}
          />
          <span style={{ fontSize: '1rem', color: '#000' }}>New address</span>
        </label>
      </div>

      {/* Form Fields */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '2rem', color: '#000' }}>
        {mode === 'saved' ? 'Edit Address' : 'Add New Address'}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem 3rem', maxWidth: '800px' }}>
        <SamsungTextField label="First Name*" value={formData.first_name} onChange={(e: any) => handleChange('first_name', e.target.value)} error={errors.first_name} />
        <SamsungTextField label="Last Name*" value={formData.last_name} onChange={(e: any) => handleChange('last_name', e.target.value)} error={errors.last_name} />
        <SamsungTextField 
            label="Mobile Number*" 
            value={formData.mobile_number} 
            onChange={(e: any) => handleChange('mobile_number', e.target.value)} 
            error={errors.mobile_number}
            type="tel"
            maxLength={10}
          />
          <SamsungTextField 
            label="Alternate Number (Optional)" 
            value={formData.alternate_number || ''} 
            onChange={(e: any) => handleChange('alternate_number', e.target.value)} 
            type="tel"
            maxLength={10}
          />
        
        <div style={{ gridColumn: '1 / -1' }}>
          <SamsungTextField label="Email Address*" type="email" value={formData.email} onChange={(e: any) => handleChange('email', e.target.value)} error={errors.email} />
        </div>
        
        <SamsungTextField 
            label="Pincode*" 
            value={formData.pincode} 
            onChange={(e: any) => handleChange('pincode', e.target.value)} 
            error={errors.pincode}
            maxLength={6}
          /> 
        <SamsungTextField label="Flat/House No*" value={formData.flat_house_no} onChange={(e: any) => handleChange('flat_house_no', e.target.value)} error={errors.flat_house_no} />
        
        <div style={{ position: 'relative', zIndex: 1000 }}>
          {(!STANDARD_FLOORS.includes(formData.floor) && formData.floor !== '') ? (
            <SamsungTextField 
              label="Floor*" 
              value={formData.floor === 'Custom' ? '' : formData.floor} 
              onChange={(e: any) => handleChange('floor', e.target.value)} 
              onClear={() => handleChange('floor', '')}
              error={errors.floor}
              autoFocus
            />
          ) : (
            <SamsungDropdownField 
              label="Floor*" 
              options={FLOOR_OPTIONS}
              value={formData.floor}
              onChange={(e: any) => handleChange('floor', e.target.value)}
              error={errors.floor}
            />
          )}
        </div>
        <SamsungTextField label="Street/Locality*" value={formData.street_locality} onChange={(e: any) => handleChange('street_locality', e.target.value)} error={errors.street_locality} />
        
        <SamsungTextField label="City*" value={formData.city} onChange={(e: any) => handleChange('city', e.target.value)} error={errors.city} />
        <SamsungTextField label="State*" value={formData.state} onChange={(e: any) => handleChange('state', e.target.value)} error={errors.state} />
        
        <SamsungTextField label="District*" value={formData.district} onChange={(e: any) => handleChange('district', e.target.value)} error={errors.district} />
        <SamsungTextField label="Landmark" value={formData.landmark} onChange={(e: any) => handleChange('landmark', e.target.value)} error={errors.landmark} />
      </div>

      <div style={{ marginTop: '40px', marginBottom: '40px' }}>
        <div style={{ marginBottom: '16px', fontWeight: 600, color: '#000', fontSize: '18px' }}>Address Type*</div>
        <SamsungRadioGroup
          label=""
          options={[{ label: 'Home', value: 'Home' }, { label: 'Work', value: 'Work' }, { label: 'Neighbour', value: 'Neighbour' }]}
          value={formData.address_type}
          onChange={(e: any) => handleChange('address_type', e.target ? e.target.value : e)}
        />
      </div>

      <SamsungButton
        onClick={handleSave}
        disabled={saving}
        style={{ width: 'auto', minWidth: '250px', padding: '1rem 3rem', borderRadius: '30px' }}
      >
        {saving ? 'Saving...' : (mode === 'saved' ? 'Apply Changes' : 'Save New Address')}
      </SamsungButton>

    </div>
  );
}
