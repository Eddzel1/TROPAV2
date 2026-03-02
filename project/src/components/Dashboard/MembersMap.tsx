import { useEffect, useRef } from 'react';
import { FamilyMember } from '../../types';
import { Map, MapPin, Maximize2, Users } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MembersMapProps {
  members: FamilyMember[];
}

const sectorColors: Record<string, string> = {
  'College Student': '#3b82f6',
  'PWD': '#8b5cf6',
  'Senior Citizen': '#f59e0b',
  'LGBTQ+': '#ec4899',
  'Indigenous People': '#10b981',
  'Solo Parent': '#ef4444',
  'General': '#6b7280'
};

export function MembersMap({ members }: MembersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const membersWithCoordinates = members.filter(
    m => m.latitude !== null && m.latitude !== undefined &&
      m.longitude !== null && m.longitude !== undefined
  );

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current).setView([7.4256, 125.4775], 11);
    mapInstanceRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    return () => {
      if (mapInstanceRef.current) {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    membersWithCoordinates.forEach(member => {
      if (!member.latitude || !member.longitude) return;
      const firstSector = member.sector ? member.sector.split(',').map(s => s.trim()).filter(Boolean)[0] : 'General';
      const color = sectorColors[firstSector] || sectorColors['General'];
      const circleMarker = L.circleMarker([member.latitude, member.longitude], {
        radius: 8, fillColor: color, color: '#ffffff', weight: 2, opacity: 1, fillOpacity: 0.8
      });
      const fullName = `${member.firstname} ${member.middlename ? member.middlename + ' ' : ''}${member.lastname}${member.extension ? ' ' + member.extension : ''}`;
      circleMarker.bindPopup(`
        <div style="min-width: 180px;">
          <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${fullName}</div>
          <div style="font-size: 13px; color: #6b7280;"><strong>Sector:</strong> ${member.sector}</div>
          <div style="font-size: 13px; color: #6b7280;"><strong>Location:</strong> ${member.barangay}, ${member.lgu}</div>
          ${member.contact_number ? `<div style="font-size: 13px; color: #6b7280;"><strong>Contact:</strong> ${member.contact_number}</div>` : ''}
        </div>
      `);
      circleMarker.addTo(mapInstanceRef.current!);
      markersRef.current.push(circleMarker as unknown as L.Marker);
    });
    if (membersWithCoordinates.length > 0) {
      const bounds = L.latLngBounds(membersWithCoordinates.map(m => [m.latitude!, m.longitude!]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [members, membersWithCoordinates.length]);

  const handleFitBounds = () => {
    if (!mapInstanceRef.current || membersWithCoordinates.length === 0) return;
    const bounds = L.latLngBounds(membersWithCoordinates.map(m => [m.latitude!, m.longitude!]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
  };

  const toggleFullscreen = () => {
    if (!mapRef.current?.parentElement) return;
    const container = mapRef.current.parentElement;
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => { setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100); });
    } else {
      document.exitFullscreen().then(() => { setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100); });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 lg:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg"><Map className="w-5 h-5 text-teal-600" /></div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Member Locations</h2>
              <p className="text-sm text-gray-600 mt-0.5">{membersWithCoordinates.length} of {members.length} members have location data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleFitBounds} disabled={membersWithCoordinates.length === 0}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <MapPin className="w-4 h-4" />Fit All
            </button>
            <button onClick={toggleFullscreen} className="p-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="relative">
        {membersWithCoordinates.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No location data available</p>
              <p className="text-sm text-gray-400 mt-1">Add GPS coordinates to members to see them on the map</p>
            </div>
          </div>
        ) : (
          <div ref={mapRef} className="h-[400px] w-full" />
        )}
      </div>
      {membersWithCoordinates.length > 0 && (
        <div className="p-4 lg:p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm font-medium text-gray-700 mb-3">Sector Legend:</div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(sectorColors).map(([sector, color]) => {
              const count = membersWithCoordinates.filter(m => (m.sector || 'General').split(',').map(s => s.trim()).filter(Boolean).includes(sector)).length;
              if (count === 0) return null;
              return (
                <div key={sector} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
                  <span className="text-sm text-gray-700">{sector} <span className="text-gray-500">({count})</span></span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
