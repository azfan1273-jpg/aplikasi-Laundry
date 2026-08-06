// ==========================================
// FILE: js/setting.js
// ==========================================

let currentTokoId = localStorage.getItem('toko_id') || null;

// Toggle (Membuat Muncul/Sembunyi) Form Input Kasir Baru
function toggleFormTambahKasir() {
  const formContainer = document.getElementById('form-tambah-kasir');
  if (!formContainer) return;

  if (formContainer.classList.contains('hidden')) {
    formContainer.classList.remove('hidden');
  } else {
    formContainer.classList.add('hidden');
  }
}

// Simpan Kasir Baru ke Supabase Auth & Tabel Profiles
async function simpanKasirBaru() {
  try {
    const inputNama = document.getElementById('new_kasir_nama');
    const inputEmail = document.getElementById('new_kasir_email');
    const inputPassword = document.getElementById('new_kasir_password');

    const nama = inputNama ? inputNama.value.trim() : '';
    const email = inputEmail ? inputEmail.value.trim() : '';
    const password = inputPassword ? inputPassword.value.trim() : '';

    if (!email || !password) {
      if (typeof showToast === 'function') {
        showToast('Email dan Password kasir wajib diisi!', 'error');
      } else {
        alert('Email dan Password kasir wajib diisi!');
      }
      return;
    }

    // 1. Tambah user ke Supabase Auth
    const { data: authData, error: authErr } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          nama_user: nama || email.split('@')[0],
          role: 'kasir'
        }
      }
    });

    if (authErr) {
      console.error('Error Sign Up Kasir:', authErr);
      if (typeof showToast === 'function') showToast('Gagal: ' + authErr.message, 'error');
      return;
    }

    // 2. Tambah profil ke tabel 'profiles'
    if (authData && authData.user) {
      const { error: dbErr } = await supabaseClient.from('profiles').insert([{
        id: authData.user.id,
        toko_id: currentTokoId,
        role: 'kasir',
        nama_user: nama || email.split('@')[0],
        email: email
      }]);

      if (dbErr) {
        console.error('Error insert profiles kasir:', dbErr);
      }
    }

    if (typeof showToast === 'function') showToast('Akun kasir berhasil dibuat!', 'success');

    // Reset input
    if (inputNama) inputNama.value = '';
    if (inputEmail) inputEmail.value = '';
    if (inputPassword) inputPassword.value = '';

    toggleFormTambahKasir();

    if (typeof renderDaftarKasir === 'function') {
      await renderDaftarKasir();
    }

  } catch (err) {
    console.error('Error simpanKasirBaru:', err);
    if (typeof showToast === 'function') showToast('Terjadi kesalahan saat membuat kasir.', 'error');
  }
}

// Render Daftar Kasir
async function renderDaftarKasir() {
  const container = document.getElementById('list-kasir-container');
  if (!container) return;

  try {
    container.innerHTML = '<p class="text-xs text-slate-400 italic">Memuat daftar kasir...</p>';

    const { data: listKasir, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('role', 'kasir');

    if (error) throw error;

    if (!listKasir || listKasir.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-400 italic">Belum ada kasir terdaftar.</p>';
      return;
    }

    container.innerHTML = '';
    listKasir.forEach((kasir) => {
      const item = document.createElement('div');
      item.className = 'flex justify-between items-center p-2 bg-white rounded-xl border border-indigo-100 text-xs';
      item.innerHTML = `
        <div>
          <p class="font-bold text-slate-800">${kasir.nama_user || 'Kasir'}</p>
          <p class="text-[10px] text-slate-400">${kasir.email}</p>
        </div>
        <span class="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-md">Kasir</span>
      `;
      container.appendChild(item);
    });

  } catch (err) {
    console.error('Error renderDaftarKasir:', err);
    container.innerHTML = '<p class="text-xs text-rose-500">Gagal memuat daftar kasir.</p>';
  }
}

// Accordion Toggle
function toggleAccordion(accId) {
  const element = document.getElementById(accId);
  const arrow = document.getElementById(`arrow-${accId}`);
  if (!element) return;

  if (element.classList.contains('hidden')) {
    element.classList.remove('hidden');
    if (arrow) arrow.style.transform = 'rotate(180deg)';
    if (accId === 'acc-kasir') renderDaftarKasir();
  } else {
    element.classList.add('hidden');
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  }
}