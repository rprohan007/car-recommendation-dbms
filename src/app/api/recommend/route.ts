import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getEmbedding } from '@/lib/embeddings';
import { SEED_VARIANTS } from '@/lib/seed-data';

export const dynamic = 'force-dynamic';

interface RecommendRequestBody {
  prompt?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  minSafety?: number | string;
  limit?: number | string;
}

const VALID_FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'];
const VALID_TRANSMISSIONS = ['Manual', 'Automatic', 'AMT', 'CVT', 'DCT'];
const VALID_BODY_TYPES = ['SUV', 'Sedan', 'Hatchback', 'MUV', 'Coupe', 'Convertible'];

export async function POST(req: NextRequest) {
  let body: RecommendRequestBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload in request body' },
      { status: 400 }
    );
  }

  const {
    prompt = '',
    minPrice,
    maxPrice,
    fuelType,
    transmission,
    bodyType,
    minSafety,
    limit,
  } = body;

  // Numerical validation & sanitization
  const parsedMinPrice = minPrice !== undefined && minPrice !== '' && minPrice !== null ? Number(minPrice) : null;
  const parsedMaxPrice = maxPrice !== undefined && maxPrice !== '' && maxPrice !== null ? Number(maxPrice) : null;
  const parsedMinSafety = minSafety !== undefined && minSafety !== '' && minSafety !== null ? Number(minSafety) : null;
  const parsedLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);

  if (parsedMinPrice !== null && (isNaN(parsedMinPrice) || parsedMinPrice < 0)) {
    return NextResponse.json({ success: false, error: 'minPrice must be a non-negative number' }, { status: 400 });
  }
  if (parsedMaxPrice !== null && (isNaN(parsedMaxPrice) || parsedMaxPrice < 0)) {
    return NextResponse.json({ success: false, error: 'maxPrice must be a non-negative number' }, { status: 400 });
  }
  if (parsedMinPrice !== null && parsedMaxPrice !== null && parsedMinPrice > parsedMaxPrice) {
    return NextResponse.json({ success: false, error: 'minPrice cannot exceed maxPrice' }, { status: 400 });
  }
  if (parsedMinSafety !== null && (isNaN(parsedMinSafety) || parsedMinSafety < 0 || parsedMinSafety > 5)) {
    return NextResponse.json({ success: false, error: 'minSafety must be between 0.0 and 5.0' }, { status: 400 });
  }

  // Enum validation
  const cleanFuel = fuelType && fuelType !== 'all' ? fuelType.trim() : null;
  if (cleanFuel && !VALID_FUEL_TYPES.some((f) => f.toLowerCase() === cleanFuel.toLowerCase())) {
    return NextResponse.json({ success: false, error: `Invalid fuelType: "${cleanFuel}". Allowed: ${VALID_FUEL_TYPES.join(', ')}` }, { status: 400 });
  }

  const cleanTrans = transmission && transmission !== 'all' ? transmission.trim() : null;
  if (cleanTrans && !VALID_TRANSMISSIONS.some((t) => t.toLowerCase() === cleanTrans.toLowerCase())) {
    return NextResponse.json({ success: false, error: `Invalid transmission: "${cleanTrans}". Allowed: ${VALID_TRANSMISSIONS.join(', ')}` }, { status: 400 });
  }

  const cleanBody = bodyType && bodyType !== 'all' ? bodyType.trim() : null;
  if (cleanBody && !VALID_BODY_TYPES.some((b) => b.toLowerCase() === cleanBody.toLowerCase())) {
    return NextResponse.json({ success: false, error: `Invalid bodyType: "${cleanBody}". Allowed: ${VALID_BODY_TYPES.join(', ')}` }, { status: 400 });
  }

  // Offline simulation demo mode check (only if explicitly enabled via query parameter for offline viva showcase)
  const isDemoRequested = req.nextUrl.searchParams.get('demo') === 'true';

  try {
    const trimmedPrompt = (prompt || '').trim();
    const hasPrompt = trimmedPrompt.length > 0;

    // Check embedding provider (OpenAI vs Keyword)
    const embeddingResult = hasPrompt ? await getEmbedding(trimmedPrompt) : { embedding: null, mode: 'keyword_fallback', provider: 'none' };
    const hasVector = embeddingResult.embedding !== null;

    // Parameterized SQL construction
    const whereClauses: string[] = ['cv.is_active = TRUE', "cm.launch_status = 'launched'"];
    const params: any[] = [];
    let paramIndex = 1;

    let vectorPlaceholder = 'NULL::vector';
    if (hasVector) {
      vectorPlaceholder = `$${paramIndex}::vector`;
      params.push(`[${embeddingResult.embedding!.join(',')}]`);
      paramIndex++;
    }

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

    if (cleanFuel) {
      whereClauses.push(`LOWER(cv.fuel_type::text) = LOWER($${paramIndex})`);
      params.push(cleanFuel);
      paramIndex++;
    }

    if (cleanTrans) {
      whereClauses.push(`LOWER(cv.transmission::text) = LOWER($${paramIndex})`);
      params.push(cleanTrans);
      paramIndex++;
    }

    if (cleanBody) {
      whereClauses.push(`LOWER(cm.body_type::text) = LOWER($${paramIndex})`);
      params.push(cleanBody);
      paramIndex++;
    }

    if (parsedMinSafety !== null && parsedMinSafety > 0) {
      whereClauses.push(`cv.safety_rating_ncap >= $${paramIndex}`);
      params.push(parsedMinSafety);
      paramIndex++;
    }

    // Optional text search condition if prompt is supplied but vector is unavailable
    if (hasPrompt && !hasVector) {
      whereClauses.push(`(
        cm.model_name ILIKE $${paramIndex} OR
        cv.variant_name ILIKE $${paramIndex} OR
        m.name ILIKE $${paramIndex} OR
        cv.fuel_type::text ILIKE $${paramIndex} OR
        cm.body_type::text ILIKE $${paramIndex}
      )`);
      params.push(`%${trimmedPrompt}%`);
      paramIndex++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    params.push(parsedLimit);
    const limitPlaceholder = `$${paramIndex}`;

    // Hybrid SQL query: pgvector cosine similarity distance (<=>) + multi-attribute constraints + deterministic tie-breakers
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
            WHEN ${hasVector ? 'cv.embedding IS NOT NULL' : 'FALSE'}
            THEN (1.0 - (cv.embedding <=> ${vectorPlaceholder}))
            ELSE 0.50
          END)::numeric, 4
        ) AS similarity_score,
        ROUND(
          (
            (CASE
              WHEN ${hasVector ? 'cv.embedding IS NOT NULL' : 'FALSE'}
              THEN (1.0 - (cv.embedding <=> ${vectorPlaceholder}))
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
      ORDER BY
        combined_relevance_score DESC,
        cv.safety_rating_ncap DESC NULLS LAST,
        cv.ex_showroom_price ASC,
        cv.variant_id ASC
      LIMIT ${limitPlaceholder};
    `;

    const result = await query(hybridSql, params);

    // Audit search to customer_searches asynchronously
    try {
      await query(
        `INSERT INTO customer_searches (
          min_budget, max_budget, preferred_fuel, preferred_transmission,
          preferred_body_type, min_safety_rating, search_query
        ) VALUES ($1, $2, $3::fuel_enum, $4::trans_enum, $5::body_type, $6, $7)`,
        [
          parsedMinPrice,
          parsedMaxPrice,
          cleanFuel ? cleanFuel : null,
          cleanTrans ? cleanTrans : null,
          cleanBody ? cleanBody : null,
          parsedMinSafety,
          trimmedPrompt || null,
        ]
      );
    } catch (auditErr) {
      console.warn('Non-blocking: Failed to insert search audit event:', auditErr);
    }

    return NextResponse.json({
      success: true,
      count: result.rows.length,
      data_source: 'live_postgresql',
      vector_mode: hasVector ? 'pgvector_cosine_distance' : hasPrompt ? 'sql_keyword_fallback' : 'multi_attribute_only',
      query: {
        prompt: trimmedPrompt,
        minPrice: parsedMinPrice,
        maxPrice: parsedMaxPrice,
        fuelType: cleanFuel,
        transmission: cleanTrans,
        bodyType: cleanBody,
        minSafety: parsedMinSafety,
      },
      data: result.rows,
    });
  } catch (err: any) {
    console.error('[DATABASE ERROR] Recommendation query failed:', err?.message);

    // If caller specifically requested demo showcase mode (for offline viva test):
    if (isDemoRequested) {
      console.info('[DEMO MODE] Caller requested simulated offline showcase.');
      let filtered = SEED_VARIANTS.filter((car) => car.is_active);
      if (parsedMinPrice !== null) filtered = filtered.filter((c) => c.ex_showroom_price >= parsedMinPrice);
      if (parsedMaxPrice !== null) filtered = filtered.filter((c) => c.ex_showroom_price <= parsedMaxPrice);
      if (cleanFuel) filtered = filtered.filter((c) => c.fuel_type.toLowerCase() === cleanFuel.toLowerCase());
      if (cleanTrans) filtered = filtered.filter((c) => c.transmission.toLowerCase() === cleanTrans.toLowerCase());
      if (cleanBody) filtered = filtered.filter((c) => c.body_type.toLowerCase() === cleanBody.toLowerCase());
      if (parsedMinSafety !== null) filtered = filtered.filter((c) => c.safety_rating_ncap >= parsedMinSafety);

      return NextResponse.json({
        success: true,
        count: filtered.length,
        data_source: 'simulated_offline_showcase',
        is_simulated_demo: true,
        data: filtered,
      });
    }

    // Fail closed: Report actual database unavailability rather than silently masquerading as live DB
    return NextResponse.json(
      {
        success: false,
        code: 'DATABASE_UNAVAILABLE',
        error: 'Database connection failed. Please ensure PostgreSQL is running and DATABASE_URL is configured.',
        details: process.env.NODE_ENV === 'development' ? err?.message : undefined,
      },
      { status: 503 }
    );
  }
}
