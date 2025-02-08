import React, { useState, useEffect } from 'react';

interface NextPassData {
  endUTC: string;
  maxUTC: string;
  startUTC: string;
  startAzCompass: string;
  endAzCompass: string;
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
  days: number;
  minVisibility: number;
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};


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
        const response = await fetch(`/api/satellite?type=visualpasses&satelliteId=${satelliteId}&observerLat=${observerLat}&observerLng=${observerLng}&observerAlt=${observerAlt}&days=${days}&minVisibility=${minVisibility}`);
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!data.passes || !Array.isArray(data.passes) || data.passes.length === 0) {
          setError('No upcoming visual passes found.');
          setLoading(false);
          return;
        }

        const nextPassData: NextPassData = {
          startAzimuth: data.passes[0].startAz,
          maxElevation: data.passes[0].maxEl,
          endAzimuth: data.passes[0].endAz,
          totalDuration: data.passes[0].duration,
          startTime: new Date(data.passes[0].startUTC * 1000).toISOString(),
          endTime: new Date(data.passes[0].endUTC * 1000).toISOString(),
          startAzCompass: data.passes[0].startAzCompass,
          endAzCompass: data.passes[0].endAzCompass,
          startUTC: new Date(data.passes[0].startUTC * 1000).toISOString(),
          maxUTC: new Date(data.passes[0].maxUTC * 1000).toISOString(),
          endUTC: new Date(data.passes[0].endUTC * 1000).toISOString(),
        };

        setNextPass(nextPassData);

        const startDate = new Date(nextPassData.startTime);
        const now = new Date();
        const timeDifference = startDate.getTime() - now.getTime();

        if (timeDifference > 0) {
          const hours = Math.floor(timeDifference / (1000 * 60 * 60));
          const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);
          setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
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
    const interval = setInterval(fetchNextPass, 60000);
    return () => clearInterval(interval);
  }, [satelliteId, observerLat, observerLng, observerAlt, days, minVisibility]);

  if (loading) {
    return <div>Loading next pass data...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="w-full bg-gray-800 text-white p-4 text-xs">
      <h3 className="text-sm font-bold py-2">🛰 Next Pass of Space Station Over Your Location...</h3>
      {nextPass ? (
        <div className="grid grid-cols-5 justify-items-stretch text-center gap-1">
          <div className="flex flex-col justify-self-auto border border-white p-1 content-center">
            <strong className="border-b border-white mb-1">Start Azimuth:</strong>
            <label>
              {new Date(nextPass.startUTC).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })} <br/>
              {nextPass.startAzimuth}° {nextPass.startAzCompass}
            </label>
          </div>
          <div className="flex flex-col justify-self-auto border border-white p-1">
            <strong className="border-b border-white mb-1">Max Elevation:</strong>
            <label>
              {new Date(nextPass.maxUTC).toLocaleString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })} <br/>
              {nextPass.maxElevation}°
            </label>
          </div>
          <div className="flex flex-col justify-self-auto border border-white p-1">
            <strong className="border-b border-white mb-1">End Azimuth:</strong>
            <label>
              {new Date(nextPass.endUTC).toLocaleString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })} <br/>
              {nextPass.endAzimuth}° {nextPass.endAzCompass}
            </label>
          </div>
          <div className="flex flex-col justify-self-auto border border-white p-1">
            <strong className="border-b border-white mb-1">Total Duration:</strong>
            {formatDuration(nextPass.totalDuration)}
          </div>
          <div className="flex flex-col justify-self-auto border border-white p-1">
            <strong className="border-b border-white mb-1">Start Time:</strong>
            {timeRemaining}
          </div>
          {/*
          <div className="flex flex-col justify-self-auto border border-white p-1">
            <strong className="border-b border-white">End Time:</strong>
            {nextPass.endTime}
          </div>
          */}
        </div>
      ) : (
        <div>No upcoming pass data found.</div>
      )}
    </div>
  );
};

export default NextPass;
