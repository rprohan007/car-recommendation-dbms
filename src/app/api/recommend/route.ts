import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getEmbedding } from '@/lib/embeddings';
import { SEED_VARIANTS } from '@/lib/seed-data';
import { RecommendationQuerySchema, extractSearchTokens } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let rawBody: any = {};
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload in request body' },
      { status: 400 }
    );
  }

  // Zod Runtime Input Validation
  const parseResult = RecommendationQuerySchema.safeParse(rawBody);
  if (!parseResult.success) {
    const firstError = parseResult.error.issues?.[0]?.message || 'Invalid recommendation query parameters';
    return NextResponse.json(
      { success: false, error: firstError, errors: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const {
    prompt: rawPrompt,
    minPrice: parsedMinPrice,
    maxPrice: parsedMaxPrice,
    fuelType: cleanFuel,
    transmission: cleanTrans,
    bodyType: cleanBody,
    minSafety: parsedMinSafety,
    limit: parsedLimit,
  } = parseResult.data;

  // Offline simulation demo mode check (only if explicitly enabled via query parameter for offline viva showcase)
  const isDemoRequested = req.nextUrl.searchParams.get('demo') === 'true';

  try {
    const trimmedPrompt = (rawPrompt || '').trim();
    const hasPrompt = trimmedPrompt.length > 0;

    // Check embedding provider (OpenAI vs Keyword fallback)
    const embeddingResult = hasPrompt
      ? await getEmbedding(trimmedPrompt)
      : { embedding: null, mode: 'keyword_fallback' as const, provider: 'none' };
    const hasVector = embeddingResult.embedding !== null;

    // Parameterized SQL construction
    // Hard criteria filters are ALWAYS applied first
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

    // Keyword Tokenization & Fallback Scoring
    const searchTokens = !hasVector && hasPrompt ? extractSearchTokens(trimmedPrompt) : [];
    const tokenMatchConditions: string[] = [];

    if (!hasVector && searchTokens.length > 0) {
      for (const token of searchTokens) {
        const tokenParamIdx = paramIndex;
        params.push(`%${token}%`);
        paramIndex++;

        // Multi-keyword token matching across model, variant, manufacturer, body_type, fuel_type, transmission, and features
        tokenMatchConditions.push(`(
          cm.model_name ILIKE $${tokenParamIdx} OR
          cv.variant_name ILIKE $${tokenParamIdx} OR
          m.name ILIKE $${tokenParamIdx} OR
          cm.body_type::text ILIKE $${tokenParamIdx} OR
          cv.fuel_type::text ILIKE $${tokenParamIdx} OR
          cv.transmission::text ILIKE $${tokenParamIdx} OR
          EXISTS (
            SELECT 1 FROM variant_features vf_kw
            JOIN features f_kw ON vf_kw.feature_id = f_kw.feature_id
            WHERE vf_kw.variant_id = cv.variant_id
              AND (f_kw.feature_name ILIKE $${tokenParamIdx} OR f_kw.description ILIKE $${tokenParamIdx})
          )
        )`);
      }

      // Filter: Vehicle must match at least one extracted keyword token
      whereClauses.push(`(${tokenMatchConditions.join(' OR ')})`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    params.push(parsedLimit);
    const limitPlaceholder = `$${paramIndex}`;

    // Compute similarity score & combined relevance score:
    // 1. If vector available: Cosine similarity (1.0 - distance)
    // 2. If offline fallback with tokens: Normalized keyword match density (matching_tokens / total_tokens)
    // 3. If multi-attribute only: Constant 0.50 base similarity
    let similaritySqlSnippet: string;
    let relevanceSqlSnippet: string;

    if (hasVector) {
      similaritySqlSnippet = `(1.0 - (cv.embedding <=> ${vectorPlaceholder}))`;
      relevanceSqlSnippet = `(
        (1.0 - (cv.embedding <=> ${vectorPlaceholder})) * 0.70 +
        (COALESCE(cv.safety_rating_ncap, 3.0) / 5.0) * 0.30
      )`;
    } else if (tokenMatchConditions.length > 0) {
      const matchDensityExpr = `((${tokenMatchConditions
        .map((cond) => `(CASE WHEN ${cond} THEN 1.0 ELSE 0.0 END)`)
        .join(' + ')}) / ${tokenMatchConditions.length}.0)`;

      similaritySqlSnippet = matchDensityExpr;
      relevanceSqlSnippet = `(
        (${matchDensityExpr}) * 0.70 +
        (COALESCE(cv.safety_rating_ncap, 3.0) / 5.0) * 0.30
      )`;
    } else {
      similaritySqlSnippet = '0.50';
      relevanceSqlSnippet = `(
        0.50 * 0.70 +
        (COALESCE(cv.safety_rating_ncap, 3.0) / 5.0) * 0.30
      )`;
    }

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
        ROUND((${similaritySqlSnippet})::numeric, 4) AS similarity_score,
        ROUND((${relevanceSqlSnippet})::numeric, 4) AS combined_relevance_score
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
      vector_mode: hasVector
        ? 'pgvector_cosine_distance'
        : searchTokens.length > 0
        ? 'keyword_token_density_fallback'
        : 'multi_attribute_only',
      token_count: searchTokens.length,
      tokens_matched: searchTokens,
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

      const searchTokens = extractSearchTokens(rawPrompt || '');
      if (searchTokens.length > 0) {
        filtered = filtered
          .map((car) => {
            const carText = `${car.manufacturer_name} ${car.model_name} ${car.variant_name} ${car.body_type} ${car.fuel_type} ${car.transmission} ${(car.standard_features || []).join(' ')}`.toLowerCase();
            const matchCount = searchTokens.reduce((acc, t) => acc + (carText.includes(t) ? 1 : 0), 0);
            const density = matchCount / searchTokens.length;
            const score = Number((density * 0.70 + (car.safety_rating_ncap / 5.0) * 0.30).toFixed(4));
            return { ...car, similarity_score: Number(density.toFixed(4)), combined_relevance_score: score, matchCount };
          })
          .filter((car) => car.matchCount > 0)
          .sort((a, b) => b.combined_relevance_score - a.combined_relevance_score);
      }

      return NextResponse.json({
        success: true,
        count: filtered.length,
        data_source: 'simulated_offline_showcase',
        is_simulated_demo: true,
        data: filtered.slice(0, parsedLimit),
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
