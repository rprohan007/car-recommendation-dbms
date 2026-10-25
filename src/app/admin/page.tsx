'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Search,
  Filter,
  Car,
  X,
  Clock,
  Sparkles
} from 'lucide-react';
import { formatPrice, formatINR } from '@/lib/formatters';

interface CarVariant {
  variant_id: number;
  variant_name: string;
  model_id: number;
  model_name: string;
  manufacturer_name: string;
  ex_showroom_price: number;
  fuel_type: string;
  transmission: string;
  engine_displacement_cc: number | null;
  power_bhp: number;
  torque_nm: number;
  mileage_kmpl: number;
  safety_rating_ncap: number;
  is_active: boolean;
}

interface CarModel {
  model_id: number;
  manufacturer_name: string;
  model_name: string;
  body_type: string;
  launch_status: string;
  expected_launch_date: string | null;
  seating_capacity: number;
  variant_count?: number;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role?.toUpperCase() === 'ADMIN';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'variants' | 'models'>('variants');

  // Variant CRUD state
  const [variants, setVariants] = useState<CarVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState<boolean>(true);
  const [variantSearch, setVariantSearch] = useState<string>('');

  // Model CRUD state
  const [models, setModels] = useState<CarModel[]>([]);
  const [loadingModels, setLoadingModels] = useState<boolean>(true);

  // Status message
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Variant Form Modal
  const [showAddVariantModal, setShowAddVariantModal] = useState<boolean>(false);
  const [newVariant, setNewVariant] = useState({
    modelId: 1,
    variantName: '',
    price: '',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engineDisplacementCc: '1199',
    powerBhp: '118',
    torqueNm: '170',
    mileageKmpl: '18.0',
    safetyRating: '5.0',
  });

  // Edit Variant Modal
  const [editingVariant, setEditingVariant] = useState<CarVariant | null>(null);

  // Edit Model Launch Date Modal
  const [editingModel, setEditingModel] = useState<CarModel | null>(null);

  // Load variants
  const fetchVariants = async () => {
    setLoadingVariants(true);
    try {
      const res = await fetch('/api/admin/cars?limit=100');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setVariants(data.data);
      }
    } catch (err) {
      console.error('Failed to load variants:', err);
    } finally {
      setLoadingVariants(false);
    }
  };

  // Load models
  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      const res = await fetch('/api/admin/models');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setModels(data.data);
      }
    } catch (err) {
      console.error('Failed to load models:', err);
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    fetchVariants();
    fetchModels();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 5000);
  };

  // Create Variant Handler
  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVariant),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', `Added new variant: ${newVariant.variantName} (Triggered auto-vector embedding)`);
        setShowAddVariantModal(false);
        setNewVariant({
          modelId: 1,
          variantName: '',
          price: '',
          fuelType: 'Petrol',
          transmission: 'Manual',
          engineDisplacementCc: '1199',
          powerBhp: '118',
          torqueNm: '170',
          mileageKmpl: '18.0',
          safetyRating: '5.0',
        });
        fetchVariants();
      } else {
        showNotification('error', data.error || 'Failed to create variant');
      }
    } catch {
      showNotification('error', 'Network error creating variant');
    }
  };

  // Update Variant Handler
  const handleUpdateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;

    try {
      const res = await fetch('/api/admin/cars', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: editingVariant.variant_id,
          variantName: editingVariant.variant_name,
          price: editingVariant.ex_showroom_price,
          fuelType: editingVariant.fuel_type,
          transmission: editingVariant.transmission,
          engineDisplacementCc: editingVariant.engine_displacement_cc,
          powerBhp: editingVariant.power_bhp,
          torqueNm: editingVariant.torque_nm,
          mileageKmpl: editingVariant.mileage_kmpl,
          safetyRating: editingVariant.safety_rating_ncap,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', `Updated variant #${editingVariant.variant_id} successfully`);
        setEditingVariant(null);
        fetchVariants();
      } else {
        showNotification('error', data.error || 'Failed to update variant');
      }
    } catch {
      showNotification('error', 'Network error updating variant');
    }
  };

  // Toggle Archive / Soft Delete Variant
  const handleToggleArchive = async (variant: CarVariant) => {
    try {
      if (variant.is_active) {
        // Soft delete / archive
        const res = await fetch(`/api/admin/cars?id=${variant.variant_id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
          showNotification('success', `Archived variant #${variant.variant_id} (${variant.variant_name})`);
          fetchVariants();
        } else {
          showNotification('error', data.error);
        }
      } else {
        // Restore
        const res = await fetch('/api/admin/cars', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantId: variant.variant_id, isActive: true }),
        });
        const data = await res.json();
        if (res.ok) {
          showNotification('success', `Restored variant #${variant.variant_id}`);
          fetchVariants();
        } else {
          showNotification('error', data.error);
        }
      }
    } catch {
      showNotification('error', 'Error toggling variant status');
    }
  };

  // Permanent Hard Delete Variant
  const handleHardDeleteVariant = async (variantId: number) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete variant #${variantId}? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/cars?id=${variantId}&hard=true`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', `Permanently deleted variant #${variantId}`);
        fetchVariants();
      } else {
        showNotification('error', data.error);
      }
    } catch {
      showNotification('error', 'Error deleting variant');
    }
  };

  // Update Model Launch Date Handler
  const handleUpdateModelLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModel) return;

    try {
      const res = await fetch('/api/admin/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: editingModel.model_id,
          expectedLaunchDate: editingModel.expected_launch_date,
          launchStatus: editingModel.launch_status,
          modelName: editingModel.model_name,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', `Updated model #${editingModel.model_id} (${editingModel.model_name}) launch details`);
        setEditingModel(null);
        fetchModels();
      } else {
        showNotification('error', data.error || 'Failed to update model');
      }
    } catch {
      showNotification('error', 'Error updating model launch schedule');
    }
  };

  // Delete Model Handler
  const handleDeleteModel = async (modelId: number, modelName: string) => {
    if (!confirm(`Are you sure you want to delete/archive model "${modelName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/models?id=${modelId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', `Archived model #${modelId} (${modelName})`);
        fetchModels();
      } else {
        showNotification('error', data.error);
      }
    } catch {
      showNotification('error', 'Error deleting model');
    }
  };

  // Filtered variants
  const filteredVariants = variants.filter(
    (v) =>
      v.variant_name.toLowerCase().includes(variantSearch.toLowerCase()) ||
      v.model_name.toLowerCase().includes(variantSearch.toLowerCase()) ||
      v.manufacturer_name.toLowerCase().includes(variantSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 pb-24">
      {/* Admin Security Banner */}
      <div className="border-b border-rose-950/60 bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 mb-2">
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>ROLE-BASED ACCESS CONTROL &bull; ADMIN PRIVILEGES</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Automotive Fleet & DBMS Management Console
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                Logged in as <strong className="text-slate-200">{session?.user?.name || session?.user?.email || 'Admin User'}</strong> (Role: <span className="text-rose-400 font-bold uppercase">{session?.user?.role || 'ADMIN'}</span>)
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddVariantModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vehicle Variant</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Toast / Alert Message */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl mb-6 text-sm flex items-center justify-between border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-6">
          <button
            onClick={() => setActiveTab('variants')}
            className={`flex items-center gap-2 text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all ${
              activeTab === 'variants'
                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Fleet Variants ({variants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('models')}
            className={`flex items-center gap-2 text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all ${
              activeTab === 'models'
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Upcoming Models & Launch Dates ({models.length})</span>
          </button>
        </div>

        {/* TAB 1: FLEET VARIANTS CRUD */}
        {activeTab === 'variants' && (
          <div className="space-y-6">
            {/* Filter / Search Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by variant, model, brand..."
                  value={variantSearch}
                  onChange={(e) => setVariantSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchVariants}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-2 rounded-xl border border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Refresh Fleet</span>
                </button>
              </div>
            </div>

            {/* Variants Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                      <th className="p-4">ID</th>
                      <th className="p-4">Brand & Model</th>
                      <th className="p-4">Variant Name</th>
                      <th className="p-4">Ex-Showroom Price</th>
                      <th className="p-4">Powertrain</th>
                      <th className="p-4">Safety</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {loadingVariants ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          Loading variants database...
                        </td>
                      </tr>
                    ) : filteredVariants.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          No matching variants found.
                        </td>
                      </tr>
                    ) : (
                      filteredVariants.map((v) => (
                        <tr key={v.variant_id} className="hover:bg-slate-800/30">
                          <td className="p-4 text-slate-500 font-mono">#{v.variant_id}</td>
                          <td className="p-4 font-bold text-white">
                            {v.manufacturer_name} {v.model_name}
                          </td>
                          <td className="p-4 text-sky-400 font-medium">{v.variant_name}</td>
                          <td className="p-4 font-extrabold text-slate-100">
                            {formatPrice(v.ex_showroom_price)}
                          </td>
                          <td className="p-4 text-slate-300">
                            {v.fuel_type} &bull; {v.transmission}
                          </td>
                          <td className="p-4 font-bold text-amber-300">
                            ⭐ {v.safety_rating_ncap || 'N/A'}
                          </td>
                          <td className="p-4">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                v.is_active
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {v.is_active ? 'Active' : 'Archived'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Price & Specs */}
                              <button
                                onClick={() => setEditingVariant({ ...v })}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                title="Edit Pricing & Specifications"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Archive / Restore Toggle */}
                              <button
                                onClick={() => handleToggleArchive(v)}
                                className={`p-1.5 rounded-lg border text-xs ${
                                  v.is_active
                                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                }`}
                                title={v.is_active ? 'Soft Archive' : 'Restore Variant'}
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>

                              {/* Hard Delete */}
                              <button
                                onClick={() => handleHardDeleteVariant(v.variant_id)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                title="Permanently Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: UPCOMING MODELS & LAUNCH DATES MANAGEMENT */}
        {activeTab === 'models' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Car Models & Launch Status Schedule</h3>
                <p className="text-xs text-slate-400">
                  Update expected market launch dates, transition status between upcoming, launched, and discontinued.
                </p>
              </div>
              <button
                onClick={fetchModels}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-2 rounded-xl border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refresh Models</span>
              </button>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                      <th className="p-4">ID</th>
                      <th className="p-4">Manufacturer</th>
                      <th className="p-4">Model Name</th>
                      <th className="p-4">Body Style</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Expected Launch Date</th>
                      <th className="p-4">Seating</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {loadingModels ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          Loading models database...
                        </td>
                      </tr>
                    ) : models.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          No models registered.
                        </td>
                      </tr>
                    ) : (
                      models.map((m) => (
                        <tr key={m.model_id} className="hover:bg-slate-800/30">
                          <td className="p-4 text-slate-500 font-mono">#{m.model_id}</td>
                          <td className="p-4 font-bold text-slate-200">{m.manufacturer_name}</td>
                          <td className="p-4 font-black text-white">{m.model_name}</td>
                          <td className="p-4 text-sky-400 font-medium">{m.body_type}</td>
                          <td className="p-4">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                m.launch_status === 'upcoming'
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                  : m.launch_status === 'launched'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {m.launch_status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-300 font-medium">
                            {m.expected_launch_date ? (
                              <span className="flex items-center gap-1.5 text-indigo-300">
                                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                <span>{m.expected_launch_date}</span>
                              </span>
                            ) : (
                              <span className="text-slate-500">Already Launched</span>
                            )}
                          </td>
                          <td className="p-4 text-slate-300">{m.seating_capacity} Seater</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Launch Date Button */}
                              <button
                                onClick={() => setEditingModel({ ...m })}
                                className="flex items-center gap-1 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1.5 rounded-lg"
                                title="Update Launch Date"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Schedule</span>
                              </button>

                              {/* Archive Model */}
                              <button
                                onClick={() => handleDeleteModel(m.model_id, m.model_name)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                title="Archive Model"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Add New Vehicle Variant */}
      {showAddVariantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setShowAddVariantModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-rose-400 mb-2">
              <Plus className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Fleet Creation Engine</span>
            </div>
            <h2 className="text-xl font-black text-white">Add New Car Variant</h2>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Inserting a new variant triggers automatic 1536-dimensional vector embedding for semantic search.
            </p>

            <form onSubmit={handleCreateVariant} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Parent Model</label>
                  <select
                    value={newVariant.modelId}
                    onChange={(e) => setNewVariant({ ...newVariant, modelId: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
                  >
                    {models.map((m) => (
                      <option key={m.model_id} value={m.model_id}>
                        {m.manufacturer_name} {m.model_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Variant Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Fearless Plus Red Dark Edition"
                    value={newVariant.variantName}
                    onChange={(e) => setNewVariant({ ...newVariant, variantName: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ex-Showroom Price (INR)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1520000"
                    value={newVariant.price}
                    onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fuel Type</label>
                  <select
                    value={newVariant.fuelType}
                    onChange={(e) => setNewVariant({ ...newVariant, fuelType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Transmission</label>
                  <select
                    value={newVariant.transmission}
                    onChange={(e) => setNewVariant({ ...newVariant, transmission: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                    <option value="DCT">DCT</option>
                    <option value="AMT">AMT</option>
                    <option value="CVT">CVT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Engine Displacement (CC)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1199 (null for EV)"
                    value={newVariant.engineDisplacementCc}
                    onChange={(e) => setNewVariant({ ...newVariant, engineDisplacementCc: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Power (BHP)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 118.2"
                    value={newVariant.powerBhp}
                    onChange={(e) => setNewVariant({ ...newVariant, powerBhp: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Torque (Nm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 170"
                    value={newVariant.torqueNm}
                    onChange={(e) => setNewVariant({ ...newVariant, torqueNm: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Economy / Range</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 17.5 kmpl or 465 km"
                    value={newVariant.mileageKmpl}
                    onChange={(e) => setNewVariant({ ...newVariant, mileageKmpl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">NCAP Safety Rating (0-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={newVariant.safetyRating}
                    onChange={(e) => setNewVariant({ ...newVariant, safetyRating: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddVariantModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg"
                >
                  Confirm & Embed Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Existing Variant Price & Specs */}
      {editingVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingVariant(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sky-400 mb-2">
              <Edit2 className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Update Variant Specifications</span>
            </div>
            <h2 className="text-lg font-black text-white">
              Edit Variant #{editingVariant.variant_id}
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              {editingVariant.manufacturer_name} {editingVariant.model_name}
            </p>

            <form onSubmit={handleUpdateVariant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Variant Name</label>
                <input
                  type="text"
                  value={editingVariant.variant_name}
                  onChange={(e) => setEditingVariant({ ...editingVariant, variant_name: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ex-Showroom Price (INR)</label>
                <input
                  type="number"
                  value={editingVariant.ex_showroom_price}
                  onChange={(e) => setEditingVariant({ ...editingVariant, ex_showroom_price: Number(e.target.value) })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fuel</label>
                  <select
                    value={editingVariant.fuel_type}
                    onChange={(e) => setEditingVariant({ ...editingVariant, fuel_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-100"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Transmission</label>
                  <select
                    value={editingVariant.transmission}
                    onChange={(e) => setEditingVariant({ ...editingVariant, transmission: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-100"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                    <option value="DCT">DCT</option>
                    <option value="AMT">AMT</option>
                    <option value="CVT">CVT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Power (BHP)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingVariant.power_bhp}
                    onChange={(e) => setEditingVariant({ ...editingVariant, power_bhp: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Safety Rating (0-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={editingVariant.safety_rating_ncap || 0}
                    onChange={(e) => setEditingVariant({ ...editingVariant, safety_rating_ncap: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingVariant(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Update Model Launch Date & Status */}
      {editingModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingModel(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Model Lifecycle & Launch</span>
            </div>
            <h2 className="text-lg font-black text-white">
              Update Launch Schedule
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              {editingModel.manufacturer_name} {editingModel.model_name} (Model #{editingModel.model_id})
            </p>

            <form onSubmit={handleUpdateModelLaunch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Expected Launch Date</label>
                <input
                  type="date"
                  value={editingModel.expected_launch_date ? editingModel.expected_launch_date.slice(0, 10) : ''}
                  onChange={(e) => setEditingModel({ ...editingModel, expected_launch_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Market Launch Status</label>
                <select
                  value={editingModel.launch_status}
                  onChange={(e) => setEditingModel({ ...editingModel, launch_status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
                >
                  <option value="upcoming">Upcoming (In pipeline)</option>
                  <option value="launched">Launched (In active commercial production)</option>
                  <option value="discontinued">Discontinued (Archived)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingModel(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg"
                >
                  Update Model Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
