// ==========================================
// FIX BUG 1: Tambah Kasir Baru & Load Kasir
// ==========================================

// Variable global toko ID (pastikan terisi dari session/localStorage)
let currentTokoId = localStorage.getItem('toko_id') || null;

/**
 * Fungsi untuk menambah kasir baru ke Supabase Auth & Tabel Profiles
 */
async function tambahKasirBaru() {
  try {
    // Ambil element input dari form HTML
    const emailInput = document.getElementById('kasirEmail') || document.getElementById('emailKasir');
    const passInput = document.getElementById('kasirPassword') || document.getElementById('passwordKasir');
    const namaInput = document.getElementById('kasirNama') || document.getElementById('namaKasir');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passInput ? passInput.value.trim() : '';
    const nama = namaInput ? namaInput.value.trim() : '';

    // Validasi input tidak boleh kosong
    if (!email || !password || !nama) {
      if (typeof showToast === 'function') showToast("Semua bidang (Nama, Email, Password) wajib diisi!");
      return;
    }

    // 1. Buat User Baru di Supabase Auth
    const { data: authData, error: authErr } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          nama_user: nama,
          role: 'kasir'
        }
      }
    });

    if (authErr) {
      console.error("Error Auth SignUp:", authErr);
      if (typeof showToast === 'function') showToast("Gagal registrasi auth: " + authErr.message);
      return;
    }

    // 2. Insert Data Lengkap ke Tabel 'profiles' Supabase
    if (authData && authData.user) {
      const { error: dbErr } = await supabaseClient.from('profiles').insert([{
        id: authData.user.id,
        toko_id: currentTokoId,
        role: 'kasir',
        nama_user: nama,
        email: email
      }]);

      if (dbErr) {
        console.error("Error insert ke profiles:", dbErr);
        if (typeof showToast === 'function') showToast("Gagal simpan profil: " + dbErr.message);
        return;
      }
    }

    // Berhasil
    if (typeof showToast === 'function') showToast("Akun kasir berhasil dibuat!");

    // Reset Form Input setelah berhasil
    if (emailInput) emailInput.value = '';
    if (passInput) passInput.value = '';
    if (namaInput) namaInput.value = '';

    // Reload daftar kasir di tabel
    if (typeof loadDaftarKasirList === 'function') {
      await loadDaftarKasirList();
    }

  } catch (err) {
    console.error("Error pada fungsi tambahKasirBaru:", err);
    if (typeof showToast === 'function') showToast("Terjadi kesalahan sistem saat membuat kasir.");
  }
}

/**
 * Fungsi untuk memuat daftar kasir ke tabel UI
 */
async function loadDaftarKasirList() {
  try {
    const { data: kasirList, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('role', 'kasir');

    if (error) throw error;

    const tbody = document.getElementById('tabelDaftarKasir');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!kasirList || kasirList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">Belum ada kasir.</td></tr>';
      return;
    }

    kasirList.forEach((kasir, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${kasir.nama_user || '-'}</td>
        <td>${kasir.email || '-'}</td>
        <td>
          <button class="btn btn-sm btn-info" onclick="bukaModalEditKasir('${kasir.id}', '${kasir.nama_user}', '${kasir.email}')">
            Detail / Edit
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Error loadDaftarKasirList:", err);
  }
}