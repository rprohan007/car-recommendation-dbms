import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam || idsParam.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required query parameter "ids". Please provide comma-separated IDs, e.g. /api/compare?ids=1,2,3',
        },
        { status: 400 }
      );
    }

    // Parse and sanitize ID integers
    const variantIds = idsParam
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id) && id > 0);

    if (variantIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid positive integer IDs provided in "ids" parameter.',
        },
        { status: 400 }
      );
    }

    if (variantIds.length > 6) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot compare more than 6 vehicles simultaneously.',
        },
        { status: 400 }
      );
    }

    // SQL JOIN with aggregated features array and structured feature objects
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
          error: 'No car variants found matching the provided IDs.',
          requestedIds: variantIds,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      count: result.rows.length,
      requestedIds: variantIds,
      data: result.rows,
    });
  } catch (err: any) {
    console.error('Error in /api/compare:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve car comparison data',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
