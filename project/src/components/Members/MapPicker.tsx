import { useEffect, useRef, useState } from 'react';
import { X, MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function MapPicker({ isOpen, onClose, onSelect, initialLat, initialLng }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!isOpen || !mapRef.current || mapInstanceRef.current) return;
    const defaultLat = initialLat || 7.4256;
    const defaultLng = initialLng || 125.4775;
    const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 13);
    mapInstanceRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    const customIcon = L.divIcon({ className: 'custom-marker', html: '<div style="color: #0d9488; font-size: 32px;">📍</div>', iconSize: [32, 32], iconAnchor: [16, 32] });
    if (initialLat && initialLng) {
      const marker = L.marker([initialLat, initialLng], { icon: customIcon }).addTo(map);
      markerRef.current = marker;
      setSelectedCoords({ lat: initialLat, lng: initialLng });
    }
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) { markerRef.current.setLatLng([lat, lng]); }
      else { const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map); markerRef.current = marker; }
      setSelectedCoords({ lat, lng });
    });
    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; markerRef.current = null; }
    };
  }, [isOpen, initialLat, initialLng]);

  const handleConfirm = () => {
    if (selectedCoords) { onSelect(selectedCoords.lat, selectedCoords.lng); onClose(); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-teal-600" /><h2 className="text-lg font-semibold text-gray-900">Select Location on Map</h2></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="flex-1 relative" style={{ minHeight: '400px' }}><div ref={mapRef} className="absolute inset-0" /></div>
        <div className="p-4 border-t bg-gray-50">
          {selectedCoords && (
            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600">Selected Coordinates:</div>
              <div className="font-mono text-sm mt-1"><span className="font-medium">Lat:</span> {selectedCoords.lat.toFixed(6)}, <span className="font-medium ml-3">Lng:</span> {selectedCoords.lng.toFixed(6)}</div>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleConfirm} disabled={!selectedCoords} className="px-4 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">Confirm Location</button>
          </div>
        </div>
      </div>
    </div>
  );
}
