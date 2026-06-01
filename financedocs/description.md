# Technical Documentation: Finance Tracker Backend

## 1. Overview & Technology Stack
* **Framework:** NestJS
* **ORM:** TypeORM
* **Database:** PostgreSQL
* **Goal:** A robust backend system for isolated, multi-currency personal finance management.

## 2. Functional Requirements

### 2.1. [cite_start]Authorization [cite: 1]
* [cite_start]**System Access:** Secure authorization mechanisms must be implemented for user access. [cite: 1]

### 2.2. [cite_start]Account Management [cite: 2]
* [cite_start]**CRUD Operations:** The system must support the creation, editing, viewing, and soft deletion of accounts. [cite: 3]
* [cite_start]**Multi-currency:** Each account has its own distinct currency. [cite: 3]
* [cite_start]**Automated Sync:** The account balance is recalculated automatically based on related transactions. [cite: 3]

### 2.3. [cite_start]Transaction Categories [cite: 4]
* [cite_start]**Classification:** Division into income and expense categories. [cite: 6]
* [cite_start]**Shared Categories:** Shared categories that are available to all users for reading. [cite: 5]
* [cite_start]**Custom Categories:** Custom categories that are created by the user and are accessible only to them. [cite: 5]

### 2.4. [cite_start]Transactions [cite: 7]
* [cite_start]**Tracking:** Recording of income and expenses specifying the amount, date, account, and category. [cite: 8]
* [cite_start]**Transfers:** Optional feature for transfers between accounts. [cite: 8]
* [cite_start]**Transaction Editing:** The ability to move funds or transactions to another account. [cite: 9] [cite_start]If account currencies differ, a recalculation must be performed. [cite: 9]
* [cite_start]**Dual-Currency Storage:** Each transaction stores the amount in the original account currency and the immediately converted amount in the user's currency at the time of the transaction. [cite: 10]

### 2.5. [cite_start]Budgets and Recurring Payments [cite: 11]
* [cite_start]**Budgeting:** Setting budgets for a specific category for a period (week, month, year). [cite: 12]
* [cite_start]**Automation:** Creation of payments that are executed periodically. [cite: 12]

### 2.6. [cite_start]History and Analytics [cite: 13]
* [cite_start]**Filtering:** Retrieving transaction history by date range, account, category, or type. [cite: 14]
* [cite_start]**Reporting:** Generation of statistics: expenses by categories, dynamics by days, and so on. [cite: 14, 15]

### 2.7. Localization
* [cite_start]**i18n:** Multilingualism support across the application. [cite: 16]

---

## 3. Database Architecture (ER Model)

The database schema is designed to enforce strict data isolation (`user_id`) and seamless currency handling.

### 3.1. `currencies` (New Reference Table)
*This table should be seeded once during the initial application deployment.*
* **`code`** (VARCHAR, Primary Key) - e.g., 'USD', 'EUR', 'UAH'.
* **`name`** (VARCHAR) - Full currency name.
* **`symbol`** (VARCHAR) - Currency symbol.

### 3.2. `users`
* **`id`** (UUID, Primary Key)
* **`email`** (VARCHAR, Unique)
* **`password`** (VARCHAR)
* **`base_currency`** (VARCHAR, Foreign Key -> `currencies.code`)
* **`created_at`** (TIMESTAMP)

### 3.3. `accounts`
* **`id`** (UUID, Primary Key)
* **`user_id`** (UUID, Foreign Key -> `users.id`)
* **`name`** (VARCHAR)
* **`currency`** (VARCHAR, Foreign Key -> `currencies.code`)
* **`balance`** (DECIMAL)

### 3.4. `categories`
* **`id`** (UUID, Primary Key)
* **`user_id`** (UUID, Foreign Key -> `users.id`, Nullable) - *NULL indicates a global system category.*
* **`nameEn`** (VARCHAR, Nullable) - *English name translation.*
* **`nameUk`** (VARCHAR, Nullable) - *Ukrainian name translation.*
* **`type`** (INT) - *1 for Income, 2 for Expense.*

### 3.5. `transactions`
* **`id`** (UUID, Primary Key)
* **`user_id`** (UUID, Foreign Key -> `users.id`)
* **`account_id`** (UUID, Foreign Key -> `accounts.id`)
* **`category_id`** (UUID, Foreign Key -> `categories.id`)
* **`type`** (INT / ENUM)
* **`amount`** (DECIMAL) - *Original currency amount.*
* **`base_amount`** (DECIMAL) - *Converted amount in the user's base currency.*
* **`date`** (TIMESTAMP)
* **`note`** (TEXT, Nullable)

### 3.6. `budgets`
* **`id`** (UUID, Primary Key)
* **`user_id`** (UUID, Foreign Key -> `users.id`)
* **`category_id`** (UUID, Foreign Key -> `categories.id`)
* **`limit_amount`** (DECIMAL)
* **`period`** (INT / ENUM)
* **`start_date`** (DATE)

### 3.7. `recurring_payments`
* **`id`** (UUID, Primary Key)
* **`user_id`** (UUID, Foreign Key -> `users.id`)
* **`account_id`** (UUID, Foreign Key -> `accounts.id`)
* **`category_id`** (UUID, Foreign Key -> `categories.id`)
* **`amount`** (DECIMAL)
* **`frequency`** (INT / ENUM)
* **`begin_date`** (DATE)
* **`is_active`** (BOOLEAN)

## 4. Technical Specifications & Enums

### 4.1. Category Enums
* **`type`**: `1` = Income, `2` = Expense

### 4.2. Budget Enums
* **`period`**: `1` = Weekly, `2` = Monthly, `3` = Yearly

### 4.3. Recurring Payments Enums
* **`type`**: `1` = Income, `2` = Expense
* **`frequency`**: `1` = Daily, `2` = Weekly, `3` = Monthly, `4` = Yearly

### 4.4. Automated Background Jobs
* **Midnight Cron**: The `RecurringPaymentsService` runs a Cron job every day at midnight (`00:00`) to process recurring payments. It identifies all active payments where `nextExecuteDate <= today`, auto-generates the corresponding transaction, and increments the `nextExecuteDate` based on the frequency.

### 4.5. Budget Calculation Logic
* The `spentAmount` on a budget is derived dynamically in the service layer by fetching all `transactions` belonging to the specified `category_id` that fall within the budget's defined `startDate` and `endDate`. Since budgets typically track expenses, this primarily sums transactions where category type is Expense.