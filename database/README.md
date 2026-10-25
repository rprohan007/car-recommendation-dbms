# Car Recommendation Database Architecture

This directory contains the complete database scripts for the **Car Recommendation Database Management System**, built for PostgreSQL 14+ with native `pgvector` support.

---

## 📁 Directory Structure & Execution Order

Execute the SQL scripts in numerical order:

```bash
# Recommended execution sequence using psql
psql -U <username> -d <database_name> -f database/01_schema.sql
psql -U <username> -d <database_name> -f database/02_vector_setup.sql
psql -U <username> -d <database_name> -f database/03_advanced_sql.sql
psql -U <username> -d <database_name> -f database/04_seed.sql
```

---

## 📜 Script Breakdown

### 1. `01_schema.sql` (Core DDL)
* **Custom ENUM Types**:
  * `user_role`: `'customer'`, `'admin'`, `'dealer'`, `'analyst'`
  * `body_type`: `'SUV'`, `'Sedan'`, `'Hatchback'`, `'MUV'`, `'Coupe'`, `'Convertible'`
  * `launch_status`: `'upcoming'`, `'launched'`, `'discontinued'`
  * `fuel_enum`: `'Petrol'`, `'Diesel'`, `'Electric'`, `'Hybrid'`, `'CNG'`
  * `trans_enum`: `'Manual'`, `'Automatic'`, `'AMT'`, `'CVT'`, `'DCT'`
* **Relational Tables**:
  * `users`: Authentication, authorization roles, and profile metadata.
  * `manufacturers`: OEMs (Tata, Mahindra, Hyundai, Toyota, etc.).
  * `car_models`: Model lines with body type and seating capacity (`ON DELETE CASCADE` to manufacturer).
  * `car_variants`: Vehicle trims with exact specifications, price, fuel, and transmission (`ON DELETE CASCADE` to model).
  * `features`: Master feature catalog across Safety, Infotainment, Comfort & Convenience, and Performance.
  * `variant_features`: Many-to-many junction table mapping standard and optional features to variants.
  * `customer_searches`: Audit table tracking user searches, budget constraints, and preferences (`ON DELETE SET NULL` for user).
* **Integrity & Optimization**:
  * `CHECK` constraints on positive prices, valid safety ratings (0.0 to 5.0), budget ranges (`max_budget >= min_budget`), and seating capacities.
  * B-Tree indexes on single and composite filtering attributes (`fuel_type, transmission, ex_showroom_price`).

---

### 2. `02_vector_setup.sql` (pgvector & Semantic Search)
* **Extension**: Enables the `vector` extension (`CREATE EXTENSION IF NOT EXISTS vector;`).
* **Vector Column**: Adds `embedding vector(1536)` to `car_variants` to support high-dimensional embeddings (compatible with OpenAI text-embedding-3 / ada-002 models).
* **HNSW Index**: Builds a Hierarchical Navigable Small World (`HNSW`) vector index using `vector_cosine_ops` with parameters `m = 16, ef_construction = 64` for fast cosine similarity search.
* **Semantic Function**: Includes `match_car_variants_semantic(query_embedding, match_threshold, match_count)` to rank cars by cosine similarity.

---

### 3. `03_advanced_sql.sql` (Views, Functions, Triggers & Analytics)
* **View `v_upcoming_launches`**:
  * Joins `car_models` and `manufacturers` where `launch_status = 'upcoming'`.
  * Computes countdown `days_until_launch`, announced variant count, and estimated starting/top prices.
* **Stored Function `recommend_cars_fn()`**:
  * Multi-attribute vehicle recommendation engine filtering on minimum/maximum budget, fuel type, transmission, body style, and minimum NCAP safety rating.
  * Dynamically aggregates standard variant features into a formatted string.
* **Trigger & Function `trg_log_search`**:
  * Attaches to `user_search_requests` to automatically log all user search parameters and timestamped events into `customer_searches`.
* **Complex Analytical CTE Query**:
  * Computes category benchmarks per `body_type` (min price, median/50th percentile, average, 75th percentile, max price, average safety rating, and average feature count).
  * Measures each variant's price and feature deviation from category averages and calculates a Value-for-Money Index score.

---

### 4. `04_seed.sql` (Comprehensive Indian Market Seed Data)
* **Manufacturers**: Tata Motors, Mahindra & Mahindra, Hyundai Motor India, Toyota Kirloskar Motor.
* **Models**: Tata Nexon, Curvv EV, Altroz, Mahindra XUV700, Thar, BE 6e, Hyundai Creta, Verna, Ioniq 7, Toyota Fortuner, Innova Hycross, Urban Cruiser EV.
* **Variants**: 17+ detailed trims across Petrol, Diesel, Electric, and Hybrid powertrains with ex-showroom prices in INR.
* **Features Catalog**: 24 distinct features across Safety (ADAS Level 2, 6 Airbags, 360 Camera, ESP), Infotainment, and Comfort.
* **Variant Features**: Full mapping of standard and premium features per trim.
* **Sample User Searches**: Multi-parameter search history.
* **1536-Dimensional Mock Embeddings**: Deterministic generation and population of unit-normalized 1536-dimensional vectors for every car variant.

---

## 🧪 Verification Queries

### 1. Test Stored Recommendation Function
```sql
-- Search for safe petrol or diesel automatic SUVs with min 4.5 star safety under 25 Lakhs
SELECT * FROM recommend_cars_fn(
    p_min_budget => 1000000.00,
    p_max_budget => 2500000.00,
    p_body_type => 'SUV'::body_type,
    p_min_safety => 4.5,
    p_limit => 5
);
```

### 2. Test Upcoming Launches View
```sql
SELECT 
    model_name, 
    manufacturer_name, 
    body_type, 
    expected_launch_date, 
    days_until_launch 
FROM v_upcoming_launches;
```

### 3. Test Search Trigger
```sql
-- Inserting a search request automatically inserts into customer_searches
INSERT INTO user_search_requests (
    user_id, min_budget, max_budget, preferred_fuel, preferred_body_type, search_query
) VALUES (
    1, 800000.00, 1500000.00, 'Petrol', 'SUV', 'Safe compact city SUV'
);

-- Verify that customer_searches received the record
SELECT * FROM customer_searches ORDER BY search_timestamp DESC LIMIT 1;
```
