import { NextRequest, NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { getEmbedding } from '@/lib/embeddings';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/cars
 * Lists car variants with complete specifications for admin management
 */
export async function GET(req: NextRequest) {
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
    console.error('Error in GET /api/admin/cars:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve car variants', details: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/cars
 * Creates a new car variant with specifications and automatic vector embedding
 */
export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await req.json();
    const {
      modelId,
      variantName,
      price,
      fuelType,
      transmission,
      engineDisplacementCc,
      powerBhp,
      torqueNm,
      mileageKmpl,
      safetyRating,
      featureIds = [],
    } = body;

    // Strict validation
    if (!modelId || !variantName || price === undefined || !fuelType || !transmission) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: modelId, variantName, price, fuelType, transmission are required.',
        },
        { status: 400 }
      );
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return NextResponse.json({ success: false, error: 'price must be a positive number' }, { status: 400 });
    }

    const numSafety = safetyRating !== undefined && safetyRating !== null ? Number(safetyRating) : null;
    if (numSafety !== null && (isNaN(numSafety) || numSafety < 0 || numSafety > 5)) {
      return NextResponse.json({ success: false, error: 'safetyRating must be between 0.0 and 5.0' }, { status: 400 });
    }

    // Auto-generate semantic text representation for vector embedding
    const descForEmbedding = `${variantName} ${fuelType} ${transmission} ex-showroom ${numPrice} INR safety ${numSafety || 'unrated'} stars`;
    const embeddingArray = await getEmbedding(descForEmbedding);
    const vectorString = `[${embeddingArray.join(',')}]`;

    await client.query('BEGIN');

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
      modelId,
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
          [createdVariant.variant_id, featId]
        );
      }
    }

    await client.query('COMMIT');

    return NextResponse.json(
      {
        success: true,
        message: 'Car variant created successfully',
        data: createdVariant,
      },
      { status: 201 }
    );
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error in POST /api/admin/cars:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create car variant',
        details: err.message,
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

/**
 * PUT /api/admin/cars
 * Updates specifications, pricing, or status of an existing car variant
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { variantId, ...fieldsToUpdate } = body;

    if (!variantId) {
      return NextResponse.json(
        { success: false, error: 'variantId is required to update a car variant' },
        { status: 400 }
      );
    }

    // Dynamic Parameterized UPDATE Statement
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

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid update fields provided.' },
        { status: 400 }
      );
    }

    // Append variantId as the final parameter
    params.push(variantId);
    const updateSql = `
      UPDATE car_variants 
      SET ${updates.join(', ')}
      WHERE variant_id = $${paramIndex}
      RETURNING *;
    `;

    const result = await query(updateSql, params);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: `Car variant with ID ${variantId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Car variant updated successfully',
      data: result.rows[0],
    });
  } catch (err: any) {
    console.error('Error in PUT /api/admin/cars:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update car variant', details: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/cars
 * Deletes or archives a car variant using parameterized SQL DML
 * Usage: DELETE /api/admin/cars?id=123 OR payload { variantId: 123, hardDelete: false }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get('id');

    let variantId: number | null = null;
    let hardDelete = false;

    if (queryId) {
      variantId = parseInt(queryId, 10);
      hardDelete = searchParams.get('hard') === 'true';
    } else {
      try {
        const body = await req.json();
        variantId = body.variantId ? parseInt(body.variantId, 10) : null;
        hardDelete = Boolean(body.hardDelete);
      } catch {
        // Body was empty or invalid JSON
      }
    }

    if (!variantId || isNaN(variantId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid variantId. Provide via query (?id=123) or JSON payload.',
        },
        { status: 400 }
      );
    }

    if (hardDelete) {
      // Permanent removal using DELETE statement
      const deleteSql = `DELETE FROM car_variants WHERE variant_id = $1 RETURNING variant_id, variant_name;`;
      const result = await query(deleteSql, [variantId]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: `Variant with ID ${variantId} not found.` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Variant ${variantId} permanently deleted.`,
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
        return NextResponse.json(
          { success: false, error: `Variant with ID ${variantId} not found.` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Variant ${variantId} archived (is_active set to false).`,
        archived: result.rows[0],
      });
    }
  } catch (err: any) {
    console.error('Error in DELETE /api/admin/cars:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to delete/archive car variant', details: err.message },
      { status: 500 }
    );
  }
}
