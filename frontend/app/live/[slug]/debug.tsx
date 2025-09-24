'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function DebugPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data for slug:', slug);
        const response = await fetch(`http://localhost:3001/api/branded-urls/slug/${slug}`);
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('Data received:', result);
          setData(result);
        } else {
          setError(`API error: ${response.status}`);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Fetch error: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!data) {
    return <div>No data</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Debug Page</h1>
      <h2>Branded URL Data:</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      
      <h2>Branded Page Preview:</h2>
      <div style={{ 
        backgroundColor: data.color || '#3B82F6', 
        color: 'white', 
        padding: '20px',
        borderRadius: '8px',
        margin: '10px 0'
      }}>
        <h3>{data.name}</h3>
        <p>Slug: {data.slug}</p>
        <p>Color: {data.color}</p>
        <p>Offline Message: {data.offlineMessage}</p>
        <p>CTA Text: {data.ctaText}</p>
        <p>CTA URL: {data.ctaUrl}</p>
        {data.logoUrl && <img src={data.logoUrl} alt="Logo" style={{ width: '50px', height: '50px' }} />}
      </div>
    </div>
  );
}
