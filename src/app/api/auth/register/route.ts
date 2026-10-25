import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON request payload' }, { status: 400 });
    }

    const { fullName, email, password, phone, role } = body;

    // Security: Reject any client attempt to self-assign privileged roles
    if (role && typeof role === 'string' && role.trim().toLowerCase() !== 'customer') {
      return NextResponse.json(
        {
          success: false,
          error: 'Security violation: Self-assignment of privileged roles (admin, analyst, dealer) is forbidden.',
        },
        { status: 403 }
      );
    }

    // Input Validation: Full Name
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 100) {
      return NextResponse.json(
        { success: false, error: 'Full name is required and must be between 2 and 100 characters' },
        { status: 400 }
      );
    }

    // Input Validation: Email
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Email address is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(normalizedEmail) || normalizedEmail.length > 150) {
      return NextResponse.json({ success: false, error: 'Invalid email address format or exceeds maximum length' }, { status: 400 });
    }

    // Input Validation: Password strength (minimum 8 characters with at least one letter and one number)
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      return NextResponse.json(
        { success: false, error: 'Password must contain both letters and numbers for account security' },
        { status: 400 }
      );
    }

    // Phone Sanitization (optional)
    let sanitizedPhone: string | null = null;
    if (phone && typeof phone === 'string' && phone.trim() !== '') {
      const p = phone.trim();
      if (!/^\+?[0-9\-\s]{7,20}$/.test(p)) {
        return NextResponse.json({ success: false, error: 'Invalid phone number format' }, { status: 400 });
      }
      sanitizedPhone = p;
    }

    try {
      // Check if user already exists
      const existingResult = await query(
        `SELECT user_id FROM users WHERE LOWER(email) = $1 LIMIT 1;`,
        [normalizedEmail]
      );

      if (existingResult.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: 'An account with this email address already exists.' },
          { status: 409 }
        );
      }

      // Hash password with bcrypt (12 salt rounds for robust security)
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      // Parameterized INSERT into PostgreSQL: Role is ALWAYS enforced as 'customer' server-side
      const insertSql = `
        INSERT INTO users (full_name, email, password_hash, role, phone)
        VALUES ($1, $2, $3, 'customer'::user_role, $4)
        RETURNING user_id, full_name, email, role, created_at;
      `;

      const result = await query(insertSql, [
        fullName.trim(),
        normalizedEmail,
        passwordHash,
        sanitizedPhone,
      ]);

      const newUser = result.rows[0];

      return NextResponse.json(
        {
          success: true,
          message: 'Account registered successfully as customer',
          user: {
            id: newUser.user_id,
            name: newUser.full_name,
            email: newUser.email,
            role: newUser.role.toUpperCase(),
          },
        },
        { status: 201 }
      );
    } catch (dbErr: any) {
      console.error('[SECURITY AUDIT] User registration database error:', dbErr?.message);
      return NextResponse.json(
        {
          success: false,
          error: 'Registration service currently unavailable. Please verify database connectivity.',
        },
        { status: 503 }
      );
    }
  } catch (err: any) {
    console.error('Unhandled error in registration:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing registration' },
      { status: 500 }
    );
  }
}
