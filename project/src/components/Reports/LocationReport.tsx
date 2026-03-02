import { useMemo } from 'react';
import { Household, FamilyMember, Location } from '../../types';
import { MapPin, Users, Home } from 'lucide-react';

interface LocationReportProps {
    households: Household[];
    members: FamilyMember[];
    locations: Location[];
}

export function LocationReport({ households, members }: LocationReportProps) {
    const statsByBarangay = useMemo(() => {
        const stats: Record<string, {
            households: number;
            members: number;
        }> = {};

        households.forEach(h => {
            const barangay = h.barangay || 'Unknown';
            if (!stats[barangay]) {
                stats[barangay] = { households: 0, members: 0 };
            }
            stats[barangay].households += 1;
        });

        members.forEach(m => {
            const barangay = m.barangay || 'Unknown';
            if (!stats[barangay]) {
                stats[barangay] = { households: 0, members: 0 };
            }
            stats[barangay].members += 1;
        });

        return stats;
    }, [households, members]);

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location Distribution
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(statsByBarangay)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([barangay, stat]) => (
                            <div key={barangay} className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                                <h4 className="font-semibold text-gray-900 mb-4 text-lg border-b pb-2">{barangay}</h4>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Home className="w-4 h-4" />
                                            <span className="text-sm">Households</span>
                                        </div>
                                        <span className="font-medium text-gray-900">{stat.households}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Users className="w-4 h-4" />
                                            <span className="text-sm">Members</span>
                                        </div>
                                        <span className="font-medium text-gray-900">{stat.members}</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                    {Object.keys(statsByBarangay).length === 0 && (
                        <div className="col-span-full py-8 text-center text-gray-500">
                            No location data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
