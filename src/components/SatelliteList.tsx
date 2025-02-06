import { useEffect, useState } from "react";

interface Satellite {
  satid: number;
  satname: string;
}

const SatelliteList = () => {
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSatellite, setSelectedSatellite] = useState<number | "">("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [altitude, setAltitude] = useState<number>(0);
  const [searchRadius, setSearchRadius] = useState<number>(90);

  // Fetch the user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Unable to retrieve location");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  }, []);

  // Function to fetch satellites based on the current position and radius
  const fetchSatellites = async () => {
    if (latitude === null || longitude === null) return;
    setLoading(true);
    setError(null); // Reset error state
  
    try {
      const response = await fetch(
        `/api/satellite?type=above&observerLat=${latitude}&observerLng=${longitude}&observerAlt=${altitude}&searchRadius=${searchRadius}`
      );
  
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
  
      const data = await response.json();
  
      if (!data || typeof data !== "object" || !Array.isArray(data.above)) {
        throw new Error("Unexpected API response format");
      }
  
      setSatellites(data.above);
    } catch (err) {
      console.error("Error fetching satellites:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setSatellites([]); // Ensure the satellites state is cleared on error
    } finally {
      setLoading(false);
    }
  };
  

  // Fetch satellites whenever location or parameters change
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      fetchSatellites();
    }
  }, [latitude, longitude, altitude, searchRadius]);

  if (loading) return <p>Loading satellites...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>SELECT SATELLITE:</h2>
      <select
        value={selectedSatellite}
        onChange={(e) => setSelectedSatellite(Number(e.target.value))}
        className="bg-gray-700 text-white w-full mb-2 px-2">
        <option value="">-- Select a Satellite --</option>
        {satellites.map((sat) => (
          <option key={sat.satid} value={sat.satid}>
            {sat.satname} (ID: {sat.satid})
          </option>
        ))}
      </select>

      {selectedSatellite && (
        <p>
          Selected Satellite ID: {selectedSatellite}
        </p>
      )}
      <div className="flex flex-col">
        <label>LATITUDE:
          <input 
            type="number" 
            value={latitude ?? ""} 
            onChange={(e) => setLatitude(Number(e.target.value))} 
            disabled={latitude !== null} // Disable if geolocation is used
             className="bg-gray-700 text-white w-full mb-2 px-2"
          />
        </label>
        <label>LONGITUDE:
          <input 
            type="number" 
            value={longitude ?? ""} 
            onChange={(e) => setLongitude(Number(e.target.value))} 
            disabled={longitude !== null} // Disable if geolocation is used
            className="bg-gray-700 text-white w-full mb-2 px-2"
          />
        </label>
        <label>ALTITUDE: 
          <input 
            type="number" 
            value={altitude} 
            onChange={(e) => setAltitude(Number(e.target.value))} 
            className="bg-gray-700 text-white w-full mb-2 px-2"
          />
        </label>
        <label>SEARCH RADIUS: 
          <input 
            type="number" 
            value={searchRadius} 
            onChange={(e) => setSearchRadius(Number(e.target.value))} 
            className="bg-gray-700 text-white w-full mb-2 px-2"
          />
        </label>
        <button onClick={fetchSatellites} className="bg-green-500 py-2 w-full font-bold rounded-xs">VIEW SATELLITE</button>
      </div>

    </div>
  );
};

export default SatelliteList;
