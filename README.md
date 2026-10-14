# TROPA — Targeted Resident Organization & Profiling Application

TROPA is a community and cooperative management system built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL & Auth)**. It provides end-to-end administration for barangay profiling, household management, family member records, membership dues collections, voter verification, form tracking, analytics reporting, and role-based access control.

> **Graphify Knowledge Graph Reference**  
> System architecture, module dependencies, components, and functions in this documentation are indexed and verified against the project knowledge graph in `graphify-out/graph.json` (365 nodes · 990 edges · 22 detected communities).

---

## Table of Contents

1. [System Architecture & Navigation](#system-architecture--navigation)
2. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
3. [Pages, Functions, and Fields](#pages-functions-and-fields)
   - [1. Authentication (`LoginPage`)](#1-authentication-loginpage)
   - [2. Dashboard (`Dashboard`)](#2-dashboard-dashboard)
   - [3. Households (`Households`)](#3-households-households)
   - [4. Members (`Members`)](#4-members-members)
   - [5. Dues Collection (`DuesCollection`)](#5-dues-collection-duescollection)
   - [6. Reports & Analytics (`Reports`)](#6-reports--analytics-reports)
   - [7. Form Tracking (`FormTrackingPage`)](#7-form-tracking-formtrackingpage)
   - [8. Tropa Finder (`TropaFinder`)](#8-tropa-finder-tropafinder)
   - [9. Settings & Administration (`Settings`)](#9-settings--administration-settings)
   - [10. Activity Logs (`Logs`)](#10-activity-logs-logs)
   - [11. Public Search (`PublicSearch`)](#11-public-search-publicsearch)
4. [Data Entities & Field Definitions](#data-entities--field-definitions)
5. [Service Functions & Hooks](#service-functions--hooks)
   - [Custom React Hooks (`useSupabase.ts`)](#custom-react-hooks-usesupabasets)
   - [Supabase API Helpers (`supabase.ts`)](#supabase-api-helpers-supabasets)
   - [Utility Modules](#utility-modules)
6. [Graphify Knowledge Graph Index](#graphify-knowledge-graph-index)

---

## System Architecture & Navigation

The application uses dynamic page switching managed by the root [`App`](file:///Users/eddz/Downloads/TROPA-main/project/src/App.tsx) component and persistent navigation through [`Sidebar`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Layout/Sidebar.tsx) and [`Header`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Layout/Header.tsx).

### Navigation Menu Items

| Menu ID | Label | Component | Required Permissions |
| :--- | :--- | :--- | :--- |
| `dashboard` | Dashboard | [`Dashboard`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Dashboard/Dashboard.tsx) | `view_dashboard` |
| `households` | Households | [`Households`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Households/Households.tsx) | `view_households`, `manage_households` |
| `members` | Members | [`Members`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Members/Members.tsx) | `view_members`, `manage_members` |
| `dues` | Dues Collection | [`DuesCollection`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/DuesCollection/DuesCollection.tsx) | `dues_collection` |
| `reports` | Reports | [`Reports`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Reports/Reports.tsx) | `view_reports` |
| `form_tracking` | Form Tracking | [`FormTrackingPage`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/FormTracking/FormTracking.tsx) | `user_management` |
| `tropafinder` | Tropa Finder | [`TropaFinder`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/TropaFinder/TropaFinder.tsx) | `tropa_finder` |
| `settings` | Settings | [`Settings`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Settings/Settings.tsx) | `user_management` |
| `logs` | Activity Logs | [`Logs`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Logs/Logs.tsx) | `user_management` |
| `/search` | Public Search | [`PublicSearch`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/PublicSearch/PublicSearch.tsx) | None (Public route) |

---

## Role-Based Access Control (RBAC)

User permissions are configured via [`UserForm`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Settings/UserForm.tsx) and validated in `App.tsx`:

- `all` — Full superuser access to every module
- `view_dashboard` — View dashboard statistics, summaries, charts, and map
- `view_households` — Browse and inspect household profiles
- `manage_households` — Create, update, or remove households and assign members
- `view_members` — Browse member profiles and demographic information
- `manage_members` — Create, edit, bulk-import, or remove family members
- `dues_collection` — Access payment recording, dues status, and history
- `view_reports` — Generate demographic, location, dues, and print ledger reports
- `user_management` — Administer users, permissions, locations, officers, rates, and audit logs
- `tropa_finder` — Search voter registries and maintain the blocklist

---

## Pages, Functions, and Fields

### 1. Authentication (`LoginPage`)

- **Source File**: [`project/src/components/Auth/LoginPage.tsx`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Auth/LoginPage.tsx)
- **Primary Use Case**: Authenticates operators and administrators using Supabase email and password credentials.

#### Functions
- `LoginPage({ onLogin })` — Renders the login screen with credential inputs, loading states, and error handling.
- `handleSubmit(e)` — Validates form inputs, triggers `supabase.auth.signInWithPassword()`, and handles authentication exceptions with toast alerts.

#### Fields
| Field Name | Type | Input / Mode | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `email` | `string` | Text input (`type="email"`) | Yes | Operator registered email address |
| `password` | `string` | Password input (`type="password"`) | Yes | Operator account password |

---

### 2. Dashboard (`Dashboard`)

- **Source File**: [`project/src/components/Dashboard/Dashboard.tsx`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Dashboard/Dashboard.tsx)
- **Primary Use Case**: Central operational overview displaying demographic statistics, barangay distributions, recent dues transactions, monthly collection analytics, and an interactive member distribution map.

#### Subcomponents & Child Nodes
- [`StatCard`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Dashboard/StatCard.tsx) — Displays high-level KPIs (Households, Total Members, Cooperative Members, Total Dues Collected).
- [`BarangayStats`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Dashboard/BarangayStats.tsx) — Displays barangay-level breakdown with household counts, member counts, and percentage distribution bars.
- [`MembersMap`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Dashboard/MembersMap.tsx) — Interactive Leaflet map plotting coordinates across barangays/puroks with color-coded markers by sector.
- [`PaymentChart`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Dashboard/PaymentChart.tsx) — Monthly visual chart for dues collections over time.
- [`RecentPayments`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Dashboard/RecentPayments.tsx) — Real-time list of latest dues payment transactions.
- [`LocationBreakdown`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Dashboard/LocationBreakdown.tsx) — Categorical representation of households across locations.

#### Functions & Handlers
- `Dashboard({ households, onMenuClick })` — Root dashboard view component.
- `useDashboardStats()` — Fetches real-time aggregate statistics from Supabase via `supabaseHelpers.getDashboardStats()`.
- `BarangayStats({ households })` — Computes member and household totals grouped by barangay.
- `MembersMap({ members, locations })` — Resolves estimated geographic coordinates via `barangayCoordinates.ts` and renders interactive markers and clusters.

#### Fields & Display Metrics
| Category | Metric / Field | Type | Description |
| :--- | :--- | :--- | :--- |
| **KPI Cards** | `totalHouseholds` | `number` | Count of registered households |
| | `totalMembers` | `number` | Total individual members across all households |
| | `cooperativeMembers` | `number` | Count of individuals with `is_cooperative_member === true` |
| | `totalCollected` | `number` (PHP) | Sum of completed membership dues payments |
| **Barangay Stats** | `barangay` | `string` | Barangay name |
| | `householdCount` | `number` | Total households in barangay |
| | `memberCount` | `number` | Total individual members in barangay |
| | `percentage` | `number` (%) | Share of total registered population |
| **Members Map** | `latitude`, `longitude` | `number` | Coordinates of member or barangay center |
| | `sector` | `string` | Sector badge (Youth, Senior Citizen, PWD, etc.) |

---

### 3. Households (`Households`)

- **Source File**: [`project/src/components/Households/Households.tsx`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Households/Households.tsx)
- **Primary Use Case**: Management of household units, assigning household leaders, mapping purok locations, and inspecting individual household member rosters.

#### Subcomponents & Child Nodes
- [`HouseholdTable`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Households/HouseholdTable.tsx) — Data table with sorting, bulk selection, search filtering, and row actions.
- [`HouseholdForm`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Households/HouseholdForm.tsx) — Modal dialog for adding or editing a household.
- [`HouseholdView`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Households/HouseholdView.tsx) — Detailed profile modal showing household meta, location, and its list of family members.
- [`BulkAddMemberForm`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Members/BulkAddMemberForm.tsx) — Rapid multi-row member addition directly into a selected household.

#### Functions & Handlers
- `Households({ households, locations, onCreateMember, onUpdateHousehold, onDeleteHousehold, onDeleteMember, onMenuClick })` — Page controller.
- `handleSort(field)` — Toggles table sort ordering by `household_name`, `lgu`, `status`, etc.
- `handleSelectAll(checked)` / `handleToggleSelection(id)` — Manages multi-row selection for batch operations.
- `handleSaveHousehold(formData)` — Submits new or updated household via `supabaseHelpers.createHousehold` / `updateHousehold`.
- `handleDeleteHousehold(id)` — Deletes household and associated records with confirmation dialog.
- `handleView(household)` — Opens detailed view modal fetching full member roster.

#### Fields

##### Form Fields (`HouseholdForm`)
| Field Name | Type | Control | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `household_name` | `string` | Text input | Yes | Family / household identifier name (e.g., "Dela Cruz Household") |
| `lgu` | `string` | Select dropdown | Yes | Local Government Unit / Municipality |
| `barangay` | `string` | Select dropdown | Yes | Barangay within selected LGU |
| `purok_id` | `string` | Select dropdown | Yes | Selected Purok ID (updates `purok` name) |
| `status` | `'active' \| 'inactive'` | Select dropdown | Yes | Current household activity status |

##### Table & Display Fields (`HouseholdTable` & `HouseholdView`)
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `household_name` | `string` | Primary name of household |
| `lgu`, `barangay`, `purok` | `string` | Location hierarchy |
| `total_members` | `number` | Count of registered members |
| `active_members` | `number` | Count of active members |
| `status` | `string` | Status badge (`active` / `inactive`) |
| `created_date` | `Date` | Timestamp when household was registered |
| `created_by` | `string` | Email of creator |

---

### 4. Members (`Members`)

- **Source File**: [`project/src/components/Members/Members.tsx`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Members/Members.tsx)
- **Primary Use Case**: Comprehensive demographic management of individual community residents and cooperative members, including voter linkage, health coverage, photo upload, and sector classification.

#### Subcomponents & Child Nodes
- [`MemberTable`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Members/MemberTable.tsx) — Displays individual records with mobile responsive card view and desktop table view.
- [`MemberForm`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Members/MemberForm.tsx) — Modal form for single-member registration/editing with voter search and auto-fill.
- [`BulkAddMemberForm`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Members/BulkAddMemberForm.tsx) — Spreadsheet-like interface for batch member registration.
- [`ProfileImageUpload`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Members/ProfileImageUpload.tsx) — Member photo upload widget with client-side compression.
- [`MapPicker`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Members/MapPicker.tsx) — Pinpoint geographic coordinate picker.

#### Functions & Handlers
- `Members({ households, locations, onMenuClick })` — Page controller.
- `useFamilyMembersPaginated({ page, limit, search, ... })` — Server-side paginated member query.
- `createEmptyMemberRow()` / `createEmptyRow()` — Generates fresh state rows for single/bulk forms.
- `formatContactNumber(value)` — Formats Philippine telephone/mobile numbers.
- `generateTempId()` — Creates temporary client keys for unsaved rows.
- `validateImageFile(file)` / `compressProfileImage(file)` — Validates MIME type and compresses images before upload.
- `handleVoterSelect(voter)` — Auto-fills member demographic data from COMELEC voter registry.

#### Fields

##### Single Member Form (`MemberForm`)
| Field Name | Type | Control | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `firstname` | `string` | Text input | Yes | Given name |
| `lastname` | `string` | Text input | Yes | Surname |
| `middlename` | `string` | Text input | No | Middle name |
| `extension` | `string` | Text input | No | Name suffix (Jr., Sr., III) |
| `household_id` | `string` | Select / Autocomplete | Yes | Associated Household ID |
| `lgu` | `string` | Select dropdown | Yes | Local Government Unit |
| `barangay` | `string` | Select dropdown | Yes | Barangay name |
| `purok_id` / `purok` | `string` | Select dropdown | Yes | Purok designation |
| `birth_date` | `Date` | Date picker (`YYYY-MM-DD`) | Yes | Date of birth (calculates age) |
| `membership_date` | `Date` | Date picker (`YYYY-MM-DD`) | Yes | Date joined organization |
| `contact_number` | `string` | Tel input | No | Mobile / telephone number |
| `sector` | `string` | Multi-select checkboxes | Yes | Sectors: `General`, `Youth`, `Student`, `College Student`, `PWD`, `Senior Citizen`, `Solo Parent`, `LGBTQ+`, `Indigenous People` |
| `year_level` | `string` | Select dropdown | If Student | Grade / Year Level (Elementary, High School, College Year) |
| `is_household_leader` | `boolean` | Checkbox | No | Sets member as head of household |
| `is_cooperative_member` | `boolean` | Checkbox | No | Flags active cooperative membership |
| `is_voter` | `boolean` | Checkbox | No | Registered voter flag |
| `voter_barangay` | `string` | Text / Select | No | Registered voting barangay |
| `phic_member` | `boolean` | Checkbox | No | PhilHealth membership indicator |
| `phic_no` | `string` | Text input | If PHIC | PhilHealth identification number |
| `trucare_member` | `boolean` | Checkbox | No | TRU Care health program indicator |
| `profile_picture_url` | `string` | File upload | No | Uploaded avatar photo URL |

##### Table & Card Display Fields (`MemberTable`)
| Field Name | Type | Display Treatment |
| :--- | :--- | :--- |
| Full Name | `string` | `{firstname} {middlename} {lastname} {extension}` |
| Badges | Tags / Badges | `Leader`, `Member`, `Voter`, `PhilHealth`, `TRU Care` |
| `age` | `number` | Derived age badge in years |
| `sector` | `string` | Color-coded chips per sector tag |
| `lgu`, `barangay` | `string` | Address label with voter barangay note if differing |
| `contact_number` | `string` | Clickable `tel:` phone link |
| Actions | Buttons | Edit (`onEdit`), Delete (`onDelete`) |

---

### 5. Dues Collection (`DuesCollection`)

- **Source File**: [`project/src/components/DuesCollection/DuesCollection.tsx`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/DuesCollection/DuesCollection.tsx)
- **Primary Use Case**: Tracking monthly cooperative member dues, processing payments, calculating arrears / outstanding balances, and logging payment methods and reference numbers.

#### Subcomponents & Child Nodes
- [`PaymentForm`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/DuesCollection/PaymentForm.tsx) — Modal form to record single or multi-month dues payments.
- [`PaymentTable`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/DuesCollection/PaymentTable.tsx) — History table of completed dues transactions.
- [`UnpaidMembersTable`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/DuesCollection/UnpaidMembersTable.tsx) — Roster of members with unpaid dues, calculated overdue months, and expected balances.

#### Functions & Handlers
- `DuesCollection({ contributionRates, onCreatePayment, onUpdatePayment, onDeletePayment, onMenuClick })` — Root dues page.
- `useDuesStats()` / `useDuesPaymentsPaginated()` — Fetches payment totals and paginated payment ledger.
- `getCurrentRate(rates)` / `getRateForMonth(month, rates)` — Computes the effective contribution rate for a specific billing month.
- `getOutstandingMonths(member, payments, rates)` — Computes list of unpaid months between member joined date and current date.
- `generateMonthRange(startMonth, count)` — Expands starting month and duration into consecutive month strings (`YYYY-MM`).
- `handleCreatePayment(payment)` / `handleUpdatePayment(id, updates)` / `handleDeletePayment(id)` — Dues CRUD operations.

#### Fields

##### Payment Form (`PaymentForm`)
| Field Name | Type | Control | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `member_id` | `string` | Autocomplete search | Yes | Target member paying dues |
| `household_id` | `string` | Hidden / Auto-filled | Yes | Associated household ID |
| `amount` | `number` | Currency input (₱) | Yes | Amount paid (auto-calculated from months covered) |
| `payment_month` | `string` | Select (`YYYY-MM`) | Yes | Starting month covered by this payment |
| `months_covered` | `number` | Number input | Yes | Number of consecutive months paid (default `1`) |
| `payment_date` | `Date` | Date input | Yes | Transaction date |
| `payment_method` | `string` | Select dropdown | Yes | Options: `Cash`, `GCash`, `PayMaya`, `Bank Transfer`, `Check` |
| `reference_number` | `string` | Text input | Optional | Check or digital transaction receipt number |
| `status` | `string` | Select dropdown | Yes | Options: `completed`, `pending`, `cancelled` |
| `notes` | `string` | Textarea | Optional | Payment remarks / remarks |

##### Payment History Table Columns (`PaymentTable`)
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `member` | `string` | Member full name |
| `household` | `string` | Associated household name |
| `amount` | `number` | Formatted currency (`₱XX.XX`) |
| `payment_month` | `string` | Covered billing month(s) |
| `payment_date` | `Date` | Date transaction was logged |
| `payment_method` | `string` | Color-coded method badge (`Cash`, `GCash`, etc.) |
| `reference_number` | `string` | Receipt / reference ID |
| `status` | `string` | Status badge (`completed`, `pending`, `cancelled`) |
| `collected_by` | `string` | Collector / user name |

---

### 6. Reports & Analytics (`Reports`)

- **Source File**: [`project/src/components/Reports/Reports.tsx`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Reports/Reports.tsx)
- **Primary Use Case**: Generation of demographic analytics, spatial location metrics, sector breakdowns, printable physical ledger rosters, and CSV exports.

#### Subcomponents & Child Nodes
- [`MembershipReport`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Reports/MembershipReport.tsx) — High-level KPI summaries and print modal trigger.
- [`LocationReport`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Reports/LocationReport.tsx) — Geographic clustering reports across LGUs and barangays.
- [`SectorReport`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Reports/SectorReport.tsx) — Statistical distribution charts and tables across demographic sectors.
- [`ExportReport`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Reports/ExportReport.tsx) — Raw CSV exporter for Households, Members, Dues, and Locations.
- [`PrintFilterModal`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Reports/PrintFilterModal.tsx) — Print options filter modal for generating targeted print sheets.
- [`HouseholdRosterPrint`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Reports/HouseholdRosterPrint.tsx) — Formatted printable HTML table for Household Rosters.
- [`PaymentLedgerPrint`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Reports/PaymentLedgerPrint.tsx) — Formatted printable physical monthly payment grid ledger.

#### Functions & Handlers
- `printHouseholdRoster({ households, members, ... })` — Launches browser print preview for formal household demographic rosters.
- `printPaymentLedger({ households, members, payments, rates, ... })` — Generates a print-ready 12-month payment ledger grid for field collectors.
- `printTreasurerSheet(...)` — Generates printable collection reconciliation sheets.
- `exportToCSV(data, filename)` — Serializes application entities to downloadable CSV files.

#### Filter & Print Dialog Fields (`PrintFilterModal`)
| Field Name | Type | Control | Description |
| :--- | :--- | :--- | :--- |
| `lgu` | `string` | Select dropdown | Filter report by Local Government Unit |
| `barangay` | `string` | Select dropdown | Filter report by Barangay |
| `purok` | `string` | Select dropdown | Filter report by Purok (optional) |
| `specificHouseholds` | `boolean` | Checkbox | Toggle manual selection of specific households |
| `selectedHouseholdIds` | `string[]` | Multi-select checkboxes | List of specifically included households |

---

### 7. Form Tracking (`FormTrackingPage`)

- **Source File**: [`project/src/components/FormTracking/FormTracking.tsx`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/FormTracking/FormTracking.tsx)
- **Primary Use Case**: Physical document pipeline tracking for paper profiling forms submitted from the field, received by coordinators, assigned to encoders, and verified.

#### Subcomponents & Child Nodes
- [`FormTrackingModal`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/FormTracking/FormTrackingModal.tsx) — Modal to log paper form batches per barangay and purok.

#### Functions & Handlers
- `FormTrackingPage({ locations, onMenuClick })` — Page controller.
- `useFormTracking()` — Hook managing queries and mutations against `form_tracking` table.
- `handleSaveForm(formData, purokEntries)` — Batch creates or updates form tracking entries per purok.
- `handleStatusChange(id, status)` — Updates lifecycle status (`Pending` -> `In Progress` -> `Completed` -> `Returned`).

#### Fields

##### Form Modal Fields (`FormTrackingModal`)
| Field Name | Type | Control | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `lgu` | `string` | Select dropdown | Yes | Local Government Unit |
| `barangay` | `string` | Select dropdown | Yes | Originating Barangay |
| `purokEntries` | `Array<{ purok: string, number_of_forms: number }>` | Dynamic repeater rows | Yes | Purok name and quantity of physical forms submitted |
| `submitted_by` | `string` | Text input | Yes | Name of field coordinator who submitted forms |
| `received_by` | `string` | Text input | Yes | Office personnel who accepted physical forms |
| `encoded_by` | `string` | Select (User ID) | Optional | Data encoder assigned to transcribe records |
| `status` | `string` | Select dropdown | Yes | Options: `Pending`, `In Progress`, `Completed`, `Returned` |
| `returned_released_by` | `string` | Text input | Optional | Name of staff releasing returned forms |
| `returned_received_by` | `string` | Text input | Optional | Recipient acknowledging return of forms |

##### Table Listing Fields
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `barangay`, `purok` | `string` | Origin location |
| `number_of_forms` | `number` | Count of physical paper forms in batch |
| `submitted_by` | `string` | Submitter name |
| `received_by` | `string` | Receiving officer |
| `encoded_by_user` | `string` | Assigned encoder's name |
| `status` | `string` | Status badge (`Pending`, `In Progress`, `Completed`, `Returned`) |
| `created_at` | `Date` | Submission timestamp |

---

### 8. Tropa Finder (`TropaFinder`)

- **Source File**: [`project/src/components/TropaFinder/TropaFinder.tsx`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/TropaFinder/TropaFinder.tsx)
- **Primary Use Case**: Voter verification engine linking residents to the official COMELEC registry, voter precinct identification, and managing the suspicious/ineligible voter blocklist.

#### Subcomponents & Child Nodes
- `BlocklistModal` — Modal dialog to flag a voter with notes and evidence photo.
- `BlocklistViewModal` — Modal dialog to review an existing blocklist record and evidence image.

#### Functions & Handlers
- `TropaFinder({ locations, onMenuClick })` — Page controller.
- `fetchLocations()` — Loads available LGUs and barangays from database.
- `handleSearch()` — Queries voter records in `voters` table matching name fragments and location.
- `handleSaveBlocklist(voter, note, imageFile)` — Uploads supporting photo to `voter_blocklist` storage and inserts blocklist record.
- `handleRemoveBlocklist(voterId)` — Deletes voter from blocklist table.

#### Fields

##### Search & Filter Fields
| Field Name | Type | Control | Description |
| :--- | :--- | :--- | :--- |
| `searchLastname` | `string` | Text input | Surname search term |
| `searchFirstname` | `string` | Text input | First name search term |
| `searchMiddlename` | `string` | Text input | Middle name search term |
| `filterLgu` | `string` | Select dropdown | Filter by LGU |
| `filterBrgy` | `string` | Select dropdown | Filter by Barangay |
| `sortField` | `string` | Table header | Sort by `lastname`, `firstname`, `brgy`, `purok`, `precinct` |

##### Voter Table Result Fields
| Field Name | Type | Description |
| :--- | :--- | :--- |
| Full Name | `string` | `{lastname}, {firstname} {middlename} {ext}` |
| `lgu`, `brgy`, `purok` | `string` | Registered voter address |
| `precinct` | `string` | Official precinct number |
| `clusteredprecinct` | `string` | Clustered polling precinct |
| `classification` | `string` | Voter classification badge |
| `status` | `string` | Active / Deactivated voter status |
| Blocklist Status | Badge / Action | Indicates whether voter is blocklisted; action to view/edit blocklist |

##### Blocklist Modal Fields (`BlocklistModal`)
| Field Name | Type | Control | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `note` | `string` | Textarea | Yes | Reason for blocklisting voter |
| `imageFile` | `File` | File upload | Optional | Supporting image / photographic evidence |

---

### 9. Settings & Administration (`Settings`)

- **Source File**: [`project/src/components/Settings/Settings.tsx`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Settings/Settings.tsx)
- **Primary Use Case**: System-wide configuration covering user accounts, location directories, barangay and purok leadership rosters, and membership contribution rates.

#### Subcomponents & Child Nodes
- [`UserTable`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Settings/UserTable.tsx) & [`UserForm`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Settings/UserForm.tsx) — Operator account administration.
- [`LocationTable`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Locations/LocationTable.tsx) & [`LocationForm`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Locations/LocationForm.tsx) — LGU and barangay directory.
- [`OrganizationTab`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Settings/OrganizationTab.tsx) — Purok creation and assigning barangay/purok officers.
- **Contribution Rates Tab** — Scheduling monthly contribution amount policies.

#### Fields

##### User Management Form (`UserForm`)
| Field Name | Type | Control | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `firstname` | `string` | Text input | Yes | User first name |
| `lastname` | `string` | Text input | Yes | User last name |
| `email` | `string` | Email input | Yes | Login email address |
| `password` | `string` | Password input | On create | User account password |
| `role` | `'admin' \| 'collector' \| 'user'` | Select dropdown | Yes | High-level role designation |
| `status` | `'active' \| 'inactive'` | Select dropdown | Yes | Account status |
| `permissions` | `string[]` | Multi-select checkboxes | Yes | Granted RBAC system permissions |

##### Location Form (`LocationForm`)
| Field Name | Type | Control | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `lgu` | `string` | Text input | Yes | Local Government Unit / Municipality name |
| `barangay` | `string` | Text input | Yes | Barangay name |

##### Organization & Officer Assignment (`OrganizationTab`)
| Field Name | Type | Control | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `selectedLgu` | `string` | Select dropdown | Yes | Selected LGU context |
| `selectedBarangay` | `string` | Select dropdown | Yes | Selected Barangay context |
| `level` | `'barangay' \| 'purok'` | Tab / Context | Yes | Officer hierarchy level |
| `purok_id` | `string` | Select dropdown | For purok | Target purok |
| `position` | `string` | Select dropdown | Yes | Role: `President`, `Vice President`, `Secretary`, `Treasurer`, `Auditor`, `Board Member` |
| `member_id` | `string` | Member search modal | Yes | Assigned member candidate |

##### Contribution Rate Form
| Field Name | Type | Control | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `amount` | `number` | Number input (₱) | Yes | Monthly dues rate amount |
| `effective_from` | `Date` | Date input | Yes | Effective starting date of rate |
| `notes` | `string` | Text input | Optional | Memo or board resolution reference |

---

### 10. Activity Logs (`Logs`)

- **Source File**: [`project/src/components/Logs/Logs.tsx`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Logs/Logs.tsx)
- **Primary Use Case**: System audit trail capturing create, update, and delete actions performed by users across all entities.

#### Functions & Handlers
- `Logs({ users, onMenuClick })` — Page controller.
- `useActivityLogs({ startDate, endDate, userId, page, limit })` — Server-side filtered log retrieval.

#### Fields

##### Filters
| Field Name | Type | Control | Description |
| :--- | :--- | :--- | :--- |
| `filterAction` | `string` | Select dropdown | Options: `ALL`, `ADD`, `EDIT`, `DELETE` |
| `userId` | `string` | Select dropdown | Filter by specific operator / user |
| `startDate` | `Date` | Date input | Filter from start date |
| `endDate` | `Date` | Date input | Filter to end date |

##### Table Columns
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `created_at` | `Date` | Timestamp of action |
| `user_name` | `string` | Operator who executed the change |
| `action` | `string` | Action badge (`ADD` / `EDIT` / `DELETE`) |
| `entity_type` | `string` | Target entity: `HOUSEHOLD`, `MEMBER`, `USER`, `LOCATION`, `CONTRIBUTION_RATE`, `DUES_PAYMENT`, `FORM_TRACKING` |
| `details` | `JSON` | Changed attributes, previous values, and metadata diff |

---

### 11. Public Search (`PublicSearch`)

- **Source File**: [`project/src/components/PublicSearch/PublicSearch.tsx`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/PublicSearch/PublicSearch.tsx)
- **Route**: Accessible directly at `/search` (unauthenticated).
- **Primary Use Case**: Citizen-facing portal allowing public inquiries to check household registration status and member records without administrative credentials.

#### Functions & Handlers
- `PublicSearch()` — Public search interface.
- `handleViewMembers(household)` — Fetches and displays members of a selected household in a read-only modal.

#### Fields

##### Search Criteria
| Field Name | Type | Control | Description |
| :--- | :--- | :--- | :--- |
| `searchType` | `'members' \| 'households'` | Radio / Tabs | Selects whether to query individual members or households |
| `householdName` | `string` | Text input | Household name query |
| `lastname` | `string` | Text input | Member surname query |
| `firstname` | `string` | Text input | Member first name query |
| `middlename` | `string` | Text input | Member middle name query |
| `selectedLgu` | `string` | Select dropdown | Location constraint: LGU |
| `selectedBarangay` | `string` | Select dropdown | Location constraint: Barangay |

##### Public Result Cards
| Entity | Displayed Fields |
| :--- | :--- |
| **Household Card** | Household Name, LGU, Barangay, Purok, Total Members count, "View Members" action |
| **Member Card** | Member Full Name, Leader Badge, Age, LGU, Barangay, Sector badges, Member status |

---

## Data Entities & Field Definitions

All core types are defined in [`project/src/types/index.ts`](file:///Users/eddz/Downloads/TROPA-main/project/src/types/index.ts) and backed by Supabase PostgreSQL tables in [`project/src/types/database.ts`](file:///Users/eddz/Downloads/TROPA-main/project/src/types/database.ts):

### `Household`
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` (UUID) | Yes | Unique household record ID |
| `household_name` | `string` | Yes | Family / household name |
| `lgu` | `string` | Yes | Local Government Unit |
| `barangay` | `string` | Yes | Barangay name |
| `purok` | `string` | Yes | Purok name |
| `purok_id` | `string` (UUID) | No | Reference to `puroks.id` |
| `household_leader_id`| `string` (UUID) | No | Reference to leader `family_members.id` |
| `total_members` | `number` | Yes | Count of all members registered |
| `active_members` | `number` | Yes | Count of active members |
| `status` | `'active' \| 'inactive'` | Yes | Household status |
| `house_picture_url` | `string` | No | Public URL of house image |
| `house_picture_path`| `string` | No | Storage path in Supabase |
| `created_date` | `Date` | Yes | Record creation timestamp |
| `updated_date` | `Date` | Yes | Record last update timestamp |
| `created_by` | `string` | Yes | Email of creator |

### `FamilyMember`
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` (UUID) | Yes | Unique member record ID |
| `household_id` | `string` (UUID) | Yes | Parent `households.id` |
| `firstname` | `string` | Yes | First name |
| `lastname` | `string` | Yes | Last name |
| `middlename` | `string` | No | Middle name |
| `extension` | `string` | No | Name suffix (Jr., Sr.) |
| `lgu` | `string` | Yes | Local Government Unit |
| `barangay` | `string` | Yes | Barangay name |
| `purok` | `string` | Yes | Purok name |
| `purok_id` | `string` (UUID) | No | Reference to `puroks.id` |
| `sector` | `string` | Yes | Comma-delimited list of sector classifications |
| `is_voter` | `boolean` | Yes | Registered voter flag |
| `voter_barangay` | `string` | No | Registered voting barangay |
| `voter_id` | `number` | No | Reference to `voters.id` |
| `contact_number` | `string` | No | Contact number |
| `is_household_leader`| `boolean` | Yes | Indicates head of household |
| `is_cooperative_member` | `boolean` | Yes | Active cooperative membership |
| `membership_date` | `Date` | No | Date admitted to cooperative |
| `birth_date` | `Date` | No | Date of birth |
| `age` | `number` | No | Calculated age |
| `latitude` | `number` | No | Geographic latitude |
| `longitude` | `number` | No | Geographic longitude |
| `religion` | `string` | No | Religious affiliation |
| `school` | `string` | No | Educational institution |
| `year_level` | `string` | No | Academic grade / year level |
| `listing_status` | `string` | No | Profiling listing condition |
| `profile_picture_url`| `string` | No | Public URL of member photo |
| `profile_picture_path`| `string` | No | Storage bucket path |
| `phic_member` | `boolean` | No | PhilHealth member flag |
| `phic_no` | `string` | No | PhilHealth identification number |
| `trucare_member` | `boolean` | No | TRU Care health member flag |
| `created_date` | `Date` | Yes | Creation timestamp |
| `updated_date` | `Date` | Yes | Last modified timestamp |
| `created_by` | `string` | No | Creator email |

### `DuesPayment`
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` (UUID) | Yes | Payment transaction ID |
| `member_id` | `string` (UUID) | Yes | Paying member ID |
| `household_id` | `string` (UUID) | Yes | Member household ID |
| `amount` | `number` | Yes | Transaction payment amount (PHP) |
| `payment_month` | `string` | Yes | Start billing month (`YYYY-MM`) |
| `months_covered` | `number` | No | Quantity of billing months covered |
| `payment_date` | `Date` | Yes | Date collected |
| `payment_method` | `string` | Yes | `Cash` \| `Bank Transfer` \| `GCash` \| `PayMaya` \| `Check` |
| `reference_number` | `string` | No | Receipt / transaction reference ID |
| `notes` | `string` | No | Transaction remarks |
| `status` | `string` | Yes | `completed` \| `pending` \| `cancelled` |
| `collected_by` | `string` | Yes | Collector user name |
| `created_by` | `string` | Yes | Logging user email |
| `created_date` | `Date` | Yes | Transaction record creation date |
| `updated_date` | `Date` | Yes | Transaction record update date |

### `User`
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` (UUID) | Yes | User account ID |
| `email` | `string` | Yes | Account email |
| `firstname` | `string` | Yes | First name |
| `lastname` | `string` | Yes | Last name |
| `role` | `'admin' \| 'collector' \| 'user'` | Yes | Primary role |
| `status` | `'active' \| 'inactive'` | Yes | Account status |
| `permissions` | `string[]` | Yes | Granted RBAC permissions |
| `last_login` | `Date` | No | Last authenticated timestamp |
| `created_date` | `Date` | Yes | Creation timestamp |
| `updated_date` | `Date` | Yes | Modification timestamp |

### `Location`
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` (UUID) | Yes | Unique location ID |
| `lgu` | `string` | Yes | Local Government Unit |
| `barangay` | `string` | Yes | Barangay name |
| `created_date` | `Date` | Yes | Creation timestamp |
| `updated_date` | `Date` | Yes | Update timestamp |
| `created_by` | `string` | Yes | Creator email |

### `Voter`
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `number` | Yes | COMELEC voter registry ID |
| `lastname`, `firstname`, `middlename`, `ext` | `string` | Yes/No | Official voter full name components |
| `lgu`, `brgy`, `purok` | `string` | No | Registered voting address |
| `district` | `number` | No | Legislative district number |
| `precinct` | `string` | No | Voting precinct |
| `clusteredprecinct` | `string` | No | Clustered precinct number |
| `classification` | `string` | No | Demographic classification |
| `status` | `string` | No | Registration status |
| `note` | `string` | No | Official registry notes |

### `FormTracking`
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` (UUID) | Yes | Form batch tracking ID |
| `barangay`, `purok` | `string` | Yes | Originating community location |
| `number_of_forms` | `number` | Yes | Number of paper profiling forms |
| `submitted_by` | `string` | Yes | Field coordinator who submitted forms |
| `received_by` | `string` | Yes | Staff member who accepted forms |
| `encoded_by` | `string` (UUID) | No | Assigned encoder user ID |
| `status` | `string` | Yes | `Pending` \| `In Progress` \| `Completed` \| `Returned` |
| `returned_released_by`| `string` | No | Person who released returned forms |
| `returned_received_by`| `string` | No | Person who acknowledged receipt of returned forms |
| `created_at` | `Date` | Yes | Form submission timestamp |
| `updated_at` | `Date` | Yes | Form status update timestamp |

### `ActivityLog`
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` (UUID) | Yes | Audit log ID |
| `user_id` | `string` (UUID) | No | Operator user ID |
| `user_name` | `string` | Yes | Operator display name |
| `action` | `'ADD' \| 'EDIT' \| 'DELETE'` | Yes | Modification type |
| `entity_type` | `string` | Yes | Target entity category |
| `entity_id` | `string` | No | Target entity ID |
| `details` | `JSON` | No | Change diff and contextual payload |
| `created_at` | `Date` | Yes | Timestamp of log event |

---

## Service Functions & Hooks

### Custom React Hooks (`useSupabase.ts`)
- **File**: [`project/src/hooks/useSupabase.ts`](file:///Users/eddz/Downloads/TROPA-main/project/src/hooks/useSupabase.ts)

| Hook Function | Return Values / Capabilities | Description |
| :--- | :--- | :--- |
| `useHouseholds()` | `{ households, loading, error, createHousehold, updateHousehold, deleteHousehold, refetch }` | Manages active household list with optimistic updates |
| `useHouseholdsPaginated()` | `{ households, totalCount, loading, error, setPage, setLimit, setSearch, ... }` | Server-side pagination and search for large household rosters |
| `useFamilyMembers()` | `{ members, loading, error, createFamilyMember, updateFamilyMember, deleteFamilyMember, refetch }` | Full member list hook |
| `useFamilyMembersPaginated()` | `{ members, totalCount, loading, error, setPage, setLimit, setSearch, ... }` | Paginated and filtered member roster |
| `useDuesPayments()` | `{ payments, loading, error, createPayment, updatePayment, deletePayment, refetch }` | Manages complete collection records |
| `useDuesPaymentsPaginated()` | `{ payments, totalCount, loading, error, ... }` | Server-side paginated dues ledger |
| `useDuesStats()` | `{ totalCollected, thisMonthCollected, totalTransactions }` | High-level financial analytics |
| `useUsers()` | `{ users, loading, error, createUser, updateUser, deleteUser, refetch }` | Admin user account management |
| `useLocations()` | `{ locations, loading, error, createLocation, updateLocation, deleteLocation }` | LGU and barangay locations list |
| `usePuroks(locationId)` | `{ puroks, loading, error, createPurok, updatePurok, deletePurok }` | Puroks filtered by barangay location |
| `useOfficers(locationId, purokId)` | `{ officers, loading, error, assignOfficer, removeOfficer }` | Barangay and purok leadership rosters |
| `useContributionRates()` | `{ rates, loading, error, createRate }` | Schedules and retrieves effective dues rates |
| `useAuthProfile()` | `{ profile, loading, error, refetch }` | Authenticated user profile and RBAC permissions |
| `useActivityLogs(filters)` | `{ logs, count, loading }` | Paginated system audit trails |
| `useFormTracking()` | `{ formTrackings, loading, error, createFormTracking, updateFormTracking, deleteFormTracking }` | Profiling form document batches |

#### Data Transformation Functions (`useSupabase.ts`)
- `transformHousehold(data)` — Maps Supabase DB rows into strongly-typed `Household` interfaces with date parsing.
- `transformFamilyMember(data)` — Maps Supabase DB rows into `FamilyMember` records.
- `transformDuesPayment(data)` — Maps Supabase rows into `DuesPayment` records with associated member and household objects.
- `transformUser(data)` — Transforms user records and normalizes permissions.
- `transformPurok(data)` — Transforms raw purok records.
- `transformOfficer(data)` — Normalizes officer records with member references.

---

### Supabase API Helpers (`supabase.ts`)
- **File**: [`project/src/lib/supabase.ts`](file:///Users/eddz/Downloads/TROPA-main/project/src/lib/supabase.ts)

The `supabaseHelpers` singleton wraps all direct Supabase PostgreSQL queries and Storage operations:

#### Storage Methods
- `uploadProfilePicture(file, path)` — Uploads member avatar to `profile-pictures` bucket.
- `deleteProfilePicture(path)` — Deletes avatar from storage.
- `uploadHousePicture(file, path)` — Uploads household image to `house-pictures` bucket.
- `deleteHousePicture(path)` — Removes household image from storage.

#### Data CRUD Methods
- **Households**: `getHouseholds()`, `getHouseholdsPaginated(params)`, `createHousehold(household)`, `updateHousehold(id, updates)`, `deleteHousehold(id)`.
- **Family Members**: `getFamilyMembers()`, `getFamilyMembersPaginated(params)`, `createFamilyMember(member)`, `createFamilyMembersBulk(members)`, `updateFamilyMember(id, updates)`, `deleteFamilyMember(id)`.
- **Dues Payments**: `getDuesPayments()`, `getDuesPaymentsPaginated(params)`, `getDuesPaymentsMetadata()`, `getDuesCollectionStats()`, `createDuesPayment(payment)`, `updateDuesPayment(id, updates)`, `deleteDuesPayment(id)`.
- **Users**: `getUsers()`, `createUser(user)`, `updateUser(id, updates)`, `deleteUser(id)`.
- **Locations & Puroks**: `getLocations()`, `createLocation(loc)`, `updateLocation(id, updates)`, `deleteLocation(id)`, `getPuroks(locationId)`, `createPurok(data)`, `ensurePurok(locationId, name)`, `updatePurok(id, data)`, `deletePurok(id)`.
- **Officers**: `getOfficers(locationId, purokId)`, `assignOfficer(officer)`, `removeOfficer(id)`.
- **Voters**: `searchVoters(filters)`.
- **Form Tracking**: `getFormTracking()`, `createFormTracking(data)`, `updateFormTracking(id, data)`, `deleteFormTracking(id)`.
- **System**: `getDashboardStats()`, `logActivity(action, entityType, entityId, details)`.

---

### Utility Modules

#### 1. Dues & Date Calculations ([`project/src/lib/utils.ts`](file:///Users/eddz/Downloads/TROPA-main/project/src/lib/utils.ts))
- `getCurrentRate(rates)` — Returns the latest effective contribution rate.
- `getRateForMonth(month, rates)` — Resolves the active rate for a specific historical billing month.
- `formatCurrency(amount)` — Formats a number to Philippine Peso currency (`₱X,XXX.XX`).
- `formatDate(date)` — Formats standard readable dates.
- `formatMonthName(monthStr)` — Converts `YYYY-MM` into month name and year (e.g. `2026-03` -> `March 2026`).
- `generateMonthRange(startMonth, count)` — Returns array of `count` consecutive months starting from `startMonth`.
- `getMemberPaidMonths(memberId, payments)` — Returns set of month strings covered by completed payments.
- `getOutstandingMonths(member, payments, rates)` — Calculates overdue months and total arrears owed.

#### 2. Image Processing ([`project/src/lib/imageUtils.ts`](file:///Users/eddz/Downloads/TROPA-main/project/src/lib/imageUtils.ts))
- `compressProfileImage(file, options)` — Compresses images using `browser-image-compression` to under 500KB before uploading.
- `validateImageFile(file)` — Validates file type (`image/jpeg`, `image/png`, `image/webp`) and size limits (<10MB).
- `generateProfileImagePath(memberId, filename)` — Generates deterministic unique file paths.
- `createImagePreview(file)` / `revokeImagePreview(url)` — Manages object URLs for client previews.

#### 3. Geographic Coordinates ([`project/src/lib/barangayCoordinates.ts`](file:///Users/eddz/Downloads/TROPA-main/project/src/lib/barangayCoordinates.ts))
- `getEstimatedCoordinates(lgu, barangay)` — Returns pre-configured latitude and longitude coordinates for barangays.
- `getAvailableLGUs()` — Returns list of supported LGUs.
- `getBarangaysForLGU(lgu)` — Returns list of barangays belonging to a designated LGU.

---

## Graphify Knowledge Graph Index

The codebase architecture and dependencies are continuously tracked using [Graphify](file:///Users/eddz/Downloads/TROPA-main/graphify-out/GRAPH_REPORT.md).

### Graph Metrics
- **Total Nodes**: 365
- **Total Edges**: 990
- **Extraction Confidence**: 99% EXTRACTED · 1% INFERRED

### Central God Nodes (Most Connected Abstractions)
1. [`Household`](file:///Users/eddz/Downloads/TROPA-main/project/src/types/index.ts#L1) — 49 edges
2. [`FamilyMember`](file:///Users/eddz/Downloads/TROPA-main/project/src/types/index.ts#L19) — 47 edges
3. `lucide-react` — 43 edges
4. [`Location`](file:///Users/eddz/Downloads/TROPA-main/project/src/types/index.ts#L97) — 35 edges
5. `react` — 34 edges
6. [`DuesPayment`](file:///Users/eddz/Downloads/TROPA-main/project/src/types/index.ts#L57) — 27 edges
7. [`User`](file:///Users/eddz/Downloads/TROPA-main/project/src/types/index.ts#L84) — 24 edges
8. [`App()`](file:///Users/eddz/Downloads/TROPA-main/project/src/App.tsx#L19) — 19 edges
9. [`Header()`](file:///Users/eddz/Downloads/TROPA-main/project/src/components/Layout/Header.tsx#L9) — 19 edges
10. [`ContributionRate`](file:///Users/eddz/Downloads/TROPA-main/project/src/types/index.ts#L123) — 17 edges

### Querying the Knowledge Graph
To explore relationships and subgraphs using Graphify:
```bash
# Query nodes or architecture concepts
graphify query "Household"
graphify query "DuesCollection"

# Shortest path between components
graphify path "App" "PaymentForm"

# Explain a specific node
graphify explain "FamilyMember"
```
