import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, password, phone } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ success: false, error: 'Full name is required' }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ success: false, error: 'Invalid email address format' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingResult = await query(
      `SELECT user_id FROM users WHERE LOWER(email) = $1 LIMIT 1;`,
      [normalizedEmail]
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'A user with this email address already exists.' },
        { status: 409 }
      );
    }

    // Hash password with bcryptjs (10 salt rounds)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user into PostgreSQL users table with customer role
    const insertSql = `
      INSERT INTO users (full_name, email, password_hash, role, phone)
      VALUES ($1, $2, $3, 'customer'::user_role, $4)
      RETURNING user_id, full_name, email, role, created_at;
    `;

    const result = await query(insertSql, [
      fullName.trim(),
      normalizedEmail,
      passwordHash,
      phone ? phone.trim() : null,
    ]);

    const newUser = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        message: 'Account registered successfully',
        user: {
          id: newUser.user_id,
          name: newUser.full_name,
          email: newUser.email,
          role: newUser.role.toUpperCase(),
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Registration error in /api/auth/register:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to register account',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
