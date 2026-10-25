'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Scale,
  Plus,
  Trash2,
  X,
  Star,
  Check,
  AlertCircle,
  HelpCircle,
  Car,
  Fuel,
  Shield,
  Zap,
  Gauge,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  Layers,
  Share2
} from 'lucide-react';
import { formatPrice, formatINR, getStarArray } from '@/lib/formatters';

interface CarSpec {
  variant_id: number;
  variant_name: string;
  model_id: number;
  model_name: string;
  manufacturer_name: string;
  country_origin: string;
  body_type: string;
  seating_capacity: number;
  ex_showroom_price: number;
  fuel_type: string;
  transmission: string;
  engine_displacement_cc: number | null;
  power_bhp: number;
  torque_nm: number;
  mileage_kmpl: number;
  safety_rating_ncap: number;
  standard_features: string[];
  optional_features?: string[];
  features_list?: {
    feature_id: number;
    feature_name: string;
    category: string;
    is_standard: boolean;
  }[];
}

interface DropdownItem {
  variant_id: number;
  variant_name: string;
  model_name: string;
  manufacturer_name: string;
  ex_showroom_price: number;
  fuel_type: string;
  transmission: string;
  body_type: string;
}

const POPULAR_COMPARISONS = [
  { label: 'Compact SUV Battle', ids: [3, 9, 6], desc: 'Tata Nexon Fearless vs Creta SX(O) vs XUV700 AX5' },
  { label: 'EV vs Turbo Petrol', ids: [4, 3, 14], desc: 'Nexon EV vs Nexon DCT vs Verna Turbo' },
  { label: 'Executive 7-Seaters', ids: [7, 12, 15], desc: 'XUV700 AWD vs Fortuner 4x4 vs Innova Hycross' },
];

function CompareMatrixContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Selected variant IDs (up to 3)
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [allVariants, setAllVariants] = useState<DropdownItem[]>([]);
  const [comparedCars, setComparedCars] = useState<CarSpec[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [dbUnavailable, setDbUnavailable] = useState<boolean>(false);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Read initial IDs from query string (?ids=1,2,3)
  useEffect(() => {
    const idsFromQuery = searchParams.get('ids');
    if (idsFromQuery) {
      const parsed = idsFromQuery
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id) && id > 0)
        .slice(0, 3);
      if (parsed.length > 0) {
        setSelectedIds(parsed);
      } else {
        setSelectedIds([3, 9, 6]); // Default fallback trio
      }
    } else {
      setSelectedIds([3, 9, 6]); // Default benchmark comparison
    }
  }, [searchParams]);

  // Fetch dropdown inventory
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch('/api/compare');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setAllVariants(data.data);
        }
      } catch (err) {
        console.error('Failed to load inventory for compare dropdown:', err);
      }
    };
    fetchInventory();
  }, []);

  // Fetch comparison matrix specs whenever selectedIds change
  useEffect(() => {
    if (selectedIds.length === 0) {
      setComparedCars([]);
      setLoading(false);
      return;
    }

    const fetchComparedCars = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/compare?ids=${selectedIds.join(',')}`);
        const data = await res.json();
        if (res.status === 503 || data.code === 'DATABASE_UNAVAILABLE') {
          setDbUnavailable(true);
          setComparedCars([]);
        } else if (data.success && Array.isArray(data.data)) {
          setComparedCars(data.data);
          setDbUnavailable(false);
        } else {
          setComparedCars([]);
        }
      } catch (err) {
        console.error('Failed to load comparison data:', err);
        setDbUnavailable(true);
        setComparedCars([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComparedCars();
  }, [selectedIds]);

  const addVariant = (variantId: number) => {
    if (selectedIds.includes(variantId)) return;
    if (selectedIds.length >= 3) {
      alert('You can compare a maximum of 3 vehicles simultaneously.');
      return;
    }
    const next = [...selectedIds, variantId];
    setSelectedIds(next);
    router.replace(`/compare?ids=${next.join(',')}`);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const removeVariant = (variantId: number) => {
    const next = selectedIds.filter((id) => id !== variantId);
    setSelectedIds(next);
    router.replace(next.length > 0 ? `/compare?ids=${next.join(',')}` : '/compare');
  };

  const selectPreset = (ids: number[]) => {
    setSelectedIds(ids);
    router.replace(`/compare?ids=${ids.join(',')}`);
  };

  // Find best-in-class values for visual highlight
  const maxPower = Math.max(...comparedCars.map((c) => Number(c.power_bhp) || 0));
  const maxMileage = Math.max(...comparedCars.map((c) => Number(c.mileage_kmpl) || 0));
  const maxSafety = Math.max(...comparedCars.map((c) => Number(c.safety_rating_ncap) || 0));
  const minPrice = Math.min(...comparedCars.map((c) => Number(c.ex_showroom_price) || Infinity));

  // Collect all unique standard features across compared cars
  const allFeaturesSet = Array.from(
    new Set(comparedCars.flatMap((c) => c.standard_features || []))
  ).sort();

  const filteredDropdownList = allVariants.filter(
    (v) =>
      !selectedIds.includes(v.variant_id) &&
      `${v.manufacturer_name} ${v.model_name} ${v.variant_name} ${v.fuel_type}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 pb-24">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/60 py-8 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Portal</span>
                </Link>
                <span className="text-slate-600">/</span>
                <span className="text-xs text-slate-400 font-medium">Side-by-Side Matrix</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                <Scale className="w-8 h-8 text-sky-400" />
                <span>Vehicle Comparison Matrix</span>
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Detailed multi-attribute technical audit. Compare powertrain, engine CC, NCAP safety stars, and features list side-by-side.
              </p>
            </div>

            {/* Quick Presets and Share Button */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">Presets:</span>
              {POPULAR_COMPARISONS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => selectPreset(p.ids)}
                  className="text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                >
                  {p.label}
                </button>
              ))}

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-sky-400 hover:text-sky-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors shadow-sm ml-1"
                title="Copy shareable comparison link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copied!' : 'Share Matrix'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Database Offline Warning */}
        {dbUnavailable && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>PostgreSQL Database Offline (Fail-Closed Enforcement). Start PostgreSQL to query the live multi-attribute comparison matrix.</span>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                fetch(`/api/compare?ids=${selectedIds.join(',')}`)
                  .then(r => r.json())
                  .then(d => { if (d.success) { setComparedCars(d.data); setDbUnavailable(false); } })
                  .finally(() => setLoading(false));
              }}
              className="text-slate-900 bg-amber-400 hover:bg-amber-300 font-bold px-3 py-1 rounded-lg shrink-0 transition"
            >
              Retry
            </button>
          </div>
        )}
        {/* Selection Bar & Multi-Select Dropdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 mb-8 backdrop-blur-xl shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Active Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Selected ({selectedIds.length}/3):
              </span>
              {comparedCars.map((c) => (
                <span
                  key={c.variant_id}
                  className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 text-sky-300 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm"
                >
                  <span>{c.manufacturer_name} {c.model_name} &bull; {c.variant_name}</span>
                  <button
                    onClick={() => removeVariant(c.variant_id)}
                    className="hover:text-rose-400 p-0.5"
                    title="Remove from comparison"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}

              {selectedIds.length === 0 && (
                <span className="text-xs text-slate-500 italic">No vehicles staged. Pick up to 3 cars below.</span>
              )}
            </div>

            {/* Dropdown Selector Button */}
            <div className="relative w-full md:w-auto">
              {selectedIds.length < 3 ? (
                <div>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full md:w-auto flex items-center justify-between gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Vehicle to Compare ({3 - selectedIds.length} remaining)</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl z-50 p-3 max-h-96 overflow-hidden flex flex-col">
                      <div className="mb-2">
                        <input
                          type="text"
                          placeholder="Search variant name or manufacturer..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          autoFocus
                        />
                      </div>

                      <div className="overflow-y-auto space-y-1.5 divide-y divide-slate-800/60 pr-1">
                        {filteredDropdownList.length === 0 ? (
                          <div className="text-center py-4 text-xs text-slate-500">
                            No matching variants found.
                          </div>
                        ) : (
                          filteredDropdownList.map((item) => (
                            <button
                              key={item.variant_id}
                              onClick={() => addVariant(item.variant_id)}
                              className="w-full text-left p-2 hover:bg-slate-900/90 rounded-lg transition-colors flex items-center justify-between gap-2"
                            >
                              <div>
                                <div className="text-xs font-bold text-white">
                                  {item.manufacturer_name} {item.model_name}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {item.variant_name} &bull; {item.fuel_type} {item.transmission}
                                </div>
                              </div>
                              <span className="text-xs font-extrabold text-sky-400 shrink-0">
                                {formatPrice(item.ex_showroom_price)}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
                  Maximum 3 cars compared
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center animate-pulse">
            <Scale className="w-10 h-10 text-sky-400 mx-auto mb-3 animate-spin" />
            <h3 className="text-base font-bold text-white">Synthesizing Comparative Matrix...</h3>
            <p className="text-xs text-slate-400 mt-1">Aggregating specs and standard feature arrays</p>
          </div>
        ) : comparedCars.length === 0 ? (
          /* Empty Matrix State */
          <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 mb-4">
              <Scale className="w-8 h-8 text-sky-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Cars Selected for Comparison</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Select up to 3 cars using the selector above or pick one of our curated automotive showdowns below.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {POPULAR_COMPARISONS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => selectPreset(p.ids)}
                  className="w-full sm:w-auto text-xs font-bold bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 px-4 py-2.5 rounded-xl transition-colors"
                >
                  Load {p.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Comparative Table View */
          <div className="space-y-8">
            {/* Horizontal Scrollable Table Container */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/90">
                      <th className="p-4 sm:p-5 w-1/4 min-w-[200px] text-xs font-bold uppercase tracking-wider text-slate-400">
                        Specification Matrix
                      </th>
                      {comparedCars.map((car) => (
                        <th
                          key={car.variant_id}
                          className="p-4 sm:p-5 w-1/4 min-w-[240px] border-l border-slate-800 relative bg-slate-950/60"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider bg-sky-500/10 px-2 py-0.5 rounded">
                                {car.manufacturer_name}
                              </span>
                              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                                {car.model_name}
                              </h3>
                              <div className="text-xs text-slate-400">{car.variant_name}</div>
                            </div>
                            <button
                              onClick={() => removeVariant(car.variant_id)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="mt-3 flex items-baseline gap-1">
                            <span className="text-xl sm:text-2xl font-black text-white">
                              {formatPrice(car.ex_showroom_price)}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/80 text-xs sm:text-sm">
                    {/* Price & Value Row */}
                    <tr className="hover:bg-slate-800/20">
                      <td className="p-4 font-semibold text-slate-400 flex items-center gap-2">
                        <span>Ex-Showroom Price</span>
                      </td>
                      {comparedCars.map((car) => {
                        const isLowest = car.ex_showroom_price === minPrice;
                        return (
                          <td key={car.variant_id} className="p-4 border-l border-slate-800">
                            <div className="font-bold text-slate-100">{formatPrice(car.ex_showroom_price)}</div>
                            <div className="text-[11px] text-slate-500">{formatINR(car.ex_showroom_price)}</div>
                            {isLowest && comparedCars.length > 1 && (
                              <span className="inline-block mt-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                Lowest Price
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Safety Rating Row */}
                    <tr className="hover:bg-slate-800/20 bg-slate-950/30">
                      <td className="p-4 font-semibold text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-amber-400" />
                          <span>Global NCAP Safety</span>
                        </div>
                      </td>
                      {comparedCars.map((car) => {
                        const isTopSafety = car.safety_rating_ncap === maxSafety && maxSafety > 0;
                        return (
                          <td key={car.variant_id} className="p-4 border-l border-slate-800">
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center text-amber-400">
                                {getStarArray(car.safety_rating_ncap).map((star, idx) => (
                                  <Star
                                    key={idx}
                                    className={`w-3.5 h-3.5 ${
                                      star.filled ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-black text-amber-300">
                                {car.safety_rating_ncap ? `${car.safety_rating_ncap} Stars` : 'Unrated'}
                              </span>
                            </div>
                            {isTopSafety && car.safety_rating_ncap === 5 && (
                              <span className="inline-block mt-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                Maximum 5-Star Safety
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Powertrain & Transmission */}
                    <tr className="hover:bg-slate-800/20">
                      <td className="p-4 font-semibold text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Fuel className="w-4 h-4 text-sky-400" />
                          <span>Fuel & Transmission</span>
                        </div>
                      </td>
                      {comparedCars.map((car) => (
                        <td key={car.variant_id} className="p-4 border-l border-slate-800 font-medium">
                          <span className="text-white font-bold">{car.fuel_type}</span> &bull; {car.transmission}
                        </td>
                      ))}
                    </tr>

                    {/* Engine CC */}
                    <tr className="hover:bg-slate-800/20 bg-slate-950/30">
                      <td className="p-4 font-semibold text-slate-400">Engine Displacement</td>
                      {comparedCars.map((car) => (
                        <td key={car.variant_id} className="p-4 border-l border-slate-800">
                          {car.engine_displacement_cc ? (
                            <span className="font-bold text-slate-200">{car.engine_displacement_cc} cc</span>
                          ) : (
                            <span className="text-sky-400 font-bold">Pure Electric (No ICE CC)</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Power BHP */}
                    <tr className="hover:bg-slate-800/20">
                      <td className="p-4 font-semibold text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          <span>Max Power (BHP)</span>
                        </div>
                      </td>
                      {comparedCars.map((car) => {
                        const isMax = Number(car.power_bhp) === maxPower && comparedCars.length > 1;
                        return (
                          <td key={car.variant_id} className="p-4 border-l border-slate-800">
                            <span className="font-bold text-slate-100">{car.power_bhp} bhp</span>
                            {isMax && (
                              <span className="ml-2 text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">
                                Highest Power
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Torque Nm */}
                    <tr className="hover:bg-slate-800/20 bg-slate-950/30">
                      <td className="p-4 font-semibold text-slate-400">Max Torque (Nm)</td>
                      {comparedCars.map((car) => (
                        <td key={car.variant_id} className="p-4 border-l border-slate-800 font-bold text-slate-100">
                          {car.torque_nm} Nm
                        </td>
                      ))}
                    </tr>

                    {/* Mileage / Range */}
                    <tr className="hover:bg-slate-800/20">
                      <td className="p-4 font-semibold text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Gauge className="w-4 h-4 text-emerald-400" />
                          <span>Fuel Economy / Range</span>
                        </div>
                      </td>
                      {comparedCars.map((car) => {
                        const isElectric = car.fuel_type === 'Electric';
                        return (
                          <td key={car.variant_id} className="p-4 border-l border-slate-800 font-bold text-sky-400">
                            {isElectric ? `${car.mileage_kmpl} km / charge` : `${car.mileage_kmpl} kmpl`}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Body Style & Seating */}
                    <tr className="hover:bg-slate-800/20 bg-slate-950/30">
                      <td className="p-4 font-semibold text-slate-400">Body Style & Seating</td>
                      {comparedCars.map((car) => (
                        <td key={car.variant_id} className="p-4 border-l border-slate-800 text-slate-200">
                          {car.body_type} &bull; <strong className="text-white">{car.seating_capacity} Seater</strong>
                        </td>
                      ))}
                    </tr>

                    {/* Country of Origin */}
                    <tr className="hover:bg-slate-800/20">
                      <td className="p-4 font-semibold text-slate-400">Country of Origin</td>
                      {comparedCars.map((car) => (
                        <td key={car.variant_id} className="p-4 border-l border-slate-800 text-slate-300">
                          {car.country_origin}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Standard Features Side-by-Side Breakdown */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-400" />
                  <span>Standard & Flagship Features Audit</span>
                </h3>
                <span className="text-xs text-slate-400">Green check indicates standard inclusion</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60">
                      <th className="p-3 font-semibold text-slate-400 w-1/4">Feature Name</th>
                      {comparedCars.map((c) => (
                        <th key={c.variant_id} className="p-3 font-bold text-slate-200 w-1/4 border-l border-slate-800">
                          {c.model_name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {allFeaturesSet.map((featureName, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="p-3 font-medium text-slate-300">{featureName}</td>
                        {comparedCars.map((c) => {
                          const hasFeature = c.standard_features?.includes(featureName);
                          return (
                            <td key={c.variant_id} className="p-3 border-l border-slate-800">
                              {hasFeature ? (
                                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                                  <Check className="w-4 h-4 text-emerald-400" />
                                  <span>Standard</span>
                                </span>
                              ) : (
                                <span className="text-slate-600 text-xs">&mdash;</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompareMatrixPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400">
          <Scale className="w-8 h-8 text-sky-400 animate-spin mr-3" />
          <span>Loading comparison matrix...</span>
        </div>
      }
    >
      <CompareMatrixContent />
    </Suspense>
  );
}
