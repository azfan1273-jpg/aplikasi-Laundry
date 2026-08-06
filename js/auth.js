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
  if (!currentProfile) return;

  var role = currentProfile.role;
  var perms = getTokoPermissions();

  var isManagerOrOwner = (role === 'owner') || perms.is_manager;

  var canReport = isManagerOrOwner || perms.akses_laporan;
  var canLayanan = isManagerOrOwner || perms.akses_layanan;
  var canPengeluaran = isManagerOrOwner || perms.akses_pengeluaran;

  const navReportBtn = document.getElementById('nav-report');
  const settingLayanan = document.getElementById('setting-owner-layanan');
  const settingKasir = document.getElementById('setting-owner-kasir');
  const fabPengeluaran = document.getElementById('fab-btn-pengeluaran');

  if (role === 'kasir') {
    if (navReportBtn) navReportBtn.style.display = canReport ? 'flex' : 'none';
    if (settingLayanan) settingLayanan.style.display = canLayanan ? 'flex' : 'none';
    if (settingKasir) settingKasir.style.display = 'none';
    if (fabPengeluaran) fabPengeluaran.style.display = canPengeluaran ? 'flex' : 'none';

    if (currentActiveTab === 'report' && !canReport) {
      switchTab('home');
      showToast("Akses Laporan dikunci oleh Owner!", "error");
    }

    const topbarHeader = document.getElementById('topbar-header-click');
    if (topbarHeader) {
      topbarHeader.onclick = function() { showToast("Akses Analitik dikunci khusus Owner!", "error"); };
    }
  } else {
    if (navReportBtn) navReportBtn.style.display = 'flex';
    if (settingLayanan) settingLayanan.style.display = 'flex';
    if (settingKasir) settingKasir.style.display = 'flex';
    if (fabPengeluaran) fabPengeluaran.style.display = 'flex';

    const topbarHeader = document.getElementById('topbar-header-click');
    if (topbarHeader) {
      topbarHeader.onclick = function() { openModalJendelaAkunWithChart(); };
    }
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