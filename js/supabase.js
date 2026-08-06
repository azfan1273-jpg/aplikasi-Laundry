// ==========================================
// FILE: js/supabase.js
// ==========================================
// Ganti URL dan ANON KEY di bawah ini dengan milikmu yang asli!
const SUPABASE_URL = "https://qcpxitlltkkxtdctertz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcHhpdGxsdGtreHRkY3RlcnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NjYwODYsImV4cCI6MjEwMTM0MjA4Nn0.RCZhreRKQIkxgsJXsfAZZia-AEgd_vM3DtgjkFXCYcI";

// Deklarasikan variabel secara GLOBAL
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = window.supabaseClient;

console.log('✅ Supabase Client Initialized:', window.supabaseClient);