// Barangay coordinates data for LGUs
// Organized by LGU -> Barangay -> {lat, lng}

type BarangayCoords = { lat: number; lng: number };
type LGUBarangayMap = Record<string, BarangayCoords>;
type CoordinatesMap = Record<string, LGUBarangayMap>;

const barangayCoordinates: CoordinatesMap = {
  'Polomolok': {
    'Poblacion': { lat: 6.2019, lng: 125.0741 },
    'Cannery Site': { lat: 6.1920, lng: 125.0695 },
    'Bentung': { lat: 6.1777, lng: 125.0585 },
    'Glamang': { lat: 6.1920, lng: 125.0800 },
    'Kinilis': { lat: 6.2200, lng: 125.0650 },
    'Klinan 6': { lat: 6.2150, lng: 125.0750 },
    'Koronadal Proper': { lat: 6.1900, lng: 125.0900 },
    'Landan': { lat: 6.2100, lng: 125.0550 },
    'Lapu': { lat: 6.2250, lng: 125.0700 },
    'Marbel': { lat: 6.2300, lng: 125.0800 },
    'Palkan': { lat: 6.1750, lng: 125.0900 },
    'Polo': { lat: 6.2000, lng: 125.0600 },
    'Rubber': { lat: 6.1850, lng: 125.0750 },
    'Silway 7': { lat: 6.2050, lng: 125.0650 },
    'Silway 8': { lat: 6.2100, lng: 125.0700 },
    'Sulit': { lat: 6.1950, lng: 125.0800 },
    'Sumbakil': { lat: 6.1800, lng: 125.0650 },
    'Tango': { lat: 6.2150, lng: 125.0550 },
    'Tinago': { lat: 6.2100, lng: 125.0850 },
  },
  'Valencia City': {
    'Poblacion': { lat: 7.9063, lng: 125.0941 },
    'Aglayan': { lat: 7.8900, lng: 125.0800 },
    'Bagontaas': { lat: 7.9200, lng: 125.1100 },
    'Balintawak': { lat: 7.8750, lng: 125.0850 },
    'Batangan': { lat: 7.9350, lng: 125.0700 },
    'Biasong': { lat: 7.9500, lng: 125.1050 },
    'Bukid': { lat: 7.9150, lng: 125.0650 },
    'Buranen': { lat: 7.8950, lng: 125.1150 },
    'Cabangahan': { lat: 7.8800, lng: 125.0900 },
    'Colonia': { lat: 7.8700, lng: 125.0750 },
    'Concepcion': { lat: 7.9400, lng: 125.0800 },
    'Dagat-Dagatan': { lat: 7.9050, lng: 125.1000 },
    'Dalwangan': { lat: 7.8650, lng: 125.1100 },
    'Imbayao': { lat: 7.8600, lng: 125.0950 },
    'Indalaza': { lat: 7.9300, lng: 125.0900 },
    'Kadingilan': { lat: 7.9100, lng: 125.1200 },
    'Kalasungay': { lat: 7.9250, lng: 125.0600 },
    'Laligan': { lat: 7.8550, lng: 125.0850 },
    'Lumbayao': { lat: 7.8850, lng: 125.0700 },
    'Lumbo': { lat: 7.8700, lng: 125.1050 },
    'Maalim': { lat: 7.8450, lng: 125.0950 },
    'Managok': { lat: 7.9450, lng: 125.0950 },
    'Maramag': { lat: 7.8750, lng: 125.1200 },
    'Nabago': { lat: 7.9150, lng: 125.0850 },
    'Nagpanaoan': { lat: 7.9050, lng: 125.0700 },
    'Napaliran': { lat: 7.8900, lng: 125.1050 },
    'New Panay': { lat: 7.9300, lng: 125.1050 },
    'Paitan': { lat: 7.8650, lng: 125.0700 },
    'Pinamaloy': { lat: 7.9500, lng: 125.0800 },
    'Pintuyan': { lat: 7.9200, lng: 125.0700 },
    'San Carlos': { lat: 7.8950, lng: 125.0850 },
    'San Isidro': { lat: 7.9000, lng: 125.1150 },
    'Sinayawan': { lat: 7.8550, lng: 125.1000 },
    'Sinawal': { lat: 7.9350, lng: 125.1150 },
    'Susan': { lat: 7.8800, lng: 125.1000 },
    'Sugod': { lat: 7.9100, lng: 125.0750 },
    'Tongantongan': { lat: 7.9250, lng: 125.0850 },
    'Tugaya': { lat: 7.8450, lng: 125.0800 },
    'Zamboanguita': { lat: 7.9400, lng: 125.1200 },
  }
};

export function getEstimatedCoordinates(
  lgu: string,
  barangay: string
): { lat: number; lng: number } | null {
  const lguData = barangayCoordinates[lgu];
  if (!lguData) return null;
  
  const coords = lguData[barangay];
  if (!coords) return null;
  
  return coords;
}

export function getAvailableLGUs(): string[] {
  return Object.keys(barangayCoordinates);
}

export function getBarangaysForLGU(lgu: string): string[] {
  const lguData = barangayCoordinates[lgu];
  if (!lguData) return [];
  return Object.keys(lguData);
}
