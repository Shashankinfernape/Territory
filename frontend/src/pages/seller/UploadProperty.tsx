import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import FileDropzone from '../../components/common/FileDropzone';
import DraggableGrid from '../../components/common/DraggableGrid';

interface DocUploadItem {
  type: string;
  file: File;
}

function ImageThumbnail({ file, index, isDragging, onRemove }: {
  file: File;
  index: number;
  isDragging: boolean;
  onRemove: () => void;
}) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return null;

  return (
    <div
      style={{
        position: 'relative',
        height: '90px',
        borderRadius: '6px',
        border: isDragging ? '2.5px solid #101010' : '1px solid #e5e7eb',
        overflow: 'hidden',
        cursor: 'grabbing',
        background: '#f4f4f4',
        boxShadow: 'rgba(36, 36, 36, 0.08) 0px 4px 12px 0px',
        opacity: 1,
        width: '100%',
        transition: 'all 0.25s ease'
      }}
    >
      <img src={url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {index === 0 && (
        <span style={{
          position: 'absolute', bottom: '4px', left: '4px',
          background: '#101010', color: '#ffffff', fontSize: '0.625rem',
          padding: '2px 6px', borderRadius: '4px', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.02em'
        }}>
          Cover
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        style={{
          position: 'absolute', top: '4px', right: '4px',
          background: '#ffffff', border: '1px solid #e5e7eb',
          borderRadius: '50%', width: '20px', height: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#ff3b30', fontSize: '0.85rem', fontWeight: 700
        }}
      >
        &times;
      </button>
    </div>
  );
}

export default function UploadProperty() {
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [areaUnit, setAreaUnit] = useState('acres');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Agricultural Land');

  const [soilType, setSoilType] = useState('');
  const [waterSource, setWaterSource] = useState('');
  const [roadAccess, setRoadAccess] = useState('');
  const [fencing, setFencing] = useState('');
  const [nearbyTown, setNearbyTown] = useState('');
  const [distFromTown, setDistFromTown] = useState('');
  const [electricity, setElectricity] = useState(false);
  const [irrigation, setIrrigation] = useState(false);
  const [keywords, setKeywords] = useState('');

  const [docs, setDocs] = useState<DocUploadItem[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const role = localStorage.getItem('user_role');
  const dashboardPath = role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/seller';

  const handleDocsSelected = (files: File[]) => {
    const newDocs = files.map(file => ({ type: 'Patta', file }));
    setDocs(prev => [...prev, ...newDocs]);
  };

  const handleDocTypeChange = (index: number, val: string) => {
    const newDocs = [...docs];
    newDocs[index].type = val;
    setDocs(newDocs);
  };

  const handleImagesSelected = async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const validated: File[] = [];
    let hasPortrait = false;

    for (const file of imageFiles) {
      const isLandscape = await new Promise<boolean>((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(img.src);
          // Strictly width > height to reject portrait and square layouts
          resolve(img.width > img.height);
        };
        img.onerror = () => {
          resolve(false);
        };
      });
      if (isLandscape) {
        validated.push(file);
      } else {
        hasPortrait = true;
      }
    }

    if (hasPortrait) {
      setError('Portrait images are not allowed. Please upload landscape photos only.');
    }

    if (validated.length > 0) {
      setImages(prev => [...prev, ...validated]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (docs.length === 0) {
      setError('Please upload at least one deed document (e.g. Patta, EC).');
      return;
    }
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('city', city);
    formData.append('district', district);
    formData.append('state', state);
    formData.append('price', price);
    formData.append('area', area);
    formData.append('area_unit', areaUnit);
    formData.append('description', description);
    formData.append('type', type);
    formData.append('soil_type', soilType);
    formData.append('water_source', waterSource);
    formData.append('road_access', roadAccess);
    formData.append('fencing', fencing);
    formData.append('nearby_town', nearbyTown);
    if (distFromTown) formData.append('distance_from_town_km', distFromTown);
    formData.append('electricity', electricity.toString());
    formData.append('irrigation', irrigation.toString());
    formData.append('keywords', keywords);

    // Append documents
    docs.forEach((doc) => {
      formData.append('files', doc.file);
      formData.append('doc_types', doc.type);
    });

    // Append images in their chosen order
    images.forEach((img) => {
      formData.append('image_files', img);
    });

    try {
      await api.post('/properties', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate(dashboardPath);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to list property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f4f4f4', minHeight: '100vh', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to={dashboardPath} style={{
            color: '#101010', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
          }}>
            &larr; Back to Dashboard
          </Link>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px' }}>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.5rem', fontWeight: 600, color: '#101010', marginBottom: '2rem', letterSpacing: '0.01em' }}>
            List New Property
          </h2>

          {error && <div className="error-box" style={{ marginBottom: '1.5rem' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* 1. Location Details */}
            <div>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.0625rem', fontWeight: 600, color: '#101010', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
                Location Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>City / Village</label>
                  <input type="text" required value={city} onChange={e => setCity(e.target.value)} className="form-input" placeholder="e.g. Pollachi" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>District</label>
                  <input type="text" required value={district} onChange={e => setDistrict(e.target.value)} className="form-input" placeholder="e.g. Coimbatore" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>State</label>
                  <input type="text" value={state} onChange={e => setState(e.target.value)} className="form-input" />
                </div>
              </div>
            </div>

            {/* 2. Property Info */}
            <div>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.0625rem', fontWeight: 600, color: '#101010', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
                Property Specifications
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>Property Type</label>
                  <select value={type} onChange={e => setType(e.target.value)} className="form-input" style={{ background: '#ffffff' }}>
                    <option>Agricultural Land</option>
                    <option>Farm Land</option>
                    <option>Flat Plot</option>
                    <option>Residential Plot</option>
                    <option>Commercial Plot</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>Asking Price (₹)</label>
                  <input type="number" required value={price} onChange={e => setPrice(e.target.value)} className="form-input" placeholder="e.g. 1500000" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>Total Area</label>
                  <input type="number" step="0.01" required value={area} onChange={e => setArea(e.target.value)} className="form-input" placeholder="e.g. 2.5" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>Area Unit</label>
                  <select value={areaUnit} onChange={e => setAreaUnit(e.target.value)} className="form-input" style={{ background: '#ffffff' }}>
                    <option value="acres">Acres</option>
                    <option value="sq_ft">Sq. Ft.</option>
                    <option value="cents">Cents</option>
                    <option value="hectares">Hectares</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>Description / Overview</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="form-input" style={{ resize: 'vertical' }} placeholder="Describe key attributes — landmarks, access paths, survey records..." />
              </div>
            </div>

            {/* 3. Features & Attributes */}
            <div>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.0625rem', fontWeight: 600, color: '#101010', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
                Land Features
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>Soil Type</label>
                  <select value={soilType} onChange={e => setSoilType(e.target.value)} className="form-input" style={{ background: '#ffffff' }}>
                    <option value="">-- Select --</option>
                    <option>Red Soil</option>
                    <option>Black Soil</option>
                    <option>Alluvial Soil</option>
                    <option>Laterite Soil</option>
                    <option>Sandy Soil</option>
                    <option>Clay Soil</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>Water Source</label>
                  <select value={waterSource} onChange={e => setWaterSource(e.target.value)} className="form-input" style={{ background: '#ffffff' }}>
                    <option value="">-- Select --</option>
                    <option>Borewell</option>
                    <option>Open Well</option>
                    <option>Canal</option>
                    <option>River</option>
                    <option>Rainfed</option>
                    <option>None</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>Road Access</label>
                  <select value={roadAccess} onChange={e => setRoadAccess(e.target.value)} className="form-input" style={{ background: '#ffffff' }}>
                    <option value="">-- Select --</option>
                    <option>National Highway</option>
                    <option>State Highway</option>
                    <option>District Road</option>
                    <option>Village Road</option>
                    <option>Mud Road</option>
                    <option>No Road</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>Fencing</label>
                  <select value={fencing} onChange={e => setFencing(e.target.value)} className="form-input" style={{ background: '#ffffff' }}>
                    <option value="">-- Select --</option>
                    <option>Compound Wall</option>
                    <option>Wire Fence</option>
                    <option>Partial</option>
                    <option>None</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>Nearest Town</label>
                  <input type="text" value={nearbyTown} onChange={e => setNearbyTown(e.target.value)} className="form-input" placeholder="e.g. Pollachi" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>Distance from Town (km)</label>
                  <input type="number" step="0.1" value={distFromTown} onChange={e => setDistFromTown(e.target.value)} className="form-input" placeholder="e.g. 5" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 500, color: '#242424' }}>
                  <input type="checkbox" checked={electricity} onChange={e => setElectricity(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#101010' }} />
                  Electricity Available
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 500, color: '#242424' }}>
                  <input type="checkbox" checked={irrigation} onChange={e => setIrrigation(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#101010' }} />
                  Irrigation Facility
                </label>
              </div>
            </div>

            {/* 4. Search Keywords */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>Keywords (Comma separated)</label>
              <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} className="form-input" placeholder="e.g. lake view, clear title, highway access" />
            </div>

            {/* 5. Documents & Images Side-by-Side */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
              
              {/* Document Dropzone & List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.0625rem', fontWeight: 600, color: '#101010', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', margin: 0 }}>
                  Upload Documents
                </h3>
                <FileDropzone
                  label="Deed Documents"
                  helperText="Click or drag to upload • PDF or JPG"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  multiple
                  onFilesSelected={handleDocsSelected}
                />

                {docs.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                    {docs.map((doc, index) => (
                      <div key={index} style={{
                        display: 'flex', gap: '0.5rem', padding: '0.75rem', background: '#ffffff',
                        border: '1px solid #e5e7eb', borderRadius: '6px', alignItems: 'center'
                      }}>
                        <select
                          className="form-input"
                          style={{ width: '140px', background: '#ffffff', padding: '0.4rem 0.6rem', fontSize: '0.8125rem' }}
                          value={doc.type} onChange={(e) => handleDocTypeChange(index, e.target.value)}
                        >
                          <option>Patta</option>
                          <option>Chitta</option>
                          <option>FMB Sketch</option>
                          <option>A-Register</option>
                          <option>Encumbrance Certificate (EC)</option>
                          <option>Parent Document</option>
                          <option>Other</option>
                        </select>
                        <span style={{ flex: 1, fontSize: '0.8125rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.file.name}
                        </span>
                        <button type="button" onClick={() => setDocs(docs.filter((_, i) => i !== index))} style={{
                          background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', display: 'flex', alignItems: 'center'
                        }}>
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Image Dropzone & Reorder Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.0625rem', fontWeight: 600, color: '#101010', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', margin: 0 }}>
                  Property Gallery Images
                </h3>
                <FileDropzone
                  label="Gallery Photos"
                  helperText="Click or drag to upload • Landscape only"
                  accept="image/*"
                  multiple
                  isImageDropzone
                  onFilesSelected={handleImagesSelected}
                />

                {images.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: 500 }}>
                      💡 Tip: Drag images to set order. The first image will be the primary cover listing.
                    </p>
                    <DraggableGrid
                      items={images}
                      onChange={setImages}
                      keyExtractor={(imgFile) => `${imgFile.name}-${imgFile.size}-${imgFile.lastModified}`}
                      renderItem={(imgFile, index, isDragging) => (
                        <ImageThumbnail
                          file={imgFile}
                          index={index}
                          isDragging={isDragging}
                          onRemove={() => setImages(prev => prev.filter((_, i) => i !== index))}
                        />
                      )}
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Submit Block */}
            <div style={{ paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb', marginTop: '1rem' }}>
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '0.9rem 1rem', borderRadius: '8px', fontSize: '0.875rem', letterSpacing: '0.02em', whiteSpace: 'normal', lineHeight: 1.3 }}>
                {loading ? 'Publishing Registry...' : 'Submit Property for Verification'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
