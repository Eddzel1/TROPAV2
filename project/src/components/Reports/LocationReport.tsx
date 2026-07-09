import React, { useMemo, useState } from 'react';
import { Household, FamilyMember, Location } from '../../types';
import { MapPin, ChevronDown, ChevronRight, Copy } from 'lucide-react';

interface LocationReportProps {
    households: Household[];
    members: FamilyMember[];
    locations: Location[];
}

interface Stats {
    households: number;
    members: number;
    voters: number;
    ageBrackets: Record<string, number>;
    sectors: Record<string, number>;
}

export function LocationReport({ households, members }: LocationReportProps) {
    const statsByBarangay = useMemo(() => {
        const stats: Record<string, {
            total: Stats;
            puroks: Record<string, Stats>;
        }> = {};

        const initStats = (): Stats => ({
            households: 0,
            members: 0,
            voters: 0,
            ageBrackets: { '0-17': 0, '18-35': 0, '36-50': 0, '51-65': 0, '66+': 0, 'Unknown': 0 },
            sectors: {}
        });

        // Initialize and ensure structures exist
        const ensurePath = (barangay: string, purok: string) => {
            if (!stats[barangay]) {
                stats[barangay] = {
                    total: initStats(),
                    puroks: {}
                };
            }
            if (!stats[barangay].puroks[purok]) {
                stats[barangay].puroks[purok] = initStats();
            }
        };

        // Process Households
        households.forEach(h => {
            const barangay = (h.barangay || 'Unknown').trim().toUpperCase();
            const purok = (h.purok || 'Unknown').trim().toUpperCase();
            ensurePath(barangay, purok);
            
            stats[barangay].total.households += 1;
            stats[barangay].puroks[purok].households += 1;
        });

        // Process Members
        members.forEach(m => {
            const barangay = (m.barangay || 'Unknown').trim().toUpperCase();
            const purok = (m.purok || 'Unknown').trim().toUpperCase();
            ensurePath(barangay, purok);

            const bTotal = stats[barangay].total;
            const pStat = stats[barangay].puroks[purok];

            bTotal.members += 1;
            pStat.members += 1;
            
            if (m.is_voter) {
                bTotal.voters += 1;
                pStat.voters += 1;
            }

            // Age Bracket
            let bracket = 'Unknown';
            if (m.age !== undefined && m.age !== null) {
                if (m.age <= 17) bracket = '0-17';
                else if (m.age <= 35) bracket = '18-35';
                else if (m.age <= 50) bracket = '36-50';
                else if (m.age <= 65) bracket = '51-65';
                else bracket = '66+';
            }
            bTotal.ageBrackets[bracket] += 1;
            pStat.ageBrackets[bracket] += 1;

            // Sector
            const sector = m.sector || 'Unspecified';
            if (!bTotal.sectors[sector]) bTotal.sectors[sector] = 0;
            if (!pStat.sectors[sector]) pStat.sectors[sector] = 0;
            
            bTotal.sectors[sector] += 1;
            pStat.sectors[sector] += 1;
        });

        return stats;
    }, [households, members]);

    const [expandedBarangays, setExpandedBarangays] = useState<Record<string, boolean>>({});

    const toggleBarangay = (barangay: string) => {
        setExpandedBarangays(prev => ({
            ...prev,
            [barangay]: !prev[barangay]
        }));
    };

    const renderBadges = (data: Record<string, number>) => {
        const items = Object.entries(data)
            .filter(([, count]) => count > 0)
            .sort(([, a], [, b]) => b - a);
            
        if (items.length === 0) return <span className="text-gray-400 text-xs">-</span>;
        
        return (
            <div className="flex flex-wrap gap-1">
                {items.map(([key, count]) => (
                    <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        {key}: <span className="ml-1 font-bold">{count}</span>
                    </span>
                ))}
            </div>
        );
    };

    const handleCopyToClipboard = () => {
        let tsv = "Barangay / Purok\tTotal HL\tTotal Members\tTotal Voters\tTotal Per Sector\tTotal Per Age Bracket\n";
        
        Object.entries(statsByBarangay)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([barangay, data]) => {
                const sectorStr = Object.entries(data.total.sectors).filter(([,c]) => c > 0).map(([k, c]) => `${k}: ${c}`).join(", ");
                const ageStr = Object.entries(data.total.ageBrackets).filter(([,c]) => c > 0).map(([k, c]) => `${k}: ${c}`).join(", ");
                
                tsv += `${barangay}\t${data.total.households}\t${data.total.members}\t${data.total.voters}\t${sectorStr}\t${ageStr}\n`;
                
                Object.entries(data.puroks)
                    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
                    .forEach(([purok, stat]) => {
                        const pSectorStr = Object.entries(stat.sectors).filter(([,c]) => c > 0).map(([k, c]) => `${k}: ${c}`).join(", ");
                        const pAgeStr = Object.entries(stat.ageBrackets).filter(([,c]) => c > 0).map(([k, c]) => `${k}: ${c}`).join(", ");
                        
                        // Add some indentation to purok names for visual hierarchy in Excel/Sheets
                        tsv += `    ${purok}\t${stat.households}\t${stat.members}\t${stat.voters}\t${pSectorStr}\t${pAgeStr}\n`;
                    });
            });

        navigator.clipboard.writeText(tsv).then(() => {
            alert("Data copied to clipboard! You can now paste it into Google Sheets.");
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert("Failed to copy data to clipboard.");
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-0">
                        <MapPin className="w-5 h-5 text-teal-600" />
                        Location Breakdown
                    </h3>
                    <button
                        onClick={handleCopyToClipboard}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                        <Copy className="w-4 h-4" />
                        Copy for Excel/Sheets
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border-b border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/5">
                                    Barangay / Purok
                                </th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Total HL
                                </th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Total Members
                                </th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Total Voters
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/4">
                                    Total Per Sector
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/4">
                                    Total Per Age Bracket
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Object.keys(statsByBarangay).length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <MapPin className="w-8 h-8 text-gray-400 mb-2" />
                                            <p>No location data available</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            
                            {Object.entries(statsByBarangay)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([barangay, data]) => {
                                    const isExpanded = expandedBarangays[barangay];
                                    
                                    return (
                                        <React.Fragment key={barangay}>
                                            {/* Barangay Row */}
                                            <tr 
                                                className={`hover:bg-gray-50 cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/30' : ''}`}
                                                onClick={() => toggleBarangay(barangay)}
                                            >
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {isExpanded ? (
                                                            <ChevronDown className="w-5 h-5 text-gray-500" />
                                                        ) : (
                                                            <ChevronRight className="w-5 h-5 text-gray-500" />
                                                        )}
                                                        <span className="font-bold text-gray-900 text-sm">{barangay}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                                                    {data.total.households}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                                                    {data.total.members}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                                                    {data.total.voters}
                                                </td>
                                                <td className="px-4 py-4 min-w-[200px]">
                                                    {renderBadges(data.total.sectors)}
                                                </td>
                                                <td className="px-4 py-4 min-w-[200px]">
                                                    {renderBadges(data.total.ageBrackets)}
                                                </td>
                                            </tr>
                                            
                                            {/* Purok Rows */}
                                            {isExpanded && Object.entries(data.puroks)
                                                .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
                                                .map(([purok, stat]) => (
                                                    <tr key={`${barangay}-${purok}`} className="bg-gray-50/50 hover:bg-gray-100 transition-colors">
                                                        <td className="px-4 py-3 whitespace-nowrap pl-12">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                                                                <span className="text-sm font-medium text-gray-700">{purok}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-700">
                                                            {stat.households}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-700">
                                                            {stat.members}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-700">
                                                            {stat.voters}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {renderBadges(stat.sectors)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {renderBadges(stat.ageBrackets)}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </React.Fragment>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
