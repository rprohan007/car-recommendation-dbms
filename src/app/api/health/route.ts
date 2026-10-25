import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAppEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const env = getAppEnv();
  const startTime = Date.now();

  const report: Record<string, any> = {
    status: 'UNKNOWN',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    checks: {
      database_connection: false,
      pgvector_extension: false,
      vector_dimension: 1536,
      openai_neural_embeddings: Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.startsWith('sk-')),
      jwt_secret_configured: Boolean(env.NEXTAUTH_SECRET && env.NEXTAUTH_SECRET.length >= 32),
    },
    tables: {},
  };

  try {
    // 1. Check basic SQL connection
    const pingRes = await query('SELECT 1 AS connected, CURRENT_TIMESTAMP AS db_time;');
    if (pingRes.rows[0]?.connected === 1) {
      report.checks.database_connection = true;
      report.db_time = pingRes.rows[0].db_time;
    }

    // 2. Check pgvector extension status
    const extRes = await query(
      "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"
    );
    if (extRes.rows.length > 0) {
      report.checks.pgvector_extension = true;
      report.checks.pgvector_version = extRes.rows[0].extversion;
    }

    // 3. Check table record counts
    const countSql = `
      SELECT 
        (SELECT COUNT(*) FROM users) AS users_count,
        (SELECT COUNT(*) FROM manufacturers) AS manufacturers_count,
        (SELECT COUNT(*) FROM car_models) AS models_count,
        (SELECT COUNT(*) FROM car_variants) AS variants_count,
        (SELECT COUNT(*) FROM features) AS features_count;
    `;
    const counts = await query(countSql);
    report.tables = counts.rows[0];

    report.latency_ms = Date.now() - startTime;
    report.status = report.checks.database_connection ? 'HEALTHY' : 'DOWN';

    return NextResponse.json(report, { status: 200 });
  } catch (err: any) {
    report.status = 'DOWN';
    report.error = 'PostgreSQL database connection refused or uninitialized';
    report.details = err?.message;
    report.latency_ms = Date.now() - startTime;

    return NextResponse.json(report, { status: 503 });
  }
}
