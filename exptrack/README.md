# FECMS — Function Expense & Collection Management System

FECMS is a web application engineered for community and organization events (festivals, functions, conferences, and sports meets) to maintain financial accountability.

Built strictly according to the **FECMS Build Plan**, it tracks every single rupee collected (linked to receipt book leaves, donors, and collectors) and every single rupee spent (with receipt bill uploads and mandatory admin review).

---

## 🚀 Key Features

### 1. Role-Based Access Control (RBAC)
- **ADMIN / Treasurer / Event Lead:**
  - Full financial dashboard with **4 Real-Time KPI Cards** (Total Collections, Approved Expenses, Net Balance, Pending Queue Count).
  - Net Balance turns **Crimson Alert** upon deficit (< ₹0).
  - **Audit Approval Queue:** 1-Click Approval (stamps reviewer and immediately accounts into expenditure) and Rejection (with mandatory rejection reason requirement).
  - **Master Ledgers:** Filterable & Searchable Collections and Expenses Ledgers with **CSV Export**.
  - **User & Roster Management:** Create team accounts and reset passwords (min 8 chars).
- **USER / Field Collector Member:**
  - **Record Collections:** Fast collection logging with unique receipt leaf verification, quick amount chips (`+₹100`, `+₹500`, `+₹1000`, `+₹2000`, `+₹5000`, `+₹10000`), payment mode pills (`CASH`, `UPI`, `BANK_TRANSFER`, `CHEQUE`), and printable vouchers.
  - **Submit Expense Bills:** Bill photo/document upload with 5 MB cap, image compression, and category selection.
  - **Field Ledger & History:** Personal collection book tracking and submitted bill status tracker (`PENDING`, `APPROVED`, `REJECTED` with admin rejection reasons).

### 2. Core Business Rules (Section 6)
- $\text{Total Income} = \sum \text{All Collections}$
- $\text{Total Expenses} = \sum \text{APPROVED Expenses Only}$
- $\text{Net Balance} = \text{Total Income} - \text{Total Approved Expenses}$
- Pending and rejected bills **never** affect Net Balance.
- Receipt book number is **strictly unique** per leaf (409 conflict avoidance).

---

## 🛠️ Tech Stack & Design Tokens

- **Frontend:** React 19 + Vite + Tailwind CSS + Lucide Icons + Canvas Confetti
- **Backend & Database:** Supabase (PostgreSQL + Row-Level Security + Storage Bucket)
- **Currency:** Indian Rupee (`INR` / `₹`) with Indian digit grouping (`₹1,50,000.00`)
- **Theme (Apex Ledger):**
  - Navy: `#0F172A`
  - Surface: `#F8F9FF`
  - Emerald (Income & Approved): `#10B981`
  - Crimson (Deficit & Rejected): `#EF4444`
  - Amber (Pending Review): `#F59E0B`
  - Typography: *Plus Jakarta Sans*

---

## 🗄️ Supabase Backend Setup

### Option A: 1-Click In-App Supabase Setup
1. Launch the app and click the **Supabase** status badge in the top navigation bar or login screen.
2. Enter your **Supabase Project URL** and **Anon Key**.
3. Copy the pre-built SQL schema from the **SQL Schema** tab and run it in the Supabase SQL Editor.
4. Click **Test Connection** & **Save & Apply**.

### Option B: Local `.env` Configuration
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Option C: Instant Offline Demo Mode
If Supabase credentials are not provided, the app automatically runs in localized offline demo mode with sample collections, expenses, and demo users.

---

## 🔑 Demo Logins

| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Treasurer / Admin** | `admin` | `password123` | Full access to KPIs, approvals queue, user roster, and CSV exports |
| **Field Member 1** | `amit` | `password123` | Field lead with collection records and submitted bills |
| **Field Member 2** | `priya` | `password123` | Volunteer collector |

---

## 📜 Routes

- `/login` — Authentication & 1-click demo login
- `/member/record` — Record collection receipt
- `/member/upload` — Submit expense bill
- `/member/history` — Personal collections & bill status
- `/admin/overview` — Financial overview & 4 KPI cards
- `/admin/approvals` — Expense bills approval queue
- `/admin/collections` — Collections master ledger & CSV export
- `/admin/expenses` — Expenses master ledger & CSV export
- `/admin/users` — User management & password reset
