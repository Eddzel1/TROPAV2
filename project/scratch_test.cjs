const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ytrpijnooxglkpgwxlpo.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0cnBpam5vb3hnbGtwZ3d4bHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1ODA4NTMsImV4cCI6MjA3MzE1Njg1M30.jmqKAtlJCr_Wdq8eO50jkZ8H-x2QnBUeeuUt70Z6DQk');

async function run() {
  console.log('--- Checking voters schema ---');
  try {
    const { data, error } = await supabase
      .from('voters')
      .select('*')
      .limit(1);
    console.log('Voters select * limit 1 data:', data, 'Error:', error);
  } catch (err) {
    console.error('Voters select * threw:', err);
  }
}

run();
