# Team Member Individual Contribution & Work Breakdown Template

**Project Title**: Car Recommendation Database Management System  
**Course Code / Name**: Database Management Systems (DBMS)  
**Academic Term**: University Project Submission  

---

## Instructions for Team Members
Please complete this work breakdown form honestly prior to your viva voce examination. Each member should highlight their primary database architectural contributions, frontend/backend modules developed, and query demonstrations prepared.

---

### Team Member 1

* **Student Name**: `[Enter Full Name]`
* **Roll / Registration Number**: `[Enter Student ID]`
* **Assigned Role**: Lead Database Architect & Security Engineer
* **Primary Responsibilities & Deliverables**:
  - Designed the relational schema DDL ([`database/01_schema.sql`](../database/01_schema.sql)) with primary, foreign, unique, and check constraints.
  - Implemented secure authentication with NextAuth.js, Bcrypt password hashing (12 salt rounds), and fail-closed error handling ([`src/lib/auth.ts`](../src/lib/auth.ts)).
  - Implemented Role-Based Access Control (RBAC) ensuring public registration strictly assigns `customer` role and restricts `/admin` endpoints ([`src/app/api/auth/register/route.ts`](../src/app/api/auth/register/route.ts), [`src/lib/auth-helpers.ts`](../src/lib/auth-helpers.ts)).
  - Configured PostgreSQL `pgvector` extension and 1536-dimensional HNSW index with cosine distance operators ([`database/02_vector_setup.sql`](../database/02_vector_setup.sql)).
* **Viva Demonstration Topic**: Relational constraints, Bcrypt security, HNSW vector indexing, and database trigger execution.

---

### Team Member 2

* **Student Name**: `[Enter Full Name]`
* **Roll / Registration Number**: `[Enter Student ID]`
* **Assigned Role**: Advanced SQL Developer & Database Optimizer
* **Primary Responsibilities & Deliverables**:
  - Developed advanced analytical queries, stored procedures (`sp_bulk_adjust_pricing`, `sp_archive_model_cascade`), and stored functions (`fn_search_cars`) ([`database/03_advanced_sql.sql`](../database/03_advanced_sql.sql)).
  - Created the Recursive CTE budget escalation ladder (`budget_ladder`) and window functions using `DENSE_RANK()` and `AVG() OVER (PARTITION BY ...)` ([`database/05_demonstration.sql`](../database/05_demonstration.sql)).
  - Implemented the database audit trigger `trg_log_search` to log search requests into `customer_searches`.
  - Authored the Technology Justification document comparing PostgreSQL + pgvector against MongoDB and Pinecone ([`docs/technology_justification.md`](technology_justification.md)).
* **Viva Demonstration Topic**: Complex 5-table JOINs, Recursive CTE logic, stored procedures, and window functions.

---

### Team Member 3

* **Student Name**: `[Enter Full Name]`
* **Roll / Registration Number**: `[Enter Student ID]`
* **Assigned Role**: Full-Stack Next.js Developer & QA Specialist
* **Primary Responsibilities & Deliverables**:
  - Built the Next.js 14 App Router frontend pages: Recommendation Portal ([`src/app/page.tsx`](../src/app/page.tsx)), Side-by-Side Comparison Matrix ([`src/app/compare/page.tsx`](../src/app/compare/page.tsx)), and Upcoming Launches ([`src/app/upcoming/page.tsx`](../src/app/upcoming/page.tsx)).
  - Created the interactive Vehicle Specifications modal with live Financial EMI & Loan Calculator in `src/app/page.tsx`.
  - Built backend API endpoints with parameterized SQL: `/api/recommend`, `/api/compare`, `/api/upcoming`, and `/api/health`.
  - Developed and ran the automated security and system test suite ([`scripts/test_system.ts`](../scripts/test_system.ts)) and compiled the QA report ([`docs/test_report.md`](test_report.md)).
* **Viva Demonstration Topic**: Natural language recommendation flow, comparison matrix parameterization, and EMI finance calculation.

---

## Signatures & Declaration

We hereby declare that this submission represents our original academic work. All external libraries, algorithms, and references have been duly cited and documented in accordance with university academic integrity regulations.

| Student Name | Signature | Date |
| :--- | :--- | :--- |
| `[Member 1]` | _________________________ | `[Date]` |
| `[Member 2]` | _________________________ | `[Date]` |
| `[Member 3]` | _________________________ | `[Date]` |
