// ==========================================
// FILE: js/supabase.js
// ==========================================

// Ganti URL dan ANON KEY di bawah ini dengan milikmu yang asli!
const SUPABASE_URL = "https://qcpxitlltkkxtdctertz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CeC_XB7zVoD26xBHmsKHKw_VxqWhPAG";

// Deklarasikan variabel secara GLOBAL menggunakan 'var' atau 'window'
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fallback untuk kompabilitas dengan kode yang memanggil 'supabase' saja
window.supabase = window.supabaseClient;

// Cek koneksi awal
console.log('✅ Supabase Client Initialized:', window.supabaseClient);