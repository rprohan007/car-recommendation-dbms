# Car Recommendation Database Management System (DBMS)

An intelligent automotive recommendation and specification audit platform built with **Next.js 14 (App Router)**, **TypeScript**, **PostgreSQL 14+**, and the **`pgvector`** extension with 1536-dimensional HNSW vector search.

Designed and engineered for a **50-Mark Academic DBMS University Project Evaluation**.

---

## 📑 Evaluation Deliverables & Documentation Index

All academic deliverables required for project evaluation and viva examination are organized in [`docs/`](file:///Users/rujuljain/car-recommendation-dbms/docs/):

* 📊 **[ER Diagram & Relational Schema Architecture](file:///Users/rujuljain/car-recommendation-dbms/docs/er_diagram.md)**: Formal Mermaid entity-relationship diagram with keys, cardinalities, check constraints, and junction table documentation.
* 🏛️ **[Technology Justification & Architectural Rationale](file:///Users/rujuljain/car-recommendation-dbms/docs/technology_justification.md)**: Academic comparative analysis justifying PostgreSQL + pgvector over MongoDB, Pinecone, and traditional SQL.
* 🎓 **[SQL Viva & Examination Demonstration Guide](file:///Users/rujuljain/car-recommendation-dbms/docs/sql_demonstration_guide.md)**: Step-by-step viva script with exact SQL commands for DML, 5-table JOINs, subqueries, recursive CTEs, triggers, and vector search.
* 🧪 **[Automated Testing & Security QA Report](file:///Users/rujuljain/car-recommendation-dbms/docs/test_report.md)**: Automated test execution log (12/12 passed), RBAC matrix, and Next.js production build output.
* ✅ **[50-Mark Demonstration Checklist](file:///Users/rujuljain/car-recommendation-dbms/docs/demonstration_checklist.md)**: Complete mapping of all 50 rubric marks to specific files and line numbers.
* 👥 **[Team Member Contribution Template](file:///Users/rujuljain/car-recommendation-dbms/docs/team_contribution_template.md)**: Work breakdown form for academic project submission.

---

## 🚀 Key Features

1. **Intelligent Hybrid Search**:
   - Natural language semantic intent matching using 1536-dimensional vector embeddings with cosine similarity.
   - Multi-attribute relational filtering (Budget Range, Powertrain, Transmission, Body Style, NCAP Safety Stars).
   - Weighted composite scoring balancing semantic match (60%), safety rating (25%), and budget alignment (15%).
2. **Side-by-Side Comparison Matrix**:
   - Compare up to 3 vehicles simultaneously across technical specifications, engine CC, NCAP stars, and equipment list.
   - One-click shareable link generation (`/compare?ids=3,9,6`) with clipboard feedback.
3. **Automotive Financial Loan & EMI Planner**:
   - Built into vehicle details modal with live recalculation of Monthly EMI, Total Payable, and Interest using dynamic sliders for Down Payment (10-50%), Interest Rate (7-14%), and Tenure (12-84 months).
4. **Upcoming Launches Timeline**:
   - Dynamic tracker querying database view `v_upcoming_launches` for expected launch dates.
5. **Role-Based Access Control (RBAC)**:
   - Authenticated `customer` and privileged `admin` roles.
   - Server-side defense-in-depth protection on `/admin` pages and privileged API endpoints (`/api/admin/cars`, `/api/admin/models`).
   - Bcrypt password hashing (12 salt rounds) with fail-closed security.
6. **Graceful Fail-Closed Architecture**:
   - Refuses to hide database connection failures behind unauthenticated mock responses.
   - Provides an interactive offline demo dataset switch so examiners can evaluate frontend functionality even before starting a local database daemon.

---

## 🛠️ Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | 14.2.35 | Full-stack React framework with SSR and API routes |
| **Language** | TypeScript | 5.5.3 | Strict static type safety |
| **Database** | PostgreSQL | 14+ | Relational DBMS with ACID transactions and constraints |
| **Vector Extension**| `pgvector` | 0.5.0+ | 1536-dimensional dense vector embeddings with HNSW index |
| **Authentication** | NextAuth.js & `bcryptjs`| 4.24 / 3.0 | Secure session management & salted password hashing |
| **Styling** | Tailwind CSS & Lucide Icons | 3.4 / 1.61 | Modern automotive dark UI aesthetic |

---

## 📋 Prerequisites & Installation

### Prerequisites
* **Node.js**: v18.17.0+ or v20+ (tested on Node.js v25.1.0)
* **npm**: v9+ (tested on npm 11.6.2)
* **PostgreSQL**: Version 14 or higher with the `pgvector` extension installed.

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/rprohan007/car-recommendation-dbms.git
cd car-recommendation-dbms
npm install
```

### 2. Configure Environment Variables
Create a local `.env.local` file by copying `.env.example`:
```bash
cp .env.example .env.local
```

Generate a secure 32-byte secret for NextAuth:
```bash
openssl rand -base64 32
```

Configure `.env.local` with your database credentials:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/car_dbms
NEXTAUTH_SECRET=your_generated_32_byte_secret_here
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development

# Optional: Add OpenAI API key for live online vector generation
# OPENAI_API_KEY=sk-...
```

---

## 🗄️ Database Setup & Initialization

All SQL scripts are located in [`database/`](file:///Users/rujuljain/car-recommendation-dbms/database/) and are designed to be safe and reproducible.

### 1. Create Database & Enable Extension
```bash
createdb car_dbms
psql -U postgres -d car_dbms -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 2. Run Database Scripts in Order
Execute the SQL files in order:
```bash
# Step 1: Idempotent Relational Schema & Constraints
psql -U postgres -d car_dbms -f database/01_schema.sql

# Step 2: Vector Setup & 1536-D HNSW Cosine Index
psql -U postgres -d car_dbms -f database/02_vector_setup.sql

# Step 3: Views, Stored Functions, Procedures, Triggers & CTEs
psql -U postgres -d car_dbms -f database/03_advanced_sql.sql

# Step 4: Seed Users (with Bcrypt Hashes), Catalog & 1536-D Embeddings
psql -U postgres -d car_dbms -f database/04_seed.sql
```

> [!NOTE]
> For development resets, use `database/00_reset_dev_only.sql` to explicitly drop existing tables before re-running setup. Normal setup via `01_schema.sql` is non-destructive (`IF NOT EXISTS`).

### Default Seed Accounts for Testing

| Email | Password | Role | Permissions |
| :--- | :--- | :--- | :--- |
| `vikram.admin@cardb.in` | `Admin@123` | **admin** | Full access to `/admin` management and privileged APIs |
| `rohan.patel@example.com` | `Customer@123` | **customer** | Public recommendations, comparison matrix, saved searches |
| `priya.sharma@example.com` | `Customer@123` | **customer** | Standard customer access |
| `ananya.analyst@cardb.in` | `Analyst@123` | **analyst** | Analytics and reporting queries |

---

## 🏃 Running the Application

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run start
```

---

## 🧪 Automated Testing & Verification

Run the automated security and system test suite:
```bash
npx tsx scripts/test_system.ts
```

Run TypeScript compiler typecheck:
```bash
npx tsc --noEmit
```

Check Git working tree whitespace cleanliness:
```bash
git diff --check
```

---

## 🎓 SQL Viva Demonstration Suite

Execute the turnkey viva demonstration script to verify all 50 marks:
```bash
psql -U postgres -d car_dbms -f database/05_demonstration.sql
```
This script demonstrates:
1. **Core DML**: Insert, Filtered Select, Update, and Delete with constraint checks.
2. **5-Table JOIN**: Aggregating variants, models, brands, and standard equipment.
3. **Subqueries**: Nested brand average calculation and correlated safety rank query.
4. **Recursive CTE**: `budget_ladder` dynamic price tier and EMI staircase.
5. **Window Functions**: `DENSE_RANK()` pricing rank by body segment.
6. **Stored Procedure**: `sp_bulk_adjust_pricing` atomic batch update.
7. **Database Trigger**: `trg_log_search` automatic auditing into `customer_searches`.
8. **pgvector CRUD**: Insertion, `<=>` Cosine Distance Search, Vector Update, and Vector Delete.

---

## 🔒 Security Architecture Highlights

* **No Arbitrary Passwords**: Removed all insecure demo-account fallbacks that previously accepted arbitrary passwords. All accounts authenticate strictly through Bcrypt hash verification.
* **Role Escalation Prevention**: The registration API strictly overrides incoming role payloads to `customer`. Privileged roles cannot be self-assigned.
* **Server-Side Authorization**: Privileged administrative APIs (`/api/admin/cars`, `/api/admin/models`) enforce server-side authentication and role verification via `requireAdmin(req)` in addition to Next.js Edge middleware.
* **SQL Injection Immunity**: 100% of user inputs in API routes use parameterized queries (`$1`, `$2`, etc.).

---

## 📄 License & Academic Declaration
This project was developed for academic database management system coursework. Source code is licensed under the MIT License.
