import React, { useState, useEffect } from 'react';

interface NextPassData {
  startAzimuth: number;
  maxElevation: number;
  endAzimuth: number;
  totalDuration: number;
  startTime: string;
  endTime: string;
}

interface NextPassProps {
  satelliteId: number;
  observerLat: number;
  observerLng: number;
  observerAlt: number;
  days: number;  // Add the number of days to look ahead
  minVisibility: number; // Add minimum visibility for the pass
}

const NextPass: React.FC<NextPassProps> = ({
  satelliteId,
  observerLat,
  observerLng,
  observerAlt,
  days,
  minVisibility,
}) => {
  const [nextPass, setNextPass] = useState<NextPassData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const fetchNextPass = async () => {
      try {
        // Send a GET request to the backend API with the necessary query parameters
        const response = await fetch(`/api/satellite?type=visualpasses&satelliteId=${satelliteId}&observerLat=${observerLat}&observerLng=${observerLng}&observerAlt=${observerAlt}&days=${days}&minVisibility=${minVisibility}`);
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Check if nextPass exists and is an array with at least one item
        if (!data.nextPass || !Array.isArray(data.nextPass) || data.nextPass.length === 0) {
          setError('No upcoming visual passes found.');
          setLoading(false);
          return;
        }

        const nextPassData: NextPassData = {
          startAzimuth: data.nextPass[0].startAzimuth,
          maxElevation: data.nextPass[0].maxElevation,
          endAzimuth: data.nextPass[0].endAzimuth,
          totalDuration: data.nextPass[0].duration,
          startTime: data.nextPass[0].startUTC,
          endTime: data.nextPass[0].endUTC,
        };

        setNextPass(nextPassData);

        // Calculate the remaining time before the pass
        const startDate = new Date(nextPassData.startTime);
        const now = new Date();
        const timeDifference = startDate.getTime() - now.getTime();

        if (timeDifference > 0) {
          // Format the time difference into hours, minutes, and seconds
          const hours = Math.floor(timeDifference / (1000 * 60 * 60));
          const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

          const formattedTime = `${hours}h ${minutes}m ${seconds}s`;
          setTimeRemaining(formattedTime);
        } else {
          setError('The next pass is in the past.');
        }

        setLoading(false);
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error fetching next pass data:', error.message);
          setError(`Error fetching next pass data: ${error.message}`);
        } else {
          console.error('An unknown error occurred:', error);
          setError('An unknown error occurred.');
        }
        setLoading(false);
      }
    };

    fetchNextPass();

    // Periodically refresh the next pass data
    const interval = setInterval(fetchNextPass, 60000); // Refresh every minute
    return () => clearInterval(interval); // Cleanup on component unmount
  }, [satelliteId, observerLat, observerLng, observerAlt, days, minVisibility]);

  if (loading) {
    return <div>Loading next pass data...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="w-full bg-gray-800 text-white p-4 text-sm">
      <h3>Next Pass of Space Station Over Your Location</h3>
      {nextPass ? (
        <div>
          <div><strong>Start Azimuth:</strong> {nextPass.startAzimuth}°</div>
          <div><strong>Max Elevation:</strong> {nextPass.maxElevation}°</div>
          <div><strong>End Azimuth:</strong> {nextPass.endAzimuth}°</div>
          <div><strong>Total Duration:</strong> {nextPass.totalDuration} seconds</div>
          <div><strong>Start Time:</strong> {timeRemaining}</div> {/* Display time remaining */}
          <div><strong>End Time:</strong> {nextPass.endTime}</div>
        </div>
      ) : (
        <div>No upcoming pass data found.</div>
      )}
    </div>
  );
};

export default NextPass;
