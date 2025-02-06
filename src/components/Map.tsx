import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet'; 
import SatelliteInfo from './SatelliteInfo'; 
import VisualPasses from './VisualPasses';
import NextPass from './NextPass';
import SatelliteList from './SatelliteList';

// Define types for the satellite data and route
interface SatellitePosition {
  lat: number;
  lng: number;
}

interface SatelliteData {
  name: string;
  position: SatellitePosition;
  velocity: { lat: number; lng: number }; // Satellite's velocity (for prediction)
}

const Map = () => {
  // State to store satellite data
  const [satelliteData, setSatelliteData] = useState<SatelliteData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // State to store the route of the current satellite
  const [route, setRoute] = useState<SatellitePosition[]>([]);

  // State to store the prediction path
  const [predictionPath, setPredictionPath] = useState<SatellitePosition[]>([]);

  // Observer's location and parameters
  const satelliteId = 25544; // satellite id
  const observerLat = 14.5995; // Example latitude (Cebu City, PH)
  const observerLng = 120.9842; // Example longitude (Cebu City, PH)
  const observerAlt = 0; // Example altitude
  const minVisibility = 90; // Minimum visibility (degrees)

  // Function to fetch satellite data from your API
  const fetchSatelliteData = async () => {
    try {
      // Fetch satellite positions via API
      const response = await fetch(`/api/satellite?type=positions&satelliteId=${satelliteId}`);
      const data = await response.json();
      console.log('API Data:', data);

      if (data.error) {
        console.error('Error:', data.error);
        setLoading(false);
        return;
      }

      // Ensure latitude and longitude are numbers
      const latitude = parseFloat(data.positions[0]?.satlatitude);
      const longitude = parseFloat(data.positions[0]?.satlongitude);
      const satelliteName = data.info?.satname || 'Unknown Satellite';

      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error('Satellite position data is missing or invalid');
      }

      // Store satellite position
      const newPosition: SatellitePosition = { lat: latitude, lng: longitude };
      const velocity = {
        lat: parseFloat(data.positions[0]?.satlatvelocity || '0'),
        lng: parseFloat(data.positions[0]?.satlongvelocity || '0'),
      };

      setSatelliteData({ name: satelliteName, position: newPosition, velocity });

      // Update route, appending the new position
      setRoute(prevRoute => {
        const updatedRoute = [...prevRoute, newPosition];
        return updatedRoute;
      });

      // Predict satellite's future path (e.g., next 5 positions)
      predictSatellitePath(newPosition, velocity);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching satellite data:', error);
      setLoading(false);
    }
  };

  // Function to predict the satellite's path based on its velocity
  const predictSatellitePath = (currentPosition: SatellitePosition, velocity: { lat: number; lng: number }) => {
    const predictions: SatellitePosition[] = [];
    const timeInterval = 5; // Predict next 5 positions, every 5 seconds

    for (let i = 1; i <= 5; i++) {
      const newLat = currentPosition.lat + velocity.lat * i * timeInterval;
      const newLng = currentPosition.lng + velocity.lng * i * timeInterval;
      predictions.push({ lat: newLat, lng: newLng });
    }

    setPredictionPath(predictions);
  };

  // Fetch satellite data when component mounts and update periodically
  useEffect(() => {
    fetchSatelliteData();
    const interval = setInterval(fetchSatelliteData, 5000); // Fetch every 5s
    return () => clearInterval(interval);
  }, []);

  // Component to trigger map size update when data changes
  const MapResizer = () => {
    const map = useMap();
    useEffect(() => {
      map.invalidateSize();
    }, [satelliteData, route, predictionPath, map]); // Trigger invalidateSize when data changes
    return null;
  };

  // Custom icon for the marker
  const satelliteIcon = new L.Icon({
    iconUrl: '/leaflet/satellite.png', 
    iconSize: [24, 24], 
    iconAnchor: [16, 21], 
    popupAnchor: [1, -34], 
  });

  if (loading) {
    return <div>Loading satellite data...</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      <div className="bg-gray-900 p-4 text-sm flex flex-col justify-between">
        <SatelliteList />
        <VisualPasses
          satelliteId={satelliteId} 
          observerLat={observerLat} 
          observerLng={observerLng} 
          observerAlt={observerAlt} 
          days={1}
          minVisibility={minVisibility} 
        />
      </div>

      <div className="col-span-2">
        <MapContainer
          center={[satelliteData?.position.lat || 0, satelliteData?.position.lng || 0]}
          zoom={1} 
          style={{ width: '100%', height: '400px' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://carto.com/attributions">CartoDB</a>'
          />

          {/* Trigger resize on data change */}
          <MapResizer />

          {/* Satellite Marker */}
          {satelliteData && (
            <Marker
              position={[satelliteData.position.lat, satelliteData.position.lng]}
              icon={satelliteIcon} 
            >
              <Popup>{satelliteData.name}</Popup>
            </Marker>
          )}

          {/* Satellite Route */}
          {route.length > 1 && <Polyline positions={route} color="red" weight={2} opacity={0.4} />}
          
          {/* Predicted Path */}
          {predictionPath.length > 0 && <Polyline positions={predictionPath} color="blue" weight={2} opacity={0.6} />}
        </MapContainer>
        <SatelliteInfo satelliteData={satelliteData} />
      </div>
      <div>
        <NextPass
          satelliteId={satelliteId}  
          observerLat={observerLat}
          observerLng={observerLng}
          observerAlt={observerAlt}
          days={1}  
          minVisibility={minVisibility}  
        />
      </div>
      
    </div>
  );
};

export default Map;
