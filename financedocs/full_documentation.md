# FinanceApp - Full Technical Documentation

This document provides a comprehensive overview of the FinanceApp backend architecture, functionalities, and the specific implementations across all Controllers, Services, and Repositories.

---

## 1. System Architecture

The backend of FinanceApp is built on **NestJS**, utilizing a strictly layered **Hexagonal Architecture** (also known as Ports and Adapters). The primary goal of this architecture is to separate the business logic (Domain) from the external concerns (Database, HTTP transport, etc.).

### 1.1. Core Layers
*   **Controllers (HTTP Layer)**: Responsible for handling incoming HTTP requests, validating DTOs (Data Transfer Objects), and passing data down to the Service layer. Controllers are decorated with Swagger decorators for automated OpenAPI documentation generation.
*   **Services (Business Logic Layer)**: Contain the core business rules. They coordinate between different modules and rely entirely on Repositories for data fetching/saving.
*   **Repositories (Persistence Layer)**: Abstract the data storage. We use **TypeORM** for relational database interaction (PostgreSQL/SQL Server). The repositories implement standard interfaces, allowing the database technology to be swapped without modifying the Service layer.
*   **Mappers**: Responsible for translating between the underlying database entity schemas (`.entity.ts`) and the pure application Domain models (`.domain.ts`).

### 1.2. Design Patterns & Principles
*   **Dependency Injection**: NestJS's core DI container is used extensively to inject Services into Controllers, and Repositories into Services.
*   **Infinity Pagination**: Instead of running heavy `COUNT(*)` database queries, the application implements an infinite-scroll pagination pattern (`infinityPagination`) that returns a simple `hasNextPage` boolean.
*   **Dual-Currency Storage**: When a transaction is recorded, the system stores both the transaction amount in the native account currency and the converted equivalent amount based on the User's base profile currency.

---

## 2. Core Functionalities & Implementations

### 2.1. Authorization and Authentication
*   **Implementation**: Utilizes Passport.js via the `AuthModule`. It supports JWT-based local authentication as well as social logins (Apple, Facebook, Google).
*   **Flow**: Users receive a JWT Bearer token upon login/registration, which must be passed in the `Authorization` header. Sessions are stored in the database to allow for secure token invalidation and device tracking.

### 2.2. Account Management
*   **Implementation**: Handled by the `AccountsModule`. Each account has a balance and an associated currency.
*   **Automation**: Account balances are automatically recalculated dynamically whenever a transaction is created, updated, or deleted.

### 2.3. Transaction Tracking
*   **Implementation**: Handled by the `TransactionsModule`. Transactions are strictly linked to a specific User, Account, and Category.
*   **Types**: Includes Income (`type: 1`), Expenses (`type: 2`), and Transfers.
*   **Transfer Logic**: Internal logic supports taking money out of one account and inserting it into another. If the currencies differ, the service performs an automatic currency exchange calculation.

### 2.4. Categories
*   **Implementation**: The `CategoriesModule` manages system-wide shared categories (read-only for all users) and user-specific custom categories.
*   **Enums**: Categories are divided structurally into Income (`1`) and Expense (`2`). 
*   **i18n**: The boilerplate utilizes `nestjs-i18n` to serve category names dynamically in English or Ukrainian based on user locale headers.

### 2.5. Budgets
*   **Implementation**: Handled by the `BudgetsModule`. Users can assign a financial limit to a specific Category for a specific time period.
*   **Calculation Logic**: The `spentAmount` property is computed dynamically. When fetched, the Service queries the `TransactionsService` for all `Expense` transactions matching the budget's `categoryId` within the budget's `startDate` and `endDate`.

### 2.6. Recurring Payments (Automations)
*   **Implementation**: Handled by the `RecurringPaymentsModule` and `@nestjs/schedule`.
*   **Cron Job**: Every day at midnight (`00:00`), a background Cron processor scans for active recurring payments where the `nextExecuteDate` is today or earlier.
*   **Execution**: It automatically generates the required transaction via the `TransactionsService` and mathematically increments the `nextExecuteDate` (Daily, Weekly, Monthly, or Yearly).

---

## 3. Module Breakdown (Controllers, Services, Repositories)

### 3.1. UsersModule
Manages the core User domain and profile settings (such as base currency).
*   **`UsersController`**: Exposes `/api/v1/users` for creating, reading, updating, and soft-deleting users. Utilizes `QueryUserDto` for Infinity Pagination filtering.
*   **`UsersService`**: Executes business rules for user management, including password hashing via bcrypt before passing data to the repository.
*   **`UserRepository`**: Implements basic CRUD operations on the `user` table.

### 3.2. AccountsModule
Manages user financial accounts (wallets, bank accounts, cards).
*   **`AccountsController`**: Exposes `/api/v1/accounts`. Requires authentication guard. Limits data retrieval strictly to the authenticated user's ID.
*   **`AccountsService`**: Handles account creation. Most crucially, contains logic for `updateBalance()` which is triggered by the `TransactionsService`.
*   **`AccountRepository`**: Saves account entities and eagerly loads associated currency data.

### 3.3. CategoriesModule
Manages transaction categories.
*   **`CategoriesController`**: Exposes `/api/v1/categories`. Retrieves default system categories and merges them with the user's custom categories.
*   **`CategoriesService`**: Contains logic to differentiate between system categories (where `userId` is null) and user categories.
*   **`CategoryRepository`**: Standard CRUD implementation for the `category` schema.

### 3.4. TransactionsModule
The core financial ledger of the application.
*   **`TransactionsController`**: Exposes `/api/v1/transactions`. Supports rich filtering by `accountId`, `categoryId`, and date ranges.
*   **`TransactionsService`**: Contains the most complex logic. 
    1. Validates that the targeted Account and Category belong to the user.
    2. Calculates dual-currency values.
    3. Calls `AccountsService.updateBalance()` to sync the wallet state.
    4. Handles rolling back account balances if a transaction is updated or deleted.
*   **`TransactionRepository`**: Standard TypeORM persistence for transactions.

### 3.5. BudgetsModule
Tracks spending limits against categories.
*   **`BudgetsController`**: Exposes `/api/v1/budgets`. 
*   **`BudgetsService`**: On `findAll()` or `findById()`, intercepts the raw budget data from the repository and actively calculates the current `spentAmount` by injecting and querying the `TransactionsService`.
*   **`BudgetRepository`**: Persists the budget configuration (amount, period, categoryId, dates).

### 3.6. RecurringPaymentsModule
Handles automated generation of transactions.
*   **`RecurringPaymentsController`**: Exposes `/api/v1/recurring-payments`. Allows users to configure active automations.
*   **`RecurringPaymentsService`**: Implements a `@Cron` task. It fetches all due payments using a specialized repository method, generates transactions, and iterates dates.
*   **`RecurringPaymentsRepository`**: Contains a specialized `findDuePayments(date)` method that uses TypeORM QueryBuilder to fetch active subscriptions that are due for execution.

### 3.7. Core System Modules
*   **`AuthModule`**: `AuthController` & `AuthService`. Handles `/auth/login`, `/auth/register`, `/auth/refresh`. Interacts closely with `SessionRepository`.
*   **`CurrenciesModule`**: System-level configuration module for available currencies (USD, EUR, UAH). Stored and retrieved by `CurrenciesService`.
*   **`FilesModule`**: Handles file uploads (e.g., user avatars). Implements S3, S3-Presigned, and Local storage drivers depending on environment configurations.
*   **`MailModule`**: An abstraction layer for sending out transactional emails (forgot password, welcome emails) utilizing Nodemailer via the `MailerModule`.

---

## 4. Technical Enums & Flags Reference

*   **Category Types**: 
    *   `1` = Income
    *   `2` = Expense
*   **Budget Periods**: 
    *   `1` = Weekly
    *   `2` = Monthly
    *   `3` = Yearly
*   **Recurring Frequencies**: 
    *   `1` = Daily
    *   `2` = Weekly
    *   `3` = Monthly
    *   `4` = Yearly
*   **Transaction Types**:
    *   `1` = Income
    *   `2` = Expense
    *   `3` = Transfer

---