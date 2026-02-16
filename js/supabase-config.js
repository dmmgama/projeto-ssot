// ============================================
// SUPABASE CONFIG v11.1
// ============================================

// Credenciais SSOT-JSJ
const SUPABASE_URL = 'https://vkuqmnoepiddpidmdale.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXFtbm9lcGlkZHBpZG1kYWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTIxMDUsImV4cCI6MjA4Njc2ODEwNX0.66AiBEfBDuC0s6qp_vf3jCqQAEQZkynCkFLR0XoKeMs';

// Valida CDN carregado
if (typeof window.supabase === 'undefined') {
  console.error('❌ ERRO FATAL: Supabase CDN não carregado!');
  throw new Error('Supabase CDN missing. Adiciona <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
}

// Inicializa client (ÚNICA vez)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exporta globalmente
window.supabaseClient = supabaseClient;

console.log('✅ Supabase client inicializado:', supabaseClient);