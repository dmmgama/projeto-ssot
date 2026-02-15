const SUPABASE_URL = 'YOUR_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
	throw new Error('Supabase CDN não carregado. Inclui https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2 antes de supabase-config.js');
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.supabaseClient = supabase;
