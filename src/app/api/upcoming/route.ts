import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bodyType = searchParams.get('bodyType');
    const manufacturer = searchParams.get('manufacturer');

    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (bodyType && bodyType.trim() !== '') {
      whereClauses.push(`body_type = $${paramIndex}::body_type`);
      params.push(bodyType.trim());
      paramIndex++;
    }

    if (manufacturer && manufacturer.trim() !== '') {
      whereClauses.push(`manufacturer_name ILIKE $${paramIndex}`);
      params.push(`%${manufacturer.trim()}%`);
      paramIndex++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT 
        model_id,
        model_name,
        manufacturer_name,
        country_origin,
        body_type,
        seating_capacity,
        expected_launch_date,
        days_until_launch,
        launch_status,
        announced_variants_count,
        estimated_starting_price,
        estimated_top_price
      FROM v_upcoming_launches
      ${whereSql}
      ORDER BY expected_launch_date ASC NULLS LAST, model_name ASC;
    `;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      count: result.rows.length,
      filters: {
        bodyType: bodyType || null,
        manufacturer: manufacturer || null,
      },
      data: result.rows,
    });
  } catch (err: any) {
    console.error('Error in /api/upcoming:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve upcoming vehicle launches',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
