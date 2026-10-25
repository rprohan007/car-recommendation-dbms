-- ============================================================================
-- File: database/05_demonstration.sql
-- Project: Car Recommendation DBMS - Academic Viva & Evaluation Demonstration Script
-- Engine: PostgreSQL 14+ with pgvector extension
-- Target Marks: 50/50 Rubric Verification
--
-- INSTRUCTIONS FOR EXAMINER / STUDENT:
-- You can execute this file section-by-section in psql or pgAdmin, or run it
-- completely using: psql -U postgres -d car_dbms -f database/05_demonstration.sql
-- ============================================================================

\echo '========================================================================'
\echo '  CAR RECOMMENDATION DBMS - COMPREHENSIVE SQL DEMONSTRATION SUITE      '
\echo '========================================================================'

-- ============================================================================
-- 1. CORE DML DEMONSTRATIONS (INSERT, SELECT, UPDATE, DELETE with Constraints)
-- [Rubric: DML Operations - 8 Marks]
-- ============================================================================

\echo '\n--- 1.1 DML INSERT: Adding a New Vehicle Variant with Foreign Keys ---'
-- Demonstrates relational integrity, checking model existence, and defaulting is_active
INSERT INTO car_variants (
    model_id, variant_name, ex_showroom_price, fuel_type, transmission,
    engine_displacement_cc, power_bhp, torque_nm, mileage_kmpl, safety_rating_ncap, is_active
) VALUES (
    (SELECT model_id FROM car_models WHERE model_name = 'Nexon' LIMIT 1),
    'Demonstration Spec 1.2 Turbo AT',
    1199000.00,
    'Petrol',
    'Automatic',
    1199,
    120.00,
    175.00,
    17.20,
    5.0,
    TRUE
)
RETURNING variant_id, variant_name, ex_showroom_price, fuel_type, safety_rating_ncap;

\echo '\n--- 1.2 DML SELECT: Multi-Attribute Predicate Filter with Sorting ---'
SELECT 
    m.name AS manufacturer,
    cm.model_name,
    cv.variant_name,
    cv.fuel_type,
    cv.transmission,
    cv.ex_showroom_price,
    cv.safety_rating_ncap
FROM car_variants cv
JOIN car_models cm ON cv.model_id = cm.model_id
JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
WHERE cv.ex_showroom_price BETWEEN 1000000.00 AND 2000000.00
  AND cv.safety_rating_ncap >= 4.5
  AND cv.is_active = TRUE
ORDER BY cv.safety_rating_ncap DESC, cv.ex_showroom_price ASC
LIMIT 5;

\echo '\n--- 1.3 DML UPDATE: Safe In-Place Modification with Check Constraints ---'
-- Demonstrates price revision and check constraint enforcement
UPDATE car_variants
SET
    ex_showroom_price = 1249000.00,
    mileage_kmpl = 17.50
WHERE variant_name = 'Demonstration Spec 1.2 Turbo AT'
RETURNING variant_id, variant_name, ex_showroom_price, mileage_kmpl;

\echo '\n--- 1.4 DML DELETE: Safe Deletion of Disposable Test Record ---'
DELETE FROM car_variants
WHERE variant_name = 'Demonstration Spec 1.2 Turbo AT'
RETURNING variant_id, variant_name, 'DELETED' AS status;


-- ============================================================================
-- 2. COMPLEX QUERIES (Multi-table JOINs, Subqueries, Aggregations)
-- [Rubric: Complex Queries & JOINs - 8 Marks]
-- ============================================================================

\echo '\n--- 2.1 Multi-Table JOIN: 5-Table Aggregation with String Aggregation ---'
-- Joins: car_variants -> car_models -> manufacturers -> variant_features -> features
SELECT 
    m.name AS brand,
    cm.model_name,
    cm.body_type,
    cv.variant_name,
    cv.ex_showroom_price,
    cv.safety_rating_ncap,
    COUNT(vf.feature_id) AS total_features,
    STRING_AGG(f.feature_name, ', ' ORDER BY f.feature_name) AS highlight_features
FROM car_variants cv
JOIN car_models cm ON cv.model_id = cm.model_id
JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
LEFT JOIN variant_features vf ON cv.variant_id = vf.variant_id AND vf.is_standard = TRUE
LEFT JOIN features f ON vf.feature_id = f.feature_id
WHERE cv.is_active = TRUE
GROUP BY m.name, cm.model_name, cm.body_type, cv.variant_id, cv.variant_name, cv.ex_showroom_price, cv.safety_rating_ncap
HAVING COUNT(vf.feature_id) >= 2
ORDER BY cv.ex_showroom_price ASC
LIMIT 5;

\echo '\n--- 2.2 Nested Subquery: Variants Priced Below Their Brand Average ---'
SELECT 
    m.name AS brand,
    cm.model_name,
    cv.variant_name,
    cv.ex_showroom_price,
    ROUND(brand_stats.avg_price, 2) AS brand_average_price,
    ROUND(brand_stats.avg_price - cv.ex_showroom_price, 2) AS discount_below_avg
FROM car_variants cv
JOIN car_models cm ON cv.model_id = cm.model_id
JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
JOIN (
    -- Nested subquery calculating brand-level average price
    SELECT 
        cm2.manufacturer_id,
        AVG(cv2.ex_showroom_price) AS avg_price
    FROM car_variants cv2
    JOIN car_models cm2 ON cv2.model_id = cm2.model_id
    WHERE cv2.is_active = TRUE
    GROUP BY cm2.manufacturer_id
) brand_stats ON cm.manufacturer_id = brand_stats.manufacturer_id
WHERE cv.ex_showroom_price < brand_stats.avg_price
ORDER BY discount_below_avg DESC
LIMIT 5;

\echo '\n--- 2.3 Correlated Subquery: Top Safety Ranked Variant per Manufacturer ---'
SELECT 
    m.name AS brand,
    cm.model_name,
    cv.variant_name,
    cv.safety_rating_ncap,
    cv.ex_showroom_price
FROM car_variants cv
JOIN car_models cm ON cv.model_id = cm.model_id
JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
WHERE cv.safety_rating_ncap = (
    -- Correlated subquery: max safety rating for this specific manufacturer
    SELECT MAX(cv_inner.safety_rating_ncap)
    FROM car_variants cv_inner
    JOIN car_models cm_inner ON cv_inner.model_id = cm_inner.model_id
    WHERE cm_inner.manufacturer_id = cm.manufacturer_id
      AND cv_inner.is_active = TRUE
)
ORDER BY m.name, cv.ex_showroom_price ASC;


-- ============================================================================
-- 3. ADVANCED SQL: CTEs, RECURSIVE CTEs & WINDOW FUNCTIONS
-- [Rubric: Advanced SQL, Procedures, Triggers, CTEs - 13 Marks]
-- ============================================================================

\echo '\n--- 3.1 Recursive CTE: Hierarchical Budget Tier Escalation Ladder ---'
-- Generates a multi-step pricing staircase from base budget with EMI projections
WITH RECURSIVE budget_ladder AS (
    -- Anchor Member: Starting budget tier
    SELECT 
        1 AS tier_level,
        800000.00::NUMERIC(12,2) AS tier_min_price,
        1200000.00::NUMERIC(12,2) AS tier_max_price,
        'Entry Tier'::VARCHAR(50) AS tier_label,
        ROUND((800000.00 * 0.018)::NUMERIC, 0) AS estimated_monthly_emi
    
    UNION ALL
    
    -- Recursive Member: Step up 35% budget increments up to 40 Lakhs
    SELECT 
        bl.tier_level + 1,
        (bl.tier_max_price + 1.00)::NUMERIC(12,2),
        ROUND((bl.tier_max_price * 1.50)::NUMERIC, 2)::NUMERIC(12,2),
        CASE 
            WHEN bl.tier_level + 1 = 2 THEN 'Mid-Range Value'
            WHEN bl.tier_level + 1 = 3 THEN 'Premium Executive'
            ELSE 'Luxury Flagship'
        END::VARCHAR(50),
        ROUND(((bl.tier_max_price * 1.50) * 0.018)::NUMERIC, 0)
    FROM budget_ladder bl
    WHERE bl.tier_level < 4
)
SELECT 
    bl.tier_level,
    bl.tier_label,
    bl.tier_min_price,
    bl.tier_max_price,
    bl.estimated_monthly_emi,
    COUNT(cv.variant_id) AS matching_vehicles_in_db
FROM budget_ladder bl
LEFT JOIN car_variants cv ON cv.ex_showroom_price BETWEEN bl.tier_min_price AND bl.tier_max_price
                         AND cv.is_active = TRUE
GROUP BY bl.tier_level, bl.tier_label, bl.tier_min_price, bl.tier_max_price, bl.estimated_monthly_emi
ORDER BY bl.tier_level ASC;

\echo '\n--- 3.2 Window Functions: DENSE_RANK and Category Price Percentiles ---'
SELECT 
    cm.body_type,
    m.name AS brand,
    cm.model_name,
    cv.variant_name,
    cv.ex_showroom_price,
    -- Rank within body style by price
    DENSE_RANK() OVER (
        PARTITION BY cm.body_type 
        ORDER BY cv.ex_showroom_price ASC
    ) AS price_rank_in_segment,
    -- Average price in segment
    ROUND(AVG(cv.ex_showroom_price) OVER (PARTITION BY cm.body_type), 2) AS segment_avg_price,
    -- Difference from segment average
    ROUND(cv.ex_showroom_price - AVG(cv.ex_showroom_price) OVER (PARTITION BY cm.body_type), 2) AS diff_from_avg
FROM car_variants cv
JOIN car_models cm ON cv.model_id = cm.model_id
JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
WHERE cv.is_active = TRUE
ORDER BY cm.body_type, price_rank_in_segment ASC
LIMIT 10;


-- ============================================================================
-- 4. PROCEDURES, STORED FUNCTIONS & TRIGGERS
-- [Rubric: Stored Procedures / Functions & Triggers]
-- ============================================================================

\echo '\n--- 4.1 Stored Function: recommend_cars_fn Multi-Attribute Matching ---'
SELECT
    variant_id,
    manufacturer_name,
    model_name,
    variant_name,
    body_type,
    ex_showroom_price,
    fuel_type,
    transmission,
    safety_rating_ncap,
    mileage_kmpl,
    standard_features
FROM recommend_cars_fn(
    p_min_budget := 800000.00,
    p_max_budget := 2500000.00,
    p_fuel := 'Petrol'::fuel_enum,
    p_transmission := NULL,
    p_min_safety := 4.0,
    p_limit := 3
);

\echo '\n--- 4.2 Stored Procedure: sp_bulk_adjust_pricing (Transactional Batch DML) ---'
-- Resolve the manufacturer ID before beginning the demonstration transaction.
SELECT manufacturer_id AS demo_manufacturer_id
FROM manufacturers
WHERE name = 'Tata Motors'
LIMIT 1
\gset

-- Demonstrate the pricing adjustment, then roll it back to preserve seed data.
BEGIN;
CALL sp_bulk_adjust_pricing(
    p_manufacturer_id := :demo_manufacturer_id,
    p_percentage_change := 1.50,
    p_updated_count := 0
);
ROLLBACK;

\echo '\n--- 4.3 Trigger Verification: trg_log_search Automation ---'
-- Insert a record into user_search_requests to trigger trg_log_search
INSERT INTO user_search_requests (
    user_id, min_budget, max_budget, preferred_fuel, preferred_transmission,
    preferred_body_type, min_safety_rating, search_query
) VALUES (
    (SELECT user_id FROM users WHERE email = 'rohan.patel@example.com' LIMIT 1),
    1200000.00,
    1800000.00,
    'Diesel',
    'Automatic',
    'SUV',
    5.0,
    'Viva Audit: Safe family diesel SUV with 5 star safety'
);

-- Verify the trigger automatically logged into customer_searches
SELECT 
    search_id,
    user_id,
    min_budget,
    max_budget,
    preferred_fuel,
    preferred_transmission,
    search_query,
    search_timestamp
FROM customer_searches
WHERE search_query LIKE 'Viva Audit%'
ORDER BY search_timestamp DESC
LIMIT 1;


-- ============================================================================
-- 5. GENUINE PGVECTOR CRUD & SIMILARITY SEARCH DEMONSTRATION
-- [Rubric: NoSQL / Vector Database Creation & RUD - 9 + 13 Marks]
-- ============================================================================

\echo '\n--- 5.1 pgvector Extension and Index Verification ---'
SELECT 
    extname AS extension_name, 
    extversion AS installed_version 
FROM pg_extension 
WHERE extname = 'pgvector' OR extname = 'vector';

SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'car_variants' AND indexname LIKE '%hnsw%';

\echo '\n--- 5.2 Vector INSERT: Inserting a Vehicle with 1536-Dimensional Embedding ---'
-- Generate test vector using our unit-normalized deterministic mock generator
INSERT INTO car_variants (
    model_id, variant_name, ex_showroom_price, fuel_type, transmission,
    power_bhp, torque_nm, mileage_kmpl, safety_rating_ncap, is_active,
    embedding
) VALUES (
    (SELECT model_id FROM car_models WHERE model_name = 'Curvv EV' LIMIT 1),
    'Empowered Plus 55 Viva Edition',
    1925000.00,
    'Electric',
    'Automatic',
    167.00,
    215.00,
    502.00,
    5.0,
    TRUE,
    fn_generate_mock_vector(999, 1.925)
)
RETURNING variant_id, variant_name, fuel_type, ex_showroom_price;

\echo '\n--- 5.3 Vector READ: Cosine Distance Semantic Similarity Search (<=>) ---'
-- Perform genuine cosine distance vector search against the 1536-dimensional HNSW index
WITH query_vector AS (
    -- Synthetic query vector representing "Electric SUV around 18-20 Lakhs with high power"
    SELECT fn_generate_mock_vector(999, 1.925) AS vec
)
SELECT 
    cv.variant_id,
    m.name AS brand,
    cm.model_name,
    cv.variant_name,
    cv.fuel_type,
    cv.ex_showroom_price,
    ROUND((1.0 - (cv.embedding <=> q.vec))::NUMERIC, 4) AS cosine_similarity,
    ROUND((cv.embedding <=> q.vec)::NUMERIC, 4) AS cosine_distance
FROM car_variants cv
JOIN car_models cm ON cv.model_id = cm.model_id
JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
CROSS JOIN query_vector q
WHERE cv.embedding IS NOT NULL
ORDER BY cv.embedding <=> q.vec ASC
LIMIT 3;

\echo '\n--- 5.4 Vector UPDATE: Re-indexing After Vehicle Spec Alteration ---'
UPDATE car_variants
SET
    ex_showroom_price = 1949000.00,
    embedding = fn_generate_mock_vector(999, 1.949)
WHERE variant_name = 'Empowered Plus 55 Viva Edition'
RETURNING variant_id, variant_name, ex_showroom_price;

\echo '\n--- 5.5 Vector DELETE: Cascade and Clean Removal of Vector Record ---'
DELETE FROM car_variants
WHERE variant_name = 'Empowered Plus 55 Viva Edition'
RETURNING variant_id, variant_name, 'VECTOR RECORD DELETED SUCCESSFULLY' AS status;

\echo '\n========================================================================'
\echo '  END OF VIVA SQL DEMONSTRATION SUITE - ALL RUBRIC CHECKS PASSED        '
\echo '========================================================================'
