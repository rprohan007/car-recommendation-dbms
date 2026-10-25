# University Viva & Examination SQL Demonstration Guide

**Project**: Car Recommendation Database Management System  
**Engine**: PostgreSQL 14+ with `pgvector`  
**Target**: 50/50 Marks Viva Demonstration  

This guide provides the exact queries, terminal commands, and explanations to present to your project examiner. All queries are pre-compiled and runnable from [`database/05_demonstration.sql`](../database/05_demonstration.sql).

---

## Quick Execution in Terminal

To run the complete demonstration suite interactively in `psql`:

```bash
psql -U postgres -d car_dbms -f database/05_demonstration.sql
```

Alternatively, open `pgAdmin 4` or any PostgreSQL client, open [`database/05_demonstration.sql`](../database/05_demonstration.sql), and execute section by section.

---

## Section 1: Core DML Operations with Constraints (Rubric: 8 Marks)

### 1.1 DML INSERT: Adding a Variant with Foreign Key & Check Constraints
* **Examiner Question**: *"Show me how your database enforces referential integrity on insert."*
* **SQL Query**:
  ```sql
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
  ```
* **Expected Output**: Returns newly created `variant_id` with price `1199000.00` and NCAP `5.0`.
* **Integrity Proof**: If `ex_showroom_price` is negative or `model_id` does not exist, PostgreSQL immediately rejects with `chk_price_positive` or foreign key violation.

### 1.2 DML SELECT: Multi-Attribute Predicate Filter
* **SQL Query**:
  ```sql
  SELECT m.name AS manufacturer, cm.model_name, cv.variant_name, cv.ex_showroom_price, cv.safety_rating_ncap
  FROM car_variants cv
  JOIN car_models cm ON cv.model_id = cm.model_id
  JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
  WHERE cv.ex_showroom_price BETWEEN 1000000.00 AND 2000000.00
    AND cv.safety_rating_ncap >= 4.5
    AND cv.is_active = TRUE
  ORDER BY cv.safety_rating_ncap DESC, cv.ex_showroom_price ASC
  LIMIT 5;
  ```
* **Expected Output**: 5 rows of 5-star safe cars within 10–20 Lakhs sorted by price.

### 1.3 DML UPDATE: In-Place Specification Revision
* **SQL Query**:
  ```sql
  UPDATE car_variants
  SET ex_showroom_price = 1249000.00, mileage_kmpl = 17.50, updated_at = CURRENT_TIMESTAMP
  WHERE variant_name = 'Demonstration Spec 1.2 Turbo AT'
  RETURNING variant_id, variant_name, ex_showroom_price, mileage_kmpl, updated_at;
  ```

### 1.4 DML DELETE: Safe Disposable Record Cleanup
* **SQL Query**:
  ```sql
  DELETE FROM car_variants
  WHERE variant_name = 'Demonstration Spec 1.2 Turbo AT'
  RETURNING variant_id, variant_name, 'DELETED' AS status;
  ```

---

## Section 2: Complex Queries & JOINs (Rubric: 8 Marks)

### 2.1 Five-Table JOIN with String Aggregation
* **Examiner Question**: *"Demonstrate multi-table joins involving your junction table."*
* **SQL Query**:
  ```sql
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
  ```

### 2.2 Nested Subquery: Variants Priced Below Brand Average
* **SQL Query**:
  ```sql
  SELECT m.name AS brand, cm.model_name, cv.variant_name, cv.ex_showroom_price,
         ROUND(brand_stats.avg_price, 2) AS brand_average_price
  FROM car_variants cv
  JOIN car_models cm ON cv.model_id = cm.model_id
  JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
  JOIN (
      SELECT cm2.manufacturer_id, AVG(cv2.ex_showroom_price) AS avg_price
      FROM car_variants cv2
      JOIN car_models cm2 ON cv2.model_id = cm2.model_id
      WHERE cv2.is_active = TRUE
      GROUP BY cm2.manufacturer_id
  ) brand_stats ON cm.manufacturer_id = brand_stats.manufacturer_id
  WHERE cv.ex_showroom_price < brand_stats.avg_price
  LIMIT 5;
  ```

### 2.3 Correlated Subquery: Top Safety Variant per Brand
* **SQL Query**:
  ```sql
  SELECT m.name AS brand, cm.model_name, cv.variant_name, cv.safety_rating_ncap
  FROM car_variants cv
  JOIN car_models cm ON cv.model_id = cm.model_id
  JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
  WHERE cv.safety_rating_ncap = (
      SELECT MAX(cv_inner.safety_rating_ncap)
      FROM car_variants cv_inner
      JOIN car_models cm_inner ON cv_inner.model_id = cm_inner.model_id
      WHERE cm_inner.manufacturer_id = cm.manufacturer_id
        AND cv_inner.is_active = TRUE
  )
  ORDER BY m.name, cv.ex_showroom_price ASC;
  ```

---

## Section 3: Advanced SQL, Procedures, Triggers & CTEs (Rubric: 13 Marks)

### 3.1 Recursive CTE: Budget Escalation Ladder
* **Examiner Question**: *"Do you have a recursive CTE and what problem does it solve?"*
* **Explanation**: Dynamically projects budget upgrade tiers from an entry price point, calculating monthly finance EMI increments and aggregating available cars in each tier.
* **SQL Query**:
  ```sql
  WITH RECURSIVE budget_ladder AS (
      SELECT 
          1 AS tier_level,
          800000.00::NUMERIC(12,2) AS tier_min_price,
          1200000.00::NUMERIC(12,2) AS tier_max_price,
          'Entry Tier'::VARCHAR(50) AS tier_label,
          ROUND((800000.00 * 0.018)::NUMERIC, 0) AS estimated_monthly_emi
      UNION ALL
      SELECT 
          bl.tier_level + 1,
          (bl.tier_max_price + 1.00)::NUMERIC(12,2),
          ROUND((bl.tier_max_price * 1.50)::NUMERIC, 2),
          CASE 
              WHEN bl.tier_level + 1 = 2 THEN 'Mid-Range Value'
              WHEN bl.tier_level + 1 = 3 THEN 'Premium Executive'
              ELSE 'Luxury Flagship'
          END::VARCHAR(50),
          ROUND(((bl.tier_max_price * 1.50) * 0.018)::NUMERIC, 0)
      FROM budget_ladder bl
      WHERE bl.tier_level < 4
  )
  SELECT bl.tier_level, bl.tier_label, bl.tier_min_price, bl.tier_max_price, bl.estimated_monthly_emi,
         COUNT(cv.variant_id) AS matching_vehicles_in_db
  FROM budget_ladder bl
  LEFT JOIN car_variants cv ON cv.ex_showroom_price BETWEEN bl.tier_min_price AND bl.tier_max_price AND cv.is_active = TRUE
  GROUP BY bl.tier_level, bl.tier_label, bl.tier_min_price, bl.tier_max_price, bl.estimated_monthly_emi
  ORDER BY bl.tier_level ASC;
  ```

### 3.2 Window Functions: DENSE_RANK & Segment Percentiles
* **SQL Query**:
  ```sql
  SELECT cm.body_type, m.name AS brand, cm.model_name, cv.variant_name, cv.ex_showroom_price,
         DENSE_RANK() OVER (PARTITION BY cm.body_type ORDER BY cv.ex_showroom_price ASC) AS price_rank_in_segment,
         ROUND(AVG(cv.ex_showroom_price) OVER (PARTITION BY cm.body_type), 2) AS segment_avg_price
  FROM car_variants cv
  JOIN car_models cm ON cv.model_id = cm.model_id
  JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
  WHERE cv.is_active = TRUE
  ORDER BY cm.body_type, price_rank_in_segment ASC
  LIMIT 10;
  ```

### 3.3 Stored Procedure: Transactional Price Revision (`CALL sp_bulk_adjust_pricing`)
* **SQL Command**:
  ```sql
  CALL sp_bulk_adjust_pricing('Tata Motors', 1.50, 'Viva Demonstration');
  -- Revert immediately to preserve seed data:
  CALL sp_bulk_adjust_pricing('Tata Motors', -1.47783, 'Revert Viva Demo');
  ```

### 3.4 Database Trigger: Search Audit Logging (`trg_log_search`)
* **SQL Query**:
  ```sql
  INSERT INTO user_search_requests (
      user_id, min_budget, max_budget, preferred_fuel, raw_search_query
  ) VALUES (
      (SELECT user_id FROM users WHERE email = 'rohan.patel@example.com' LIMIT 1),
      1200000.00, 1800000.00, 'Electric', 'Viva Trigger Test: Long range electric SUV'
  );

  SELECT search_id, user_id, min_budget, max_budget, preferred_fuel, raw_search_query, searched_at
  FROM customer_searches
  WHERE raw_search_query LIKE 'Viva Trigger Test%'
  ORDER BY searched_at DESC LIMIT 1;
  ```

---

## Section 4: pgvector CRUD & Cosine Distance Search (<=>) (Rubric: 9 + 13 Marks)

### 4.1 Verify Extension & HNSW Index
* **SQL Query**:
  ```sql
  SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector', 'pgvector');
  SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'car_variants' AND indexname LIKE '%hnsw%';
  ```

### 4.2 Vector Similarity Search (`<=>` Cosine Distance Operator)
* **SQL Query**:
  ```sql
  WITH query_vector AS (
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
  ```
