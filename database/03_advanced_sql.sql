-- ============================================================================
-- File: database/03_advanced_sql.sql
-- Description: Views, Stored Functions, Triggers, and Analytical CTE Queries
-- Database Engine: PostgreSQL 14+
-- ============================================================================

-- ============================================================================
-- 1. VIEW: Upcoming Vehicle Launches (v_upcoming_launches)
-- ============================================================================
-- Aggregates upcoming car models with manufacturer details, seating capacity,
-- launch countdown, and estimated variant price ranges (if pre-configured).
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
-- 3. TRIGGER & TRIGGER FUNCTION: trg_log_search
-- ============================================================================
-- Automatically records incoming customer search queries/recommendation requests
-- into customer_searches whenever a search request event is registered.

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
    -- Insert search event parameters into customer_searches audit table
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
-- 4. COMPLEX CTE QUERY: Vehicle Type Price Benchmarks & Feature Counts
-- ============================================================================
-- Analytical Multi-CTE Query calculating:
--   1. Feature counts per variant (standard and total)
--   2. Vehicle type price benchmarks (min, max, avg, 50th & 75th percentiles)
--   3. Average feature density per body style
--   4. Comparative deviation analysis for each variant against its category benchmark
-- ============================================================================

WITH variant_feature_counts AS (
    -- CTE 1: Calculate total and standard feature counts per variant
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
    -- CTE 2: Join variants with models and manufacturers
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
        vfc.standard_features_count
    FROM variant_feature_counts vfc
    JOIN car_models cm 
        ON vfc.model_id = cm.model_id
    JOIN manufacturers m 
        ON cm.manufacturer_id = m.manufacturer_id
    WHERE cm.launch_status = 'launched'
),
body_type_benchmarks AS (
    -- CTE 3: Compute comprehensive price and feature statistics by body type
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
),
variant_benchmark_comparison AS (
    -- CTE 4: Compare each variant against its category benchmark
    SELECT 
        vm.body_type,
        vm.manufacturer_name,
        vm.model_name,
        vm.variant_name,
        vm.ex_showroom_price,
        btb.avg_price AS category_avg_price,
        ROUND(vm.ex_showroom_price - btb.avg_price, 2) AS price_variance_from_avg,
        ROUND(((vm.ex_showroom_price - btb.avg_price) / btb.avg_price) * 100.0, 2) AS price_variance_pct,
        vm.total_features_count,
        btb.avg_feature_count AS category_avg_feature_count,
        ROUND(vm.total_features_count - btb.avg_feature_count, 2) AS feature_variance_from_avg,
        vm.safety_rating_ncap,
        btb.avg_safety_rating AS category_avg_safety,
        -- Value-for-Money Index Score (Higher = Better value)
        ROUND(
            (COALESCE(vm.safety_rating_ncap, 3.0) * 20.0) 
            + (vm.total_features_count * 2.5) 
            - ((vm.ex_showroom_price / btb.avg_price) * 15.0),
            2
        ) AS value_index_score
    FROM variant_metadata vm
    JOIN body_type_benchmarks btb 
        ON vm.body_type = btb.body_type
)
-- Final Output: Vehicle body type benchmarks with value rankings
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
    btb.avg_standard_feature_count,
    vbc.manufacturer_name || ' ' || vbc.model_name || ' (' || vbc.variant_name || ')' AS best_value_variant,
    vbc.ex_showroom_price AS best_value_variant_price,
    vbc.price_variance_pct AS best_value_price_variance_pct,
    vbc.total_features_count AS best_value_features,
    vbc.safety_rating_ncap AS best_value_safety_rating,
    vbc.value_index_score
FROM body_type_benchmarks btb
JOIN LATERAL (
    SELECT *
    FROM variant_benchmark_comparison vbc_sub
    WHERE vbc_sub.body_type = btb.body_type
    ORDER BY vbc_sub.value_index_score DESC
    LIMIT 1
) vbc ON TRUE
ORDER BY btb.total_variants_in_category DESC, btb.avg_price ASC;
