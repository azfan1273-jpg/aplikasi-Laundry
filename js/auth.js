// ==========================================
// STATE AKUN & PROFILE GLOBAL
// ==========================================
let currentUserProfile = null;
let currentToko = null;
let isRegisterMode = false;

// ==========================================
// CEK SESSION SAAT APLIKASI PERTAMA DIKLIKS
// ==========================================
async function checkUserSession() {
  if (!supabaseClient) return;

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session && session.user) {
      await loadUserProfile(session.user);
    } else {
      showAuthScreen(true);
    }
  } catch (err) {
    console.error("Error checkUserSession:", err);
    showAuthScreen(true);
  }
}

async function loadUserProfile(authUser) {
  try {
    // 1. Tarik data Profile
    const { data: profile, error: profErr } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profErr || !profile) {
      console.warn("Profile tidak ditemukan, mencoba ulang...");
      showAuthScreen(true);
      return;
    }

    currentUserProfile = profile;

    // 2. Tarik data Toko berdasarkan toko_id di profile
    if (profile.toko_id) {
      const { data: toko, error: tokoErr } = await supabaseClient
        .from('toko')
        .select('*')
        .eq('id', profile.toko_id)
        .single();

      if (!tokoErr && toko) {
        currentToko = toko;
      }
    }

    // Update Tampilan Topbar & UI
    const topbarEmail = document.getElementById('topbar-user-email');
    const topbarToko = document.getElementById('topbar-nama-toko');
    const settingEmail = document.getElementById('setting-user-email');

    if (topbarEmail) topbarEmail.innerText = authUser.email;
    if (settingEmail) settingEmail.innerText = authUser.email;
    if (topbarToko && currentToko) topbarToko.innerText = currentToko.nama_toko || 'LNDR';

    showAuthScreen(false);
    applyUserPermissionsUI();

    // Load data awal dashboard
    if (typeof loadDataHome === 'function') loadDataHome();
    if (typeof loadSettingsToForm === 'function') loadSettingsToForm();

  } catch (err) {
    console.error("Error loadUserProfile:", err);
    showAuthScreen(true);
  }
}

// ==========================================
// KONTROL TAMPILAN SCREEN LOGIN / REGISTER
// ==========================================
function showAuthScreen(show) {
  const authScreen = document.getElementById('auth-screen');
  if (authScreen) {
    if (show) {
      authScreen.classList.remove('hidden');
    } else {
      authScreen.classList.add('hidden');
    }
  }
}

function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  const containerNamaToko = document.getElementById('container_nama_toko');
  const btnAuthSubmit = document.getElementById('btn-auth-submit');
  const btnToggleAuth = document.getElementById('btn-toggle-auth');
  const authSubtitle = document.getElementById('auth-subtitle');
  const btnForgotPass = document.getElementById('btn-forgot-pass');

  if (isRegisterMode) {
    if (containerNamaToko) containerNamaToko.classList.remove('hidden');
    if (btnAuthSubmit) btnAuthSubmit.innerText = 'DAFTAR TOKO BARU';
    if (btnToggleAuth) btnToggleAuth.innerText = 'Sudah punya akun? Log In Kasir/Owner';
    if (authSubtitle) authSubtitle.innerText = 'Daftarkan Toko Laundry Anda';
    if (btnForgotPass) btnForgotPass.classList.add('hidden');
  } else {
    if (containerNamaToko) containerNamaToko.classList.add('hidden');
    if (btnAuthSubmit) btnAuthSubmit.innerText = 'LOG IN';
    if (btnToggleAuth) btnToggleAuth.innerText = 'Belum punya akun? Daftar Toko Baru (Owner)';
    if (authSubtitle) authSubtitle.innerText = 'Masuk ke akun LNDR Anda';
    if (btnForgotPass) btnForgotPass.classList.remove('hidden');
  }
}

// ==========================================
// SUBMIT AUTH (LOGIN / REGISTER OWNER)
// ==========================================
async function handleAuthSubmit() {
  const emailInput = document.getElementById('auth_email');
  const passInput = document.getElementById('auth_password');
  const namaTokoInput = document.getElementById('auth_nama_toko');

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value.trim() : '';
  const namaToko = namaTokoInput ? namaTokoInput.value.trim() : '';

  if (!email || !password) {
    showToast("Isi email dan password!", "error");
    return;
  }

  if (isRegisterMode) {
    // REGISTRASI OWNER & TOKO BARU
    if (!namaToko) {
      showToast("Isi Nama Toko Laundry Anda!", "error");
      return;
    }

    try {
      // 1. Buat Toko Baru di database
      const { data: newToko, error: tokoErr } = await supabaseClient
        .from('toko')
        .insert([{ 
          nama_toko: namaToko,
          permissions: {
            akses_laporan: true,
            akses_layanan: true,
            akses_pengeluaran: true,
            akses_edit_order: true,
            is_manager: true
          }
        }])
        .select()
        .single();

      if (tokoErr) {
        showToast("Gagal membuat toko: " + tokoErr.message, "error");
        return;
      }

      // 2. SignUp User Owner ke Auth Supabase dengan metadata
      const { data: authData, error: authErr } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            toko_id: newToko.id,
            role: 'owner',
            nama_user: 'Owner ' + namaToko
          }
        }
      });

      if (authErr) {
        showToast("Gagal mendaftar: " + authErr.message, "error");
        return;
      }

      showToast("Pendaftaran Toko Berhasil! Silahkan Login. 🎉", "success");
      toggleAuthMode();

    } catch (err) {
      showToast("Terjadi kesalahan: " + err.message, "error");
    }

  } else {
    // LOGIN KASIR / OWNER
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        showToast("Login gagal: " + error.message, "error");
        return;
      }

      showToast("Login Berhasil! Selamat Datang. 👋", "success");
      await loadUserProfile(data.user);

    } catch (err) {
      showToast("Terjadi kesalahan: " + err.message, "error");
    }
  }
}

// ==========================================
// LOGOUT AKUN
// ==========================================
async function handleLogout() {
  if (confirm("Apakah Anda yakin ingin keluar dari akun ini?")) {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    currentUserProfile = null;
    currentToko = null;
    showAuthScreen(true);
    showToast("Anda telah keluar.", "info");
  }
}

// ==========================================
// MODAL & HANDLER RESET PASSWORD
// ==========================================
function openModalLupaPassword() {
  const modal = document.getElementById('modal-lupa-password');
  if (modal) modal.classList.remove('hidden');
}

async function handleKirimResetPassword() {
  const emailInput = document.getElementById('forgot_email_input');
  const email = emailInput ? emailInput.value.trim() : '';

  if (!email) {
    showToast("Masukkan email Anda!", "error");
    return;
  }

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
  if (!error) {
    showToast("Link reset password telah dikirim ke email Anda! 📩", "success");
    closeModalWithHistory('modal-lupa-password');
  } else {
    showToast("Gagal mengirim link: " + error.message, "error");
  }
}

async function handleSaveNewPassword() {
  const passInput = document.getElementById('new_reset_password');
  const newPassword = passInput ? passInput.value.trim() : '';

  if (!newPassword || newPassword.length < 6) {
    showToast("Password minimal 6 karakter!", "error");
    return;
  }

  const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
  if (!error) {
    showToast("Password berhasil diperbarui! Silahkan login.", "success");
    const modal = document.getElementById('modal-update-password');
    if (modal) modal.classList.add('hidden');
    handleLogout();
  } else {
    showToast("Gagal memperbarui password: " + error.message, "error");
  }
}

// ==========================================
// GET PERMISSIONS TOKO SECARA AMAN
// ==========================================
function getTokoPermissions() {
  if (currentToko && currentToko.permissions) {
    let p = currentToko.permissions;
    if (typeof p === 'string') {
      try { p = JSON.parse(p); } catch (e) { p = {}; }
    }
    return {
      akses_laporan: !!p.akses_laporan,
      akses_layanan: !!p.akses_layanan,
      akses_pengeluaran: !!p.akses_pengeluaran,
      akses_edit_order: !!p.akses_edit_order,
      is_manager: !!p.is_manager
    };
  }
  return {
    akses_laporan: false,
    akses_layanan: false,
    akses_pengeluaran: false,
    akses_edit_order: false,
    is_manager: false
  };
}

// ==========================================
// TERAPKAN IZIN AKSES UI (OWNER VS KASIR)
// ==========================================
function applyUserPermissionsUI() {
  if (!currentUserProfile) return;

  const isOwner = currentUserProfile.role === 'owner';
  const roleBadge = document.getElementById('topbar-role-badge');
  const settingRoleBadge = document.getElementById('setting-role-badge');

  if (roleBadge) roleBadge.innerText = isOwner ? 'Owner' : 'Kasir';
  if (settingRoleBadge) settingRoleBadge.innerText = isOwner ? 'Owner' : 'Kasir';

  const perms = getTokoPermissions();

  const ownerSectionLayanan = document.getElementById('setting-owner-layanan');
  const ownerSectionKasir = document.getElementById('setting-owner-kasir');
  const fabPengeluaran = document.getElementById('fab-btn-pengeluaran');
  const navReport = document.getElementById('nav-report');

  if (!isOwner) {
    // Sembunyikan Kelola Kasir dari Kasir
    if (ownerSectionKasir) ownerSectionKasir.style.display = 'none';

    // Jika Manager = Buka Semua, jika Bukan = Cek per-fitur
    const canLaporan = perms.is_manager || perms.akses_laporan;
    const canLayanan = perms.is_manager || perms.akses_layanan;
    const canPengeluaran = perms.is_manager || perms.akses_pengeluaran;

    if (ownerSectionLayanan) ownerSectionLayanan.style.display = canLayanan ? 'flex' : 'none';
    if (fabPengeluaran) fabPengeluaran.style.display = canPengeluaran ? 'flex' : 'none';
    if (navReport) navReport.style.display = canLaporan ? 'flex' : 'none';
  } else {
    // Owner Akses Penuh
    if (ownerSectionLayanan) ownerSectionLayanan.style.display = 'flex';
    if (ownerSectionKasir) ownerSectionKasir.style.display = 'flex';
    if (fabPengeluaran) fabPengeluaran.style.display = 'flex';
    if (navReport) navReport.style.display = 'flex';
  }
}

// ==========================================
// REFRESH MANUAL REALTIME (SYC PERMISSION & DATA)
// ==========================================
async function triggerManualRefresh() {
  const icon = document.getElementById('refresh-icon');
  if (icon) icon.classList.add('spinning');

  try {
    if (typeof supabaseClient !== 'undefined' && supabaseClient && currentUserProfile) {
      // 1. Refresh Profile User
      const { data: profData } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', currentUserProfile.id)
        .single();
      
      if (profData) currentUserProfile = profData;

      // 2. Refresh Data Toko & Permissions
      if (currentUserProfile && currentUserProfile.toko_id) {
        const { data: tokoData } = await supabaseClient
          .from('toko')
          .select('*')
          .eq('id', currentUserProfile.toko_id)
          .single();

        if (tokoData) {
          currentToko = tokoData;
          applyUserPermissionsUI();
        }
      }
    }

    // 3. Reload Data Dashboard Home
    if (typeof loadDataHome === 'function') {
      await loadDataHome();
    }

    showToast("Data & Izin Akses Berhasil Diperbarui! 🔄", "info");
  } catch (err) {
    console.error("Error refresh:", err);
    showToast("Gagal memperbarui data.", "error");
  } finally {
    // PASTI DIPANGGIL: Matikan animasi muter dalam kondisi apapun!
    if (icon) {
      setTimeout(() => {
        icon.classList.remove('spinning');
      }, 500);
    }
  }
}