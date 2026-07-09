import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';

export default function EditProperty() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [soilType, setSoilType] = useState('');
  const [waterSource, setWaterSource] = useState('');
  const [roadAccess, setRoadAccess] = useState('');
  const [fencing, setFencing] = useState('');
  const [electricity, setElectricity] = useState(false);
  const [irrigation, setIrrigation] = useState(false);
  const [nearbyTown, setNearbyTown] = useState('');
  const [distFromTown, setDistFromTown] = useState('');

  // Documents
  const [retainedDocs, setRetainedDocs] = useState<{type: string, url: string}[]>([]);
  const [newDocs, setNewDocs] = useState<{type: string, file: File | null}[]>([]);

  const addNewDocument = () => {
    setNewDocs([...newDocs, { type: 'Patta', file: null }]);
  };

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await api.get('/properties/seller/me');
        const prop = response.data.find((p: any) => p.id === id);
        if (prop) {
          setCity(prop.city);
          setDistrict(prop.district || '');
          setPrice(prop.price);
          setDescription(prop.description || '');
          setSoilType(prop.soil_type || '');
          setWaterSource(prop.water_source || '');
          setRoadAccess(prop.road_access || '');
          setFencing(prop.fencing || '');
          setElectricity(prop.electricity || false);
          setIrrigation(prop.irrigation || false);
          setNearbyTown(prop.nearby_town || '');
          setDistFromTown(prop.distance_from_town_km || '');
          if (prop.documents) setRetainedDocs(prop.documents);
        } else {
          setError('Property not found.');
        }
      } catch (err) {
        setError('Failed to load property');
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    // Validate new docs
    for (let i = 0; i < newDocs.length; i++) {
      if (!newDocs[i].file) {
        setError(`Please attach a file for ${newDocs[i].type} or remove it.`);
        setSaving(false);
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append('city', city);
      formData.append('district', district);
      formData.append('price', price.toString());
      if (description) formData.append('description', description);
      if (soilType) formData.append('soil_type', soilType);
      if (waterSource) formData.append('water_source', waterSource);
      if (roadAccess) formData.append('road_access', roadAccess);
      if (fencing) formData.append('fencing', fencing);
      formData.append('electricity', electricity.toString());
      formData.append('irrigation', irrigation.toString());
      if (nearbyTown) formData.append('nearby_town', nearbyTown);
      if (distFromTown) formData.append('distance_from_town_km', distFromTown);

      formData.append('retained_documents', JSON.stringify(retainedDocs));

      newDocs.forEach(doc => {
        formData.append('doc_types', doc.type);
        formData.append('files', doc.file as File);
      });

      await api.put(`/properties/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      navigate('/dashboard/seller');
    } catch (err: any) {
       setError(err.response?.data?.detail || 'Failed to update property');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary text-sm";
  const selectClass = "mt-1 block w-full bg-white border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary text-sm";

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link to="/dashboard/seller" className="text-primary hover:underline">&larr; Back to Dashboard</Link>
      </div>
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Property</h2>
        
        {error && <div className="mb-4 text-red-500 text-sm font-medium bg-red-50 p-3 rounded">{error}</div>}
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">City / Village</label>
              <input type="text" required value={city} onChange={e => setCity(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">District</label>
              <input type="text" value={district} onChange={e => setDistrict(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Asking Price (₹)</label>
            <input type="number" required value={price} onChange={e => setPrice(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description / Overview</label>
            <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} className={inputClass}></textarea>
          </div>

          <hr className="border-gray-200" />
          <h3 className="text-lg font-semibold text-gray-800">Land Features</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Soil Type</label>
              <select value={soilType} onChange={e => setSoilType(e.target.value)} className={selectClass}>
                <option value="">-- Select --</option>
                <option>Red Soil</option><option>Black Soil</option><option>Alluvial Soil</option><option>Laterite Soil</option><option>Sandy Soil</option><option>Clay Soil</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Water Source</label>
              <select value={waterSource} onChange={e => setWaterSource(e.target.value)} className={selectClass}>
                <option value="">-- Select --</option>
                <option>Borewell</option><option>Open Well</option><option>Canal</option><option>River</option><option>Rainfed</option><option>None</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Road Access</label>
              <select value={roadAccess} onChange={e => setRoadAccess(e.target.value)} className={selectClass}>
                <option value="">-- Select --</option>
                <option>National Highway</option><option>State Highway</option><option>District Road</option><option>Village Road</option><option>Mud Road</option><option>No Road</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fencing</label>
              <select value={fencing} onChange={e => setFencing(e.target.value)} className={selectClass}>
                <option value="">-- Select --</option>
                <option>Compound Wall</option><option>Wire Fence</option><option>Partial</option><option>None</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nearest Town</label>
              <input type="text" value={nearbyTown} onChange={e => setNearbyTown(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Distance from Town (km)</label>
              <input type="number" step="0.1" value={distFromTown} onChange={e => setDistFromTown(e.target.value)} className={inputClass} />
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={electricity} onChange={e => setElectricity(e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
              <span className="text-sm text-gray-700">Electricity Available</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={irrigation} onChange={e => setIrrigation(e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
              <span className="text-sm text-gray-700">Irrigation Facility</span>
            </label>
          </div>

          <hr className="border-gray-200" />
          <h3 className="text-lg font-semibold text-gray-800">Documents</h3>
          <p className="text-sm text-gray-500 mb-4">Manage property documents here.</p>

          <div className="space-y-4">
            {retainedDocs.map((doc, index) => (
              <div key={`ret-${index}`} className="flex justify-between items-center p-4 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-700">{doc.type}</span>
                  <a href={`http://localhost:8000${doc.url}`} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline">(View File)</a>
                </div>
                <button type="button" onClick={() => setRetainedDocs(retainedDocs.filter((_, i) => i !== index))} className="text-red-500 hover:text-red-700 text-sm font-medium">
                  Remove
                </button>
              </div>
            ))}
            {newDocs.map((doc, index) => (
              <div key={`new-${index}`} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 border border-gray-200 rounded-md bg-white">
                <select
                  className={selectClass + " sm:w-48"}
                  value={doc.type} onChange={(e) => {
                    const nd = [...newDocs];
                    nd[index].type = e.target.value;
                    setNewDocs(nd);
                  }}
                >
                  <option>Patta</option>
                  <option>Chitta</option>
                  <option>FMB Sketch</option>
                  <option>A-Register</option>
                  <option>Encumbrance Certificate (EC)</option>
                  <option>Parent Document</option>
                  <option>Other</option>
                </select>
                <input type="file" required onChange={(e) => {
                  const nd = [...newDocs];
                  nd[index].file = e.target.files ? e.target.files[0] : null;
                  setNewDocs(nd);
                }} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-emerald-600 cursor-pointer" />
                <button type="button" onClick={() => setNewDocs(newDocs.filter((_, i) => i !== index))} className="text-red-500 hover:text-red-700 p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addNewDocument} className="mt-2 text-sm text-primary hover:text-emerald-700 font-medium flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            Add new document
          </button>

          <div className="pt-4">
            <button type="submit" disabled={saving} className="w-full py-3 px-4 rounded-md text-white bg-dark hover:bg-gray-800 focus:outline-none disabled:opacity-75">
              {saving ? 'Saving...' : 'Update Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
