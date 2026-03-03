const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ytrpijnooxglkpgwxlpo.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0cnBpam5vb3hnbGtwZ3d4bHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1ODA4NTMsImV4cCI6MjA3MzE1Njg1M30.jmqKAtlJCr_Wdq8eO50jkZ8H-x2QnBUeeuUt70Z6DQk');

async function run() {
  console.log('Fetching all members...');
  const { data: allMembers, error: membersError } = await supabase.from('family_members').select('*');
  if (membersError) throw membersError;
  
  console.log(`Found ${allMembers.length} members.`);
  
  const leaders = allMembers.filter(m => m.is_household_leader);
  console.log(`Found ${leaders.length} household leaders.`);
  
  const householdsMap = {};
  
  // Group members by household_id to calculate totals
  allMembers.forEach(m => {
    if (!m.household_id) return;
    if (!householdsMap[m.household_id]) {
      householdsMap[m.household_id] = {
        total: 0,
        active: 0
      };
    }
    householdsMap[m.household_id].total++;
    if (m.is_cooperative_member) {
      householdsMap[m.household_id].active++;
    }
  });
  
  const newHouseholdsMap = {};
  
  for (const leader of leaders) {
    if (!leader.household_id) continue;
    
    // Only process each household_id once, taking the first leader found
    if (newHouseholdsMap[leader.household_id]) continue;
    
    const counts = householdsMap[leader.household_id] || { total: 1, active: leader.is_cooperative_member ? 1 : 0 };
    
    newHouseholdsMap[leader.household_id] = {
      id: leader.household_id,
      household_name: `${leader.lastname} Family`,
      lgu: leader.lgu || 'Unknown',
      barangay: leader.barangay || 'Unknown',
      purok: leader.purok || 'Unknown',
      household_leader_id: leader.id,
      total_members: counts.total,
      active_members: counts.active,
      status: 'active',
      created_by: leader.created_by || 'system'
    };
  }
  
  const newHouseholds = Object.values(newHouseholdsMap);
  console.log(`Preparing to insert ${newHouseholds.length} unique households (from leaders).`);
  
  // Check if there are any members that don't belong to a household created by a leader
  const orphanHouseholdIds = Object.keys(householdsMap).filter(id => !newHouseholdsMap[id]);
  console.log(`Found ${orphanHouseholdIds.length} households without a leader flag.`);
  
  // Create households for them as well
  for (const orphanId of orphanHouseholdIds) {
    const membersInHousehold = allMembers.filter(m => m.household_id === orphanId);
    if (membersInHousehold.length === 0) continue;
    
    // Pick the first member as the representative
    const rep = membersInHousehold[0];
    const counts = householdsMap[orphanId];
    
    newHouseholds.push({
      id: orphanId,
      household_name: `${rep.lastname} Family`,
      lgu: rep.lgu || 'Unknown',
      barangay: rep.barangay || 'Unknown',
      purok: rep.purok || 'Unknown',
      household_leader_id: null, // No explicit leader
      total_members: counts.total,
      active_members: counts.active,
      status: 'active',
      created_by: rep.created_by || 'system'
    });
  }
  
  console.log(`Total households to insert: ${newHouseholds.length}.`);

  // Insert in batches
  for (let i = 0; i < newHouseholds.length; i += 50) {
    const batch = newHouseholds.slice(i, i + 50);
    const { error: insertError } = await supabase
      .from('households')
      .upsert(batch, { onConflict: 'id' });
      
    if (insertError) {
      console.error('Error inserting batch starting at index', i, insertError.message);
    } else {
      console.log(`Successfully inserted batch ${i} to ${i + batch.length}`);
    }
  }
  
  console.log('Recovery script complete.');
}

run().catch(console.error);
