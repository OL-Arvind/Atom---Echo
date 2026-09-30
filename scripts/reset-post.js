const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach((line) => {
  const idx = line.indexOf('=');
  if (idx !== -1) {
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function reset() {
  const postId = 'e823d7d4-09e4-48db-8388-6e48e8f64720';
  await supabase
    .from('content_items')
    .update({
      status: 'scheduled',
      published_at: null,
      scheduled_publish_date: '2026-09-30T09:30:00+00:00'
    })
    .eq('id', postId);
  console.log('Reset post back to scheduled');
}

reset();
