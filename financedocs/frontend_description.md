# Frontend Interface - FinanceApp UI

A stunning, premium, state-of-the-art React financial dashboard built with Vite, TypeScript, Lucide Icons, and beautiful high-performance CSS animations. This frontend maps directly to the isolated multi-currency account management endpoints inside the NestJS API.

---

## 🌟 Visual Theme & Design Systems

- **Glassmorphism Design**: High-end financial SaaS presentation styling utilizing translucent materials, harmonized border strokes, glowing neon accents, and backdrop filters.
- **Micro-animations**: Subtle, responsive transitions for card expansions, overlay animations, spinner loaders, and tab switches.
- **Harmonized HSL Accents**: Customized slate dark theme designed for minimal visual strain. Highlights currency accounts with specialized side-border glows based on selected currency (`USD` = blue, `EUR` = green, `UAH` = orange).

---

## 🛠️ Main Feature Sections

### 1. Authentication Portal
- **Login screen**: Clean, animated form featuring real-time error alerts and togglable password visibility.
- **Registration screen**: Custom signup flow integrating the newly designed **Base Currency Selection** dropdown (`USD`, `EUR`, `UAH`).
- **Session Persistence**: Automated cache management syncing the JWT access tokens inside `localStorage` to keep the user signed in on page refresh.

### 2. Client Dashboard
- **Net Worth Aggregator**: Automatically aggregates the values of all owned accounts, converts them using dynamic exchange rates, and displays a unified Net Worth representation in the user's selected profile base currency.
- **Active Widgets**: Real-time counter of total active accounts, displaying their names, specific creation timestamps, and individual currency indicators.

### 3. Accounts CRUD Dashboard
- **Create Account Modal**: Beautiful, slide-up dialog with interactive form control validations.
- **Update Account Modal**: Inline modal allowing modifications of existing account properties (name, currency code, balance).
- **Owner-isolation Verification**: Restricts any account action strictly to the logged-in profile owner.
- **Soft-deletes**: Integrates safe soft deletion triggering the TypeORM soft delete endpoint.

### 4. Categories Management Dashboard
- **Tabbed Interface**: Seamlessly switch between the "Accounts Overview" and the "Categories" configuration view within the main dashboard.
- **Dual-Language Forms**: Dedicated inputs for **English** and **Ukrainian** category names, enforcing that at least one language must be provided.
- **Localized UI Display**: Interactive **EN / UK** toggle switch in the dashboard header that instantly changes the language of all displayed category names.
- **System Categories Protection**: The UI automatically detects `Global` system categories (where `user_id` is null) and restricts edit/delete capabilities while still allowing full modification of user-created custom categories.

---

## 🚀 Execution & Watch Startup

1. **Bootstrap dependencies**:
   ```bash
   cd d:\projects\FinanceApp\financeappui
   npm install
   ```
2. **Launch development server**:
   ```bash
   npm run dev
   ```
   *The frontend dashboard will be active immediately on [http://localhost:5173/](http://localhost:5173/).*
3. **Verify API connectivity**: Ensure the NestJS backend container is listening on port `3000`. Cross-origin resource sharing (CORS) is natively configured to allow seamless client-server message routing.
