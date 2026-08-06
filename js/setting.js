// ==========================================
// FILE: js/setting.js
// ==========================================

// Toggle Accordion di Jendela Akun (Termasuk Accordion Kasir)
function toggleAccordion(accId) {
  const element = document.getElementById(accId);
  const arrow = document.getElementById(`arrow-${accId}`);
  if (!element) return;

  if (element.classList.contains('hidden')) {
    element.classList.remove('hidden');
    if (arrow) arrow.style.transform = 'rotate(180deg)';
    if (accId === 'acc-kasir' && typeof renderDaftarKasir === 'function') {
      renderDaftarKasir();
    }
  } else {
    element.classList.add('hidden');
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  }
}

// Toggle Form Input Kasir Baru (+ Buat Kasir)
function toggleFormTambahKasir() {
  const formContainer = document.getElementById('form-tambah-kasir');
  if (!formContainer) return;

  if (formContainer.classList.contains('hidden')) {
    formContainer.classList.remove('hidden');
  } else {
    formContainer.classList.add('hidden');
  }
}

// Simpan Kasir Baru ke Supabase
async function simpanKasirBaru() {
  try {
    const inputNama = document.getElementById('new_kasir_nama');
    const inputEmail = document.getElementById('new_kasir_email');
    const inputPassword = document.getElementById('new_kasir_password');

    const nama = inputNama ? inputNama.value.trim() : '';
    const email = inputEmail ? inputEmail.value.trim() : '';
    const password = inputPassword ? inputPassword.value.trim() : '';

    if (!email || !password) {
      alert('Email dan Password kasir wajib diisi!');
      return;
    }

    if (typeof supabaseClient === 'undefined') {
      alert('Koneksi database Supabase belum siap.');
      return;
    }

    // 1. Registrasi Auth
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
      alert('Gagal membuat kasir: ' + authErr.message);
      return;
    }

    // 2. Simpan ke Profiles
    if (authData && authData.user) {
      await supabaseClient.from('profiles').insert([{
        id: authData.user.id,
        toko_id: localStorage.getItem('toko_id') || null,
        role: 'kasir',
        nama_user: nama || email.split('@')[0],
        email: email
      }]);
    }

    alert('Akun kasir berhasil dibuat!');

    if (inputNama) inputNama.value = '';
    if (inputEmail) inputEmail.value = '';
    if (inputPassword) inputPassword.value = '';

    toggleFormTambahKasir();
    renderDaftarKasir();

  } catch (err) {
    console.error('Error simpanKasirBaru:', err);
    alert('Terjadi kesalahan saat menyimpan kasir.');
  }
}

// Render List Kasir
async function renderDaftarKasir() {
  const container = document.getElementById('list-kasir-container');
  if (!container || typeof supabaseClient === 'undefined') return;

  try {
    container.innerHTML = '<p class="text-xs text-slate-400 italic">Memuat kasir...</p>';

    const { data: listKasir, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('role', 'kasir');

    if (error) throw error;

    if (!listKasir || listKasir.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-400 italic">Belum ada kasir.</p>';
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
    console.error(err);
    container.innerHTML = '<p class="text-xs text-rose-500">Gagal memuat kasir.</p>';
  }
}

// FUNGSI SIMPAN LAYANAN BARU LANGSUNG KE SUPABASE
async function tambahLayananBaru(e) {
  if (e && e.preventDefault) e.preventDefault();

  const namaInput = document.getElementById('new_nama_layanan');
  const hargaInput = document.getElementById('new_harga_layanan');
  const satuanInput = document.getElementById('new_satuan_layanan');
  const estimasiInput = document.getElementById('new_estimasi_hari');

  const nama_layanan = namaInput?.value?.trim();
  const harga = parseFloat(hargaInput?.value) || 0;
  const satuan = satuanInput?.value || 'Kg';
  const estimasi_hari = parseFloat(estimasiInput?.value) || 1;

  if (!nama_layanan || harga <= 0) {
    alert('Harap isi Nama Layanan dan Harga yang valid!');
    return;
  }

  try {
    const user = (await supabase.auth.getUser()).data?.user;
    const userId = user ? user.id : null;

    const { data, error } = await supabase
      .from('layanan')
      .insert([
        {
          nama_layanan: nama_layanan,
          harga: harga,
          satuan: satuan,
          estimasi_hari: estimasi_hari,
          user_id: userId
        }
      ])
      .select();

    if (error) {
      console.error('Error insert layanan:', error);
      alert('Gagal menyimpan layanan: ' + error.message);
      return;
    }

    alert('Layanan berhasil ditambahkan!');

    // Reset Form
    if (namaInput) namaInput.value = '';
    if (hargaInput) hargaInput.value = '';
    if (estimasiInput) estimasiInput.value = '';

    // Refresh daftar layanan jika ada fungsi render
    if (typeof renderKelolaLayananList === 'function') renderKelolaLayananList();
    if (typeof renderLayananPOS === 'function') renderLayananPOS();

    // Tutup Modal Kelola Layanan
    if (typeof closeModalKelolaLayanan === 'function') closeModalKelolaLayanan();

  } catch (err) {
    console.error('Error catch:', err);
    alert('Terjadi kesalahan sistem.');
  }
}