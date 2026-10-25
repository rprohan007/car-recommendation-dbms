-- ============================================================================
-- File: database/02_vector_setup.sql
-- Description: pgvector Extension Setup, Vector Column DDL, and HNSW Index
-- Database Engine: PostgreSQL 14+ with pgvector extension
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENABLE PGVECTOR EXTENSION
-- ----------------------------------------------------------------------------
-- pgvector enables native vector storage, distance operators, and vector indexing
CREATE EXTENSION IF NOT EXISTS vector;

-- ----------------------------------------------------------------------------
-- 2. ADD 1536-DIMENSIONAL EMBEDDING COLUMN TO CAR_VARIANTS
-- ----------------------------------------------------------------------------
-- 1536 dimensions match standard text embeddings (e.g., OpenAI text-embedding-3-small,
-- text-embedding-ada-002) for semantic search over car specs, reviews, and features.
ALTER TABLE car_variants 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- ----------------------------------------------------------------------------
-- 3. CREATE HNSW (Hierarchical Navigable Small World) VECTOR INDEX
-- ----------------------------------------------------------------------------
-- Uses vector_cosine_ops for cosine similarity search (distance operator: <=>).
-- Parameters:
--   m = 16: Max number of bidirectional links per node in the graph layer.
--   ef_construction = 64: Size of the dynamic candidate list for index building.
CREATE INDEX IF NOT EXISTS idx_car_variants_embedding_hnsw
ON car_variants 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ----------------------------------------------------------------------------
-- 4. UTILITY HELPER FUNCTION: SEMANTIC CAR VARIANT MATCHING
-- ----------------------------------------------------------------------------
-- Finds top-K car variants matching an input query embedding based on cosine similarity
CREATE OR REPLACE FUNCTION match_car_variants_semantic(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.60,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    variant_id INT,
    variant_name VARCHAR,
    model_name VARCHAR,
    manufacturer_name VARCHAR,
    body_type body_type,
    ex_showroom_price NUMERIC,
    fuel_type fuel_enum,
    safety_rating_ncap NUMERIC,
    cosine_similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Optional runtime search precision tuning:
    -- SET LOCAL hnsw.ef_search = 40;

    RETURN QUERY
    SELECT 
        cv.variant_id,
        cv.variant_name,
        cm.model_name,
        m.name AS manufacturer_name,
        cm.body_type,
        cv.ex_showroom_price,
        cv.fuel_type,
        cv.safety_rating_ncap,
        (1.0 - (cv.embedding <=> query_embedding))::FLOAT AS cosine_similarity
    FROM car_variants cv
    JOIN car_models cm ON cv.model_id = cm.model_id
    JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
    WHERE cv.embedding IS NOT NULL
      AND (1.0 - (cv.embedding <=> query_embedding)) >= match_threshold
    ORDER BY cv.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;
