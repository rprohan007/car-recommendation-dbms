-- ============================================================================
-- File: database/01_schema.sql
-- Description: Core Schema DDL for Car Recommendation Database Management System
-- Database Engine: PostgreSQL 14+
-- ============================================================================

-- Clean up existing tables and types (in reverse dependency order)
DROP TABLE IF EXISTS variant_features CASCADE;
DROP TABLE IF EXISTS features CASCADE;
DROP TABLE IF EXISTS customer_searches CASCADE;
DROP TABLE IF EXISTS car_variants CASCADE;
DROP TABLE IF EXISTS car_models CASCADE;
DROP TABLE IF EXISTS manufacturers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS body_type CASCADE;
DROP TYPE IF EXISTS launch_status CASCADE;
DROP TYPE IF EXISTS fuel_enum CASCADE;
DROP TYPE IF EXISTS trans_enum CASCADE;

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================

-- User roles within the recommendation platform
CREATE TYPE user_role AS ENUM (
    'customer',
    'admin',
    'dealer',
    'analyst'
);

-- Common automotive body styles
CREATE TYPE body_type AS ENUM (
    'SUV',
    'Sedan',
    'Hatchback',
    'MUV',
    'Coupe',
    'Convertible'
);

-- Market launch lifecycle status
CREATE TYPE launch_status AS ENUM (
    'upcoming',
    'launched',
    'discontinued'
);

-- Fuel / Powertrain classification
CREATE TYPE fuel_enum AS ENUM (
    'Petrol',
    'Diesel',
    'Electric',
    'Hybrid',
    'CNG'
);

-- Transmission mechanism types
CREATE TYPE trans_enum AS ENUM (
    'Manual',
    'Automatic',
    'AMT',
    'CVT',
    'DCT'
);

-- ============================================================================
-- 2. TABLE DEFINITIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: users
-- Stores end-users, dealership representatives, and system administrators
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    phone VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ----------------------------------------------------------------------------
-- Table: manufacturers
-- Automotive original equipment manufacturers (OEMs)
-- ----------------------------------------------------------------------------
CREATE TABLE manufacturers (
    manufacturer_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country_origin VARCHAR(100) NOT NULL DEFAULT 'India',
    website_url VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_manufacturers_name UNIQUE (name)
);

-- ----------------------------------------------------------------------------
-- Table: car_models
-- Specific vehicle model lines under each manufacturer
-- ----------------------------------------------------------------------------
CREATE TABLE car_models (
    model_id SERIAL PRIMARY KEY,
    manufacturer_id INT NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    body_type body_type NOT NULL,
    launch_status launch_status NOT NULL DEFAULT 'launched',
    expected_launch_date DATE,
    seating_capacity INT NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_car_models_manufacturer 
        FOREIGN KEY (manufacturer_id) 
        REFERENCES manufacturers(manufacturer_id) 
        ON DELETE CASCADE,

    CONSTRAINT uq_manufacturer_model 
        UNIQUE (manufacturer_id, model_name),

    CONSTRAINT chk_seating_capacity 
        CHECK (seating_capacity >= 2 AND seating_capacity <= 16)
);

-- ----------------------------------------------------------------------------
-- Table: car_variants
-- Trims / variants for each model with specific engine, transmission, and pricing
-- ----------------------------------------------------------------------------
CREATE TABLE car_variants (
    variant_id SERIAL PRIMARY KEY,
    model_id INT NOT NULL,
    variant_name VARCHAR(100) NOT NULL,
    ex_showroom_price NUMERIC(12, 2) NOT NULL,
    fuel_type fuel_enum NOT NULL,
    transmission trans_enum NOT NULL,
    engine_displacement_cc INT,
    power_bhp NUMERIC(6, 2),
    torque_nm NUMERIC(6, 2),
    mileage_kmpl NUMERIC(5, 2),
    safety_rating_ncap NUMERIC(2, 1),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_car_variants_model 
        FOREIGN KEY (model_id) 
        REFERENCES car_models(model_id) 
        ON DELETE CASCADE,

    CONSTRAINT uq_model_variant 
        UNIQUE (model_id, variant_name),

    CONSTRAINT chk_price_positive 
        CHECK (ex_showroom_price > 0),

    CONSTRAINT chk_safety_rating_range 
        CHECK (safety_rating_ncap IS NULL OR (safety_rating_ncap >= 0.0 AND safety_rating_ncap <= 5.0)),

    CONSTRAINT chk_engine_cc 
        CHECK (engine_displacement_cc IS NULL OR engine_displacement_cc >= 0),

    CONSTRAINT chk_power_positive 
        CHECK (power_bhp IS NULL OR power_bhp > 0),

    CONSTRAINT chk_torque_positive 
        CHECK (torque_nm IS NULL OR torque_nm > 0),

    CONSTRAINT chk_mileage_positive 
        CHECK (mileage_kmpl IS NULL OR mileage_kmpl >= 0)
);

-- ----------------------------------------------------------------------------
-- Table: features
-- Master catalog of vehicle features (Safety, Infotainment, Comfort, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE features (
    feature_id SERIAL PRIMARY KEY,
    feature_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,

    CONSTRAINT uq_features_name UNIQUE (feature_name),
    CONSTRAINT chk_feature_category CHECK (
        category IN ('Safety', 'Infotainment', 'Comfort & Convenience', 'Performance', 'Exterior', 'Interior')
    )
);

-- ----------------------------------------------------------------------------
-- Table: variant_features
-- Junction table mapping features to specific car variants
-- ----------------------------------------------------------------------------
CREATE TABLE variant_features (
    variant_id INT NOT NULL,
    feature_id INT NOT NULL,
    is_standard BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT pk_variant_features 
        PRIMARY KEY (variant_id, feature_id),

    CONSTRAINT fk_variant_features_variant 
        FOREIGN KEY (variant_id) 
        REFERENCES car_variants(variant_id) 
        ON DELETE CASCADE,

    CONSTRAINT fk_variant_features_feature 
        FOREIGN KEY (feature_id) 
        REFERENCES features(feature_id) 
        ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- Table: customer_searches
-- Audit trail and tracking of user search criteria & preferences
-- ----------------------------------------------------------------------------
CREATE TABLE customer_searches (
    search_id BIGSERIAL PRIMARY KEY,
    user_id INT,
    min_budget NUMERIC(12, 2),
    max_budget NUMERIC(12, 2),
    preferred_fuel fuel_enum,
    preferred_transmission trans_enum,
    preferred_body_type body_type,
    min_safety_rating NUMERIC(2, 1),
    search_query TEXT,
    search_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_customer_searches_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE SET NULL,

    CONSTRAINT chk_min_budget_non_negative 
        CHECK (min_budget IS NULL OR min_budget >= 0),

    CONSTRAINT chk_max_budget_non_negative 
        CHECK (max_budget IS NULL OR max_budget >= 0),

    CONSTRAINT chk_budget_consistency 
        CHECK (min_budget IS NULL OR max_budget IS NULL OR max_budget >= min_budget),

    CONSTRAINT chk_search_safety_rating 
        CHECK (min_safety_rating IS NULL OR (min_safety_rating >= 0.0 AND min_safety_rating <= 5.0))
);

-- ============================================================================
-- 3. B-TREE INDEXES FOR SEARCH OPTIMIZATION
-- ============================================================================

-- Indexes on car_models
CREATE INDEX idx_car_models_manufacturer_id 
    ON car_models(manufacturer_id);

CREATE INDEX idx_car_models_body_type 
    ON car_models(body_type);

CREATE INDEX idx_car_models_launch_status 
    ON car_models(launch_status);

-- Indexes on car_variants for multi-attribute filtering
CREATE INDEX idx_car_variants_model_id 
    ON car_variants(model_id);

CREATE INDEX idx_car_variants_price 
    ON car_variants(ex_showroom_price);

CREATE INDEX idx_car_variants_fuel 
    ON car_variants(fuel_type);

CREATE INDEX idx_car_variants_trans 
    ON car_variants(transmission);

CREATE INDEX idx_car_variants_safety 
    ON car_variants(safety_rating_ncap);

-- Composite B-Tree index for common car search queries (Fuel + Transmission + Price)
CREATE INDEX idx_car_variants_filter_comp 
    ON car_variants(fuel_type, transmission, ex_showroom_price);

-- Indexes on variant_features
CREATE INDEX idx_variant_features_feature_id 
    ON variant_features(feature_id);

-- Indexes on customer_searches for user lookup and time-series analytics
CREATE INDEX idx_customer_searches_user_id 
    ON customer_searches(user_id);

CREATE INDEX idx_customer_searches_timestamp 
    ON customer_searches(search_timestamp DESC);
