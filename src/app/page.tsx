export default function HomePage() {
  const endpoints = [
    {
      method: 'POST',
      path: '/api/recommend',
      desc: 'Hybrid pgvector cosine search + SQL multi-attribute filtering (Price, Fuel, Transmission, Safety)',
      samplePayload: JSON.stringify(
        {
          prompt: '5-star safe compact SUV with panoramic sunroof',
          minPrice: 800000,
          maxPrice: 2000000,
          fuelType: 'Petrol',
          transmission: 'DCT',
          minSafety: 4.5,
        },
        null,
        2
      ),
    },
    {
      method: 'GET',
      path: '/api/compare?ids=1,2,3',
      desc: 'Side-by-side spec comparison with aggregated standard and optional features',
      samplePayload: 'Query params: ?ids=1,3,7',
    },
    {
      method: 'GET',
      path: '/api/upcoming?bodyType=SUV',
      desc: 'Fetches directly from PostgreSQL v_upcoming_launches view with days-until-launch countdown',
      samplePayload: 'Query params: ?bodyType=SUV&manufacturer=Tata',
    },
    {
      method: 'POST / PUT / DELETE',
      path: '/api/admin/cars',
      desc: 'CRUD operations with parameterized SQL DML statements, auto-embedding, and soft/hard deletes',
      samplePayload: JSON.stringify(
        {
          modelId: 1,
          variantName: 'Fearless Plus Red Dark Edition',
          price: 1520000,
          fuelType: 'Petrol',
          transmission: 'DCT',
          safetyRating: 5.0,
          featureIds: [1, 2, 3, 4],
        },
        null,
        2
      ),
    },
  ];

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#090d16',
        color: '#f1f5f9',
        padding: '3rem 2rem',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '1.5rem' }}>
          <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Next.js App Router + PostgreSQL + pgvector
          </div>
          <h1 style={{ fontSize: '2.25rem', margin: '0 0 0.5rem 0', fontWeight: 800, letterSpacing: '-0.025em', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Car Recommendation DBMS Backend API
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0, lineHeight: 1.6 }}>
            Robust, SQL-injection-safe backend API layer with 1536-dimensional vector similarity search, multi-table joins, and admin DML routes.
          </p>
        </header>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {endpoints.map((ep, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span
                  style={{
                    backgroundColor: ep.method.includes('POST') ? '#0284c7' : ep.method.includes('GET') ? '#059669' : '#d97706',
                    color: '#ffffff',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                >
                  {ep.method}
                </span>
                <code style={{ fontSize: '1.05rem', color: '#f8fafc', fontWeight: 600, fontFamily: 'monospace' }}>
                  {ep.path}
                </code>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.95rem', margin: '0 0 1rem 0' }}>{ep.desc}</p>
              <div style={{ background: '#020617', padding: '1rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Sample Request / Payload
                </div>
                <pre style={{ margin: 0, color: '#38bdf8', fontSize: '0.85rem', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                  {ep.samplePayload}
                </pre>
              </div>
            </div>
          ))}
        </section>

        <footer style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #1e293b', color: '#64748b', fontSize: '0.875rem', textAlign: 'center' }}>
          Database connected via <code style={{ color: '#94a3b8' }}>process.env.DATABASE_URL</code> with <code style={{ color: '#94a3b8' }}>pgvector(1536)</code>
        </footer>
      </div>
    </main>
  );
}
