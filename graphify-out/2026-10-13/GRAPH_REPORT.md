# Graph Report - TROPA-main  (2026-10-07)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 365 nodes · 990 edges · 22 communities (18 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5bfedf83`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Household
- useSupabase.ts
- App.tsx
- DuesCollection.tsx
- lucide-react
- compilerOptions
- package.json
- @supabase/supabase-js
- devDependencies
- Members.tsx
- Dashboard.tsx
- ProfileImageUpload.tsx
- database.ts
- dependencies
- MembersMap.tsx
- barangayCoordinates.ts
- compilerOptions
- scripts
- vite.config.ts

## God Nodes (most connected - your core abstractions)
1. `Household` - 49 edges
2. `FamilyMember` - 47 edges
3. `lucide-react` - 43 edges
4. `Location` - 35 edges
5. `react` - 34 edges
6. `DuesPayment` - 27 edges
7. `User` - 24 edges
8. `App()` - 19 edges
9. `Header()` - 19 edges
10. `ContributionRate` - 17 edges

## Surprising Connections (you probably didn't know these)
- `MembersMapProps` --references--> `FamilyMember`  [EXTRACTED]
  project/src/components/Dashboard/MembersMap.tsx → project/src/types/index.ts
- `MemberRow` --references--> `FamilyMember`  [EXTRACTED]
  project/src/components/Members/BulkAddMemberForm.tsx → project/src/types/index.ts
- `MemberTableProps` --references--> `FamilyMember`  [EXTRACTED]
  project/src/components/Members/MemberTable.tsx → project/src/types/index.ts
- `BarangayStatsProps` --references--> `Household`  [EXTRACTED]
  project/src/components/Dashboard/BarangayStats.tsx → project/src/types/index.ts
- `DashboardProps` --references--> `Household`  [EXTRACTED]
  project/src/components/Dashboard/Dashboard.tsx → project/src/types/index.ts

## Import Cycles
- None detected.

## Communities (22 total, 4 thin omitted)

### Community 0 - "Household"
Cohesion: 0.10
Nodes (41): LocationBreakdownProps, PaymentChartProps, RecentPaymentsProps, DuesCollectionProps, PaymentFormProps, methodColors, PaymentTableProps, statusColors (+33 more)

### Community 1 - "useSupabase.ts"
Cohesion: 0.10
Nodes (38): FormTrackingProps, FormTrackingModal(), FormTrackingModalProps, HouseholdForm(), HouseholdFormProps, Households(), HouseholdTable(), HouseholdTableProps (+30 more)

### Community 2 - "App.tsx"
Cohesion: 0.10
Nodes (28): App(), LoginPage(), LoginPageProps, FormTrackingPage(), cn(), menuItems, Sidebar(), PublicSearch() (+20 more)

### Community 3 - "DuesCollection.tsx"
Cohesion: 0.14
Nodes (26): DuesCollection(), ViewMode, PaymentForm(), paymentMethods, PaymentTable(), UnpaidMembersTable(), MONTH_INITIALS, MONTH_LABELS (+18 more)

### Community 4 - "lucide-react"
Cohesion: 0.14
Nodes (23): RecentPayments(), Header(), HeaderProps, SidebarProps, LocationForm(), Locations(), LocationTable(), Logs() (+15 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 6 - "package.json"
Cohesion: 0.11
Nodes (17): name, private, type, version, autoprefixer, clsx, eslint, eslint-plugin-react-hooks (+9 more)

### Community 7 - "@supabase/supabase-js"
Cohesion: 0.13
Nodes (7): { createClient }, supabase, { createClient }, supabase, supabase, @supabase/supabase-js, supabase

### Community 8 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, autoprefixer, eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, postcss, tailwindcss, @types/leaflet (+7 more)

### Community 9 - "Members.tsx"
Cohesion: 0.24
Nodes (11): createEmptyMemberRow(), emptyForm, formatContactNumber(), generateTempId(), HouseholdMemberRow, MemberForm(), Members(), MemberTable() (+3 more)

### Community 10 - "Dashboard.tsx"
Cohesion: 0.27
Nodes (8): BarangayStats(), BarangayStatsProps, Dashboard(), DashboardProps, colorStyles, StatCard(), StatCardProps, useDashboardStats()

### Community 11 - "ProfileImageUpload.tsx"
Cohesion: 0.33
Nodes (9): ProfileImageUpload(), ProfileImageUploadProps, CompressionOptions, compressProfileImage(), createImagePreview(), generateProfileImagePath(), revokeImagePreview(), validateImageFile() (+1 more)

### Community 12 - "database.ts"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 13 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, browser-image-compression, clsx, leaflet, lucide-react, react, react-dom, react-hot-toast (+1 more)

### Community 14 - "MembersMap.tsx"
Cohesion: 0.25
Nodes (4): MembersMapProps, sectorColors, MapPickerProps, leaflet

### Community 15 - "barangayCoordinates.ts"
Cohesion: 0.25
Nodes (4): barangayCoordinates, BarangayCoords, CoordinatesMap, LGUBarangayMap

### Community 16 - "compilerOptions"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 17 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

## Knowledge Gaps
- **116 isolated node(s):** `Stats`, `PrintMode`, `MemberCandidate`, `Tables`, `StatCardProps` (+111 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 136 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `lucide-react` connect `lucide-react` to `Household`, `useSupabase.ts`, `App.tsx`, `DuesCollection.tsx`, `package.json`, `Members.tsx`, `Dashboard.tsx`, `ProfileImageUpload.tsx`, `MembersMap.tsx`?**
  _High betweenness centrality (0.152) - this node is a cross-community bridge._
- **What connects `Stats`, `PrintMode`, `MemberCandidate` to the rest of the system?**
  _116 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Household` be split into smaller, more focused modules?**
  _Cohesion score 0.0987012987012987 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Household` to `useSupabase.ts`, `App.tsx`, `DuesCollection.tsx`, `lucide-react`, `package.json`, `Members.tsx`, `ProfileImageUpload.tsx`, `MembersMap.tsx`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Should `useSupabase.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09840425531914894 - nodes in this community are weakly interconnected._
- **Why does `@supabase/supabase-js` connect `@supabase/supabase-js` to `App.tsx`, `package.json`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1021021021021021 - nodes in this community are weakly interconnected._