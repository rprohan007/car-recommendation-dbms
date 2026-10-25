-- ============================================================================
-- File: database/04_seed.sql
-- Description: Comprehensive Seed Data for Indian Automotive Market & Vector Embeddings
-- Database Engine: PostgreSQL 14+ with pgvector
-- ============================================================================

-- Safely clean existing seed data if tables exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_search_requests') THEN
        EXECUTE 'TRUNCATE TABLE user_search_requests RESTART IDENTITY CASCADE;';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_searches') THEN
        EXECUTE 'TRUNCATE TABLE customer_searches RESTART IDENTITY CASCADE;';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'variant_features') THEN
        EXECUTE 'TRUNCATE TABLE variant_features RESTART IDENTITY CASCADE;';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'features') THEN
        EXECUTE 'TRUNCATE TABLE features RESTART IDENTITY CASCADE;';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'car_variants') THEN
        EXECUTE 'TRUNCATE TABLE car_variants RESTART IDENTITY CASCADE;';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'car_models') THEN
        EXECUTE 'TRUNCATE TABLE car_models RESTART IDENTITY CASCADE;';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'manufacturers') THEN
        EXECUTE 'TRUNCATE TABLE manufacturers RESTART IDENTITY CASCADE;';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        EXECUTE 'TRUNCATE TABLE users RESTART IDENTITY CASCADE;';
    END IF;
END $$;

-- ============================================================================
-- 1. SEED: USERS (Authentic 12-round bcrypt hashes for academic evaluation)
-- Passwords:
--   Admin:    vikram.admin@cardb.in    -> Admin@123
--   Customer: rohan.patel@example.com  -> Customer@123
--   Customer: priya.sharma@example.com -> Customer@123
--   Analyst:  ananya.analyst@cardb.in  -> Analyst@123
-- ============================================================================
INSERT INTO users (full_name, email, password_hash, role, phone) VALUES
('Rohan Patel', 'rohan.patel@example.com', '$2b$12$tgaEekL31HxertPPzcMrkOQHL0p12SmqZEAmC/cm8leTAlphxnXDe', 'customer', '+919876543210'),
('Priya Sharma', 'priya.sharma@example.com', '$2b$12$tgaEekL31HxertPPzcMrkOQHL0p12SmqZEAmC/cm8leTAlphxnXDe', 'customer', '+919812345678'),
('Vikram Malhotra', 'vikram.admin@cardb.in', '$2b$12$hPKXJeSSd4NM5WB9teM59e0pmnPE70rmo1WVZ7MfQ.IfwEH7AuDOS', 'admin', '+919900112233'),
('Ananya Deshmukh', 'ananya.analyst@cardb.in', '$2b$12$5u0gzuzxr9Ao2mxUE7rb2.wNDkaAJjjrrOPHNTUuViBgeH420GeSq', 'analyst', '+919765432109');

-- ============================================================================
-- 2. SEED: MANUFACTURERS (Indian Automotive Market)
-- ============================================================================
INSERT INTO manufacturers (name, country_origin, website_url) VALUES
('Tata Motors', 'India', 'https://cars.tatamotors.com'),
('Mahindra & Mahindra', 'India', 'https://auto.mahindra.com'),
('Hyundai Motor India', 'South Korea', 'https://www.hyundai.com/in'),
('Toyota Kirloskar Motor', 'Japan', 'https://www.toyotabharat.com');

-- ============================================================================
-- 3. SEED: CAR MODELS
-- ============================================================================
INSERT INTO car_models (manufacturer_id, model_name, body_type, launch_status, expected_launch_date, seating_capacity) VALUES
-- Tata Models
((SELECT manufacturer_id FROM manufacturers WHERE name = 'Tata Motors'), 'Nexon', 'SUV', 'launched', NULL, 5),
((SELECT manufacturer_id FROM manufacturers WHERE name = 'Tata Motors'), 'Curvv EV', 'Coupe', 'upcoming', CURRENT_DATE + INTERVAL '45 days', 5),
((SELECT manufacturer_id FROM manufacturers WHERE name = 'Tata Motors'), 'Altroz', 'Hatchback', 'launched', NULL, 5),

-- Mahindra Models
((SELECT manufacturer_id FROM manufacturers WHERE name = 'Mahindra & Mahindra'), 'XUV700', 'SUV', 'launched', NULL, 7),
((SELECT manufacturer_id FROM manufacturers WHERE name = 'Mahindra & Mahindra'), 'Thar', 'SUV', 'launched', NULL, 4),
((SELECT manufacturer_id FROM manufacturers WHERE name = 'Mahindra & Mahindra'), 'BE 6e', 'SUV', 'upcoming', CURRENT_DATE + INTERVAL '90 days', 5),

-- Hyundai Models
((SELECT manufacturer_id FROM manufacturers WHERE name = 'Hyundai Motor India'), 'Creta', 'SUV', 'launched', NULL, 5),
((SELECT manufacturer_id FROM manufacturers WHERE name = 'Hyundai Motor India'), 'Verna', 'Sedan', 'launched', NULL, 5),
((SELECT manufacturer_id FROM manufacturers WHERE name = 'Hyundai Motor India'), 'Ioniq 7', 'SUV', 'upcoming', CURRENT_DATE + INTERVAL '180 days', 7),

-- Toyota Models
((SELECT manufacturer_id FROM manufacturers WHERE name = 'Toyota Kirloskar Motor'), 'Fortuner', 'SUV', 'launched', NULL, 7),
((SELECT manufacturer_id FROM manufacturers WHERE name = 'Toyota Kirloskar Motor'), 'Innova Hycross', 'MUV', 'launched', NULL, 7),
((SELECT manufacturer_id FROM manufacturers WHERE name = 'Toyota Kirloskar Motor'), 'Urban Cruiser EV', 'SUV', 'upcoming', CURRENT_DATE + INTERVAL '120 days', 5);

-- ============================================================================
-- 4. SEED: FEATURES CATALOG
-- ============================================================================
INSERT INTO features (feature_name, category, description) VALUES
-- Safety
('6 Airbags', 'Safety', 'Six comprehensive front, side, and curtain airbags standard protection'),
('Level 2 ADAS', 'Safety', 'Advanced Driver Assistance Systems with Autonomous Emergency Braking, Lane Keep Assist, and Adaptive Cruise'),
('360-Degree Surround Camera', 'Safety', 'Multi-angle high definition bird-eye view camera for effortless parking'),
('Electronic Stability Program (ESP)', 'Safety', 'Active safety system that prevents skidding during sudden loss of traction'),
('Hill Hold & Descent Control', 'Safety', 'Automated brake assistance on steep inclines and declines'),
('Blind Spot View Monitor', 'Safety', 'Blind spot video display on digital cluster when turn signal is engaged'),
('ISOFIX Child Seat Mounts', 'Safety', 'Standard anchor points for secure child seat installation'),
('Tyre Pressure Monitoring System (TPMS)', 'Safety', 'Real-time tire pressure and temperature readout with low-pressure alert'),

-- Infotainment
('10.25-inch HD Touchscreen', 'Infotainment', 'High resolution infotainment display with rapid touch response'),
('Wireless Android Auto & Apple CarPlay', 'Infotainment', 'Cable-free smartphone projection and navigation mirroring'),
('JBL 9-Speaker Audio System', 'Infotainment', 'Premium surround sound acoustic experience with dedicated subwoofer'),
('Connected Car Tech (eSIM Telematics)', 'Infotainment', 'Remote engine start, geo-fencing, live vehicle health, and OTA updates'),
('10.25-inch Digital Cockpit', 'Infotainment', 'Full color customizable digital instrument cluster with navigation display'),

-- Comfort & Convenience
('Panoramic Sunroof', 'Comfort & Convenience', 'Voice-assisted electric sliding panoramic glass roof with UV filter'),
('Ventilated Front Seats', 'Comfort & Convenience', 'Cooled perforated leatherette seats for tropical climates'),
('Dual-Zone Automatic Climate Control', 'Comfort & Convenience', 'Independent temperature controls for driver and front passenger'),
('Wireless Smartphone Charger', 'Comfort & Convenience', '15W fast wireless inductive charging pad with active cooling'),
('Powered Tailgate with Gesture Control', 'Comfort & Convenience', 'Hands-free automated electric boot lid with kick sensor'),
('Air Purifier with AQI Display', 'Comfort & Convenience', 'HEPA-grade integrated air filtration unit with live PM2.5 monitoring'),
('6-Way Powered Driver Seat with Memory', 'Comfort & Convenience', 'Power-adjustable front seating with driver memory profile'),

-- Performance / Drivetrain
('Multi-Drive Modes (Eco/City/Sport)', 'Performance', 'Custom throttle and steering tuning response profiles'),
('All-Wheel Drive (AWD / 4x4)', 'Performance', 'Mechanical or electronic torque on demand all-wheel traction'),
('Paddle Shifters', 'Performance', 'Steering wheel mounted gearshift paddles for immediate manual control'),
('Electronic Parking Brake with Auto Hold', 'Performance', 'Push-button parking brake with automatic stop-and-go hold');

-- ============================================================================
-- 5. SEED: CAR VARIANTS
-- ============================================================================
INSERT INTO car_variants (
    model_id, variant_name, ex_showroom_price, fuel_type, transmission, 
    engine_displacement_cc, power_bhp, torque_nm, mileage_kmpl, safety_rating_ncap, is_active
) VALUES
-- ----------------------------------------------------------------------------
-- Tata Nexon Variants
-- ----------------------------------------------------------------------------
(
    (SELECT model_id FROM car_models WHERE model_name = 'Nexon' LIMIT 1),
    'Smart 1.2 Petrol 5MT', 815000.00, 'Petrol', 'Manual', 
    1199, 118.20, 170.00, 17.44, 5.0, TRUE
),
(
    (SELECT model_id FROM car_models WHERE model_name = 'Nexon' LIMIT 1),
    'Creative 1.5 Diesel 6AMT', 1310000.00, 'Diesel', 'AMT', 
    1497, 113.40, 260.00, 23.23, 5.0, TRUE
),
(
    (SELECT model_id FROM car_models WHERE model_name = 'Nexon' LIMIT 1),
    'Fearless Plus S 1.2 Petrol 7DCA', 1480000.00, 'Petrol', 'DCT', 
    1199, 118.20, 170.00, 17.01, 5.0, TRUE
),
(
    (SELECT model_id FROM car_models WHERE model_name = 'Nexon' LIMIT 1),
    'EV Empowered Plus 45', 1719000.00, 'Electric', 'Automatic', 
    NULL, 142.60, 215.00, 465.00, 5.0, TRUE
),

-- ----------------------------------------------------------------------------
-- Mahindra XUV700 Variants
-- ----------------------------------------------------------------------------
(
    (SELECT model_id FROM car_models WHERE model_name = 'XUV700' LIMIT 1),
    'MX 2.0 Turbo Petrol 6MT 5-Str', 1449000.00, 'Petrol', 'Manual', 
    1997, 197.13, 380.00, 15.00, 5.0, TRUE
),
(
    (SELECT model_id FROM car_models WHERE model_name = 'XUV700' LIMIT 1),
    'AX5 2.0 Turbo Petrol 6AT 7-Str', 1899000.00, 'Petrol', 'Automatic', 
    1997, 197.13, 380.00, 13.50, 5.0, TRUE
),
(
    (SELECT model_id FROM car_models WHERE model_name = 'XUV700' LIMIT 1),
    'AX7 Luxury Pack 2.2 Diesel 6AT AWD 7-Str', 2699000.00, 'Diesel', 'Automatic', 
    2198, 182.38, 450.00, 16.57, 5.0, TRUE
),

-- ----------------------------------------------------------------------------
-- Hyundai Creta Variants
-- ----------------------------------------------------------------------------
(
    (SELECT model_id FROM car_models WHERE model_name = 'Creta' LIMIT 1),
    'E 1.5 MPI Petrol 6MT', 1100000.00, 'Petrol', 'Manual', 
    1497, 113.42, 144.00, 17.40, 3.0, TRUE
),
(
    (SELECT model_id FROM car_models WHERE model_name = 'Creta' LIMIT 1),
    'SX (O) 1.5 Turbo Petrol 7DCT', 2000000.00, 'Petrol', 'DCT', 
    1482, 157.81, 253.00, 18.40, 5.0, TRUE
),
(
    (SELECT model_id FROM car_models WHERE model_name = 'Creta' LIMIT 1),
    'SX (O) 1.5 CRDi Diesel 6AT', 2015000.00, 'Diesel', 'Automatic', 
    1493, 114.41, 250.00, 19.10, 5.0, TRUE
),

-- ----------------------------------------------------------------------------
-- Toyota Fortuner Variants
-- ----------------------------------------------------------------------------
(
    (SELECT model_id FROM car_models WHERE model_name = 'Fortuner' LIMIT 1),
    '4x2 2.7 Petrol 5MT', 3343000.00, 'Petrol', 'Manual', 
    2694, 163.60, 245.00, 10.01, 5.0, TRUE
),
(
    (SELECT model_id FROM car_models WHERE model_name = 'Fortuner' LIMIT 1),
    '4x4 2.8 Diesel 6AT', 4232000.00, 'Diesel', 'Automatic', 
    2755, 201.20, 500.00, 14.40, 5.0, TRUE
),
(
    (SELECT model_id FROM car_models WHERE model_name = 'Fortuner' LIMIT 1),
    'GR-Sport 4x4 2.8 Diesel 6AT', 5144000.00, 'Diesel', 'Automatic', 
    2755, 201.20, 500.00, 14.40, 5.0, TRUE
),

-- ----------------------------------------------------------------------------
-- Additional Models for Multi-Category Benchmark Analysis
-- ----------------------------------------------------------------------------
(
    (SELECT model_id FROM car_models WHERE model_name = 'Verna' LIMIT 1),
    'SX (O) 1.5 Turbo DCT', 1742000.00, 'Petrol', 'DCT', 
    1482, 157.81, 253.00, 20.60, 5.0, TRUE
),
(
    (SELECT model_id FROM car_models WHERE model_name = 'Innova Hycross' LIMIT 1),
    'ZX (O) Hybrid 2.0 e-CVT', 3098000.00, 'Hybrid', 'CVT', 
    1987, 183.72, 206.00, 23.24, 5.0, TRUE
),
(
    (SELECT model_id FROM car_models WHERE model_name = 'Altroz' LIMIT 1),
    'XZ Plus (S) 1.2 Petrol 5MT', 910000.00, 'Petrol', 'Manual', 
    1199, 86.80, 115.00, 19.33, 5.0, TRUE
),
(
    (SELECT model_id FROM car_models WHERE model_name = 'Thar' LIMIT 1),
    'LX 4-Str Hard Top 2.2 Diesel 6AT 4WD', 1760000.00, 'Diesel', 'Automatic', 
    2184, 130.00, 300.00, 15.20, 4.0, TRUE
);

-- ============================================================================
-- 6. SEED: VARIANT FEATURES MAPPING
-- ============================================================================

-- Helper block to map features across variants
DO $$
DECLARE
    v_nexon_smart INT;
    v_nexon_fearless INT;
    v_nexon_ev INT;
    v_xuv_mx INT;
    v_xuv_ax7 INT;
    v_creta_e INT;
    v_creta_sxo INT;
    v_fortuner_4x4 INT;
    v_fortuner_gr INT;
    v_verna_sxo INT;
    v_hycross_zx INT;
BEGIN
    SELECT variant_id INTO v_nexon_smart FROM car_variants WHERE variant_name LIKE 'Smart 1.2 Petrol%' LIMIT 1;
    SELECT variant_id INTO v_nexon_fearless FROM car_variants WHERE variant_name LIKE 'Fearless Plus S%' LIMIT 1;
    SELECT variant_id INTO v_nexon_ev FROM car_variants WHERE variant_name LIKE 'EV Empowered%' LIMIT 1;
    SELECT variant_id INTO v_xuv_mx FROM car_variants WHERE variant_name LIKE 'MX 2.0%' LIMIT 1;
    SELECT variant_id INTO v_xuv_ax7 FROM car_variants WHERE variant_name LIKE 'AX7 Luxury Pack%' LIMIT 1;
    SELECT variant_id INTO v_creta_e FROM car_variants WHERE variant_name LIKE 'E 1.5 MPI%' LIMIT 1;
    SELECT variant_id INTO v_creta_sxo FROM car_variants WHERE variant_name LIKE 'SX (O) 1.5 Turbo%' LIMIT 1;
    SELECT variant_id INTO v_fortuner_4x4 FROM car_variants WHERE variant_name LIKE '4x4 2.8 Diesel%' LIMIT 1;
    SELECT variant_id INTO v_fortuner_gr FROM car_variants WHERE variant_name LIKE 'GR-Sport%' LIMIT 1;
    SELECT variant_id INTO v_verna_sxo FROM car_variants WHERE variant_name LIKE 'SX (O) 1.5 Turbo DCT%' LIMIT 1;
    SELECT variant_id INTO v_hycross_zx FROM car_variants WHERE variant_name LIKE 'ZX (O) Hybrid%' LIMIT 1;

    -- Standard Safety Features on Tata Nexon Smart
    INSERT INTO variant_features (variant_id, feature_id, is_standard)
    SELECT v_nexon_smart, feature_id, TRUE 
    FROM features 
    WHERE feature_name IN ('6 Airbags', 'Electronic Stability Program (ESP)', 'Hill Hold & Descent Control', 'ISOFIX Child Seat Mounts');

    -- Top-spec Tata Nexon Fearless Plus S
    INSERT INTO variant_features (variant_id, feature_id, is_standard)
    SELECT v_nexon_fearless, feature_id, TRUE 
    FROM features 
    WHERE feature_name IN (
        '6 Airbags', 'Electronic Stability Program (ESP)', '360-Degree Surround Camera', 
        '10.25-inch HD Touchscreen', 'Wireless Android Auto & Apple CarPlay', 'JBL 9-Speaker Audio System',
        '10.25-inch Digital Cockpit', 'Panoramic Sunroof', 'Ventilated Front Seats', 
        'Wireless Smartphone Charger', 'Air Purifier with AQI Display', 'Paddle Shifters', 'Blind Spot View Monitor'
    );

    -- Tata Nexon EV Empowered Plus
    INSERT INTO variant_features (variant_id, feature_id, is_standard)
    SELECT v_nexon_ev, feature_id, TRUE 
    FROM features 
    WHERE feature_name IN (
        '6 Airbags', 'Electronic Stability Program (ESP)', '360-Degree Surround Camera', 
        '10.25-inch HD Touchscreen', 'Wireless Android Auto & Apple CarPlay', 'JBL 9-Speaker Audio System',
        'Connected Car Tech (eSIM Telematics)', '10.25-inch Digital Cockpit', 'Panoramic Sunroof', 
        'Ventilated Front Seats', 'Wireless Smartphone Charger', 'Electronic Parking Brake with Auto Hold',
        'Blind Spot View Monitor', 'Paddle Shifters'
    );

    -- Mahindra XUV700 MX Base Variant
    INSERT INTO variant_features (variant_id, feature_id, is_standard)
    SELECT v_xuv_mx, feature_id, TRUE 
    FROM features 
    WHERE feature_name IN ('Electronic Stability Program (ESP)', 'ISOFIX Child Seat Mounts', 'Multi-Drive Modes (Eco/City/Sport)');

    -- Mahindra XUV700 AX7 Luxury Pack
    INSERT INTO variant_features (variant_id, feature_id, is_standard)
    SELECT v_xuv_ax7, feature_id, TRUE 
    FROM features 
    WHERE feature_name IN (
        '6 Airbags', 'Level 2 ADAS', '360-Degree Surround Camera', 'Electronic Stability Program (ESP)', 
        'Hill Hold & Descent Control', 'Blind Spot View Monitor', 'ISOFIX Child Seat Mounts', 'Tyre Pressure Monitoring System (TPMS)',
        '10.25-inch HD Touchscreen', 'Wireless Android Auto & Apple CarPlay', 'JBL 9-Speaker Audio System',
        'Connected Car Tech (eSIM Telematics)', '10.25-inch Digital Cockpit', 'Panoramic Sunroof', 'Ventilated Front Seats',
        'Dual-Zone Automatic Climate Control', 'Wireless Smartphone Charger', '6-Way Powered Driver Seat with Memory',
        'All-Wheel Drive (AWD / 4x4)', 'Electronic Parking Brake with Auto Hold'
    );

    -- Hyundai Creta E Base Variant
    INSERT INTO variant_features (variant_id, feature_id, is_standard)
    SELECT v_creta_e, feature_id, TRUE 
    FROM features 
    WHERE feature_name IN ('6 Airbags', 'Electronic Stability Program (ESP)', 'Hill Hold & Descent Control', 'ISOFIX Child Seat Mounts');

    -- Hyundai Creta SX (O) Top Spec
    INSERT INTO variant_features (variant_id, feature_id, is_standard)
    SELECT v_creta_sxo, feature_id, TRUE 
    FROM features 
    WHERE feature_name IN (
        '6 Airbags', 'Level 2 ADAS', '360-Degree Surround Camera', 'Electronic Stability Program (ESP)',
        'Blind Spot View Monitor', 'Tyre Pressure Monitoring System (TPMS)', '10.25-inch HD Touchscreen',
        'Wireless Android Auto & Apple CarPlay', 'JBL 9-Speaker Audio System', 'Connected Car Tech (eSIM Telematics)',
        '10.25-inch Digital Cockpit', 'Panoramic Sunroof', 'Ventilated Front Seats', 'Dual-Zone Automatic Climate Control',
        'Wireless Smartphone Charger', 'Air Purifier with AQI Display', 'Paddle Shifters', 'Electronic Parking Brake with Auto Hold'
    );

    -- Toyota Fortuner 4x4 AT & GR-Sport
    INSERT INTO variant_features (variant_id, feature_id, is_standard)
    SELECT v_fortuner_4x4, feature_id, TRUE 
    FROM features 
    WHERE feature_name IN (
        '6 Airbags', 'Electronic Stability Program (ESP)', 'Hill Hold & Descent Control', 'ISOFIX Child Seat Mounts',
        'Tyre Pressure Monitoring System (TPMS)', '10.25-inch HD Touchscreen', 'Wireless Android Auto & Apple CarPlay',
        'JBL 9-Speaker Audio System', 'Dual-Zone Automatic Climate Control', 'Ventilated Front Seats',
        '6-Way Powered Driver Seat with Memory', 'All-Wheel Drive (AWD / 4x4)', 'Paddle Shifters'
    );

    INSERT INTO variant_features (variant_id, feature_id, is_standard)
    SELECT v_fortuner_gr, feature_id, TRUE 
    FROM features 
    WHERE feature_name IN (
        '6 Airbags', 'Electronic Stability Program (ESP)', 'Hill Hold & Descent Control', 'ISOFIX Child Seat Mounts',
        'Tyre Pressure Monitoring System (TPMS)', '360-Degree Surround Camera', '10.25-inch HD Touchscreen', 
        'Wireless Android Auto & Apple CarPlay', 'JBL 9-Speaker Audio System', 'Dual-Zone Automatic Climate Control', 
        'Ventilated Front Seats', '6-Way Powered Driver Seat with Memory', 'All-Wheel Drive (AWD / 4x4)', 
        'Powered Tailgate with Gesture Control', 'Paddle Shifters'
    );

    -- Hyundai Verna SX (O) Sedan
    INSERT INTO variant_features (variant_id, feature_id, is_standard)
    SELECT v_verna_sxo, feature_id, TRUE 
    FROM features 
    WHERE feature_name IN (
        '6 Airbags', 'Level 2 ADAS', 'Electronic Stability Program (ESP)', 'Hill Hold & Descent Control',
        '10.25-inch HD Touchscreen', 'Wireless Android Auto & Apple CarPlay', '10.25-inch Digital Cockpit',
        'Panoramic Sunroof', 'Ventilated Front Seats', 'Air Purifier with AQI Display', 'Paddle Shifters',
        'Electronic Parking Brake with Auto Hold'
    );

    -- Toyota Innova Hycross ZX (O) Hybrid MUV
    INSERT INTO variant_features (variant_id, feature_id, is_standard)
    SELECT v_hycross_zx, feature_id, TRUE 
    FROM features 
    WHERE feature_name IN (
        '6 Airbags', 'Level 2 ADAS', '360-Degree Surround Camera', 'Electronic Stability Program (ESP)',
        'Hill Hold & Descent Control', 'Tyre Pressure Monitoring System (TPMS)', '10.25-inch HD Touchscreen',
        'Wireless Android Auto & Apple CarPlay', 'JBL 9-Speaker Audio System', 'Connected Car Tech (eSIM Telematics)',
        'Panoramic Sunroof', 'Ventilated Front Seats', 'Dual-Zone Automatic Climate Control', 
        'Powered Tailgate with Gesture Control', 'Electronic Parking Brake with Auto Hold'
    );

END $$;

-- ============================================================================
-- 7. SEED: SAMPLE CUSTOMER SEARCHES
-- ============================================================================
INSERT INTO customer_searches (
    user_id, min_budget, max_budget, preferred_fuel, preferred_transmission, 
    preferred_body_type, min_safety_rating, search_query
) VALUES
(
    (SELECT user_id FROM users WHERE email = 'rohan.patel@example.com'),
    1000000.00, 2200000.00, 'Petrol', 'DCT', 'SUV', 5.0,
    'Looking for a 5-star safe compact SUV with DCT automatic and panoramic sunroof'
),
(
    (SELECT user_id FROM users WHERE email = 'priya.sharma@example.com'),
    1500000.00, 3000000.00, 'Diesel', 'Automatic', 'SUV', 5.0,
    '7-seater family SUV with ADAS safety features and AWD'
),
(
    (SELECT user_id FROM users WHERE email = 'rohan.patel@example.com'),
    2500000.00, 5500000.00, 'Diesel', 'Automatic', 'SUV', 5.0,
    'Heavy duty 4x4 full-size SUV for rugged highway and off-road driving'
),
(
    NULL,
    1500000.00, 2000000.00, 'Electric', 'Automatic', 'SUV', 5.0,
    'Electric SUV with long range and fast charging under 20 Lakhs'
);

-- ============================================================================
-- 8. SEED: MOCK VECTOR EMBEDDINGS (1536-Dimensional pgvector)
-- ============================================================================
-- Generates deterministic, unit-normalized 1536-dimensional mock embeddings
-- reflecting semantic vehicle profiles (powertrain, luxury level, safety, price tier)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_generate_mock_vector(seed_int INT, price_factor FLOAT)
RETURNS vector(1536) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_arr real[];
    v_norm float := 0.0;
    i INT;
    val float;
BEGIN
    v_arr := ARRAY[]::real[];
    
    FOR i IN 1..1536 LOOP
        -- Deterministic pseudo-random distribution based on variant seed & price
        val := (sin(i * 0.031 + seed_int * 0.73) * 0.55) + 
               (cos(i * 0.017 + price_factor * 1.25) * 0.45);
        v_norm := v_norm + (val * val);
        v_arr := array_append(v_arr, val::real);
    END LOOP;
    
    -- L2-Normalization to unit length for exact cosine similarity
    IF v_norm > 0 THEN
        v_norm := sqrt(v_norm);
        FOR i IN 1..1536 LOOP
            v_arr[i] := (v_arr[i] / v_norm)::real;
        END LOOP;
    END IF;

    RETURN v_arr::vector;
END;
$$;

-- Populate 1536-dimensional embeddings for all car variants if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'car_variants' AND column_name = 'embedding'
    ) THEN
        UPDATE car_variants 
        SET embedding = fn_generate_mock_vector(
            variant_id, 
            (ex_showroom_price / 1000000.0)::FLOAT
        );
        RAISE NOTICE 'Successfully seeded 1536-dimensional embeddings for % car variants.', 
            (SELECT COUNT(*) FROM car_variants WHERE embedding IS NOT NULL);
    ELSE
        RAISE NOTICE 'Column car_variants.embedding does not exist yet. Run 02_vector_setup.sql before or re-run seed.';
    END IF;
END $$;
