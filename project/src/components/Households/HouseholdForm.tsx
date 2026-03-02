import React, { useState, useEffect } from 'react';
import { Household, Location } from '../../types';
import { X, Save } from 'lucide-react';

interface HouseholdFormProps {
    household: Household;
    locations: Location[];
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Household>) => Promise<Household>;
}

export function HouseholdForm({ household, locations, isOpen, onClose, onSave }: HouseholdFormProps) {
    const [formData, setFormData] = useState<Partial<Household>>({
        household_name: '',
        lgu: '',
        barangay: '',
        purok: '',
        status: 'active'
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (household) {
            setFormData({
                household_name: household.household_name,
                lgu: household.lgu,
                barangay: household.barangay,
                purok: household.purok,
                status: household.status
            });
        }
    }, [household, isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(household.id, formData);
            onClose();
        } catch (error) {
            console.error('Failed to save household:', error);
            alert('Failed to update household.');
        } finally {
            setIsSaving(false);
        }
    };

    const lgus = Array.from(new Set(locations.map(l => l.lgu))).sort();
    const barangays = locations
        .filter(l => !formData.lgu || l.lgu === formData.lgu)
        .map(l => l.barangay)
        .sort();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900">Edit Household</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Household Name *</label>
                        <input
                            type="text"
                            name="household_name"
                            required
                            value={formData.household_name || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 max-w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LGU *</label>
                        <select
                            name="lgu"
                            required
                            value={formData.lgu || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 max-w-full"
                        >
                            <option value="">Select LGU</option>
                            {lgus.map(lgu => (
                                <option key={lgu} value={lgu}>{lgu}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Barangay *</label>
                        <select
                            name="barangay"
                            required
                            value={formData.barangay || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 max-w-full"
                        >
                            <option value="">Select Barangay</option>
                            {barangays.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Purok *</label>
                        <input
                            type="text"
                            name="purok"
                            required
                            value={formData.purok || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 max-w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                        <select
                            name="status"
                            required
                            value={formData.status || 'active'}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 max-w-full"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {isSaving ? 'Saving...' : 'Update Household'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
