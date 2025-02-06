const API_KEY = process.env.NEXT_PUBLIC_N2YO_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_N2YO_API_BASE_URL;

if (!API_KEY || !BASE_URL) {
  throw new Error("API_KEY or BASE_URL is not defined in the environment variables.");
}

// Helper function to handle API responses
const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${url}`);
    }
    return await response.json();
  } catch (err) {
    console.error('API error:', err);
    throw err;
  }
};

// API endpoint handler
export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET': {
      const { type, satelliteId, observerLat, observerLng, observerAlt, days, minVisibility } = req.query;

      // Fetch visual passes
      if (type === 'visualpasses' && satelliteId && observerLat && observerLng && observerAlt && days && minVisibility) {
        const url = `${BASE_URL}visualpasses/${satelliteId}/${observerLat}/${observerLng}/${observerAlt}/${days}/${minVisibility}/&apiKey=${API_KEY}`;
        console.log("Fetching visual passes from:", url); // Debugging log
        const data = await fetchData(url);
        return res.status(200).json(data);
      }

      // Fetch satellite position
      if (type === 'positions' && satelliteId) {
        const url = `${BASE_URL}positions/${satelliteId}/0/0/0/30?apiKey=${API_KEY}`;
        const data = await fetchData(url);
        return res.status(200).json(data);
      }

      // Fetch satellites above
      if (type === 'above' && observerLat && observerLng) {
        const url = `${BASE_URL}above/${observerLat}/${observerLng}/${observerAlt || 0}/90/18/&apiKey=${API_KEY}`;
        console.log("Fetching satellites from:", url); // Debugging log
        const data = await fetchData(url);
        return res.status(200).json(data);
      }


      return res.status(400).json({ error: 'Invalid request parameters.' });
    }

    default:
      res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
}
