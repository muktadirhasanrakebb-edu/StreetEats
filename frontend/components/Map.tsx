import React, { useState, useContext, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import type { Coordinates, Vendor } from '../types';
import { AppContext } from '../context/AppContext';
import { StarIcon } from './Icons';

interface MapProps {
  userLocation: Coordinates | null;
  vendors: Vendor[];
}

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem'
};

// Default center: Dhaka, Bangladesh
const defaultCenter = {
  lat: 23.8103,
  lng: 90.4125
};

// Clean Map Styles (removes excessive POIs to focus on food)
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
    },
    {
        featureType: "poi.business",
        elementType: "labels",
        stylers: [{ visibility: "on" }]
    }
  ]
};

const Map: React.FC<MapProps> = ({ userLocation, vendors }) => {
  // Safely access env vars by casting import.meta to any to bypass missing type definitions
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    // Fallback to empty string if env var is missing, but warns user
    googleMapsApiKey:  apiKey
  });

  const { navigateTo } = useContext(AppContext);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [map, setMap] = useState<any | null>(null);

  const onLoad = useCallback((map: any) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (!apiKey) {
      return (
          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center flex-col text-center p-4">
              <p className="text-red-500 font-bold mb-2">API Key Missing</p>
              <p className="text-sm text-gray-600">
                  Please create a <code className="bg-gray-300 px-1 rounded">.env</code> file in your frontend folder and add:
                  <br/>
                  <code className="block bg-gray-800 text-white p-2 mt-2 rounded text-xs text-left">VITE_GOOGLE_MAPS_API_KEY=your_key_here</code>
              </p>
          </div>
      );
  }

  if (!isLoaded) {
    return (
        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center animate-pulse">
            <p className="text-gray-500 font-semibold">Loading Map...</p>
        </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={userLocation || defaultCenter}
      zoom={14}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
    >
      {/* User Location Marker (Blue Dot) */}
      {userLocation && (
        <Marker
          position={userLocation}
          title="You are here"
          icon={{
            path: (window as any).google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
          }}
        />
      )}

      {/* Vendor Markers (Red Pins) */}
      {vendors.map((vendor) => (
        <Marker
          key={vendor.id}
          position={vendor.coords}
          title={vendor.businessName}
          onClick={() => setSelectedVendor(vendor)}
          animation={(window as any).google.maps.Animation.DROP}
        />
      ))}

      {/* Info Window for Selected Vendor */}
      {selectedVendor && (
        <InfoWindow
          position={selectedVendor.coords}
          onCloseClick={() => setSelectedVendor(null)}
        >
          <div className="p-1 min-w-[150px]">
            <h3 className="font-bold text-dark text-base">{selectedVendor.businessName}</h3>
            <p className="text-xs text-primary font-semibold uppercase mb-1">{selectedVendor.foodType}</p>
            <div className="flex items-center mb-2">
                <StarIcon className="w-3 h-3 text-secondary" />
                <span className="text-xs ml-1 font-bold">{selectedVendor.rating.toFixed(1)}</span>
            </div>
            <button
                onClick={() => navigateTo('vendorDetail', selectedVendor)}
                className="w-full bg-primary text-white text-xs font-bold py-1 px-2 rounded hover:bg-red-600 transition-colors"
            >
                View Menu
            </button>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default Map;