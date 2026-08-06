// LOGIKA AUTENTIKASI SUPABASE (LOGIN / REGISTER OWNER & KASIR)
function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  const btnSubmit = document.getElementById('btn-auth-submit');
  const btnToggle = document.getElementById('btn-toggle-auth');
  const subTitle = document.getElementById('auth-subtitle');
  const containerNamaToko = document.getElementById('container_nama_toko');
  const btnForgot = document.getElementById('btn-forgot-pass');

  if(isRegisterMode) {
    btnSubmit.innerText = "DAFTAR TOKO BARU (OWNER)";
    btnToggle.innerText = "Sudah punya akun? Login Kasir / Owner";
    subTitle.innerText = "Daftar sebagai Pemilik Toko Laundry Baru";
    containerNamaToko.classList.remove('hidden');
    if(btnForgot) btnForgot.classList.add('hidden');
  } else {
    btnSubmit.innerText = "LOG IN";
    btnToggle.innerText = "Belum punya akun? Daftar Toko Baru (Owner)";
    subTitle.innerText = "Masuk ke akun LNDR Anda";
    containerNamaToko.classList.add('hidden');
    if(btnForgot) btnForgot.classList.remove('hidden');
  }
}

async function handleAuthSubmit() {
  const email = document.getElementById('auth_email').value;
  const password = document.getElementById('auth_password').value;

  if(!email || !password) {
    showToast("Isi email dan password terlebih dahulu!", "error");
    return;
  }

  if(isRegisterMode) {
    const namaToko = document.getElementById('auth_nama_toko').value || 'LNDR Toko';
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    
    if(error) {
      showToast("Gagal Daftar: " + error.message, "error");
    } else if (data && data.user) {
      const resToko = await supabaseClient.from('toko').insert([{ 
        owner_id: data.user.id, 
        nama_toko: namaToko,
        permissions: {
          akses_laporan: false,
          akses_layanan: false,
          akses_pengeluaran: false,
          akses_edit_order: false,
          is_manager: false
        }
      }]).select().single();

      if(resToko.data) {
        await supabaseClient.from('profiles').upsert([{ id: data.user.id, toko_id: resToko.data.id, role: 'owner', nama_user: 'Owner' }]);
      }
      showToast("Pendaftaran Toko Berhasil! Otomatis masuk...", "success");
      setTimeout(() => checkUserSession(), 1000);
    }
  } else {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if(error) {
      showToast("Gagal Login: " + error.message, "error");
    } else {
      showToast("Login Berhasil! Selamat bekerja! 👋", "success");
      checkUserSession();
    }
  }
}

function openModalLupaPassword() {
  document.getElementById('forgot_email_input').value = document.getElementById('auth_email').value || '';
  openModalWithHistory('modal-lupa-password');
}

async function handleKirimResetPassword() {
  const email = document.getElementById('forgot_email_input').value;
  if (!email) { showToast("Masukkan email Anda terlebih dahulu!", "error"); return; }

  const redirectUrl = window.location.origin + window.location.pathname;
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });

  if (error) showToast("Gagal mengirim email reset: " + error.message, "error");
  else {
    showToast("Link reset password berhasil dikirim ke email!", "success");
    closeModalWithHistory('modal-lupa-password');
  }
}

async function handleSaveNewPassword() {
  const newPassword = document.getElementById('new_reset_password').value;
  if (!newPassword || newPassword.length < 6) { showToast("Password minimal 6 karakter!", "error"); return; }

  const { error } = await supabaseClient.auth.updateUser({ password: newPassword });

  if (error) showToast("Gagal memperbarui password: " + error.message, "error");
  else {
    showToast("Password berhasil diubah! Silahkan login kembali.", "success");
    document.getElementById('modal-update-password').classList.add('hidden');
    await supabaseClient.auth.signOut();
    checkUserSession();
  }
}

async function handleLogout() {
  if(confirm("Apakah Anda yakin ingin keluar dari akun ini?")) {
    await supabaseClient.auth.signOut();
    currentUser = null; currentProfile = null; currentToko = null;
    document.getElementById('auth-screen').classList.remove('hidden');
    showToast("Berhasil logout.", "info");
  }
}

// UPDATE DYNAMIC ROLE PERMISSIONS ACCORDING TO OWNER & KASIR
function applyUserPermissionsUI() {
  if (!currentUserProfile) return;

  const isOwner = currentUserProfile.role === 'owner';
  const roleBadge = document.getElementById('topbar-role-badge');
  const settingRoleBadge = document.getElementById('setting-role-badge');

  if (roleBadge) roleBadge.innerText = isOwner ? 'Owner' : 'Kasir';
  if (settingRoleBadge) settingRoleBadge.innerText = isOwner ? 'Owner' : 'Kasir';

  // Dapatkan permissions terbaru
  const perms = getTokoPermissions();

  const ownerSectionLayanan = document.getElementById('setting-owner-layanan');
  const ownerSectionKasir = document.getElementById('setting-owner-kasir');
  const fabPengeluaran = document.getElementById('fab-btn-pengeluaran');
  const navReport = document.getElementById('nav-report');

  if (!isOwner) {
    // Sembunyikan Kelola Kasir dari Kasir
    if (ownerSectionKasir) ownerSectionKasir.style.display = 'none';

    // Jika BUKAN Manager, cek izin satu per satu
    if (!perms.is_manager) {
      if (ownerSectionLayanan) ownerSectionLayanan.style.display = perms.akses_layanan ? 'flex' : 'none';
      if (fabPengeluaran) fabPengeluaran.style.display = perms.akses_pengeluaran ? 'flex' : 'none';
      if (navReport) navReport.style.display = perms.akses_laporan ? 'flex' : 'none';
    } else {
      // Jika dijadikan Manager, tampilkan semua
      if (ownerSectionLayanan) ownerSectionLayanan.style.display = 'flex';
      if (fabPengeluaran) fabPengeluaran.style.display = 'flex';
      if (navReport) navReport.style.display = 'flex';
    }
  } else {
    // Owner punya akses ke seluruh fitur
    if (ownerSectionLayanan) ownerSectionLayanan.style.display = 'flex';
    if (ownerSectionKasir) ownerSectionKasir.style.display = 'flex';
    if (fabPengeluaran) fabPengeluaran.style.display = 'flex';
    if (navReport) navReport.style.display = 'flex';
  }
}

async function checkUserSession() {
  if(!supabaseClient) return;

  if (window.location.hash && window.location.hash.includes('type=recovery')) {
    document.getElementById('modal-update-password').classList.remove('hidden');
  }

  const { data: { session } } = await supabaseClient.auth.getSession();

  if(session && session.user) {
    currentUser = session.user;
    
    let resProf = await supabaseClient
      .from('profiles')
      .select('*, toko:toko_id(*)')
      .eq('id', currentUser.id)
      .maybeSingle();
    
    if (!resProf.data) {
      await supabaseClient.auth.signOut();
      currentUser = null; currentProfile = null; currentToko = null;
      document.getElementById('auth-screen').classList.remove('hidden');
      showToast("Akun tidak ditemukan di server. Silahkan login kembali.", "error");
      return;
    }

    currentProfile = resProf.data;
    currentToko = resProf.data.toko;

    document.getElementById('auth-screen').classList.add('hidden');
    
    var nmToko = currentToko ? currentToko.nama_toko : 'LNDR';
    var role = currentProfile ? currentProfile.role : 'owner';

    document.getElementById('topbar-nama-toko').innerText = nmToko;
    document.getElementById('topbar-user-email').innerText = currentUser.email;
    document.getElementById('setting-user-email').innerText = currentUser.email;
    
    var badgeText = role === 'kasir' ? 'Kasir' : 'Owner';
    document.getElementById('topbar-role-badge').innerText = badgeText;
    document.getElementById('setting-role-badge').innerText = badgeText;

    applyUserPermissionsUI();

    if (role === 'owner') {
      loadDaftarKasirList();
      loadPermissionSwitches();
      loadSettingsToForm();
    }

    if(currentToko) {
      supabaseClient
        .channel('realtime_toko_perm_' + currentToko.id)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'toko', 
          filter: 'id=eq.' + currentToko.id 
        }, payload => {
          if(payload.new) {
            currentToko = payload.new;
            applyUserPermissionsUI();
            if(role === 'kasir') {
              showToast("Hak akses Anda diperbarui oleh Owner! ⚡", "info");
            }
          }
        })
        .subscribe();
    }

    loadDataHome();
    preloadLayanan();
  } else {
    currentUser = null; currentProfile = null; currentToko = null;
    document.getElementById('auth-screen').classList.remove('hidden');
  }
}
// ==========================================
// REFRESH MANUAL UNTUK SYNC PERMISSION REALTIME
// ==========================================
async function triggerManualRefresh() {
  const icon = document.getElementById('refresh-icon');
  if (icon) icon.classList.add('spinning');

  try {
    if (typeof supabaseClient !== 'undefined' && supabaseClient && currentUserProfile) {
      // Pull data toko terbaru dari Supabase untuk update izin/permissions
      const { data: tokoData } = await supabaseClient
        .from('toko')
        .select('*')
        .eq('id', currentUserProfile.toko_id)
        .single();

      if (tokoData) {
        currentToko = tokoData;
        
        // Terapkan ulang sembunyi/tampil tombol sesuai izin terbaru
        if (typeof applyUserPermissionsUI === 'function') {
          applyUserPermissionsUI();
        }
      }
    }

    // Reload data halaman
    if (typeof loadDataHome === 'function') {
      await loadDataHome();
    }

    showToast("Data & Izin Akses diperbarui! 🔄", "info");
  } catch (err) {
    console.error("Error refresh:", err);
  } finally {
    if (icon) {
      setTimeout(() => icon.classList.remove('spinning'), 600);
    }
  }
}