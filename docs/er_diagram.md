# Entity-Relationship (ER) Diagram & Relational Schema Architecture

**Project**: Car Recommendation Database Management System  
**Engine**: PostgreSQL 14+ with `pgvector` Extension  
**Course / Evaluation Target**: 50-Mark DBMS University Evaluation  

---

## 1. Formal Mermaid Entity-Relationship Diagram

This diagram reflects the exact database schema implemented in [`database/01_schema.sql`](../database/01_schema.sql) and [`database/02_vector_setup.sql`](../database/02_vector_setup.sql).

```mermaid
erDiagram
    MANUFACTURERS ||--o{ CAR_MODELS : manufactures
    CAR_MODELS ||--|{ CAR_VARIANTS : contains
    CAR_VARIANTS ||--o{ VARIANT_FEATURES : equips
    FEATURES ||--o{ VARIANT_FEATURES : specified_in
    USERS ||--o{ USER_SEARCH_REQUESTS : submits
    USERS ||--o{ CUSTOMER_SEARCHES : logs
    USER_SEARCH_REQUESTS ||--o| CUSTOMER_SEARCHES : triggers_audit

    MANUFACTURERS {
        SERIAL manufacturer_id PK
        VARCHAR(100) name UK "NOT NULL"
        VARCHAR(60) country_origin "NOT NULL"
        VARCHAR(255) website_url
        TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
    }

    CAR_MODELS {
        SERIAL model_id PK
        INT manufacturer_id FK "REFERENCES manufacturers(manufacturer_id) ON DELETE RESTRICT"
        VARCHAR(100) model_name "NOT NULL"
        VARCHAR(40) body_type "CHECK IN ('SUV', 'Sedan', 'Hatchback', 'MUV', 'Coupe')"
        VARCHAR(30) launch_status "DEFAULT 'launched' CHECK IN ('launched', 'upcoming', 'discontinued')"
        DATE expected_launch_date
        INT seating_capacity "CHECK > 0 AND <= 16"
        TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
    }

    CAR_VARIANTS {
        SERIAL variant_id PK
        INT model_id FK "REFERENCES car_models(model_id) ON DELETE CASCADE"
        VARCHAR(120) variant_name "NOT NULL"
        NUMERIC(12_2) ex_showroom_price "NOT NULL CHECK > 0"
        VARCHAR(30) fuel_type "NOT NULL CHECK IN ('Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid')"
        VARCHAR(30) transmission "NOT NULL CHECK IN ('Manual', 'Automatic', 'AMT', 'CVT', 'DCT')"
        INT engine_displacement_cc "CHECK > 0 OR NULL (EV)"
        NUMERIC(6_2) power_bhp "CHECK > 0"
        NUMERIC(6_2) torque_nm "CHECK > 0"
        NUMERIC(5_2) mileage_kmpl "NOT NULL CHECK > 0"
        NUMERIC(2_1) safety_rating_ncap "CHECK >= 0 AND <= 5"
        BOOLEAN is_active "DEFAULT TRUE"
        VECTOR_1536 embedding "Dense OpenAI 1536-D Vector"
        TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMP updated_at "DEFAULT CURRENT_TIMESTAMP"
    }

    FEATURES {
        SERIAL feature_id PK
        VARCHAR(100) feature_name UK "NOT NULL"
        VARCHAR(50) category "CHECK IN ('Safety', 'Comfort & Convenience', 'Infotainment', 'Performance')"
        TEXT description
    }

    VARIANT_FEATURES {
        INT variant_id PK, FK "REFERENCES car_variants(variant_id) ON DELETE CASCADE"
        INT feature_id PK, FK "REFERENCES features(feature_id) ON DELETE RESTRICT"
        BOOLEAN is_standard "DEFAULT TRUE"
    }

    USERS {
        SERIAL user_id PK
        VARCHAR(120) full_name "NOT NULL"
        VARCHAR(255) email UK "NOT NULL (LOWER normalized)"
        VARCHAR(255) password_hash "NOT NULL (Bcrypt 12-round)"
        VARCHAR(30) role "DEFAULT 'customer' CHECK IN ('customer', 'admin', 'analyst')"
        VARCHAR(20) phone
        TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
    }

    USER_SEARCH_REQUESTS {
        SERIAL request_id PK
        INT user_id FK "REFERENCES users(user_id) ON DELETE SET NULL"
        NUMERIC(12_2) min_budget "CHECK >= 0"
        NUMERIC(12_2) max_budget "CHECK >= min_budget"
        VARCHAR(30) preferred_fuel
        VARCHAR(30) preferred_transmission
        VARCHAR(40) preferred_body_type
        NUMERIC(2_1) min_safety_rating
        TEXT raw_search_query
        TIMESTAMP requested_at "DEFAULT CURRENT_TIMESTAMP"
    }

    CUSTOMER_SEARCHES {
        SERIAL search_id PK
        INT user_id FK "REFERENCES users(user_id) ON DELETE SET NULL"
        NUMERIC(12_2) min_budget
        NUMERIC(12_2) max_budget
        VARCHAR(30) preferred_fuel
        VARCHAR(30) preferred_transmission
        TEXT raw_search_query
        TIMESTAMP searched_at "DEFAULT CURRENT_TIMESTAMP"
    }
```

---

## 2. Relational Schema Architecture & Cardinality Analysis

### A. Manufacturer → Model → Variant Hierarchy
* **1-to-Many (`manufacturers` → `car_models`)**: One automaker (e.g., Tata Motors, Mahindra) designs multiple model lines (`Nexon`, `Curvv EV`, `XUV700`). Referential integrity uses `ON DELETE RESTRICT` to ensure a manufacturer cannot be deleted while vehicle models still reference it.
* **1-to-Many (`car_models` → `car_variants`)**: Each model line contains multiple trims with distinct powertrains and equipment levels. Referential integrity uses `ON DELETE CASCADE`, ensuring trim removal when a parent model line is purged.
* **Many-to-Many (`car_variants` ↔ `features`) via `variant_features`**:
  * Junction table using composite primary key `(variant_id, feature_id)`.
  * Accommodates equipment variance across trim ladders: base trims lack ADAS or panoramic sunroofs, whereas luxury trims include them as standard (`is_standard = TRUE`).

### B. User Activity & Search Auditing
* **1-to-Many (`users` → `user_search_requests`)**: Authenticated and guest search inputs are captured for preference mining. Uses `ON DELETE SET NULL` to preserve historical analytical data even if a user account is removed.
* **Database Trigger Synchronization (`trg_log_search`)**: Automatically propagates validated search criteria into `customer_searches` for administrative trend analysis.

---

## 3. Database Constraints & Data Integrity Matrix

| Table | Constraint Name | Type | Purpose |
| :--- | :--- | :--- | :--- |
| `users` | `uq_users_email` | UNIQUE | Prevents duplicate user registrations (case-insensitive normalized). |
| `users` | `chk_user_role` | CHECK | Restricts roles strictly to `customer`, `admin`, or `analyst`. |
| `car_models` | `chk_body_type` | CHECK | Ensures body styles adhere to valid automotive segments. |
| `car_models` | `chk_launch_status` | CHECK | Enforces launch progression (`launched`, `upcoming`, `discontinued`). |
| `car_variants` | `chk_price_positive` | CHECK | Rejects negative or zero prices (`ex_showroom_price > 0`). |
| `car_variants` | `chk_safety_rating` | CHECK | Restricts NCAP stars between `0.0` and `5.0`. |
| `car_variants` | `chk_fuel_type` | CHECK | Validates fuel powertrains against known market options. |
| `variant_features` | `pk_variant_features` | PRIMARY KEY | Composite key `(variant_id, feature_id)` prevents duplicate feature assignments. |
| `car_variants` | `idx_car_variants_hnsw` | HNSW INDEX | 1536-dimensional cosine distance vector index (`vector_cosine_ops`). |
