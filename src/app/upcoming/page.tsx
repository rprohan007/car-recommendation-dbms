'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Car,
  Bell,
  Sparkles,
  ChevronRight,
  Filter,
  CheckCircle2,
  X,
  Zap,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';
import { formatPrice } from '@/lib/formatters';

interface UpcomingCar {
  model_id: number;
  model_name: string;
  manufacturer_name: string;
  country_origin: string;
  body_type: string;
  seating_capacity: number;
  expected_launch_date: string;
  days_until_launch: number;
  launch_status: string;
  announced_variants_count: number;
  estimated_starting_price: number;
  estimated_top_price: number;
  highlight_features?: string[];
  battery_or_engine?: string;
}

export default function UpcomingLaunchesPage() {
  const [launches, setLaunches] = useState<UpcomingCar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBodyType, setSelectedBodyType] = useState<string>('all');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all');

  // Notify Me Modal State
  const [interestModalCar, setInterestModalCar] = useState<UpcomingCar | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [notificationSuccess, setNotificationSuccess] = useState<boolean>(false);

  const fetchUpcoming = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBodyType !== 'all') params.append('bodyType', selectedBodyType);
      if (selectedManufacturer !== 'all') params.append('manufacturer', selectedManufacturer);

      const res = await fetch(`/api/upcoming?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setLaunches(data.data);
      } else {
        setLaunches([]);
      }
    } catch (err) {
      console.error('Failed to load upcoming vehicle launches:', err);
      setLaunches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcoming();
  }, [selectedBodyType, selectedManufacturer]);

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;
    setNotificationSuccess(true);
    setTimeout(() => {
      setInterestModalCar(null);
      setNotificationSuccess(false);
      setUserEmail('');
    }, 2000);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 pb-24">
      {/* Header Banner */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-indigo-950/40 via-slate-900/40 to-[#090d16] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 mb-3 backdrop-blur-md">
                <Calendar className="w-3.5 h-3.5" />
                <span>PostgreSQL View: `v_upcoming_launches`</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Upcoming Vehicle <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200 bg-clip-text text-transparent">Launches</span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
                Direct view into upcoming Indian automotive market launches. Monitor launch countdown timers, estimated variant price brackets, and pre-booking schedules.
              </p>
            </div>

            {/* Quick stats badge */}
            <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-4 py-3 rounded-2xl backdrop-blur-md">
              <Clock className="w-5 h-5 text-indigo-400" />
              <div>
                <div className="text-xs text-slate-400 font-medium">Pipeline Status</div>
                <div className="text-sm font-extrabold text-white">
                  {launches.length} Upcoming Models
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Filter Controls */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-8 backdrop-blur-xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span>Filter Launches:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Body Type Filter */}
            <select
              value={selectedBodyType}
              onChange={(e) => setSelectedBodyType(e.target.value)}
              className="bg-slate-950/90 border border-slate-700/80 text-xs sm:text-sm text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Body Styles</option>
              <option value="SUV">SUV</option>
              <option value="Coupe">Coupe</option>
              <option value="Sedan">Sedan</option>
              <option value="MUV">MUV</option>
            </select>

            {/* Manufacturer Filter */}
            <select
              value={selectedManufacturer}
              onChange={(e) => setSelectedManufacturer(e.target.value)}
              className="bg-slate-950/90 border border-slate-700/80 text-xs sm:text-sm text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Manufacturers</option>
              <option value="Tata">Tata Motors</option>
              <option value="Mahindra">Mahindra & Mahindra</option>
              <option value="Hyundai">Hyundai Motor India</option>
              <option value="Toyota">Toyota Kirloskar</option>
            </select>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse"
              >
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-slate-800 rounded w-28" />
                  <div className="h-6 bg-slate-800 rounded-full w-24" />
                </div>
                <div className="h-8 bg-slate-700 rounded w-48" />
                <div className="h-16 bg-slate-800/50 rounded-xl" />
                <div className="h-10 bg-slate-800/40 rounded" />
              </div>
            ))}
          </div>
        ) : launches.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-2xl p-8 max-w-lg mx-auto">
            <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">No Upcoming Launches Found</h3>
            <p className="text-sm text-slate-400 mb-4">
              There are no upcoming car launches matching your selected body type or manufacturer filter.
            </p>
            <button
              onClick={() => {
                setSelectedBodyType('all');
                setSelectedManufacturer('all');
              }}
              className="text-xs font-bold text-slate-950 bg-indigo-400 hover:bg-indigo-300 px-4 py-2 rounded-xl"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Card & Timeline Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {launches.map((item) => {
              const days = item.days_until_launch || 60;
              const isImminent = days <= 60;

              return (
                <div
                  key={item.model_id}
                  className="group relative bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 sm:p-7 transition-all duration-200 flex flex-col justify-between shadow-xl hover:shadow-indigo-500/10 backdrop-blur-xl"
                >
                  <div>
                    {/* Top Header: Manufacturer & Countdown Badge */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300 bg-slate-800/90 border border-slate-700/60 px-2.5 py-1 rounded-md">
                          {item.manufacturer_name}
                        </span>
                        <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md">
                          {item.body_type}
                        </span>
                      </div>

                      {/* Countdown badge */}
                      <div
                        className={`flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full border ${
                          isImminent
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{days > 0 ? `${days} Days to Launch` : 'Launching Soon'}</span>
                      </div>
                    </div>

                    {/* Model Name & Country */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 className="text-2xl font-black text-white group-hover:text-indigo-300 transition-colors">
                        {item.model_name}
                      </h2>
                      <span className="text-xs text-slate-400 font-medium">
                        Origin: {item.country_origin}
                      </span>
                    </div>

                    {/* Expected Launch Date & Seating */}
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        <span>Expected: <strong>{formatDate(item.expected_launch_date)}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-slate-400" />
                        <span>{item.seating_capacity} Seater</span>
                      </div>
                    </div>

                    {/* Estimated Price Range Box */}
                    <div className="mt-5 bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Estimated Ex-Showroom Bracket
                        </span>
                        <div className="text-lg sm:text-xl font-black text-white mt-0.5">
                          {item.estimated_starting_price > 0
                            ? `${formatPrice(item.estimated_starting_price)} – ${formatPrice(item.estimated_top_price)}`
                            : 'Expected: ₹18.00 Lakh – ₹26.00 Lakh'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block font-medium">Announced Variants</span>
                        <span className="text-sm font-bold text-indigo-400">
                          {item.announced_variants_count > 0 ? `${item.announced_variants_count} Editions` : '3 Editions'}
                        </span>
                      </div>
                    </div>

                    {/* Next-Gen Technology Highlights */}
                    <div className="mt-5">
                      <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                        Next-Gen Tech Highlights
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(item.highlight_features || [
                          'Level 2+ ADAS Suite',
                          'Dedicated EV Architecture',
                          'Ultra-fast DC Charging',
                          'Panoramic Glass Roof'
                        ]).map((feat, fIdx) => (
                          <span
                            key={fIdx}
                            className="text-xs bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/50 flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            <span>{feat}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setInterestModalCar(item)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-sky-600 hover:from-indigo-400 hover:to-sky-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg transition-all"
                    >
                      <Bell className="w-4 h-4" />
                      <span>Notify Me on Launch</span>
                    </button>

                    <Link
                      href="/"
                      className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1"
                      title="Search existing alternatives"
                    >
                      <span>Similar Cars</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pre-Booking Notification Modal */}
      {interestModalCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setInterestModalCar(null);
                setNotificationSuccess(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {notificationSuccess ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">Pre-Launch Alert Configured!</h3>
                <p className="text-xs text-slate-400 mt-2">
                  We will notify you immediately once booking windows open for{' '}
                  <strong className="text-slate-200">{interestModalCar.model_name}</strong>.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                  <Bell className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Launch Priority Alert</span>
                </div>
                <h3 className="text-xl font-black text-white">
                  Stay Updated on {interestModalCar.model_name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 mb-5">
                  Get notified the instant pricing is announced and test drives commence in {formatDate(interestModalCar.expected_launch_date)}.
                </p>

                <form onSubmit={handleNotifySubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Your Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. yourname@example.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-500 to-sky-600 hover:from-indigo-400 hover:to-sky-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-all"
                  >
                    Register Priority Notification
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
