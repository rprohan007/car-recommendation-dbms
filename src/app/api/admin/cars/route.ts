import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, pool } from '@/lib/db';
import { getEmbedding, buildEnrichedVehicleText } from '@/lib/embeddings';
import { requireAdmin } from '@/lib/auth-helpers';
import { CarVariantAdminSchema, CarVariantUpdateSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

async function verifyAdminAuth(req: NextRequest) {
  const { user, errorResponse } = await requireAdmin(req);
  if (!errorResponse && user) {
    return { authorized: true, user };
  }

  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const role = (session.user.role as string)?.toUpperCase();
      if (role === 'ADMIN') {
        return { authorized: true, user: session.user };
      }
      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, error: 'Forbidden: Insufficient privileges. ADMIN role required.' },
          { status: 403 }
        ),
      };
    }
  } catch {
    // Session fallback error ignored
  }

  return {
    authorized: false,
    response:
      errorResponse ||
      NextResponse.json({ success: false, error: 'Forbidden: Insufficient privileges. Authentication required.' }, { status: 401 }),
  };
}

/**
 * GET /api/admin/cars
 * Lists car variants with complete specifications for admin management
 * Protected: Requires ADMIN role
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
    const modelId = searchParams.get('modelId');

    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (modelId) {
      whereClauses.push(`cv.model_id = $${paramIndex}`);
      params.push(parseInt(modelId, 10));
      paramIndex++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const listSql = `
      SELECT
        cv.variant_id,
        cv.variant_name,
        cv.model_id,
        cm.model_name,
        cm.body_type,
        m.manufacturer_id,
        m.name AS manufacturer_name,
        cv.ex_showroom_price,
        cv.fuel_type,
        cv.transmission,
        cv.engine_displacement_cc,
        cv.power_bhp,
        cv.torque_nm,
        cv.mileage_kmpl,
        cv.safety_rating_ncap,
        cv.is_active,
        cv.created_at,
        COUNT(vf.feature_id) AS total_features_count
      FROM car_variants cv
      JOIN car_models cm ON cv.model_id = cm.model_id
      JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
      LEFT JOIN variant_features vf ON cv.variant_id = vf.variant_id
      ${whereSql}
      GROUP BY
        cv.variant_id,
        cv.variant_name,
        cv.model_id,
        cm.model_name,
        cm.body_type,
        m.manufacturer_id,
        m.name,
        cv.ex_showroom_price,
        cv.fuel_type,
        cv.transmission,
        cv.engine_displacement_cc,
        cv.power_bhp,
        cv.torque_nm,
        cv.mileage_kmpl,
        cv.safety_rating_ncap,
        cv.is_active,
        cv.created_at
      ORDER BY cv.variant_id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;

    params.push(limit, offset);

    const result = await query(listSql, params);

    return NextResponse.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err: any) {
    console.error('Database error in GET /api/admin/cars:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database service unavailable. Failed to retrieve car variants.' },
      { status: 503 }
    );
  }
}

/**
 * POST /api/admin/cars
 * Creates a new car variant with specifications and automatic vector embedding
 * Protected: Requires ADMIN role
 */
export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth.authorized) return auth.response;

  let rawBody: any;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON request payload' }, { status: 400 });
  }

  const parseResult = CarVariantAdminSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const firstError = parseResult.error.issues?.[0]?.message || 'Validation failed';
    return NextResponse.json(
      { success: false, error: firstError, errors: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const {
    modelId,
    variantName,
    price: numPrice,
    fuelType,
    transmission,
    engineDisplacementCc,
    powerBhp,
    torqueNm,
    mileageKmpl,
    safetyRating: numSafety,
    featureIds = [],
  } = parseResult.data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch parent model & manufacturer details for rich embedding generation
    const modelMetaRes = await client.query(
      `SELECT cm.model_name, cm.body_type, m.name AS manufacturer_name
       FROM car_models cm
       JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
       WHERE cm.model_id = $1`,
      [Number(modelId)]
    );

    const modelMeta = modelMetaRes.rows[0] || {};

    // Fetch feature names if featureIds provided
    let featureNames: string[] = [];
    if (Array.isArray(featureIds) && featureIds.length > 0) {
      const featRes = await client.query(
        `SELECT feature_name FROM features WHERE feature_id = ANY($1::int[])`,
        [featureIds.map(Number)]
      );
      featureNames = featRes.rows.map((r) => r.feature_name);
    }

    // Build enriched text for semantic vector representation
    const enrichedText = buildEnrichedVehicleText({
      manufacturerName: modelMeta.manufacturer_name,
      modelName: modelMeta.model_name,
      variantName: variantName.trim(),
      bodyType: modelMeta.body_type,
      fuelType: fuelType.trim(),
      transmission: transmission.trim(),
      price: numPrice,
      powerBhp: powerBhp ? Number(powerBhp) : null,
      torqueNm: torqueNm ? Number(torqueNm) : null,
      safetyRating: numSafety,
      features: featureNames,
    });

    const embeddingObj = await getEmbedding(enrichedText);
    const vectorString = embeddingObj.embedding ? `[${embeddingObj.embedding.join(',')}]` : null;

    // Parameterized INSERT into car_variants
    const insertVariantSql = `
      INSERT INTO car_variants (
        model_id,
        variant_name,
        ex_showroom_price,
        fuel_type,
        transmission,
        engine_displacement_cc,
        power_bhp,
        torque_nm,
        mileage_kmpl,
        safety_rating_ncap,
        embedding
      ) VALUES (
        $1, $2, $3, $4::fuel_enum, $5::trans_enum, $6, $7, $8, $9, $10, $11::vector
      )
      RETURNING *;
    `;

    const insertResult = await client.query(insertVariantSql, [
      Number(modelId),
      variantName.trim(),
      numPrice,
      fuelType.trim(),
      transmission.trim(),
      engineDisplacementCc ? Number(engineDisplacementCc) : null,
      powerBhp ? Number(powerBhp) : null,
      torqueNm ? Number(torqueNm) : null,
      mileageKmpl ? Number(mileageKmpl) : null,
      numSafety,
      vectorString,
    ]);

    const createdVariant = insertResult.rows[0];

    // Associate features if provided
    if (Array.isArray(featureIds) && featureIds.length > 0) {
      for (const featId of featureIds) {
        await client.query(
          `INSERT INTO variant_features (variant_id, feature_id, is_standard)
           VALUES ($1, $2, TRUE)
           ON CONFLICT DO NOTHING`,
          [createdVariant.variant_id, Number(featId)]
        );
      }
    }

    await client.query('COMMIT');

    return NextResponse.json(
      {
        success: true,
        message: 'Car variant created successfully with vector embedding',
        data: createdVariant,
        embeddingMode: embeddingObj.mode,
      },
      { status: 201 }
    );
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error in POST /api/admin/cars:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database service unavailable or failed to create variant.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

/**
 * PUT /api/admin/cars
 * Updates specifications, pricing, status, and regenerates vector embeddings
 * Protected: Requires ADMIN role
 */
export async function PUT(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth.authorized) return auth.response;

  let rawBody: any;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON request payload' }, { status: 400 });
  }

  const parseResult = CarVariantUpdateSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const firstError = parseResult.error.issues?.[0]?.message || 'Validation failed';
    return NextResponse.json(
      { success: false, error: firstError, errors: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { variantId, ...fieldsToUpdate } = parseResult.data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check existing record
    const existingRes = await client.query(
      `SELECT cv.*, cm.model_name, cm.body_type, m.name AS manufacturer_name
       FROM car_variants cv
       JOIN car_models cm ON cv.model_id = cm.model_id
       JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
       WHERE cv.variant_id = $1`,
      [Number(variantId)]
    );

    if (existingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: `Variant #${variantId} not found` }, { status: 404 });
    }

    const current = existingRes.rows[0];

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (fieldsToUpdate.variantName !== undefined) {
      updates.push(`variant_name = $${paramIndex}`);
      params.push(fieldsToUpdate.variantName.trim());
      paramIndex++;
    }

    if (fieldsToUpdate.price !== undefined) {
      const p = Number(fieldsToUpdate.price);
      if (isNaN(p) || p <= 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ success: false, error: 'price must be positive' }, { status: 400 });
      }
      updates.push(`ex_showroom_price = $${paramIndex}`);
      params.push(p);
      paramIndex++;
    }

    if (fieldsToUpdate.fuelType !== undefined) {
      updates.push(`fuel_type = $${paramIndex}::fuel_enum`);
      params.push(fieldsToUpdate.fuelType);
      paramIndex++;
    }

    if (fieldsToUpdate.transmission !== undefined) {
      updates.push(`transmission = $${paramIndex}::trans_enum`);
      params.push(fieldsToUpdate.transmission);
      paramIndex++;
    }

    if (fieldsToUpdate.engineDisplacementCc !== undefined) {
      updates.push(`engine_displacement_cc = $${paramIndex}`);
      params.push(fieldsToUpdate.engineDisplacementCc !== null ? Number(fieldsToUpdate.engineDisplacementCc) : null);
      paramIndex++;
    }

    if (fieldsToUpdate.powerBhp !== undefined) {
      updates.push(`power_bhp = $${paramIndex}`);
      params.push(fieldsToUpdate.powerBhp !== null ? Number(fieldsToUpdate.powerBhp) : null);
      paramIndex++;
    }

    if (fieldsToUpdate.torqueNm !== undefined) {
      updates.push(`torque_nm = $${paramIndex}`);
      params.push(fieldsToUpdate.torqueNm !== null ? Number(fieldsToUpdate.torqueNm) : null);
      paramIndex++;
    }

    if (fieldsToUpdate.mileageKmpl !== undefined) {
      updates.push(`mileage_kmpl = $${paramIndex}`);
      params.push(fieldsToUpdate.mileageKmpl !== null ? Number(fieldsToUpdate.mileageKmpl) : null);
      paramIndex++;
    }

    if (fieldsToUpdate.safetyRating !== undefined) {
      const s = fieldsToUpdate.safetyRating !== null ? Number(fieldsToUpdate.safetyRating) : null;
      if (s !== null && (isNaN(s) || s < 0 || s > 5)) {
        await client.query('ROLLBACK');
        return NextResponse.json({ success: false, error: 'safetyRating must be between 0.0 and 5.0' }, { status: 400 });
      }
      updates.push(`safety_rating_ncap = $${paramIndex}`);
      params.push(s);
      paramIndex++;
    }

    if (fieldsToUpdate.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(Boolean(fieldsToUpdate.isActive));
      paramIndex++;
    }

    // Regenerate vector embedding so embeddings never stay stale
    const updatedName = fieldsToUpdate.variantName !== undefined ? fieldsToUpdate.variantName.trim() : current.variant_name;
    const updatedFuel = fieldsToUpdate.fuelType !== undefined ? fieldsToUpdate.fuelType : current.fuel_type;
    const updatedTrans = fieldsToUpdate.transmission !== undefined ? fieldsToUpdate.transmission : current.transmission;
    const updatedPrice = fieldsToUpdate.price !== undefined ? Number(fieldsToUpdate.price) : current.ex_showroom_price;
    const updatedPower = fieldsToUpdate.powerBhp !== undefined ? Number(fieldsToUpdate.powerBhp) : current.power_bhp;
    const updatedSafety = fieldsToUpdate.safetyRating !== undefined ? Number(fieldsToUpdate.safetyRating) : current.safety_rating_ncap;

    const enrichedText = buildEnrichedVehicleText({
      manufacturerName: current.manufacturer_name,
      modelName: current.model_name,
      variantName: updatedName,
      bodyType: current.body_type,
      fuelType: updatedFuel,
      transmission: updatedTrans,
      price: updatedPrice,
      powerBhp: updatedPower,
      safetyRating: updatedSafety,
    });

    const embeddingObj = await getEmbedding(enrichedText);
    if (embeddingObj.embedding) {
      updates.push(`embedding = $${paramIndex}::vector`);
      params.push(`[${embeddingObj.embedding.join(',')}]`);
      paramIndex++;
    }

    if (updates.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'No valid update fields provided' }, { status: 400 });
    }

    params.push(Number(variantId));
    const updateSql = `
      UPDATE car_variants
      SET ${updates.join(', ')}
      WHERE variant_id = $${paramIndex}
      RETURNING *;
    `;

    const result = await client.query(updateSql, params);
    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Car variant updated successfully and vector embedding synchronized',
      data: result.rows[0],
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error in PUT /api/admin/cars:', err?.message);
    return NextResponse.json({ success: false, error: 'Failed to update car variant' }, { status: 500 });
  } finally {
    client.release();
  }
}

/**
 * DELETE /api/admin/cars
 * Deletes or archives a car variant using parameterized SQL DML
 * Protected: Requires ADMIN role
 */
export async function DELETE(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get('id');
    const hardDelete = searchParams.get('hard') === 'true';

    let variantId: number | null = queryId ? parseInt(queryId, 10) : null;

    if (!variantId || isNaN(variantId)) {
      return NextResponse.json({ success: false, error: 'Missing or invalid variant ID' }, { status: 400 });
    }

    if (hardDelete) {
      // Permanent removal using DELETE statement
      const deleteSql = `DELETE FROM car_variants WHERE variant_id = $1 RETURNING variant_id, variant_name;`;
      const result = await query(deleteSql, [variantId]);

      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: `Variant #${variantId} not found` }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `Variant #${variantId} permanently deleted.`,
        deleted: result.rows[0],
      });
    } else {
      // Soft-archive by setting is_active = FALSE
      const archiveSql = `
        UPDATE car_variants
        SET is_active = FALSE
        WHERE variant_id = $1
        RETURNING variant_id, variant_name, is_active;
      `;
      const result = await query(archiveSql, [variantId]);

      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: `Variant #${variantId} not found` }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `Variant #${variantId} archived (is_active set to false).`,
        archived: result.rows[0],
      });
    }
  } catch (err: any) {
    console.error('Error in DELETE /api/admin/cars:', err?.message);
    return NextResponse.json({ success: false, error: 'Failed to delete or archive variant' }, { status: 500 });
  }
}
