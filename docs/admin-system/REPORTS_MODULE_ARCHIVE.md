# Reports Module Archive

_Last updated: see git history for timestamp_

> This document captures the previous admin reports experience so it can be rebuilt later. The UI and service layers described here were removed temporarily from the runtime codebase.

## Module Purpose
- Single destination for admins to review monthly usage, equipment popularity, overdue loans, and utilization health.
- CSV exports for each view so admins can continue offline analysis.
- Reuses shared primitives (Layout, AdvancedSearchModal, saved searches) to match the rest of the admin surface.

## UI Overview (former `ReportsPage`)
- **Access control**: gated by `useAuth().isAdmin`; renders an access-denied state for non-admins.
- **Tabs**: `monthly`, `popular`, `overdue`, `utilization` with per-tab icons and Thai labels.
- **Advanced filters** (`AdvancedSearchModal`): persisted saved searches under the `reports` key; filter payload feeds the currently active tab.
- **Loading/Error handling**: global `loading` spinner per fetch, inline red alert for failures, optimistic state updates.
- **Layout**: `Layout` wrapper, 7xl width container, header CTA to open advanced filters.

### Monthly Usage Tab
- Controls: year dropdown (current year down to -4), month dropdown (Thai month names), `สร้างรายงาน` and conditional CSV download buttons.
- Stats cards: total loan requests, approved loans, total reservations, overdue loans.
- Popular equipment table: top 5 records with rank, name, category, usage count.
- Data source: `ReportService.generateMonthlyUsageReport(year, month)`.

### Popular Equipment Tab
- Controls: start/end date pickers defaulting to current month range, run + CSV buttons.
- Table columns: rank, equipment name, category, brand, loan count, reservation count, total usage.
- Data source: `ReportService.generatePopularEquipmentReport(startDate, endDate)`.

### Overdue Users Tab
- Controls: refresh + CSV download.
- Table columns: user name/department, equipment name/serial, due date, days overdue badge, contact info.
- Empty state when no overdue loans.
- Data source: `ReportService.generateOverdueUsersReport()`.

### Utilization Tab
- Refresh button only; grid layout showing four cards:
  1. Equipment inventory (total, available, borrowed, maintenance).
  2. Utilization rates (utilization, availability, maintenance percentages).
  3. Loan stats (total, pending, approved, overdue).
  4. Reservation stats (total, pending, approved, completed).
- Data source: `ReportService.generateEquipmentUtilizationReport()`.

## ReportService Responsibilities
- Located at `src/services/reportService.js` (removed). Relied on Firestore + service helpers.
- **Dependencies**: `db` (Firestore), `EquipmentService`, `LoanRequestService`, `ReservationService`, `LOAN_REQUEST_STATUS`, `RESERVATION_STATUS`.
- **Collections touched**: `loanRequests`, `reservations`, `users`.
- **Helper logic**:
  - `generateMonthlyUsageReport(year, month)`:
    - Queries loan/reservation documents by `createdAt` range.
    - Aggregates stats per status, fetches related equipment info, builds `popularEquipment`, and returns decorated request/reservation arrays.
  - `generatePopularEquipmentReport(startDate, endDate, limit=10)`:
    - Filters by status subsets (`APPROVED`, `BORROWED`, `RETURNED` for loans; `APPROVED`, `COMPLETED` for reservations).
    - Counts usage per equipment and enriches with equipment metadata.
  - `generateOverdueUsersReport()`:
    - Finds `loanRequests` with status `OVERDUE`, orders by `expectedReturnDate`.
    - Fetches linked user + equipment, calculates `daysOverdue` from `expectedReturnDate`.
  - `generateEquipmentUtilizationReport()`:
    - Calls existing stats helpers and derives utilization/availability/maintenance percentages.
  - CSV helpers (`exportToCSV`, `downloadFile`, download*CSV variants) convert datasets into Thai-labeled CSV files and trigger browser download.
  - `getStatusText` maps `LOAN_REQUEST_STATUS` enums to Thai copy used in CSVs.

## Integration Points
- `src/App.js` registered `/reports` (general) and `/admin/reports` (protected) routes referencing the lazy component.
- `src/components/lazy/LazyComponents.js` exposed `LazyReportsPage`, used by Router + Skeleton preloader.
- `src/components/layout/Sidebar.js` and `src/components/dashboard/QuickActions.js` linked to `/admin/reports`.
- Tests in `src/App.test.js` mocked `LazyReportsPageWithSkeleton` to satisfy routing snapshots.
- Documentation references: search for `รายงาน` or `/reports` in `docs/**` when reintroducing.

## Rebuild Notes
- Keep Advanced Search use cases aligned with `useSavedSearches('reports')` to preserve saved filters.
- CSV exports expect Thai labels; double-check encoding when reimplementing.
- Consider migrating heavy Firestore aggregations into scheduled Cloud Functions if the dataset keeps growing.
- When restoring UI, coordinate with navigation (sidebar/quick actions) so admins rediscover the entry point.
