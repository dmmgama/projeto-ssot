// Supabase Config v11.1
const SUPABASE_URL = 'PLACEHOLDER_URL';
const SUPABASE_ANON_KEY = 'PLACEHOLDER_KEY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabaseClient = supabase;
