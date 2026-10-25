'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface CarVariant {
  variant_id: number;
  variant_name: string;
  model_name: string;
  manufacturer_name: string;
  ex_showroom_price: number;
  fuel_type: string;
  transmission: string;
  safety_rating_ncap: number;
  is_active: boolean;
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [variants, setVariants] = useState<CarVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  // Form state for creating a new variant
  const [newVariant, setNewVariant] = useState({
    modelId: 1, // Tata Nexon by default
    variantName: '',
    price: '',
    fuelType: 'Petrol',
    transmission: 'Manual',
    safetyRating: '5.0',
  });

  const fetchCars = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/cars');
      const data = await res.json();
      if (data.success) {
        setVariants(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load cars:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionStatus(null);
    try {
      const res = await fetch('/api/admin/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVariant),
      });
      const data = await res.json();
      if (res.ok) {
        setActionStatus(`✅ Successfully added variant #${data.data.variant_id} (${data.data.variant_name})`);
        setNewVariant({
          modelId: 1,
          variantName: '',
          price: '',
          fuelType: 'Petrol',
          transmission: 'Manual',
          safetyRating: '5.0',
        });
        fetchCars();
      } else {
        setActionStatus(`❌ Error: ${data.error}`);
      }
    } catch {
      setActionStatus('❌ Failed to create car variant.');
    }
  };

  const handleToggleArchive = async (variantId: number, currentlyActive: boolean) => {
    setActionStatus(null);
    try {
      if (currentlyActive) {
        // Soft delete / archive
        const res = await fetch(`/api/admin/cars?id=${variantId}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
          setActionStatus(`📦 Archived variant #${variantId}`);
          fetchCars();
        } else {
          setActionStatus(`❌ ${data.error}`);
        }
      } else {
        // Restore
        const res = await fetch('/api/admin/cars', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantId, isActive: true }),
        });
        const data = await res.json();
        if (res.ok) {
          setActionStatus(`🔄 Restored variant #${variantId}`);
          fetchCars();
        } else {
          setActionStatus(`❌ ${data.error}`);
        }
      }
    } catch {
      setActionStatus('❌ Failed to update variant status.');
    }
  };

  return (
    <div
      style={{
        minHeight: '90vh',
        backgroundColor: '#090d16',
        color: '#f8fafc',
        padding: '2.5rem 1.5rem',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid #1e293b', paddingBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '3px 10px', borderRadius: '9999px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              🛡️ RBAC PROTECTED AREA (ROLE: ADMIN)
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>
              Admin Fleet Management Console
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
              Authenticated as <span style={{ color: '#f8fafc', fontWeight: 600 }}>{session?.user?.name || session?.user?.email}</span> (Role: <span style={{ color: '#f87171', fontWeight: 700 }}>{session?.user?.role}</span>)
            </p>
          </div>
        </div>

        {actionStatus && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: actionStatus.startsWith('✅') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${actionStatus.startsWith('✅') ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              color: '#f8fafc',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
            }}
          >
            {actionStatus}
          </div>
        )}

        {/* Create Variant Card */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#f8fafc' }}>
            ➕ Quick Add New Vehicle Variant (Triggers Auto-Vector Embedding)
          </h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>
                Model
              </label>
              <select
                value={newVariant.modelId}
                onChange={(e) => setNewVariant({ ...newVariant, modelId: Number(e.target.value) })}
                style={{ width: '100%', padding: '0.6rem', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '0.875rem' }}
              >
                <option value={1}>Tata Nexon (Model #1)</option>
                <option value={4}>Mahindra XUV700 (Model #4)</option>
                <option value={7}>Hyundai Creta (Model #7)</option>
                <option value={10}>Toyota Fortuner (Model #10)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>
                Variant Name
              </label>
              <input
                type="text"
                placeholder="e.g. Fearless Plus S"
                value={newVariant.variantName}
                onChange={(e) => setNewVariant({ ...newVariant, variantName: e.target.value })}
                required
                style={{ width: '100%', padding: '0.6rem', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '0.875rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>
                Ex-Showroom Price (INR)
              </label>
              <input
                type="number"
                placeholder="e.g. 1450000"
                value={newVariant.price}
                onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                required
                style={{ width: '100%', padding: '0.6rem', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '0.875rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>
                Fuel Type
              </label>
              <select
                value={newVariant.fuelType}
                onChange={(e) => setNewVariant({ ...newVariant, fuelType: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '0.875rem' }}
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="CNG">CNG</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.3rem' }}>
                Transmission
              </label>
              <select
                value={newVariant.transmission}
                onChange={(e) => setNewVariant({ ...newVariant, transmission: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '0.875rem' }}
              >
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
                <option value="DCT">DCT</option>
                <option value="AMT">AMT</option>
                <option value="CVT">CVT</option>
              </select>
            </div>

            <button
              type="submit"
              style={{
                padding: '0.65rem 1.25rem',
                backgroundColor: '#f43f5e',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.875rem',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Add Variant
            </button>
          </form>
        </div>

        {/* Vehicle Variants Table */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Registered Fleet Variants ({variants.length})</h2>
            <button
              onClick={fetchCars}
              style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              🔄 Refresh List
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading database records...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#020617', borderBottom: '1px solid #1e293b', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Manufacturer & Model</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Variant Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Price (INR)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Powertrain</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Safety</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.variant_id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>#{v.variant_id}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{v.manufacturer_name} {v.model_name}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#38bdf8' }}>{v.variant_name}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>₹{Number(v.ex_showroom_price).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>{v.fuel_type} · {v.transmission}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>⭐ {v.safety_rating_ncap || 'N/A'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: v.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.2)',
                            color: v.is_active ? '#34d399' : '#94a3b8',
                          }}
                        >
                          {v.is_active ? 'Active' : 'Archived'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <button
                          onClick={() => handleToggleArchive(v.variant_id, v.is_active)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #334155',
                            backgroundColor: v.is_active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                            color: v.is_active ? '#f87171' : '#38bdf8',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {v.is_active ? 'Archive' : 'Restore'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
