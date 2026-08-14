import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Menu, FileText, CheckCircle, Clock, Undo2, ChevronDown, ChevronRight } from 'lucide-react';
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const filteredForms = forms.filter(form => {
    const matchesSearch = 
      form.barangay.toLowerCase().includes(searchTerm.toLowerCase()) || 
      form.purok.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? form.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  type PurokGroup = { barangay: string; purok: string; forms: FormTracking[]; totalForms: number };

  const groupedForms = filteredForms.reduce((acc, form) => {
    const key = `${form.barangay}-${form.purok}`;
    if (!acc[key]) {
      acc[key] = {
        barangay: form.barangay,
        purok: form.purok,
        forms: [],
        totalForms: 0
      };
    }
    acc[key].forms.push(form);
    acc[key].totalForms += form.number_of_forms || 0;
    return acc;
  }, {} as Record<string, PurokGroup>);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatPHTime = (dateInput: string | Date | undefined) => {
    if (!dateInput) return '';
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      return date.toLocaleString('en-US', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return String(dateInput);
    }
  };

  const getGroupStatus = (groupForms: FormTracking[]) => {
    if (groupForms.some(f => f.status === 'In Progress')) return 'In Progress';
    if (groupForms.every(f => f.status === 'Completed')) return 'Completed';
    return 'Pending';
  };

  const handleSave = async (formData: any) => {
    try {
      if (editingForm) {
        await updateForm(editingForm.id, formData);
      } else {
        if (Array.isArray(formData)) {
          for (const data of formData) {
            await createForm(data);
          }
        } else {
          await createForm(formData);
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
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" /> Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Edit2 className="w-4 h-4 mr-1" /> In Progress
          </span>
        );
      case 'Returned':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Undo2 className="w-4 h-4 mr-1" /> Returned
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 z-10 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center text-teal-600">
              <FileText className="h-6 w-6 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">Form Tracking</h1>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingForm(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Tracking
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Barangay or Purok..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Returned">Returned</option>
            </select>
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(Object.entries(groupedForms) as [string, PurokGroup][]).map(([key, group]) => {
                      const isExpanded = expandedGroups[key];
                      const groupStatus = getGroupStatus(group.forms);

                      return (
                        <React.Fragment key={key}>
                          {/* Parent Row */}
                          <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleGroup(key)}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {isExpanded ? (
                                  <ChevronDown className="h-5 w-5 text-gray-400 mr-2" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-gray-400 mr-2" />
                                )}
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{group.barangay}</div>
                                  <div className="text-sm text-gray-500">{group.purok}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {group.totalForms} pcs
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(groupStatus)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colSpan={3}>
                              <span className="text-xs text-gray-400 italic">{group.forms.length} submission(s)</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            </td>
                          </tr>

                          {/* Child Rows */}
                          {isExpanded && group.forms.map((form: FormTracking) => (
                          <tr key={form.id} className="bg-gray-50">
                            <td className="px-6 py-3 pl-14 whitespace-nowrap">
                              <div className="text-xs text-gray-500">
                                {formatPHTime(form.created_at)}
                              </div>
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                              {form.number_of_forms} pcs
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap">
                              {getStatusBadge(form.status)}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                              {form.submitted_by}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                              {form.received_by}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-500">
                              {form.encoded_by_user 
                                ? `${form.encoded_by_user.firstname} ${form.encoded_by_user.lastname}`.toUpperCase() 
                                : 'Not Assigned'}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingForm(form);
                                  setIsModalOpen(true);
                                }}
                                className="text-teal-600 hover:text-teal-900 mr-4"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(form.id);
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  {Object.keys(groupedForms).length === 0 && (
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
