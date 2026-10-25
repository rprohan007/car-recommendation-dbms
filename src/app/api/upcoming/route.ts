import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { SEED_UPCOMING_LAUNCHES } from '@/lib/seed-data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bodyType = searchParams.get('bodyType');
    const manufacturer = searchParams.get('manufacturer');
    const isDemoRequested = searchParams.get('demo') === 'true';

    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (bodyType && bodyType.trim() !== '' && bodyType !== 'all') {
      whereClauses.push(`body_type = $${paramIndex}::body_type`);
      params.push(bodyType.trim());
      paramIndex++;
    }

    if (manufacturer && manufacturer.trim() !== '' && manufacturer !== 'all') {
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

    try {
      const result = await query(sql, params);
      return NextResponse.json({
        success: true,
        count: result.rows.length,
        data_source: 'live_postgresql',
        filters: {
          bodyType: bodyType || null,
          manufacturer: manufacturer || null,
        },
        data: result.rows,
      });
    } catch (dbErr: any) {
      console.error('[DATABASE ERROR] Upcoming launches query failed:', dbErr?.message);

      if (isDemoRequested) {
        let filtered = [...SEED_UPCOMING_LAUNCHES];
        if (bodyType && bodyType !== 'all') {
          filtered = filtered.filter((u) => u.body_type.toLowerCase() === bodyType.toLowerCase());
        }
        if (manufacturer && manufacturer !== 'all') {
          filtered = filtered.filter((u) =>
            u.manufacturer_name.toLowerCase().includes(manufacturer.toLowerCase())
          );
        }
        return NextResponse.json({
          success: true,
          count: filtered.length,
          data_source: 'simulated_offline_showcase',
          is_simulated_demo: true,
          filters: {
            bodyType: bodyType || null,
            manufacturer: manufacturer || null,
          },
          data: filtered,
        });
      }

      return NextResponse.json(
        {
          success: false,
          code: 'DATABASE_UNAVAILABLE',
          error: 'Database connection failed. Unable to query v_upcoming_launches view.',
        },
        { status: 503 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
