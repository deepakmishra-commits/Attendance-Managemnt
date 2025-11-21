import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { OFFICE_COORDS, ATTENDANCE_RADIUS_METERS } from '../constants';

// Fix Leaflet icon issue in React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  userLocation: { lat: number; lng: number } | null;
}

const MapUpdater: React.FC<{ center: { lat: number; lng: number } }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
        map.flyTo(center, 14, {
            duration: 1.5
        });
        // Invalidate size to ensure tiles load correctly if map container resized
        map.invalidateSize();
    }
  }, [center, map]);
  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ userLocation }) => {
  const center = userLocation || OFFICE_COORDS;

  return (
    <MapContainer center={center} zoom={13} className="h-full w-full rounded-lg z-0" scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Office Radius */}
      <Circle 
        center={OFFICE_COORDS} 
        radius={ATTENDANCE_RADIUS_METERS} 
        pathOptions={{ fillColor: 'blue', color: 'blue', fillOpacity: 0.05, weight: 1 }} 
      />
      <Marker position={OFFICE_COORDS}>
        <Popup>
          <div className="text-center">
            <strong>TechFlow Solutions</strong><br/>
            Office HQ
          </div>
        </Popup>
      </Marker>

      {/* User Location */}
      {userLocation && (
        <>
          <Marker position={userLocation}>
            <Popup>You are here</Popup>
          </Marker>
          <MapUpdater center={userLocation} />
        </>
      )}
    </MapContainer>
  );
};

export default MapComponent;
