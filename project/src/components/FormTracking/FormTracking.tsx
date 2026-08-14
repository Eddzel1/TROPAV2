import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Menu, FileText, CheckCircle, Clock, Undo2 } from 'lucide-react';
import { FormTrackingModal } from './FormTrackingModal';
import { useFormTracking, useAuthProfile } from '../../hooks/useSupabase';
import { FormTracking, Location } from '../../types';

interface FormTrackingProps {
  locations: Location[];
  onMenuClick: () => void;
}

export function FormTrackingPage({ locations, onMenuClick }: FormTrackingProps) {
  const { forms, loading, error, createForm, updateForm, deleteForm } = useFormTracking();
  const { profile } = useAuthProfile();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<FormTracking | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredForms = forms.filter(form => {
    const matchesSearch = 
      form.barangay.toLowerCase().includes(searchTerm.toLowerCase()) || 
      form.purok.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? form.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const handleSave = async (formData: any) => {
    try {
      if (editingForm) {
        await updateForm(editingForm.id, formData);
      } else {
        if (Array.isArray(formData)) {
          for (const data of formData) {
            await createForm({
              ...data,
              encoded_by: profile?.id
            });
          }
        } else {
          await createForm({
            ...formData,
            encoded_by: profile?.id
          });
        }
      }
      setIsModalOpen(false);
      setEditingForm(null);
    } catch (err) {
      console.error('Failed to save form tracking:', err);
      alert('Failed to save form tracking record. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteForm(id);
      } catch (err) {
        console.error('Failed to delete:', err);
        alert('Failed to delete form tracking record.');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1 self-center" /> Pending</span>;
      case 'In Progress':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"><Edit2 className="w-3 h-3 mr-1 self-center" /> In Progress</span>;
      case 'Completed':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1 self-center" /> Completed</span>;
      case 'Returned':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800"><Undo2 className="w-3 h-3 mr-1 self-center" /> Returned</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center">
          <button onClick={onMenuClick} className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500 lg:hidden">
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-teal-600" />
            Form Tracking
          </h1>
        </div>
        <button
          onClick={() => {
            setEditingForm(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          New Tracking
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mb-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              placeholder="Search by Barangay or Purok..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Returned">Returned</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {loading ? (
             <div className="p-8 flex justify-center items-center text-gray-500">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-2"></div>
               Loading forms...
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forms</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received By</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Encoded By</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredForms.map((form) => (
                    <tr key={form.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{form.barangay}</div>
                        <div className="text-sm text-gray-500">{form.purok}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {form.number_of_forms} pcs
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(form.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {form.submitted_by}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {form.received_by}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {form.encoded_by_user ? `${form.encoded_by_user.firstname} ${form.encoded_by_user.lastname}` : 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditingForm(form);
                            setIsModalOpen(true);
                          }}
                          className="text-teal-600 hover:text-teal-900 mr-4"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(form.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredForms.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No tracking records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <FormTrackingModal
          formTracking={editingForm || undefined}
          locations={locations}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingForm(null);
          }}
          onSave={handleSave}
          currentUser={profile}
        />
      )}
    </div>
  );
}
