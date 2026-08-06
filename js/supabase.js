const SUPABASE_URL = "https://qcpxitlltkkxtdctertz.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_CeC_XB7zVoD26xBHmsKHKw_VxqWhPAG"; 

var supabaseClient = null;

try {
  if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch(e) {}