'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const user = session?.user;
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const navLinks = [
    { label: 'Overview', href: '/' },
    { label: 'Upcoming', href: '/api/upcoming' },
    { label: 'Compare', href: '/api/compare?ids=1,2,3' },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        borderBottom: '1px solid rgba(51, 65, 85, 0.6)',
        padding: '0.875rem 1.75rem',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: '#ffffff',
              fontSize: '1rem',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
            }}
          >
            🚗
          </div>
          <span
            style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            AutoMatch <span style={{ color: '#38bdf8' }}>DBMS</span>
          </span>
        </Link>

        {/* Central Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  textDecoration: 'none',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'color 0.2s',
                }}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Conditional Admin Dashboard Link: Visible ONLY to ADMIN */}
          {isAdmin && (
            <Link
              href="/admin"
              style={{
                textDecoration: 'none',
                color: pathname.startsWith('/admin') ? '#f43f5e' : '#fb7185',
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>🛡️</span> Admin Dashboard
            </Link>
          )}
        </nav>

        {/* User Auth Session Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {status === 'loading' ? (
            <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Checking session...</div>
          ) : session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              {/* Profile Details */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#f1f5f9', fontSize: '0.875rem', fontWeight: 600 }}>
                  {user?.name || user?.email}
                </div>
                {/* Role Badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      backgroundColor: isAdmin ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                      color: isAdmin ? '#f87171' : '#38bdf8',
                      border: `1px solid ${isAdmin ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.3)'}`,
                    }}
                  >
                    {user?.role || 'CUSTOMER'}
                  </span>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                style={{
                  background: 'rgba(51, 65, 85, 0.5)',
                  border: '1px solid #475569',
                  color: '#e2e8f0',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.825rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link
                href="/login"
                style={{
                  textDecoration: 'none',
                  color: '#e2e8f0',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  padding: '6px 14px',
                }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                style={{
                  textDecoration: 'none',
                  backgroundColor: '#38bdf8',
                  color: '#090d16',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  padding: '6px 14px',
                  borderRadius: '6px',
                  boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)',
                  transition: 'opacity 0.2s',
                }}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
