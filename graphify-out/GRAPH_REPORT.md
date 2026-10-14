# Graph Report - TROPA-main  (2026-10-13)

## Corpus Check
- 112 files · ~77,572 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 7, .css 1)

## Summary
- 616 nodes · 1334 edges · 61 communities (25 shown, 36 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 131 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a0466d42`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Household
- lucide-react
- useSupabase.ts
- TropaFinder.tsx
- Location
- compilerOptions
- package.json
- @supabase/supabase-js
- devDependencies
- Supabase
- Dashboard.tsx
- ProfileImageUpload.tsx
- database.ts
- dependencies
- react
- barangayCoordinates.ts
- compilerOptions
- scripts
- vite.config.ts
- Changelog
- Writing Guidelines for Postgres References
- MemberListPrint.ts
- Changelog
- Section Definitions
- Supabase Postgres Best Practices
- Graphify Knowledge Graph Index
- advanced-full-text-search.md
- advanced-jsonb-indexing.md
- conn-idle-timeout.md
- conn-limits.md
- conn-pooling.md
- conn-prepared-statements.md
- data-batch-inserts.md
- data-n-plus-one.md
- data-pagination.md
- data-upsert.md
- lock-advisory.md
- lock-deadlock-prevention.md
- lock-short-transactions.md
- lock-skip-locked.md
- monitor-explain-analyze.md
- monitor-pg-stat-statements.md
- monitor-vacuum-analyze.md
- query-composite-indexes.md
- query-covering-indexes.md
- query-index-types.md
- query-missing-indexes.md
- query-partial-indexes.md
- schema-constraints.md
- schema-data-types.md
- schema-foreign-key-indexes.md
- schema-lowercase-identifiers.md
- schema-partitioning.md
- schema-primary-keys.md
- security-privileges.md
- security-rls-basics.md
- security-rls-performance.md
- _template.md

## God Nodes (most connected - your core abstractions)
1. `Household` - 56 edges
2. `FamilyMember` - 52 edges
3. `lucide-react` - 44 edges
4. `Location` - 37 edges
5. `react` - 35 edges
6. `User` - 26 edges
7. `DuesPayment` - 24 edges
8. `App()` - 21 edges
9. `Header()` - 21 edges
10. `ContributionRate` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Subcomponents & Child Nodes` --references--> `LocationBreakdown()`  [INFERRED]
  README.md → project/src/components/Dashboard/LocationBreakdown.tsx
- `Subcomponents & Child Nodes` --references--> `PaymentChart()`  [INFERRED]
  README.md → project/src/components/Dashboard/PaymentChart.tsx
- `Functions & Handlers` --references--> `PublicSearch()`  [INFERRED]
  README.md → project/src/components/PublicSearch/PublicSearch.tsx
- `Filter & Print Dialog Fields (`PrintFilterModal`)` --references--> `PrintFilterModal()`  [INFERRED]
  README.md → project/src/components/Reports/PrintFilterModal.tsx
- `Functions & Handlers` --references--> `useDashboardStats()`  [INFERRED]
  README.md → project/src/hooks/useSupabase.ts

## Import Cycles
- None detected.

## Communities (61 total, 36 thin omitted)

### Community 0 - "Household"
Cohesion: 0.07
Nodes (63): LocationBreakdown(), LocationBreakdownProps, PaymentChart(), PaymentChartProps, RecentPaymentsProps, DuesCollectionProps, ViewMode, PaymentForm() (+55 more)

### Community 1 - "lucide-react"
Cohesion: 0.08
Nodes (39): HouseholdForm(), HouseholdTable(), HouseholdTableProps, HouseholdView(), sectorColors, HeaderProps, BulkAddMemberForm(), createEmptyRow() (+31 more)

### Community 2 - "useSupabase.ts"
Cohesion: 0.08
Nodes (58): App(), LoginPage(), LoginPageProps, Dashboard(), DuesCollection(), FormTrackingPage(), FormTrackingModal(), Households() (+50 more)

### Community 3 - "TropaFinder.tsx"
Cohesion: 0.12
Nodes (18): BlocklistEntry, BlocklistModal(), BlocklistModalProps, BlocklistViewModal(), BlocklistViewModalProps, compressImage(), SortDir, SortField (+10 more)

### Community 4 - "Location"
Cohesion: 0.07
Nodes (47): FormTrackingProps, FormTrackingModalProps, HouseholdFormProps, LocationForm(), LocationFormProps, Locations(), LocationsProps, LocationTable() (+39 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 6 - "package.json"
Cohesion: 0.11
Nodes (18): name, private, type, version, autoprefixer, clsx, eslint, eslint-plugin-react-hooks (+10 more)

### Community 7 - "@supabase/supabase-js"
Cohesion: 0.13
Nodes (7): { createClient }, supabase, { createClient }, supabase, supabase, @supabase/supabase-js, supabase

### Community 8 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, autoprefixer, eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, postcss, tailwindcss, @types/leaflet (+7 more)

### Community 9 - "Supabase"
Cohesion: 0.12
Nodes (14): Fix suggestion, Source, What happened, Skill Feedback, Steps, Core Principles, Making and Committing Schema Changes, Option A: Declarative schemas (+6 more)

### Community 10 - "Dashboard.tsx"
Cohesion: 0.08
Nodes (26): BarangayStats(), BarangayStatsProps, DashboardProps, MembersMap(), RecentPayments(), colorStyles, StatCard(), StatCardProps (+18 more)

### Community 11 - "ProfileImageUpload.tsx"
Cohesion: 0.33
Nodes (9): ProfileImageUpload(), ProfileImageUploadProps, CompressionOptions, compressProfileImage(), createImagePreview(), generateProfileImagePath(), revokeImagePreview(), validateImageFile() (+1 more)

### Community 12 - "database.ts"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 13 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, browser-image-compression, clsx, leaflet, lucide-react, react, react-dom, react-hot-toast (+1 more)

### Community 14 - "react"
Cohesion: 0.17
Nodes (15): MembersMapProps, sectorColors, MapPickerProps, ExportReport(), LocationReport(), Stats, MembershipReport(), Reports() (+7 more)

### Community 15 - "barangayCoordinates.ts"
Cohesion: 0.17
Nodes (9): barangayCoordinates, BarangayCoords, CoordinatesMap, getAvailableLGUs(), LGUBarangayMap, 1. Dues & Date Calculations ([`project/src/lib/utils.ts`](file:///Users/eddz/Downloads/TROPA-main/project/src/lib/utils.ts)), 2. Image Processing ([`project/src/lib/imageUtils.ts`](file:///Users/eddz/Downloads/TROPA-main/project/src/lib/imageUtils.ts)), 3. Geographic Coordinates ([`project/src/lib/barangayCoordinates.ts`](file:///Users/eddz/Downloads/TROPA-main/project/src/lib/barangayCoordinates.ts)) (+1 more)

### Community 16 - "compilerOptions"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 17 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 22 - "Changelog"
Cohesion: 0.12
Nodes (16): [1.2.0](https://github.com/supabase/agent-skills/compare/v1.1.1...v1.2.0) (2026-06-02), [1.3.0](https://github.com/supabase/agent-skills/compare/v1.2.0...v1.3.0) (2026-06-05), [1.4.0](https://github.com/supabase/agent-skills/compare/v1.3.0...v1.4.0) (2026-07-10), [1.5.0](https://github.com/supabase/agent-skills/compare/supabase-postgres-best-practices-v1.4.0...supabase-postgres-best-practices-v1.5.0) (2026-07-30), [1.6.0](https://github.com/supabase/agent-skills/compare/supabase-postgres-best-practices-v1.5.0...supabase-postgres-best-practices-v1.6.0) (2026-07-30), Bug Fixes, Bug Fixes, Bug Fixes (+8 more)

### Community 23 - "Writing Guidelines for Postgres References"
Cohesion: 0.12
Nodes (15): 1. Concrete Transformation Patterns, 2. Error-First Structure, 3. Quantified Impact, 4. Self-Contained Examples, 5. Semantic Naming, Code Example Standards, Comments, Impact Level Guidelines (+7 more)

### Community 24 - "MemberListPrint.ts"
Cohesion: 0.23
Nodes (14): byName(), calcAge(), esc(), fmtDate(), fullName(), MemberPrintFormat, MONTH_INITIALS, MONTH_LABELS (+6 more)

### Community 25 - "Changelog"
Cohesion: 0.14
Nodes (13): [0.1.3](https://github.com/supabase/agent-skills/compare/v0.1.2...v0.1.3) (2026-06-02), [0.1.4](https://github.com/supabase/agent-skills/compare/v0.1.3...v0.1.4) (2026-06-05), [0.1.5](https://github.com/supabase/agent-skills/compare/v0.1.4...v0.1.5) (2026-07-10), [0.1.6](https://github.com/supabase/agent-skills/compare/v0.1.5...supabase-v0.1.6) (2026-07-30), Bug Fixes, Bug Fixes, Bug Fixes, Bug Fixes (+5 more)

### Community 26 - "Section Definitions"
Cohesion: 0.20
Nodes (9): 1. Query Performance (query), 2. Connection Management (conn), 3. Security & RLS (security), 4. Schema Design (schema), 5. Concurrency & Locking (lock), 6. Data Access Patterns (data), 7. Monitoring & Diagnostics (monitor), 8. Advanced Features (advanced) (+1 more)

### Community 27 - "Supabase Postgres Best Practices"
Cohesion: 0.33
Nodes (5): How to Use, References, Rule Categories by Priority, Supabase Postgres Best Practices, When to Apply

### Community 28 - "Graphify Knowledge Graph Index"
Cohesion: 0.67
Nodes (3): Graph Metrics, Graphify Knowledge Graph Index, Querying the Knowledge Graph

## Knowledge Gaps
- **225 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+220 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 277 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `lucide-react` connect `lucide-react` to `Household`, `useSupabase.ts`, `TropaFinder.tsx`, `Location`, `package.json`, `Dashboard.tsx`, `ProfileImageUpload.tsx`, `react`, `MemberListPrint.ts`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Household` (e.g. with `Central God Nodes (Most Connected Abstractions)` and `Data Transformation Functions (`useSupabase.ts`)`) actually correct?**
  _`Household` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _225 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Household` be split into smaller, more focused modules?**
  _Cohesion score 0.07183544303797468 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `Household`, `lucide-react`, `useSupabase.ts`, `TropaFinder.tsx`, `Location`, `package.json`, `ProfileImageUpload.tsx`, `MemberListPrint.ts`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `FamilyMember` (e.g. with `Central God Nodes (Most Connected Abstractions)` and `Data Transformation Functions (`useSupabase.ts`)`) actually correct?**
  _`FamilyMember` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.08326530612244898 - nodes in this community are weakly interconnected._