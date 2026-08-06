// ==========================================
// FILE: js/setting.js
// ==========================================

// Variable Global Store / Toko
let currentTokoId = localStorage.getItem('toko_id') || null;

/**
 * 1. FUNGSI UNTUK TOGGLE (MEMBUKA/MENUTUP) FORM TAMBAH KASIR
 * Memastikan form input nama, email, password kasir bisa dibuka dari tombol '+ Buat Kasir'
 */
function toggleFormTambahKasir() {
  const formContainer = document.getElementById('form-tambah-kasir');
  if (!formContainer) return;

  if (formContainer.classList.contains('hidden')) {
    formContainer.classList.remove('hidden');
  } else {
    formContainer.classList.add('hidden');
  }
}

/**
 * 2. FUNGSI UNTUK MENYIMPAN KASIR BARU KE SUPABASE
 */
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

    // A. Buat akun di Supabase Auth
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

    // B. Insert data profil ke tabel 'profiles' Supabase
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

    // Reset Form Input
    if (inputNama) inputNama.value = '';
    if (inputEmail) inputEmail.value = '';
    if (inputPassword) inputPassword.value = '';

    // Sembunyikan kembali form
    toggleFormTambahKasir();

    // Reload daftar kasir
    if (typeof renderDaftarKasir === 'function') {
      await renderDaftarKasir();
    }

  } catch (err) {
    console.error('Error simpanKasirBaru:', err);
    if (typeof showToast === 'function') showToast('Terjadi kesalahan saat membuat kasir.', 'error');
  }
}

/**
 * 3. FUNGSI RENDER DAFTAR KASIR AKTIF DI MODAL
 */
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