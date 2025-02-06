import React from 'react';

// Define types for the satellite data
interface SatellitePosition {
  lat: number;
  lng: number;
}

interface SatelliteData {
  name: string;
  position: SatellitePosition;
}

interface SatelliteInfoProps {
  satelliteData: SatelliteData | null;
}

const SatelliteInfo: React.FC<SatelliteInfoProps> = ({ satelliteData }) => {
  if (!satelliteData) {
    return <div>No satellite data available</div>;
  }

  return (
    <div className="w-full bg-gray-800 text-white p-4 text-sm">
      <h3>Satellite Information</h3>
      <p><strong>Name:</strong> {satelliteData.name}</p>
      <p><strong>Latitude:</strong> {satelliteData.position.lat}</p>
      <p><strong>Longitude:</strong> {satelliteData.position.lng}</p>
    </div>
  );
};

export default SatelliteInfo;
