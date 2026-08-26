import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './project/.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('households')
    .select('*, family_members!inner(firstname, lastname, middlename)')
    .eq('family_members.is_household_leader', true)
    .or('firstname.ilike.%juan%,lastname.ilike.%juan%', { foreignTable: 'family_members' })
    .limit(5);
  console.log(error || data);
}
test();
