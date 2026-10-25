'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Car, Scale, Sparkles, Calendar, Shield, Menu, X, LogIn, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = session?.user;
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const navLinks = [
    { label: 'Recommendations', href: '/', icon: Sparkles },
    { label: 'Compare', href: '/compare', icon: Scale },
    { label: 'Upcoming Launches', href: '/upcoming', icon: Calendar },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform duration-200">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent group-hover:from-sky-300 group-hover:to-white transition-all">
                AutoMatch <span className="text-sky-400 font-black">DBMS</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase text-slate-400 font-semibold -mt-1 hidden sm:block">
                Intelligent Vehicle Matrix
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'text-sky-400 bg-sky-500/10 border border-sky-500/25 shadow-sm shadow-sky-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Admin Link if role is Admin */}
            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  pathname.startsWith('/admin')
                    ? 'text-rose-400 bg-rose-500/15 border border-rose-500/30'
                    : 'text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 border border-rose-500/20'
                }`}
              >
                <Shield className="w-4 h-4 text-rose-400" />
                <span>Admin Console</span>
              </Link>
            )}
          </nav>

          {/* Desktop Auth / User Controls */}
          <div className="hidden md:flex items-center gap-3">
            {status === 'loading' ? (
              <div className="text-xs text-slate-500 animate-pulse px-3 py-1">
                Verifying session...
              </div>
            ) : session ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end text-right">
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user?.name || user?.email}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isAdmin
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    }`}
                  >
                    {user?.role || 'Customer'}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-sky-400 to-sky-300 hover:from-sky-300 hover:to-sky-200 px-3.5 py-1.5 rounded-lg transition-all shadow-md shadow-sky-500/20 font-sans"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'text-sky-400 bg-sky-500/10 border border-sky-500/20'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 text-sky-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20"
              >
                <Shield className="w-4 h-4 text-rose-400" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {session ? (
              <div className="flex items-center justify-between w-full">
                <div>
                  <div className="text-xs font-semibold text-slate-200">{user?.name || user?.email}</div>
                  <span className="text-[10px] text-sky-400 uppercase font-bold">{user?.role || 'CUSTOMER'}</span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center gap-1 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-lg"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-medium text-slate-200 bg-slate-800 border border-slate-700 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-bold text-slate-950 bg-sky-400 rounded-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
