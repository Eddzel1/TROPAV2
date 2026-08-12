import { MapPin, Users, Home } from 'lucide-react';
import { Household } from '../../types';

interface BarangayStatsProps {
  households: Household[];
}

export function BarangayStats({ households }: BarangayStatsProps) {
  const activeHouseholds = households.filter(h => h.status === 'active');

  const toTitleCase = (str: string) => {
    if (!str) return 'Unknown';
    return str.toLowerCase().split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const stats = activeHouseholds.reduce((acc, household) => {
    const brgy = toTitleCase(household.barangay || '');
    if (!acc[brgy]) {
      acc[brgy] = { households: 0, members: 0 };
    }
    acc[brgy].households += 1;
    acc[brgy].members += household.total_members || 0;
    return acc;
  }, {} as Record<string, { households: number; members: number }>);

  const sortedBarangays = Object.entries(stats).sort((a, b) => b[1].households - a[1].households);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <MapPin className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-semibold text-gray-900">Barangay Statistics</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-sm text-gray-500">
              <th className="pb-3 font-medium">Barangay</th>
              <th className="pb-3 font-medium text-right">Households</th>
              <th className="pb-3 font-medium text-right">Members</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedBarangays.map(([brgy, data]) => (
              <tr key={brgy} className="text-sm">
                <td className="py-3 font-medium text-gray-900">{brgy}</td>
                <td className="py-3 text-right text-gray-600">
                  <div className="flex items-center justify-end gap-1">
                    <Home className="w-4 h-4 text-gray-400" />
                    {data.households}
                  </div>
                </td>
                <td className="py-3 text-right text-gray-600">
                  <div className="flex items-center justify-end gap-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    {data.members}
                  </div>
                </td>
              </tr>
            ))}
            {sortedBarangays.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No barangay data available</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
