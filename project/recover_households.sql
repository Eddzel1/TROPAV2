-- 1. Create households for members who are explicitly marked as leaders
INSERT INTO households (
    id, household_name, lgu, barangay, purok, 
    household_leader_id, total_members, active_members, status, created_by
)
SELECT 
    f.household_id AS id,
    f.lastname || ' Family' AS household_name,
    f.lgu,
    f.barangay,
    f.purok,
    f.id AS household_leader_id,
    agg.total_members,
    agg.active_members,
    'active' AS status,
    COALESCE(f.created_by, 'system') AS created_by
FROM family_members f
JOIN (
    SELECT household_id, COUNT(*) as total_members, 
           SUM(CASE WHEN is_cooperative_member THEN 1 ELSE 0 END) as active_members
    FROM family_members
    WHERE household_id IS NOT NULL
    GROUP BY household_id
) agg ON agg.household_id = f.household_id
WHERE f.is_household_leader = true
ON CONFLICT (id) DO NOTHING;

-- 2. Create households for members that belong to a household_id but don't have a leader
INSERT INTO households (
    id, household_name, lgu, barangay, purok, 
    household_leader_id, total_members, active_members, status, created_by
)
SELECT DISTINCT ON (f.household_id)
    f.household_id AS id,
    f.lastname || ' Family' AS household_name,
    f.lgu,
    f.barangay,
    f.purok,
    NULL AS household_leader_id,
    agg.total_members,
    agg.active_members,
    'active' AS status,
    COALESCE(f.created_by, 'system') AS created_by
FROM family_members f
JOIN (
    SELECT household_id, COUNT(*) as total_members, 
           SUM(CASE WHEN is_cooperative_member THEN 1 ELSE 0 END) as active_members
    FROM family_members
    WHERE household_id IS NOT NULL
    GROUP BY household_id
) agg ON agg.household_id = f.household_id
WHERE f.household_id IS NOT NULL AND f.household_id NOT IN (SELECT id FROM households)
ON CONFLICT (id) DO NOTHING;
