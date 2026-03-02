
import { MapPin } from 'lucide-react';
import { Household, FamilyMember } from '../../types';

interface LocationBreakdownProps {
  households: Household[];
  members: FamilyMember[];
}

export function LocationBreakdown({ households, members }: LocationBreakdownProps) {
  const activeHouseholds = households.filter(h =>
    h.status === 'active' && members.some(m => m.household_id === h.id)
  );

  const toTitleCase = (str: string) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const locationStats = activeHouseholds.reduce((acc, household) => {
    const lgu = toTitleCase(household.lgu || '');
    const brgy = toTitleCase(household.barangay || '');
    const key = `${lgu}, ${brgy}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedLocations = Object.entries(locationStats).sort(([, a], [, b]) => b - a).slice(0, 5);
  const maxCount = Math.max(...Object.values(locationStats), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <MapPin className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-semibold text-gray-900">Households by Location</h3>
      </div>
      <div className="space-y-4">
        {sortedLocations.map(([location, count]) => (
          <div key={location} className="flex items-center gap-4">
            <div className="flex-1">
              <p className="font-medium text-gray-900">{location}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 bg-gray-100 rounded-full h-2">
                <div className="bg-teal-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(count / maxCount) * 100}%` }}></div>
              </div>
              <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
            </div>
          </div>
        ))}
      </div>
      {sortedLocations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No household data available</p>
        </div>
      )}
    </div>
  );
}
