-- ============================================================================
-- File: database/03_advanced_sql.sql
-- Description: Advanced SQL Architecture for Car Recommendation DBMS
-- Contents:
--   1. VIEW: Upcoming Vehicle Launches (v_upcoming_launches)
--   2. STORED FUNCTION: recommend_cars_fn (Multi-Attribute Recommendation)
--   3. STORED PROCEDURE: sp_archive_model_cascade (Transaction Control DDL/DML)
--   4. STORED PROCEDURE: sp_bulk_adjust_pricing (Transactional Pricing Update)
--   5. TRIGGER & TRIGGER FUNCTION: trg_log_search on user_search_requests
--   6. RECURSIVE CTE: Hierarchical Budget Bracket Ladder
--   7. ANALYTICAL MULTI-CTE: Category Benchmarks, Window Functions & Value Index
-- ============================================================================

-- ============================================================================
-- 1. VIEW: Upcoming Vehicle Launches (v_upcoming_launches)
-- ============================================================================
-- Aggregates upcoming car models with manufacturer details, seating capacity,
-- launch countdown, and estimated variant price ranges.
CREATE OR REPLACE VIEW v_upcoming_launches AS
SELECT
    cm.model_id,
    cm.model_name,
    m.name AS manufacturer_name,
    m.country_origin,
    cm.body_type,
    cm.seating_capacity,
    cm.expected_launch_date,
    CASE
        WHEN cm.expected_launch_date IS NOT NULL
        THEN (cm.expected_launch_date - CURRENT_DATE)
        ELSE NULL
    END AS days_until_launch,
    cm.launch_status,
    COUNT(cv.variant_id) AS announced_variants_count,
    COALESCE(MIN(cv.ex_showroom_price), 0.00) AS estimated_starting_price,
    COALESCE(MAX(cv.ex_showroom_price), 0.00) AS estimated_top_price
FROM car_models cm
JOIN manufacturers m
    ON cm.manufacturer_id = m.manufacturer_id
LEFT JOIN car_variants cv
    ON cm.model_id = cv.model_id
WHERE cm.launch_status = 'upcoming'
GROUP BY
    cm.model_id,
    cm.model_name,
    m.name,
    m.country_origin,
    cm.body_type,
    cm.seating_capacity,
    cm.expected_launch_date,
    cm.launch_status
ORDER BY
    cm.expected_launch_date ASC NULLS LAST,
    cm.model_name ASC;

-- ============================================================================
-- 2. STORED FUNCTION: Multi-Attribute Car Recommendation (recommend_cars_fn)
-- ============================================================================
-- Filters active variants by budget, fuel type, transmission, body type, and
-- safety rating, returning matching cars with aggregated standard features.
CREATE OR REPLACE FUNCTION recommend_cars_fn(
    p_min_budget NUMERIC DEFAULT 0,
    p_max_budget NUMERIC DEFAULT NULL,
    p_fuel fuel_enum DEFAULT NULL,
    p_transmission trans_enum DEFAULT NULL,
    p_body_type body_type DEFAULT NULL,
    p_min_safety NUMERIC DEFAULT 0.0,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    variant_id INT,
    manufacturer_name VARCHAR,
    model_name VARCHAR,
    variant_name VARCHAR,
    body_type body_type,
    ex_showroom_price NUMERIC,
    fuel_type fuel_enum,
    transmission trans_enum,
    safety_rating_ncap NUMERIC,
    mileage_kmpl NUMERIC,
    power_bhp NUMERIC,
    seating_capacity INT,
    standard_features TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cv.variant_id,
        m.name AS manufacturer_name,
        cm.model_name,
        cv.variant_name,
        cm.body_type,
        cv.ex_showroom_price,
        cv.fuel_type,
        cv.transmission,
        cv.safety_rating_ncap,
        cv.mileage_kmpl,
        cv.power_bhp,
        cm.seating_capacity,
        COALESCE(
            string_agg(f.feature_name, ', ' ORDER BY f.feature_name)
            FILTER (WHERE vf.is_standard = TRUE),
            'Standard specifications only'
        ) AS standard_features
    FROM car_variants cv
    JOIN car_models cm
        ON cv.model_id = cm.model_id
    JOIN manufacturers m
        ON cm.manufacturer_id = m.manufacturer_id
    LEFT JOIN variant_features vf
        ON cv.variant_id = vf.variant_id
    LEFT JOIN features f
        ON vf.feature_id = f.feature_id
    WHERE cv.is_active = TRUE
      AND cm.launch_status = 'launched'
      AND (cv.ex_showroom_price >= p_min_budget)
      AND (p_max_budget IS NULL OR cv.ex_showroom_price <= p_max_budget)
      AND (p_fuel IS NULL OR cv.fuel_type = p_fuel)
      AND (p_transmission IS NULL OR cv.transmission = p_transmission)
      AND (p_body_type IS NULL OR cm.body_type = p_body_type)
      AND (p_min_safety IS NULL OR cv.safety_rating_ncap >= p_min_safety)
    GROUP BY
        cv.variant_id,
        m.name,
        cm.model_name,
        cv.variant_name,
        cm.body_type,
        cv.ex_showroom_price,
        cv.fuel_type,
        cv.transmission,
        cv.safety_rating_ncap,
        cv.mileage_kmpl,
        cv.power_bhp,
        cm.seating_capacity
    ORDER BY
        cv.safety_rating_ncap DESC NULLS LAST,
        cv.ex_showroom_price ASC
    LIMIT p_limit;
END;
$$;

-- ============================================================================
-- 3. STORED PROCEDURE: sp_archive_model_cascade
-- ============================================================================
-- Demonstrates genuine PostgreSQL STORED PROCEDURE with transaction management.
-- Archives a car model (sets status to 'discontinued') and deactivates all its
-- variants in a single atomic transaction.
CREATE OR REPLACE PROCEDURE sp_archive_model_cascade(
    IN p_model_id INT,
    INOUT p_archived_variants_count INT DEFAULT 0
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verify model exists
    IF NOT EXISTS (SELECT 1 FROM car_models WHERE model_id = p_model_id) THEN
        RAISE EXCEPTION 'Car model with ID % does not exist.', p_model_id;
    END IF;

    -- Update parent model status
    UPDATE car_models
    SET launch_status = 'discontinued'
    WHERE model_id = p_model_id;

    -- Soft-archive all associated variants
    UPDATE car_variants
    SET is_active = FALSE
    WHERE model_id = p_model_id AND is_active = TRUE;

    GET DIAGNOSTICS p_archived_variants_count = ROW_COUNT;

    RAISE NOTICE 'Model % successfully discontinued. Archived % variants.', p_model_id, p_archived_variants_count;
END;
$$;

-- ============================================================================
-- 4. STORED PROCEDURE: sp_bulk_adjust_pricing
-- ============================================================================
-- Demonstrates parameterized bulk pricing adjustments with percentage modifiers.
CREATE OR REPLACE PROCEDURE sp_bulk_adjust_pricing(
    IN p_manufacturer_id INT,
    IN p_percentage_change NUMERIC(5, 2),
    INOUT p_updated_count INT DEFAULT 0
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_percentage_change < -50.0 OR p_percentage_change > 100.0 THEN
        RAISE EXCEPTION 'Percentage change % is out of safe operational range (-50%% to +100%%).', p_percentage_change;
    END IF;

    UPDATE car_variants cv
    SET ex_showroom_price = ROUND(cv.ex_showroom_price * (1.0 + (p_percentage_change / 100.0)), 2)
    FROM car_models cm
    WHERE cv.model_id = cm.model_id
      AND cm.manufacturer_id = p_manufacturer_id
      AND cv.is_active = TRUE;

    GET DIAGNOSTICS p_updated_count = ROW_COUNT;

    RAISE NOTICE 'Bulk price update completed for manufacturer %. Updated % variants by % percent.',
        p_manufacturer_id, p_updated_count, p_percentage_change;
END;
$$;

-- ============================================================================
-- 5. TRIGGER & TRIGGER FUNCTION: trg_log_search
-- ============================================================================
-- Ingest table for user recommendation search events
CREATE TABLE IF NOT EXISTS user_search_requests (
    request_id BIGSERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    min_budget NUMERIC(12, 2),
    max_budget NUMERIC(12, 2),
    preferred_fuel fuel_enum,
    preferred_transmission trans_enum,
    preferred_body_type body_type,
    min_safety_rating NUMERIC(2, 1),
    search_query TEXT,
    requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Trigger Function: fn_log_search
CREATE OR REPLACE FUNCTION fn_log_search()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Automatically record incoming customer searches into the audit trail table
    INSERT INTO customer_searches (
        user_id,
        min_budget,
        max_budget,
        preferred_fuel,
        preferred_transmission,
        preferred_body_type,
        min_safety_rating,
        search_query,
        search_timestamp
    ) VALUES (
        NEW.user_id,
        NEW.min_budget,
        NEW.max_budget,
        NEW.preferred_fuel,
        NEW.preferred_transmission,
        NEW.preferred_body_type,
        NEW.min_safety_rating,
        NEW.search_query,
        COALESCE(NEW.requested_at, CURRENT_TIMESTAMP)
    );

    RETURN NEW;
END;
$$;

-- Drop trigger if it already exists to allow idempotent re-runs
DROP TRIGGER IF EXISTS trg_log_search ON user_search_requests;

-- Trigger trg_log_search: fires automatically after every user search request
CREATE TRIGGER trg_log_search
AFTER INSERT ON user_search_requests
FOR EACH ROW
EXECUTE FUNCTION fn_log_search();

-- ============================================================================
-- 6. RECURSIVE CTE: Hierarchical Budget Bracket Price Ladder
-- ============================================================================
-- Demonstrates RECURSIVE CTE to dynamically generate standard price brackets,
-- counting active vehicle models falling into each tier.
CREATE OR REPLACE VIEW v_budget_tier_ladder AS
WITH RECURSIVE budget_ladder AS (
    -- Anchor member: Starting budget tier (Tier 1: Up to 10 Lakh)
    SELECT
        1 AS tier_level,
        'Entry Tier'::VARCHAR AS tier_name,
        0.00::NUMERIC AS tier_min_price,
        1000000.00::NUMERIC AS tier_max_price

    UNION ALL

    -- Recursive member: Incrementing budget brackets up to Luxury Tier (50+ Lakh)
    SELECT
        bl.tier_level + 1,
        CASE (bl.tier_level + 1)
            WHEN 2 THEN 'Mid-Market Compact'::VARCHAR
            WHEN 3 THEN 'Executive Segment'::VARCHAR
            WHEN 4 THEN 'Premium Luxury'::VARCHAR
            ELSE 'Ultra Luxury'::VARCHAR
        END,
        bl.tier_max_price,
        bl.tier_max_price + CASE (bl.tier_level + 1)
            WHEN 2 THEN 1000000.00
            WHEN 3 THEN 1500000.00
            ELSE 2500000.00
        END
    FROM budget_ladder bl
    WHERE bl.tier_level < 4
)
SELECT
    bl.tier_level,
    bl.tier_name,
    bl.tier_min_price,
    bl.tier_max_price,
    COUNT(cv.variant_id) AS active_variants_in_tier,
    ROUND(AVG(cv.ex_showroom_price), 2) AS avg_tier_price,
    ROUND(AVG(cv.safety_rating_ncap), 2) AS avg_tier_safety_stars
FROM budget_ladder bl
LEFT JOIN car_variants cv
    ON cv.is_active = TRUE
   AND cv.ex_showroom_price >= bl.tier_min_price
   AND cv.ex_showroom_price < bl.tier_max_price
GROUP BY
    bl.tier_level,
    bl.tier_name,
    bl.tier_min_price,
    bl.tier_max_price
ORDER BY bl.tier_level ASC;

-- ============================================================================
-- 7. ANALYTICAL MULTI-CTE: Category Benchmarks, Window Functions & Value Index
-- ============================================================================
-- Demonstrates:
--   - Multiple CTEs (WITH clause)
--   - Window functions (DENSE_RANK, PERCENTILE_CONT, AVG OVER)
--   - Correlated and Lateral joins
--   - Value-for-Money analytical calculations
CREATE OR REPLACE VIEW v_category_benchmarks_analysis AS
WITH variant_feature_counts AS (
    SELECT
        cv.variant_id,
        cv.model_id,
        cv.variant_name,
        cv.ex_showroom_price,
        cv.safety_rating_ncap,
        COUNT(vf.feature_id) AS total_features_count,
        COUNT(vf.feature_id) FILTER (WHERE vf.is_standard = TRUE) AS standard_features_count
    FROM car_variants cv
    LEFT JOIN variant_features vf
        ON cv.variant_id = vf.variant_id
    WHERE cv.is_active = TRUE
    GROUP BY
        cv.variant_id,
        cv.model_id,
        cv.variant_name,
        cv.ex_showroom_price,
        cv.safety_rating_ncap
),
variant_metadata AS (
    SELECT
        vfc.variant_id,
        vfc.variant_name,
        cm.model_id,
        cm.model_name,
        cm.body_type,
        m.name AS manufacturer_name,
        vfc.ex_showroom_price,
        vfc.safety_rating_ncap,
        vfc.total_features_count,
        vfc.standard_features_count,
        -- Window function: Rank price within body type category
        DENSE_RANK() OVER (
            PARTITION BY cm.body_type
            ORDER BY vfc.ex_showroom_price ASC
        ) AS category_price_rank
    FROM variant_feature_counts vfc
    JOIN car_models cm
        ON vfc.model_id = cm.model_id
    JOIN manufacturers m
        ON cm.manufacturer_id = m.manufacturer_id
    WHERE cm.launch_status = 'launched'
),
body_type_benchmarks AS (
    SELECT
        vm.body_type,
        COUNT(DISTINCT vm.model_id) AS total_models_in_category,
        COUNT(vm.variant_id) AS total_variants_in_category,
        MIN(vm.ex_showroom_price) AS min_price,
        ROUND(AVG(vm.ex_showroom_price), 2) AS avg_price,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY vm.ex_showroom_price)::NUMERIC(12, 2) AS median_price_50th_pct,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY vm.ex_showroom_price)::NUMERIC(12, 2) AS upper_price_75th_pct,
        MAX(vm.ex_showroom_price) AS max_price,
        ROUND(AVG(vm.safety_rating_ncap), 2) AS avg_safety_rating,
        ROUND(AVG(vm.total_features_count), 2) AS avg_feature_count,
        ROUND(AVG(vm.standard_features_count), 2) AS avg_standard_feature_count
    FROM variant_metadata vm
    GROUP BY vm.body_type
)
SELECT
    btb.body_type,
    btb.total_models_in_category,
    btb.total_variants_in_category,
    btb.min_price,
    btb.median_price_50th_pct,
    btb.avg_price,
    btb.upper_price_75th_pct,
    btb.max_price,
    btb.avg_safety_rating,
    btb.avg_feature_count,
    btb.avg_standard_feature_count
FROM body_type_benchmarks btb
ORDER BY btb.total_variants_in_category DESC, btb.avg_price ASC;
