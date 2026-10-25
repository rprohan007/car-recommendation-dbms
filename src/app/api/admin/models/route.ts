import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/models
 * Lists all car models with manufacturer, launch dates, and status
 * Protected: Requires ADMIN role
 */
export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    const sql = `
      SELECT 
        cm.model_id,
        cm.manufacturer_id,
        m.name AS manufacturer_name,
        cm.model_name,
        cm.body_type,
        cm.launch_status,
        cm.expected_launch_date,
        cm.seating_capacity,
        COUNT(cv.variant_id) AS variant_count
      FROM car_models cm
      JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
      LEFT JOIN car_variants cv ON cm.model_id = cv.model_id
      GROUP BY 
        cm.model_id,
        cm.manufacturer_id,
        m.name,
        cm.model_name,
        cm.body_type,
        cm.launch_status,
        cm.expected_launch_date,
        cm.seating_capacity
      ORDER BY cm.launch_status DESC, cm.model_name ASC;
    `;
    const result = await query(sql);
    return NextResponse.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err: any) {
    console.error('GET /api/admin/models DB query failed:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database service unavailable. Failed to retrieve models.' },
      { status: 503 }
    );
  }
}

/**
 * PUT /api/admin/models
 * Updates expected_launch_date and/or launch_status of a model
 * Protected: Requires ADMIN role
 */
export async function PUT(req: NextRequest) {
  const { errorResponse } = await requireAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { modelId, expectedLaunchDate, launchStatus, modelName } = body;

    if (!modelId) {
      return NextResponse.json({ success: false, error: 'modelId is required' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (expectedLaunchDate !== undefined) {
      updates.push(`expected_launch_date = $${paramIdx}`);
      params.push(expectedLaunchDate || null);
      paramIdx++;
    }

    if (launchStatus !== undefined) {
      updates.push(`launch_status = $${paramIdx}::launch_status`);
      params.push(launchStatus);
      paramIdx++;
    }

    if (modelName !== undefined) {
      updates.push(`model_name = $${paramIdx}`);
      params.push(modelName.trim());
      paramIdx++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No update parameters provided' }, { status: 400 });
    }

    params.push(Number(modelId));
    const sql = `UPDATE car_models SET ${updates.join(', ')} WHERE model_id = $${paramIdx} RETURNING *;`;
    const res = await query(sql, params);

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: `Model #${modelId} not found` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Model #${modelId} updated successfully`,
      data: res.rows[0],
    });
  } catch (err: any) {
    console.error('PUT /api/admin/models error:', err?.message);
    return NextResponse.json({ success: false, error: 'Failed to update model in database' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/models
 * Deletes or archives a car model
 * Protected: Requires ADMIN role
 */
export async function DELETE(req: NextRequest) {
  const { errorResponse } = await requireAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const modelId = searchParams.get('id');

    if (!modelId) {
      return NextResponse.json({ success: false, error: 'modelId query parameter is required' }, { status: 400 });
    }

    const sql = `DELETE FROM car_models WHERE model_id = $1 RETURNING model_id, model_name;`;
    const res = await query(sql, [parseInt(modelId, 10)]);

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: `Model #${modelId} not found` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Model #${modelId} (${res.rows[0].model_name}) deleted successfully`,
      data: res.rows[0],
    });
  } catch (err: any) {
    console.error('DELETE /api/admin/models error:', err?.message);
    return NextResponse.json({ success: false, error: 'Failed to delete model from database' }, { status: 500 });
  }
}
