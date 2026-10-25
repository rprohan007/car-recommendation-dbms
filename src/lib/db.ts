import { Pool, QueryResult, QueryResultRow } from 'pg';

/**
 * PostgreSQL Connection Pool configuration
 * Utilizes DATABASE_URL with a singleton pattern in development
 * to prevent connection exhaustion during Next.js hot-reloads.
 */
declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cardb';

export const pool: Pool =
  global.pgPool ||
  new Pool({
    connectionString,
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  global.pgPool = pool;
}

// Log unexpected connection pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

/**
 * Helper function for executing parameterized SQL queries safely.
 *
 * @param text The SQL query string with parameter placeholders ($1, $2, etc.)
 * @param params Array of parameters to bind to the placeholders
 * @returns QueryResult containing rows, rowCount, fields, etc.
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text: text.trim().slice(0, 100), duration: `${duration}ms`, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query execution error:', {
      query: text,
      params,
      error,
    });
    throw error;
  }
}
