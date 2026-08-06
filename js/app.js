// ==========================================
// FILE: js/app.js (Bagian Proteksi Kasir)
// ==========================================

// 1. MEMBUKA MODAL KELOLA AKUN & ANALITIK (DENGAN CEK HAK AKSES KASIR)
async function openModalJendelaAkunWithChart() {
  try {
    // Cek apakah user yang login adalah kasir
    let userRole = localStorage.getItem('user_role');
    
    // Jika role belum ada di localStorage, cek dari Supabase Auth / Tabel Profiles
    if (!userRole && typeof supabaseClient !== 'undefined') {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile) {
          userRole = profile.role;
          localStorage.setItem('user_role', userRole);
        }
      }
    }

    // JIKA KASIR, TOLAK AKSES KE KELOLA AKUN
    if (userRole === 'kasir') {
      if (typeof showToast === 'function') {
        showToast('Akses Ditolak: Menu Kelola Akun khusus Owner/Admin!', 'error');
      } else {
        alert('Akses Ditolak: Menu Kelola Akun khusus Owner/Admin!');
      }
      return; // Batalkan pembukaan modal
    }

    // JIKA OWNER / ADMIN, LANJUTKAN BUKA MODAL
    const modal = document.getElementById('modal-jendela-akun');
    if (!modal) return;

    modal.classList.remove('hidden');

    const accountModalEmail = document.getElementById('account-modal-email');
    const topbarEmail = document.getElementById('topbar-user-email');
    const settingEmail = document.getElementById('setting-user-email');

    let activeEmail = '';
    if (topbarEmail && topbarEmail.textContent && topbarEmail.textContent !== 'Memuat akun...') {
      activeEmail = topbarEmail.textContent;
    } else if (settingEmail && settingEmail.textContent && settingEmail.textContent !== 'Memuat...') {
      activeEmail = settingEmail.textContent;
    }

    if (accountModalEmail && activeEmail) {
      accountModalEmail.textContent = activeEmail;
    }

    if (typeof renderTrafficChart === 'function') {
      try { renderTrafficChart(); } catch (err) { console.log(err); }
    }

  } catch (err) {
    console.error('Error cek akses kasir:', err);
  }
}

// 2. MEMBUKA MODAL KELOLA LAYANAN
function openModalKelolaLayanan() {
  const modal = document.getElementById('modal-kelola-layanan');
  if (modal) {
    modal.classList.remove('hidden');
    if (typeof renderKelolaLayananList === 'function') {
      try {
        renderKelolaLayananList();
      } catch (err) {
        console.log('Error render kelola layanan:', err);
      }
    }
  }
}

// 3. FUNGSI MENUTUP MODAL (AMAN)
function closeModalWithHistory(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
  }
}

function closeOnBackdrop(event, modalId) {
  if (event && event.target && event.target.id === modalId) {
    closeModalWithHistory(modalId);
  }
}

// 4. ANIMASI TOGGLE TOMBOL FAB (+) MELAYANG KE ATAS
function toggleFabMenu() {
  const backdrop = document.getElementById('fab-backdrop');
  const sideMenu = document.getElementById('fab-side-menu');
  const icon = document.getElementById('fab-icon');

  if (!sideMenu) return;

  const isHidden = sideMenu.classList.contains('opacity-0') || sideMenu.classList.contains('pointer-events-none');

  if (isHidden) {
    // BUKA MENU
    sideMenu.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
    sideMenu.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');

    if (backdrop) {
      backdrop.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      backdrop.classList.add('opacity-100', 'pointer-events-auto');
    }

    if (icon) icon.style.transform = 'rotate(45deg)';
  } else {
    // TUTUP MENU
    sideMenu.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
    sideMenu.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');

    if (backdrop) {
      backdrop.classList.add('hidden', 'opacity-0', 'pointer-events-none');
      backdrop.classList.remove('opacity-100', 'pointer-events-auto');
    }

    if (icon) icon.style.transform = 'rotate(0deg)';
  }
}

// 5. NAVIGASI TAB UTAMA (BERANDA, ORDER, REPORT, SETTING)
function switchTab(tabName) {
  const sections = document.querySelectorAll('.page-section');
  sections.forEach(sec => sec.classList.remove('active'));

  const targetSection = document.getElementById(`panel-${tabName}`);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.classList.remove('text-blue-600', 'font-bold');
    btn.classList.add('text-slate-400', 'font-medium');
  });

  const activeNavBtn = document.getElementById(`nav-${tabName}`);
  if (activeNavBtn) {
    activeNavBtn.classList.remove('text-slate-400', 'font-medium');
    activeNavBtn.classList.add('text-blue-600', 'font-bold');
  }
}

// Inisialisasi saat file loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('App JS terload dengan aman.');
});

// ==========================================
// FUNGSI BARU: SEMBUNYIKAN TOMBOL KELOLA AKUN UNTUK KASIR
// ==========================================
function terapkanHakAksesKasir() {
  const userRole = localStorage.getItem('user_role');
  
  // Jika role yang login adalah kasir
  if (userRole === 'kasir') {
    // Sembunyikan tombol "Kelola Akun" di menu Pengaturan
    const menuKelolaAkun = document.getElementById('setting-owner-kasir');
    if (menuKelolaAkun) {
      menuKelolaAkun.style.display = 'none';
    }
  }
}

// Jalankan otomatis saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(terapkanHakAksesKasir, 500);
});