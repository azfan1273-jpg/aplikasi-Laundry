// ==========================================
// FILE: js/supabase.js
// ==========================================
// Ganti URL dan ANON KEY di bawah ini dengan milikmu yang asli!
const SUPABASE_URL = "https://qcpxitlltkkxtdctertz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CeC_XB7zVoD26xBHmsKHKw_VxqWhPAG";

// Deklarasikan variabel secara GLOBAL
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = window.supabaseClient;

console.log('✅ Supabase Client Initialized:', window.supabaseClient);