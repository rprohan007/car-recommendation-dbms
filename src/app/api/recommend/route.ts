import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getEmbedding } from '@/lib/embeddings';

export const dynamic = 'force-dynamic';

interface RecommendRequestBody {
  prompt?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  fuelType?: string;
  transmission?: string;
  minSafety?: number | string;
}

export async function POST(req: NextRequest) {
  try {
    let body: RecommendRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload in request body' },
        { status: 400 }
      );
    }

    const {
      prompt = '',
      minPrice,
      maxPrice,
      fuelType,
      transmission,
      minSafety,
    } = body;

    // Numerical sanitization & parsing
    const parsedMinPrice = minPrice !== undefined && minPrice !== '' ? Number(minPrice) : null;
    const parsedMaxPrice = maxPrice !== undefined && maxPrice !== '' ? Number(maxPrice) : null;
    const parsedMinSafety = minSafety !== undefined && minSafety !== '' ? Number(minSafety) : null;

    if (parsedMinPrice !== null && (isNaN(parsedMinPrice) || parsedMinPrice < 0)) {
      return NextResponse.json({ error: 'minPrice must be a non-negative number' }, { status: 400 });
    }
    if (parsedMaxPrice !== null && (isNaN(parsedMaxPrice) || parsedMaxPrice < 0)) {
      return NextResponse.json({ error: 'maxPrice must be a non-negative number' }, { status: 400 });
    }
    if (parsedMinPrice !== null && parsedMaxPrice !== null && parsedMinPrice > parsedMaxPrice) {
      return NextResponse.json({ error: 'minPrice cannot exceed maxPrice' }, { status: 400 });
    }
    if (parsedMinSafety !== null && (isNaN(parsedMinSafety) || parsedMinSafety < 0 || parsedMinSafety > 5)) {
      return NextResponse.json({ error: 'minSafety must be between 0.0 and 5.0' }, { status: 400 });
    }

    // Convert prompt to 1536-dimensional vector embedding
    const queryVector = await getEmbedding(prompt || 'reliable safe family car');
    const vectorString = `[${queryVector.join(',')}]`;

    // Dynamic Parameterized Query Construction
    const whereClauses: string[] = ['cv.is_active = TRUE', "cm.launch_status = 'launched'"];
    const params: any[] = [vectorString]; // $1 is always the query vector
    let paramIndex = 2;

    if (parsedMinPrice !== null) {
      whereClauses.push(`cv.ex_showroom_price >= $${paramIndex}`);
      params.push(parsedMinPrice);
      paramIndex++;
    }

    if (parsedMaxPrice !== null) {
      whereClauses.push(`cv.ex_showroom_price <= $${paramIndex}`);
      params.push(parsedMaxPrice);
      paramIndex++;
    }

    if (fuelType && fuelType.trim() !== '') {
      whereClauses.push(`cv.fuel_type = $${paramIndex}::fuel_enum`);
      params.push(fuelType.trim());
      paramIndex++;
    }

    if (transmission && transmission.trim() !== '') {
      whereClauses.push(`cv.transmission = $${paramIndex}::trans_enum`);
      params.push(transmission.trim());
      paramIndex++;
    }

    if (parsedMinSafety !== null) {
      whereClauses.push(`cv.safety_rating_ncap >= $${paramIndex}`);
      params.push(parsedMinSafety);
      paramIndex++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Hybrid Query: pgvector Cosine Similarity Distance (<=>) + SQL Filters + Safety Score Weighting
    const hybridSql = `
      SELECT 
        cv.variant_id,
        cv.variant_name,
        cm.model_id,
        cm.model_name,
        m.name AS manufacturer_name,
        cm.body_type,
        cv.ex_showroom_price,
        cv.fuel_type,
        cv.transmission,
        cv.engine_displacement_cc,
        cv.power_bhp,
        cv.torque_nm,
        cv.mileage_kmpl,
        cv.safety_rating_ncap,
        cm.seating_capacity,
        COALESCE(
          ARRAY_AGG(f.feature_name ORDER BY f.feature_name) FILTER (WHERE vf.is_standard = TRUE), 
          '{}'
        ) AS standard_features,
        ROUND(
          (CASE 
            WHEN cv.embedding IS NOT NULL 
            THEN (1.0 - (cv.embedding <=> $1::vector))
            ELSE 0.50 
          END)::numeric, 4
        ) AS similarity_score,
        ROUND(
          (
            (CASE 
              WHEN cv.embedding IS NOT NULL 
              THEN (1.0 - (cv.embedding <=> $1::vector))
              ELSE 0.50 
            END) * 0.70 + 
            (COALESCE(cv.safety_rating_ncap, 3.0) / 5.0) * 0.30
          )::numeric, 4
        ) AS combined_relevance_score
      FROM car_variants cv
      JOIN car_models cm ON cv.model_id = cm.model_id
      JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
      LEFT JOIN variant_features vf ON cv.variant_id = vf.variant_id
      LEFT JOIN features f ON vf.feature_id = f.feature_id
      ${whereSql}
      GROUP BY 
        cv.variant_id,
        cv.variant_name,
        cm.model_id,
        cm.model_name,
        m.name,
        cm.body_type,
        cv.ex_showroom_price,
        cv.fuel_type,
        cv.transmission,
        cv.engine_displacement_cc,
        cv.power_bhp,
        cv.torque_nm,
        cv.mileage_kmpl,
        cv.safety_rating_ncap,
        cm.seating_capacity,
        cv.embedding
      ORDER BY combined_relevance_score DESC, cv.safety_rating_ncap DESC NULLS LAST
      LIMIT 5;
    `;

    const result = await query(hybridSql, params);

    // Asynchronously log the search to customer_searches audit table
    try {
      await query(
        `INSERT INTO customer_searches (
          min_budget, max_budget, preferred_fuel, preferred_transmission, 
          min_safety_rating, search_query
        ) VALUES ($1, $2, $3::fuel_enum, $4::trans_enum, $5, $6)`,
        [
          parsedMinPrice,
          parsedMaxPrice,
          fuelType || null,
          transmission || null,
          parsedMinSafety,
          prompt || null,
        ]
      );
    } catch (auditErr) {
      console.warn('Non-blocking: Failed to record search audit log:', auditErr);
    }

    return NextResponse.json({
      success: true,
      count: result.rows.length,
      query: {
        prompt,
        minPrice: parsedMinPrice,
        maxPrice: parsedMaxPrice,
        fuelType: fuelType || null,
        transmission: transmission || null,
        minSafety: parsedMinSafety,
      },
      data: result.rows,
    });
  } catch (err: any) {
    console.error('Error in /api/recommend:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process car recommendation query',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
