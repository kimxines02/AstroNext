import React, { useState, useEffect } from 'react';

// Define types for the visual passes data
interface VisualPass {
  start: string;  // ISO format time
}

interface VisualPassesProps {
  satelliteId: number;
  observerLat: number;
  observerLng: number;
  observerAlt: number;
  days: number;
  minVisibility: number;
}

const VisualPasses: React.FC<VisualPassesProps> = ({
  satelliteId,
  observerLat,
  observerLng,
  observerAlt,
  days,
  minVisibility,
}) => {
  const [nextPass, setNextPass] = useState<VisualPass | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch visual passes data
  useEffect(() => {
    const fetchVisualPasses = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/satellite?type=visualpasses&satelliteId=${satelliteId}&observerLat=${observerLat}&observerLng=${observerLng}&observerAlt=${observerAlt}&days=${days}&minVisibility=${minVisibility}`
        );

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          setError(data.error);
          return;
        }

        if (data.passes && data.passes.length > 0) {
          const nextPassData = data.passes[0]; // Get the next pass

          // Assuming 'start' is in a valid date format (ISO 8601 or similar)
          const startTime = new Date(nextPassData.start).getTime();
          const now = Date.now();

          if (startTime > now) {
            const diffInMilliseconds = startTime - now;

            // Calculate time left in hours, minutes, and seconds
            const hours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
            const minutes = Math.floor((diffInMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffInMilliseconds % (1000 * 60)) / 1000);

            setNextPass({
              ...nextPassData,
              start: `${hours}h ${minutes}m ${seconds}s`, // Format the time remaining
            });
          } else {
            setError('No upcoming visual passes found.');
          }
        } else {
          setError('No visual passes found.');
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(`Error fetching visual passes: ${error.message}`);
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVisualPasses();

    const interval = setInterval(fetchVisualPasses, 60000); // Refresh every minute
    return () => clearInterval(interval); // Cleanup on component unmount
  }, [satelliteId, observerLat, observerLng, observerAlt, days, minVisibility]);

  // If loading, show loading message
  if (loading) {
    return <div>Loading visual passes...</div>;
  }

  // If error occurs, show error message
  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="w-full text-white p-4 text-sm">
      <h3>🛰 Upcoming Visual Passes</h3>
      {nextPass ? (
        <div>
          <div><strong>ISS will cross your sky in:</strong> {nextPass.start}</div>
        </div>
      ) : (
        <div>🛰 No upcoming visual passes found.</div>
      )}
    </div>
  );
};

export default VisualPasses;
