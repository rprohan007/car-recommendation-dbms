'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Search,
  RotateCcw,
  SlidersHorizontal,
  Fuel,
  Shield,
  Gauge,
  Zap,
  Car,
  ChevronDown,
  Scale,
  Check,
  Star,
  Info,
  Layers,
  ArrowRight,
  Calculator,
  X,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { formatPrice, formatINR, getStarArray } from '@/lib/formatters';

interface CarResult {
  variant_id: number;
  variant_name: string;
  model_id: number;
  model_name: string;
  manufacturer_name: string;
  body_type: string;
  ex_showroom_price: number;
  fuel_type: string;
  transmission: string;
  engine_displacement_cc: number | null;
  power_bhp: number;
  torque_nm: number;
  mileage_kmpl: number;
  safety_rating_ncap: number;
  seating_capacity: number;
  standard_features: string[];
  similarity_score?: number;
  combined_relevance_score?: number;
}

const SAMPLE_PROMPTS = [
  'Family-friendly electric SUV with high safety and sunroof',
  '5-star safe compact SUV with automatic transmission under 15 Lakh',
  'Punchy turbo petrol sedan with Level 2 ADAS and paddle shifters',
  'Fuel-efficient 7-seater hybrid for long highway family road trips',
  'Rugged 4x4 off-roader with high ground clearance and diesel torque',
];

export default function RecommendationPortal() {
  const router = useRouter();

  // Filters state
  const [prompt, setPrompt] = useState('Family-friendly electric SUV with high safety and sunroof');
  const [minPrice, setMinPrice] = useState<number>(600000);
  const [maxPrice, setMaxPrice] = useState<number>(4000000);
  const [fuelType, setFuelType] = useState<string>('all');
  const [transmission, setTransmission] = useState<string>('all');
  const [bodyType, setBodyType] = useState<string>('all');
  const [minSafety, setMinSafety] = useState<number>(0);

  // Selected cars for quick comparison
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);

  // Results & Loading
  const [cars, setCars] = useState<CarResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Maintain backward-compatible aliases
  const loading = isLoading;
  const setLoading = setIsLoading;

  const [isPending, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(true);

  // Database Connection & Diagnostic State
  const [dbUnavailable, setDbUnavailable] = useState<boolean>(false);
  const [demoMode, setDemoMode] = useState<boolean>(false);

  // Active Car for Specs & EMI Calculator Modal
  const [activeModalCar, setActiveModalCar] = useState<CarResult | null>(null);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenureMonths, setTenureMonths] = useState<number>(60);

  const fetchRecommendations = async (overrideDemo = demoMode) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload: any = {
        prompt: prompt.trim(),
        minPrice,
        maxPrice,
      };

      if (fuelType !== 'all') payload.fuelType = fuelType;
      if (transmission !== 'all') payload.transmission = transmission;
      if (bodyType !== 'all') payload.bodyType = bodyType;
      if (minSafety > 0) payload.minSafety = minSafety;

      const endpoint = overrideDemo ? '/api/recommend?demo=true' : '/api/recommend';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson.error || errJson.message || `API error occurred (HTTP ${res.status})`;
        setError(errMsg);
        if (res.status === 503 || errJson.code === 'DATABASE_UNAVAILABLE') {
          setDbUnavailable(true);
        }
        setCars([]);
        return;
      }

      const data = await res.json();
      if (data.code === 'DATABASE_UNAVAILABLE') {
        setDbUnavailable(true);
        setError(data.error || 'Live PostgreSQL database is unreachable.');
        setCars([]);
      } else if (data.success && Array.isArray(data.data)) {
        setCars(data.data);
        setDbUnavailable(false);
        setError(null);
      } else {
        setCars([]);
        if (data.error) {
          setError(data.error);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch recommendations:', err);
      const message = err?.message || 'Failed to communicate with recommendation engine. Please check network/database connectivity.';
      setError(message);
      setDbUnavailable(true);
      setCars([]);
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  };

  // Initial load
  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecommendations();
  };

  const handleResetFilters = () => {
    setPrompt('');
    setMinPrice(500000);
    setMaxPrice(5500000);
    setFuelType('all');
    setTransmission('all');
    setBodyType('all');
    setMinSafety(0);
    setTimeout(() => {
      fetchRecommendations();
    }, 50);
  };

  const toggleCompare = (variantId: number) => {
    if (selectedForCompare.includes(variantId)) {
      setSelectedForCompare(selectedForCompare.filter((id) => id !== variantId));
    } else {
      if (selectedForCompare.length >= 3) {
        alert('You can compare a maximum of 3 vehicles simultaneously.');
        return;
      }
      setSelectedForCompare([...selectedForCompare, variantId]);
    }
  };

  const navigateToCompare = () => {
    if (selectedForCompare.length === 0) return;
    router.push(`/compare?ids=${selectedForCompare.join(',')}`);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 via-[#090d16] to-[#090d16] py-10 sm:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-3 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Next-Gen Hybrid Vector + Multi-Attribute SQL Matching</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                Intelligent Car <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-sky-200 bg-clip-text text-transparent">Recommendation</span> Portal
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
                Describe your dream vehicle in plain English or fine-tune multi-table database constraints. Our engine balances 1536-D semantic similarity with Global NCAP safety metrics.
              </p>
            </div>

            {/* Quick Stats or Compare Drawer Banner */}
            {selectedForCompare.length > 0 && (
              <div className="flex items-center gap-3 bg-sky-950/60 border border-sky-500/40 px-4 py-2.5 rounded-xl backdrop-blur-md shadow-lg shadow-sky-950/50">
                <div className="text-xs">
                  <span className="font-bold text-sky-300">{selectedForCompare.length}/3</span> cars staged for comparison
                </div>
                <button
                  onClick={navigateToCompare}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md transition-all"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Compare Now</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Database Offline Fail-Closed Notification Banner */}
        {dbUnavailable && !demoMode && (
          <div className="mb-8 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl backdrop-blur-md animate-in fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-300">Live PostgreSQL Database Offline (Fail-Closed Enforcement)</h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                    Per the university evaluation security requirements, the application refuses to mask database connection failures behind silent unauthenticated mock responses. To query the live database, run PostgreSQL and execute <code className="text-amber-300 font-mono">database/01_schema.sql</code> through <code className="text-amber-300 font-mono">04_seed.sql</code>. Alternatively, launch the offline demo dataset below to evaluate UI filtering and scoring.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                <button
                  onClick={() => {
                    setDemoMode(true);
                    fetchRecommendations(true);
                  }}
                  className="text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2.5 rounded-xl transition shadow-md shadow-amber-950/30"
                >
                  Load Demo Dataset
                </button>
                <button
                  onClick={() => fetchRecommendations(false)}
                  className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 rounded-xl transition border border-slate-700"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Error State Warning Banner */}
        {error && !dbUnavailable && (
          <div className="mb-8 p-4 sm:p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl backdrop-blur-md animate-in fade-in flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-300">Recommendation Query Notice</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{error}</p>
              </div>
            </div>
            <button
              onClick={() => fetchRecommendations(false)}
              className="text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 px-4 py-2 rounded-xl transition shrink-0 self-end sm:self-center"
            >
              Retry Search
            </button>
          </div>
        )}

        {/* Demo Mode Notice Badge */}
        {demoMode && (
          <div className="mb-6 flex items-center justify-between p-3.5 bg-sky-950/40 border border-sky-500/30 rounded-xl text-xs backdrop-blur-md">
            <span className="text-sky-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Viewing Evaluation Demo Dataset (PostgreSQL Mock Stream)</span>
            </span>
            <button
              onClick={() => {
                setDemoMode(false);
                fetchRecommendations(false);
              }}
              className="text-slate-400 hover:text-white underline text-[11px]"
            >
              Switch to Live PostgreSQL
            </button>
          </div>
        )}

        {/* Search & Filter Panel */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-7 backdrop-blur-xl shadow-2xl mb-10">
          <form onSubmit={handleSearchSubmit} className="space-y-6">
            {/* Natural Language Prompt Area */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="semantic-prompt" className="flex items-center gap-2 text-sm font-bold text-slate-200">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Natural Language Search Prompt (Vector Similarity)</span>
                </label>
                <span className="text-xs text-slate-400">pgvector cosine match (70% weight)</span>
              </div>
              <div className="relative">
                <textarea
                  id="semantic-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={2}
                  placeholder='e.g. "Family-friendly electric SUV with panoramic sunroof, 5-star safety, and ventilated seats"'
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3.5 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all shadow-inner"
                />
              </div>

              {/* Sample Prompt Chips */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-400 font-medium">Try asking:</span>
                {SAMPLE_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(p);
                      // Trigger search immediately
                      setTimeout(() => {
                        fetchRecommendations();
                      }, 50);
                    }}
                    className="text-xs bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700/60 transition-colors text-left"
                  >
                    &ldquo;{p}&rdquo;
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Toggle and Budget Sliders */}
            <div className="pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white"
                >
                  <SlidersHorizontal className="w-4 h-4 text-sky-400" />
                  <span>SQL Attribute Constraints & Sliders</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </button>
                <div className="text-xs text-sky-400 font-semibold">
                  Budget: {formatPrice(minPrice)} &mdash; {formatPrice(maxPrice)}
                </div>
              </div>

              {showAdvancedFilters && (
                <div className="space-y-6">
                  {/* Budget Dual Sliders */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
                    <div>
                      <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                        <span>Minimum Budget</span>
                        <span className="font-bold text-sky-400">{formatPrice(minPrice)}</span>
                      </div>
                      <input
                        type="range"
                        min="500000"
                        max="3000000"
                        step="50000"
                        value={minPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val <= maxPrice) setMinPrice(val);
                        }}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>₹5 Lakh</span>
                        <span>₹15 Lakh</span>
                        <span>₹30 Lakh</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                        <span>Maximum Budget</span>
                        <span className="font-bold text-sky-400">{formatPrice(maxPrice)}</span>
                      </div>
                      <input
                        type="range"
                        min="1000000"
                        max="6000000"
                        step="100000"
                        value={maxPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val >= minPrice) setMaxPrice(val);
                        }}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>₹10 Lakh</span>
                        <span>₹35 Lakh</span>
                        <span>₹60 Lakh</span>
                      </div>
                    </div>
                  </div>

                  {/* Dropdowns Row: Fuel, Transmission, Vehicle Type, Safety */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Fuel Type */}
                    <div>
                      <label htmlFor="fuel-type-select" className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Fuel Type
                      </label>
                      <select
                        id="fuel-type-select"
                        value={fuelType}
                        onChange={(e) => setFuelType(e.target.value)}
                        className="w-full bg-slate-950/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      >
                        <option value="all">All Powertrains</option>
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Electric">Electric (EV)</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="CNG">CNG</option>
                      </select>
                    </div>

                    {/* Transmission */}
                    <div>
                      <label htmlFor="transmission-select" className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Transmission
                      </label>
                      <select
                        id="transmission-select"
                        value={transmission}
                        onChange={(e) => setTransmission(e.target.value)}
                        className="w-full bg-slate-950/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      >
                        <option value="all">All Transmissions</option>
                        <option value="Manual">Manual</option>
                        <option value="Automatic">Automatic (Torque Conv.)</option>
                        <option value="DCT">DCT / DCA (Dual Clutch)</option>
                        <option value="CVT">CVT / e-CVT</option>
                        <option value="AMT">AMT</option>
                      </select>
                    </div>

                    {/* Vehicle Type / Body Style */}
                    <div>
                      <label htmlFor="body-type-select" className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Body Style
                      </label>
                      <select
                        id="body-type-select"
                        value={bodyType}
                        onChange={(e) => setBodyType(e.target.value)}
                        className="w-full bg-slate-950/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      >
                        <option value="all">All Body Styles</option>
                        <option value="SUV">SUV</option>
                        <option value="Sedan">Sedan</option>
                        <option value="Hatchback">Hatchback</option>
                        <option value="MUV">MUV / MPV</option>
                        <option value="Coupe">Coupe</option>
                      </select>
                    </div>

                    {/* Safety Rating Threshold */}
                    <div>
                      <label htmlFor="safety-threshold-select" className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Global NCAP Safety Rating
                      </label>
                      <select
                        id="safety-threshold-select"
                        value={minSafety}
                        onChange={(e) => setMinSafety(Number(e.target.value))}
                        className="w-full bg-slate-950/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      >
                        <option value={0}>Any Safety Rating</option>
                        <option value={3.0}>⭐ 3.0+ Stars</option>
                        <option value={4.0}>⭐⭐ 4.0+ Stars</option>
                        <option value={5.0}>⭐⭐⭐ 5.0 Stars (Maximum)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                <span>{loading ? 'Executing Hybrid Query...' : 'Find Matches'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Recommended Vehicles</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {cars.length} Found
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Ranked by: <span className="text-slate-300 font-medium">Cosine Distance (70%) + Safety Rating (30%)</span>
            </p>
          </div>

          {/* Loading Skeletons */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-800 rounded w-24" />
                      <div className="h-6 bg-slate-700 rounded w-44" />
                    </div>
                    <div className="h-6 bg-slate-800 rounded-full w-20" />
                  </div>
                  <div className="h-8 bg-slate-800/80 rounded w-32" />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-10 bg-slate-800/50 rounded" />
                    <div className="h-10 bg-slate-800/50 rounded" />
                    <div className="h-10 bg-slate-800/50 rounded" />
                  </div>
                  <div className="h-12 bg-slate-800/40 rounded" />
                </div>
              ))}
            </div>
          ) : cars.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-8 max-w-xl mx-auto">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 mb-4">
                <Car className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Matching Vehicles Found</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                We couldn&apos;t find cars matching your specific filter criteria and budget combination. Try broadening your budget range, changing fuel preferences, or adjusting safety stars.
              </p>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 bg-sky-400 hover:bg-sky-300 px-4 py-2.5 rounded-lg transition-colors shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters to Default</span>
              </button>
            </div>
          ) : (
            /* Cars Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map((car) => {
                const isSelected = selectedForCompare.includes(car.variant_id);
                const relevancePercent = car.combined_relevance_score
                  ? Math.round(Number(car.combined_relevance_score) * 100)
                  : 85;

                return (
                  <div
                    key={car.variant_id}
                    className="group relative bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between shadow-xl hover:shadow-sky-500/10 backdrop-blur-md"
                  >
                    <div>
                      {/* Top Row: Manufacturer Badge + Match Score Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 rounded-md">
                            {car.manufacturer_name}
                          </span>
                          <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md">
                            {car.body_type}
                          </span>
                        </div>

                        {/* Match Score Badge */}
                        <div
                          className="flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500/15 to-teal-500/20 text-emerald-300 border border-emerald-500/30"
                          title={`Similarity: ${car.similarity_score || 0.85} | Combined: ${car.combined_relevance_score || 0.88}`}
                        >
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>{relevancePercent}% Match</span>
                        </div>
                      </div>

                      {/* Model & Variant Name */}
                      <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                        {car.model_name}{' '}
                        <span className="text-sm font-normal text-slate-400 block sm:inline">
                          {car.variant_name}
                        </span>
                      </h3>

                      {/* Price Header */}
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-black tracking-tight text-white">
                          {formatPrice(car.ex_showroom_price)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">Ex-Showroom</span>
                      </div>

                      {/* Safety Rating Stars */}
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex items-center text-amber-400">
                          {getStarArray(car.safety_rating_ncap).map((star, idx) => (
                            <Star
                              key={idx}
                              className={`w-3.5 h-3.5 ${
                                star.filled
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-amber-300">
                          {car.safety_rating_ncap ? `${car.safety_rating_ncap} Star Global NCAP` : 'Unrated'}
                        </span>
                      </div>

                      {/* Key Specification Matrix */}
                      <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-center">
                        <div className="p-1">
                          <span className="text-[10px] text-slate-400 block font-medium">Powertrain</span>
                          <span className="text-xs font-bold text-slate-200">
                            {car.fuel_type}
                          </span>
                        </div>
                        <div className="p-1 border-x border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-medium">Transmission</span>
                          <span className="text-xs font-bold text-slate-200">
                            {car.transmission}
                          </span>
                        </div>
                        <div className="p-1">
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {car.fuel_type === 'Electric' ? 'Range' : 'Economy'}
                          </span>
                          <span className="text-xs font-bold text-sky-400">
                            {car.fuel_type === 'Electric'
                              ? `${car.mileage_kmpl} km`
                              : `${car.mileage_kmpl} kmpl`}
                          </span>
                        </div>
                      </div>

                      {/* Performance Specs */}
                      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 px-1">
                        <span>
                          Power:{' '}
                          <strong className="text-slate-200">{car.power_bhp} bhp</strong>
                        </span>
                        <span>
                          Torque:{' '}
                          <strong className="text-slate-200">{car.torque_nm} Nm</strong>
                        </span>
                        {car.engine_displacement_cc && (
                          <span>
                            Displ:{' '}
                            <strong className="text-slate-200">{car.engine_displacement_cc} cc</strong>
                          </span>
                        )}
                      </div>

                      {/* Standard Features Tags Preview */}
                      {car.standard_features && car.standard_features.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-800/60">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                            Standard Features Highlights
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {car.standard_features.slice(0, 3).map((feat, fIdx) => (
                              <span
                                key={fIdx}
                                className="text-[11px] bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded border border-slate-700/50"
                              >
                                {feat}
                              </span>
                            ))}
                            {car.standard_features.length > 3 && (
                              <span className="text-[11px] text-sky-400 font-semibold px-1 py-0.5">
                                +{car.standard_features.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-2">
                      <button
                        onClick={() => toggleCompare(car.variant_id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 px-3 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                            : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-slate-700'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Staged for Compare</span>
                          </>
                        ) : (
                          <>
                            <Scale className="w-3.5 h-3.5 text-sky-400" />
                            <span>Add to Compare</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setActiveModalCar(car)}
                        className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-sky-400 hover:text-sky-300 border border-slate-700 transition-colors"
                        title="View Full Specs & EMI Loan Calculator"
                      >
                        <Calculator className="w-4 h-4" />
                      </button>

                      <Link
                        href={`/compare?ids=${car.variant_id}`}
                        className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                        title="View Full Spec Matrix"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Comparison Tray if cars are selected */}
      {selectedForCompare.length > 0 && (
        <aside aria-label="Selected cars comparison tray" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl bg-slate-950/95 border border-sky-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
              {selectedForCompare.length}
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                {selectedForCompare.length} of 3 Vehicles Staged
              </div>
              <div className="text-[11px] text-slate-400">
                Ready for side-by-side spec comparison
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedForCompare([])}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5"
            >
              Clear
            </button>
            <button
              onClick={navigateToCompare}
              className="flex items-center gap-1.5 bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 text-xs font-extrabold px-4 py-2 rounded-xl shadow-lg transition-all"
            >
              <Scale className="w-4 h-4" />
              <span>Launch Matrix ({selectedForCompare.length})</span>
            </button>
          </div>
        </aside>
      )}
      {/* Specs & Interactive EMI Calculator Modal */}
      {activeModalCar && (() => {
        const exPrice = activeModalCar.ex_showroom_price;
        const downPaymentAmount = Math.round((exPrice * downPaymentPercent) / 100);
        const principal = exPrice - downPaymentAmount;
        const monthlyRate = interestRate / 12 / 100;
        const emi = monthlyRate > 0
          ? Math.round(
              (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
                (Math.pow(1 + monthlyRate, tenureMonths) - 1)
            )
          : Math.round(principal / tenureMonths);
        const totalAmountPayable = emi * tenureMonths;
        const totalInterest = totalAmountPayable - principal;
        const isSelected = selectedForCompare.includes(activeModalCar.variant_id);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#0b101b] border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8">
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                      {activeModalCar.manufacturer_name}
                    </span>
                    <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {activeModalCar.body_type}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {activeModalCar.model_name} <span className="text-sky-300 font-semibold">{activeModalCar.variant_name}</span>
                  </h2>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-white">
                      {formatPrice(activeModalCar.ex_showroom_price)}
                    </span>
                    <span className="text-xs text-slate-400">Ex-Showroom Price</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModalCar(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Technical Specifications Matrix */}
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Vehicle Engineering Specifications
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Fuel / Powertrain</span>
                    <span className="text-xs font-bold text-white">{activeModalCar.fuel_type}</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Transmission</span>
                    <span className="text-xs font-bold text-white">{activeModalCar.transmission}</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Power Output</span>
                    <span className="text-xs font-bold text-white">{activeModalCar.power_bhp} bhp</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Peak Torque</span>
                    <span className="text-xs font-bold text-white">{activeModalCar.torque_nm} Nm</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Economy / Range</span>
                    <span className="text-xs font-bold text-sky-400">
                      {activeModalCar.fuel_type === 'Electric' ? `${activeModalCar.mileage_kmpl} km` : `${activeModalCar.mileage_kmpl} kmpl`}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Displacement</span>
                    <span className="text-xs font-bold text-white">
                      {activeModalCar.engine_displacement_cc ? `${activeModalCar.engine_displacement_cc} cc` : 'N/A (EV)'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Safety Rating</span>
                    <span className="text-xs font-bold text-amber-400">
                      {activeModalCar.safety_rating_ncap} Star NCAP
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Seating Capacity</span>
                    <span className="text-xs font-bold text-white">{activeModalCar.seating_capacity || 5} Seater</span>
                  </div>
                </div>
              </div>

              {/* Standard Features */}
              {activeModalCar.standard_features && activeModalCar.standard_features.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    Included Equipment & Features
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {activeModalCar.standard_features.map((feat, idx) => (
                      <span key={idx} className="text-xs bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700/60">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Loan & EMI Calculator */}
              <div className="mt-6 p-5 bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/30 rounded-2xl border border-sky-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    Automotive Financing & Monthly EMI Planner
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Slider Controls */}
                  <div className="md:col-span-2 space-y-4">
                    {/* Down Payment */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Down Payment ({downPaymentPercent}%)</span>
                        <span className="font-bold text-white">{formatINR(downPaymentAmount)}</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={50}
                        step={5}
                        value={downPaymentPercent}
                        onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                        className="w-full accent-sky-400"
                      />
                    </div>

                    {/* Interest Rate */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Interest Rate (Annual)</span>
                        <span className="font-bold text-white">{interestRate}% p.a.</span>
                      </div>
                      <input
                        type="range"
                        min={7.0}
                        max={14.0}
                        step={0.25}
                        value={interestRate}
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                        className="w-full accent-sky-400"
                      />
                    </div>

                    {/* Loan Tenure */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Loan Tenure</span>
                        <span className="font-bold text-white">{tenureMonths} Months ({tenureMonths / 12} Yrs)</span>
                      </div>
                      <input
                        type="range"
                        min={12}
                        max={84}
                        step={12}
                        value={tenureMonths}
                        onChange={(e) => setTenureMonths(Number(e.target.value))}
                        className="w-full accent-sky-400"
                      />
                    </div>
                  </div>

                  {/* Calculated Output Summary */}
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 font-semibold block">Estimated Monthly EMI</span>
                      <div className="text-2xl font-black text-sky-400 mt-1">
                        {formatINR(emi)} <span className="text-xs text-slate-400 font-normal">/mo</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Principal Loan:</span>
                        <span className="font-semibold text-slate-200">{formatINR(principal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Interest:</span>
                        <span className="font-semibold text-amber-300">{formatINR(totalInterest)}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t border-slate-800/80">
                        <span className="text-slate-300">Total Payable:</span>
                        <span className="text-white">{formatINR(totalAmountPayable)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => toggleCompare(activeModalCar.variant_id)}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <Scale className="w-4 h-4" />
                  <span>{isSelected ? 'Remove from Compare' : 'Add to Comparison'}</span>
                </button>
                <Link
                  href={`/compare?ids=${activeModalCar.variant_id}`}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 flex items-center justify-center gap-2 transition"
                >
                  <span>Launch Side-by-Side Matrix</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
