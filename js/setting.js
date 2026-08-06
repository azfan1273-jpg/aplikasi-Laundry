// ==========================================
// KELOLA PROFIL TOKO & SETTING OWNER
// ==========================================

async function loadSettingsToForm() {
  if (!currentToko) return;

  const namaTokoInput = document.getElementById('setting_nama_toko');
  const alamatInput = document.getElementById('setting_alamat_toko');
  const noHpInput = document.getElementById('setting_nohp_toko');

  if (namaTokoInput) namaTokoInput.value = currentToko.nama_toko || '';
  if (alamatInput) alamatInput.value = currentToko.alamat || '';
  if (noHpInput) noHpInput.value = currentToko.no_hp || '';
}

async function simpanProfilDanPassOwner() {
  const namaTokoInput = document.getElementById('setting_nama_toko');
  const alamatInput = document.getElementById('setting_alamat_toko');
  const noHpInput = document.getElementById('setting_nohp_toko');
  const passInput = document.getElementById('edit_owner_pass');

  const namaToko = namaTokoInput ? namaTokoInput.value.trim() : '';
  const alamat = alamatInput ? alamatInput.value.trim() : '';
  const noHp = noHpInput ? noHpInput.value.trim() : '';
  const newPass = passInput ? passInput.value.trim() : '';

  if (!currentToko || !supabaseClient) {
    if (typeof showToast === 'function') showToast("Data toko belum siap!", "error");
    return;
  }

  try {
    // 1. Update Profile Toko
    const { error: tokoErr } = await supabaseClient
      .from('toko')
      .update({
        nama_toko: namaToko,
        alamat: alamat,
        no_hp: noHp
      })
      .eq('id', currentToko.id);

    if (tokoErr) {
      if (typeof showToast === 'function') showToast("Gagal simpan toko: " + tokoErr.message, "error");
      return;
    }

    currentToko.nama_toko = namaToko;
    currentToko.alamat = alamat;
    currentToko.no_hp = noHp;

    const topbarToko = document.getElementById('topbar-nama-toko');
    if (topbarToko) topbarToko.innerText = namaToko || 'LNDR';

    // 2. Update Password Owner jika diisi
    if (newPass) {
      if (newPass.length < 6) {
        if (typeof showToast === 'function') showToast("Password minimal 6 karakter!", "error");
        return;
      }

      const { error: passErr } = await supabaseClient.auth.updateUser({ password: newPass });
      if (passErr) {
        if (typeof showToast === 'function') showToast("Gagal ubah pass: " + passErr.message, "error");
        return;
      }
      if (passInput) passInput.value = '';
    }

    if (typeof showToast === 'function') showToast("Pengaturan profil berhasil disimpan! 🎉", "success");

  } catch (err) {
    if (typeof showToast === 'function') showToast("Terjadi kesalahan: " + err.message, "error");
  }
}

// ==========================================
// KELOLA DAFTAR KASIR & HAK AKSES
// ==========================================

async function loadDaftarKasirList() {
  const container = document.getElementById('list-kasir-container');
  if (!container) return;

  if (!currentToko || !supabaseClient) {
    container.innerHTML = '<p class="text-xs text-slate-400 text-center py-2">Memuat data toko...</p>';
    return;
  }

  try {
    const { data: kasirList, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('toko_id', currentToko.id)
      .eq('role', 'kasir');

    if (error || !kasirList || kasirList.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-400 text-center py-2">Belum ada akun kasir terdaftar.</p>';
      return;
    }

    container.innerHTML = kasirList.map(k => `
      <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
        <div>
          <p class="font-extrabold text-slate-800">${k.nama_user || 'Kasir'}</p>
          <p class="text-[10px] text-slate-400">${k.email || ''}</p>
        </div>
        <button onclick="hapusAkunKasir('${k.id}')" class="text-rose-500 font-bold text-xs hover:underline bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">Hapus</button>
      </div>
    `).join('');

  } catch (err) {
    console.error("Error loadDaftarKasirList:", err);
  }
}

async function tambahKasirBaru() {
  const emailInput = document.getElementById('new_kasir_email');
  const passInput = document.getElementById('new_kasir_pass');
  const namaInput = document.getElementById('new_kasir_nama');

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value.trim() : '';
  const nama = namaInput ? namaInput.value.trim() : '';

  if (!email || !password || !nama) {
    if (typeof showToast === 'function') showToast("Isi nama, email, dan password kasir!", "error");
    return;
  }

  if (!currentToko || !supabaseClient) {
    if (typeof showToast === 'function') showToast("Data toko belum siap!", "error");
    return;
  }

  try {
    // 1. Panggil API SignUp Supabase
    const { data: authData, error: authErr } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          toko_id: currentToko.id,
          role: 'kasir',
          nama_user: nama
        }
      }
    });

    if (authErr) {
      if (typeof showToast === 'function') showToast("Gagal: " + authErr.message, "error");
      return;
    }

    // 2. Insert Manual ke Tabel Profiles sebagai cadangan
    if (authData && authData.user) {
      await supabaseClient.from('profiles').insert([{
        id: authData.user.id,
        toko_id: currentToko.id,
        role: 'kasir',
        nama_user: nama,
        email: email
      }]);
    }

    if (typeof showToast === 'function') showToast("Akun kasir berhasil dibuat! 🎉", "success");

    // Reset Form
    if (emailInput) emailInput.value = '';
    if (passInput) passInput.value = '';
    if (namaInput) namaInput.value = '';

    await loadDaftarKasirList();

  } catch (err) {
    console.error("Error tambahKasirBaru:", err);
    if (typeof showToast === 'function') showToast("Terjadi kesalahan sistem.", "error");
  }
}

async function hapusAkunKasir(kasirId) {
  if (!confirm("Apakah Anda yakin ingin menghapus akun kasir ini?")) return;

  if (!supabaseClient) return;

  try {
    const { error } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', kasirId);

    if (error) {
      if (typeof showToast === 'function') showToast("Gagal menghapus kasir: " + error.message, "error");
      return;
    }

    if (typeof showToast === 'function') showToast("Akun kasir berhasil dihapus.", "info");
    await loadDaftarKasirList();

  } catch (err) {
    if (typeof showToast === 'function') showToast("Terjadi kesalahan: " + err.message, "error");
  }
}

// ==========================================
// SWITCH HAK AKSES PERMISSIONS TOKO
// ==========================================

async function loadPermissionSwitches() {
  if (!currentToko) return;

  let perms = currentToko.permissions || {};
  if (typeof perms === 'string') {
    try { perms = JSON.parse(perms); } catch (e) { perms = {}; }
  }

  const switchManager = document.getElementById('switch_perm_manager');
  const switchLaporan = document.getElementById('switch_perm_laporan');
  const switchLayanan = document.getElementById('switch_perm_layanan');
  const switchPengeluaran = document.getElementById('switch_perm_pengeluaran');
  const switchEditOrder = document.getElementById('switch_perm_edit_order');

  if (switchManager) switchManager.checked = !!perms.is_manager;
  if (switchLaporan) switchLaporan.checked = !!perms.akses_laporan;
  if (switchLayanan) switchLayanan.checked = !!perms.akses_layanan;
  if (switchPengeluaran) switchPengeluaran.checked = !!perms.akses_pengeluaran;
  if (switchEditOrder) switchEditOrder.checked = !!perms.akses_edit_order;
}

async function simpanPermissionsToko() {
  if (!currentToko || !supabaseClient) return;

  const switchManager = document.getElementById('switch_perm_manager');
  const switchLaporan = document.getElementById('switch_perm_laporan');
  const switchLayanan = document.getElementById('switch_perm_layanan');
  const switchPengeluaran = document.getElementById('switch_perm_pengeluaran');
  const switchEditOrder = document.getElementById('switch_perm_edit_order');

  const permissionsData = {
    is_manager: switchManager ? switchManager.checked : false,
    akses_laporan: switchLaporan ? switchLaporan.checked : false,
    akses_layanan: switchLayanan ? switchLayanan.checked : false,
    akses_pengeluaran: switchPengeluaran ? switchPengeluaran.checked : false,
    akses_edit_order: switchEditOrder ? switchEditOrder.checked : false
  };

  try {
    const { error } = await supabaseClient
      .from('toko')
      .update({ permissions: permissionsData })
      .eq('id', currentToko.id);

    if (error) {
      if (typeof showToast === 'function') showToast("Gagal update izin: " + error.message, "error");
      return;
    }

    currentToko.permissions = permissionsData;
    if (typeof applyUserPermissionsUI === 'function') applyUserPermissionsUI();
    if (typeof showToast === 'function') showToast("Izin akses kasir berhasil diperbarui! 🔐", "success");

  } catch (err) {
    if (typeof showToast === 'function') showToast("Terjadi kesalahan: " + err.message, "error");
  }
}

// ==========================================
// KELOLA LAYANAN & HARGA (DASHBOARD/MODAL)
// ==========================================

async function renderKelolaLayananList() {
  const container = document.getElementById('list-kelola-layanan-container');
  if (!container) return;

  if (typeof supabaseClient === 'undefined' || !supabaseClient) {
    container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">Sistem belum siap...</p>';
    return;
  }

  // Tentukan toko_id secara fleksibel (CurrentToko ATAU Profile)
  const tokoId = (currentToko && currentToko.id) ? currentToko.id : (currentUserProfile ? currentUserProfile.toko_id : null);

  if (!tokoId) {
    container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">Memuat data toko...</p>';
    return;
  }

  container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">Memuat daftar layanan...</p>';

  try {
    const { data: layananList, error } = await supabaseClient
      .from('layanan')
      .select('*')
      .eq('toko_id', tokoId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetch layanan:", error);
      container.innerHTML = '<p class="text-xs text-rose-500 text-center py-4">Gagal memuat layanan.</p>';
      return;
    }

    if (!layananList || layananList.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">Belum ada layanan terdaftar.</p>';
      return;
    }

    container.innerHTML = layananList.map(l => `
      <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
        <div>
          <p class="font-extrabold text-slate-800">${l.nama_layanan || 'Layanan'}</p>
          <p class="text-[10px] text-slate-400">Rp ${Number(l.harga || 0).toLocaleString()} / ${l.satuan || 'Kg'} (${l.estimasi_hari || 1} Hari)</p>
        </div>
        <button onclick="hapusLayanan('${l.id}')" class="text-rose-500 font-bold text-xs hover:underline bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">Hapus</button>
      </div>
    `).join('');

  } catch (err) {
    console.error("Error renderKelolaLayananList:", err);
    container.innerHTML = '<p class="text-xs text-rose-500 text-center py-4">Terjadi kesalahan sistem.</p>';
  }
}

async function tambahLayananBaru() {
  const namaInput = document.getElementById('new_nama_layanan');
  const hargaInput = document.getElementById('new_harga_layanan');
  const satuanInput = document.getElementById('new_satuan_layanan');
  const estimasiInput = document.getElementById('new_estimasi_hari');

  const nama = namaInput ? namaInput.value.trim() : '';
  const harga = hargaInput ? parseFloat(hargaInput.value) : 0;
  const satuan = satuanInput ? satuanInput.value : 'Kg';
  const estimasi = estimasiInput ? parseFloat(estimasiInput.value) : 1;

  if (!nama || isNaN(harga) || harga <= 0) {
    if (typeof showToast === 'function') showToast("Isi nama dan harga layanan dengan benar!", "error");
    return;
  }

  const tokoId = (currentToko && currentToko.id) ? currentToko.id : (currentUserProfile ? currentUserProfile.toko_id : null);

  if (!tokoId || !supabaseClient) {
    if (typeof showToast === 'function') showToast("Data toko tidak ditemukan!", "error");
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('layanan')
      .insert([{
        toko_id: tokoId,
        nama_layanan: nama,
        harga: harga,
        satuan: satuan,
        estimasi_hari: estimasi
      }]);

    if (error) {
      if (typeof showToast === 'function') showToast("Gagal menambah layanan: " + error.message, "error");
      return;
    }

    if (typeof showToast === 'function') showToast("Layanan baru berhasil ditambahkan! 🎉", "success");
    
    if (namaInput) namaInput.value = '';
    if (hargaInput) hargaInput.value = '';
    if (estimasiInput) estimasiInput.value = '';

    await renderKelolaLayananList();

  } catch (err) {
    if (typeof showToast === 'function') showToast("Terjadi kesalahan: " + err.message, "error");
  }
}

async function hapusLayanan(idLayanan) {
  if (!confirm("Apakah Anda yakin ingin menghapus layanan ini?")) return;

  if (!supabaseClient) return;

  try {
    const { error } = await supabaseClient
      .from('layanan')
      .delete()
      .eq('id', idLayanan);

    if (error) {
      if (typeof showToast === 'function') showToast("Gagal menghapus layanan: " + error.message, "error");
      return;
    }

    if (typeof showToast === 'function') showToast("Layanan berhasil dihapus.", "info");
    await renderKelolaLayananList();

  } catch (err) {
    if (typeof showToast === 'function') showToast("Terjadi kesalahan: " + err.message, "error");
  }
}