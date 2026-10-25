import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { SEED_VARIANTS } from '@/lib/seed-data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids');
    const isDemoRequested = searchParams.get('demo') === 'true';

    // If no IDs provided, return list of all active variants for selection dropdown
    if (!idsParam || idsParam.trim() === '') {
      try {
        const allSql = `
          SELECT 
            cv.variant_id,
            cv.variant_name,
            cm.model_name,
            m.name AS manufacturer_name,
            cv.ex_showroom_price,
            cv.fuel_type,
            cv.transmission,
            cm.body_type
          FROM car_variants cv
          JOIN car_models cm ON cv.model_id = cm.model_id
          JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
          WHERE cv.is_active = TRUE
          ORDER BY cv.ex_showroom_price ASC;
        `;
        const allRes = await query(allSql);
        return NextResponse.json({
          success: true,
          count: allRes.rows.length,
          data_source: 'live_postgresql',
          data: allRes.rows,
        });
      } catch (err: any) {
        if (isDemoRequested) {
          return NextResponse.json({
            success: true,
            count: SEED_VARIANTS.length,
            data_source: 'simulated_offline_showcase',
            is_simulated_demo: true,
            data: SEED_VARIANTS,
          });
        }
        return NextResponse.json(
          {
            success: false,
            code: 'DATABASE_UNAVAILABLE',
            error: 'Failed to retrieve vehicle inventory from database',
          },
          { status: 503 }
        );
      }
    }

    // Parse and sanitize ID integers
    const rawTokens = idsParam.split(',').map((id) => id.trim()).filter(Boolean);
    const variantIds: number[] = [];

    for (const token of rawTokens) {
      const num = parseInt(token, 10);
      if (isNaN(num) || num <= 0 || !/^\d+$/.test(token)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid vehicle ID: "${token}". All IDs must be positive integers.`,
          },
          { status: 400 }
        );
      }
      variantIds.push(num);
    }

    if (variantIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid positive integer IDs provided in "ids" parameter.' },
        { status: 400 }
      );
    }

    if (variantIds.length > 6) {
      return NextResponse.json(
        { success: false, error: 'Cannot compare more than 6 vehicles simultaneously.' },
        { status: 400 }
      );
    }

    try {
      // Parameterized multi-table JOIN with standard and optional feature aggregation
      const compareSql = `
        SELECT 
          cv.variant_id,
          cv.variant_name,
          cm.model_id,
          cm.model_name,
          m.manufacturer_id,
          m.name AS manufacturer_name,
          m.country_origin,
          cm.body_type,
          cm.seating_capacity,
          cv.ex_showroom_price,
          cv.fuel_type,
          cv.transmission,
          cv.engine_displacement_cc,
          cv.power_bhp,
          cv.torque_nm,
          cv.mileage_kmpl,
          cv.safety_rating_ncap,
          COALESCE(
            ARRAY_AGG(f.feature_name ORDER BY f.category, f.feature_name) 
            FILTER (WHERE vf.is_standard = TRUE),
            '{}'
          ) AS standard_features,
          COALESCE(
            ARRAY_AGG(f.feature_name ORDER BY f.category, f.feature_name) 
            FILTER (WHERE vf.is_standard = FALSE),
            '{}'
          ) AS optional_features,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'feature_id', f.feature_id,
                'feature_name', f.feature_name,
                'category', f.category,
                'is_standard', vf.is_standard
              ) ORDER BY f.category, f.feature_name
            ) FILTER (WHERE f.feature_id IS NOT NULL),
            '[]'
          ) AS features_list
        FROM car_variants cv
        JOIN car_models cm ON cv.model_id = cm.model_id
        JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
        LEFT JOIN variant_features vf ON cv.variant_id = vf.variant_id
        LEFT JOIN features f ON vf.feature_id = f.feature_id
        WHERE cv.variant_id = ANY($1::int[])
        GROUP BY 
          cv.variant_id,
          cv.variant_name,
          cm.model_id,
          cm.model_name,
          m.manufacturer_id,
          m.name,
          m.country_origin,
          cm.body_type,
          cm.seating_capacity,
          cv.ex_showroom_price,
          cv.fuel_type,
          cv.transmission,
          cv.engine_displacement_cc,
          cv.power_bhp,
          cv.torque_nm,
          cv.mileage_kmpl,
          cv.safety_rating_ncap
        ORDER BY cv.ex_showroom_price ASC;
      `;

      const result = await query(compareSql, [variantIds]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'No car variants found matching the provided IDs in database.',
            requestedIds: variantIds,
          },
          { status: 404 }
        );
      }

      const foundIds = result.rows.map((r: any) => r.variant_id);
      const missingIds = variantIds.filter((id) => !foundIds.includes(id));

      return NextResponse.json({
        success: true,
        count: result.rows.length,
        data_source: 'live_postgresql',
        requestedIds: variantIds,
        missingIds: missingIds.length > 0 ? missingIds : undefined,
        data: result.rows,
      });
    } catch (dbErr: any) {
      console.error('[DATABASE ERROR] Comparison query failed:', dbErr?.message);

      if (isDemoRequested) {
        const matched = SEED_VARIANTS.filter((v) => variantIds.includes(v.variant_id));
        return NextResponse.json({
          success: true,
          count: matched.length,
          data_source: 'simulated_offline_showcase',
          is_simulated_demo: true,
          requestedIds: variantIds,
          data: matched,
        });
      }

      return NextResponse.json(
        {
          success: false,
          code: 'DATABASE_UNAVAILABLE',
          error: 'Database connection failed. Please ensure PostgreSQL is running.',
        },
        { status: 503 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Internal server error processing comparison' },
      { status: 500 }
    );
  }
}
