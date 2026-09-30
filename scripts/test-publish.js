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

async function testDownload() {
  const postId = 'e823d7d4-09e4-48db-8388-6e48e8f64720';
  const manifestPath = `manifests/${postId}.json`;
  const { data, error } = await supabase.storage.from('content-revisions').download(manifestPath);
  console.log('Download error:', error);
  if (data) {
    const text = await data.text();
    console.log('Manifest content:', text);
  }
}

testDownload();
