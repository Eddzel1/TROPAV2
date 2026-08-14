import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { FormTracking, User, Location, Purok } from '../../types';
import { supabaseHelpers } from '../../lib/supabase';

interface FormTrackingModalProps {
  formTracking?: FormTracking;
  locations: Location[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (form: any) => void;
  currentUser: User | null;
}

export function FormTrackingModal({
  formTracking,
  locations,
  isOpen,
  onClose,
  onSave,
  currentUser
}: FormTrackingModalProps) {
  const [formData, setFormData] = useState({
    lgu: '',
    barangay: '',
    submitted_by: '',
    received_by: '',
    status: 'Pending',
    returned_received_by: ''
  });

  const [purokEntries, setPurokEntries] = useState([{ purok: '', number_of_forms: 0 }]);
  const [puroks, setPuroks] = useState<Purok[]>([]);
  const [loadingPuroks, setLoadingPuroks] = useState(false);

  useEffect(() => {
    if (formTracking) {
      // Find LGU from barangay
      const loc = locations.find(l => l.barangay === formTracking.barangay);
      setFormData({
        lgu: loc ? loc.lgu : '',
        barangay: formTracking.barangay,
        submitted_by: formTracking.submitted_by,
        received_by: formTracking.received_by,
        status: formTracking.status,
        returned_received_by: formTracking.returned_received_by || ''
      });
      setPurokEntries([{ purok: formTracking.purok, number_of_forms: formTracking.number_of_forms }]);
    } else {
      setFormData({
        lgu: '',
        barangay: '',
        submitted_by: '',
        received_by: currentUser ? `${currentUser.firstname} ${currentUser.lastname}` : '',
        status: 'Pending',
        returned_received_by: ''
      });
      setPurokEntries([{ purok: '', number_of_forms: 0 }]);
    }
  }, [formTracking, currentUser, locations]);

  useEffect(() => {
    if (formData.lgu && formData.barangay) {
      const fetchPuroksForLocation = async () => {
        setLoadingPuroks(true);
        try {
          const loc = locations.find(
            l => l.lgu.toUpperCase() === formData.lgu?.toUpperCase() &&
                 l.barangay.toUpperCase() === formData.barangay?.toUpperCase()
          );
          if (loc) {
            const data = await supabaseHelpers.getPuroks(loc.id);
            setPuroks(data as any);
          } else {
            setPuroks([]);
          }
        } catch (err) {
          console.error('Error fetching puroks:', err);
        } finally {
          setLoadingPuroks(false);
        }
      };
      fetchPuroksForLocation();
    } else {
      setPuroks([]);
    }
  }, [formData.lgu, formData.barangay, locations]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formTracking) {
      const payload: any = {
        barangay: formData.barangay,
        purok: purokEntries[0].purok,
        number_of_forms: purokEntries[0].number_of_forms,
        submitted_by: formData.submitted_by,
        received_by: formData.received_by,
        status: formData.status
      };

      if (formData.status === 'Returned') {
        payload.returned_released_by = currentUser?.id;
        payload.returned_received_by = formData.returned_received_by;
      } else {
        payload.returned_released_by = null;
        payload.returned_received_by = null;
      }

      onSave(payload);
    } else {
      const payloads = purokEntries.filter(entry => entry.purok).map(entry => {
        const payload: any = {
          barangay: formData.barangay,
          purok: entry.purok,
          number_of_forms: entry.number_of_forms,
          submitted_by: formData.submitted_by,
          received_by: formData.received_by,
          status: formData.status
        };

        if (formData.status === 'Returned') {
          payload.returned_released_by = currentUser?.id;
          payload.returned_received_by = formData.returned_received_by;
        } else {
          payload.returned_released_by = null;
          payload.returned_received_by = null;
        }

        return payload;
      });

      if (payloads.length > 0) {
        onSave(payloads);
      }
    }
  };

  const lgus = Array.from(new Set(locations.map(l => l.lgu))).sort();
  const barangays = locations
    .filter(l => !formData.lgu || l.lgu === formData.lgu)
    .map(l => l.barangay)
    .sort();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {formTracking ? 'Edit Form Tracking' : 'New Form Tracking'}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                <span className="sr-only">Close</span>
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">LGU</label>
                <select
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  value={formData.lgu}
                  onChange={(e) => setFormData({ ...formData, lgu: e.target.value, barangay: '' })}
                >
                  <option value="">Select LGU</option>
                  {lgus.map(lgu => (
                    <option key={lgu} value={lgu}>{lgu}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Barangay</label>
                <select
                  required
                  disabled={!formData.lgu}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-400"
                  value={formData.barangay}
                  onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                >
                  <option value="">{!formData.lgu ? 'Select LGU First' : 'Select Barangay'}</option>
                  {barangays.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Puroks & Form Counts</label>
                  {!formTracking && (
                    <button
                      type="button"
                      onClick={() => setPurokEntries([...purokEntries, { purok: '', number_of_forms: 0 }])}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                    >
                      + Add Purok
                    </button>
                  )}
                </div>
                {purokEntries.map((entry, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex-1">
                      <select
                        required
                        disabled={loadingPuroks || !formData.barangay}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-400"
                        value={entry.purok}
                        onChange={(e) => {
                          const newEntries = [...purokEntries];
                          newEntries[index].purok = e.target.value;
                          setPurokEntries(newEntries);
                        }}
                      >
                        <option value="">
                          {loadingPuroks ? 'Loading...' : !formData.barangay ? 'Select Barangay' : 'Select Purok'}
                        </option>
                        {puroks.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="Forms"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                        value={entry.number_of_forms}
                        onChange={(e) => {
                          const newEntries = [...purokEntries];
                          newEntries[index].number_of_forms = parseInt(e.target.value) || 0;
                          setPurokEntries(newEntries);
                        }}
                      />
                    </div>
                    {!formTracking && purokEntries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newEntries = [...purokEntries];
                          newEntries.splice(index, 1);
                          setPurokEntries(newEntries);
                        }}
                        className="mt-2 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Submitted By</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    value={formData.submitted_by}
                    onChange={(e) => setFormData({ ...formData, submitted_by: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Received By</label>
                  <input
                    type="text"
                    disabled
                    className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm text-gray-500"
                    value={formData.received_by || (currentUser ? `${currentUser.firstname} ${currentUser.lastname}` : 'Loading user...')}
                  />
                  <p className="mt-1 text-xs text-gray-500">Automatically tracked to current user.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>

              {formData.status === 'Returned' && (
                <div className="bg-gray-50 p-4 rounded-md mt-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Return Details</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Released By</label>
                      <input
                        type="text"
                        disabled
                        className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm text-gray-500"
                        value={currentUser ? `${currentUser.firstname} ${currentUser.lastname}` : 'Loading user...'}
                      />
                      <p className="mt-1 text-xs text-gray-500">Automatically tracked to current user.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Received By</label>
                      <input
                        type="text"
                        required={formData.status === 'Returned'}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                        value={formData.returned_received_by}
                        onChange={(e) => setFormData({ ...formData, returned_received_by: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-teal-600 text-base font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:col-start-2 sm:text-sm"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
