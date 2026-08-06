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

// ==========================================
// 4. ADVANCED UI ANIMATION: TRANSAKSI LAUNCHER
// ==========================================
let isJendelaNavigasiOpen = false;

async function mulaiAnimasiTransaksi() {
    const container = document.getElementById('transaksi-animator-container');
    const tombol = document.getElementById('btn-transaksi-animasi');
    const teksBtn = document.getElementById('teks-btn-transaksi');
    const ikonClose = document.getElementById('ikon-btn-close');
    const backdrop = document.getElementById('transaksi-backdrop');
    const jendelaNav = document.getElementById('jendela-navigasi-baru');

    if (!tombol || !container) return;

    if (!isJendelaNavigasiOpen) {
        // PROSES BUKA (MELUNCUR KE ATAS & JADI BULAT)
        isJendelaNavigasiOpen = true;
        tombol.style.pointerEvents = 'none';

        if (teksBtn) teksBtn.style.opacity = '0';
        if (backdrop) backdrop.classList.remove('opacity-0');
        if (jendelaNav) jendelaNav.classList.remove('translate-y-full');

        const targetTop = 24; 
        const currentBottom = parseInt(tombol.style.bottom) || 80; 
        const windowHeight = window.innerHeight;
        const tombolHeight = parseInt(tombol.style.height) || 56; 

        const translateY = -(windowHeight - currentBottom - targetTop - (tombolHeight / 2));

        tombol.style.transform = `translateY(${translateY}px)`;
        tombol.style.width = '56px';
        tombol.style.borderRadius = '50%';
        tombol.style.left = 'calc(50% - 28px)';
        tombol.style.right = 'auto';

        setTimeout(() => {
            if (ikonClose) ikonClose.style.opacity = '1';
            tombol.style.pointerEvents = 'auto';
        }, 500);

    } else {
        closeJendelaNavigasiBaru();
    }
}

function closeJendelaNavigasiBaru() {
    const tombol = document.getElementById('btn-transaksi-animasi');
    const teksBtn = document.getElementById('teks-btn-transaksi');
    const ikonClose = document.getElementById('ikon-btn-close');
    const backdrop = document.getElementById('transaksi-backdrop');
    const jendelaNav = document.getElementById('jendela-navigasi-baru');

    if (!tombol) return;

    isJendelaNavigasiOpen = false;
    tombol.style.pointerEvents = 'none';

    if (ikonClose) ikonClose.style.opacity = '0';
    if (jendelaNav) jendelaNav.classList.add('translate-y-full');
    if (backdrop) backdrop.classList.add('opacity-0');

    tombol.style.transform = 'translateY(0)';
    tombol.style.width = 'auto';
    tombol.style.left = '16px';
    tombol.style.right = '16px';
    tombol.style.borderRadius = '16px';

    setTimeout(() => {
        if (teksBtn) teksBtn.style.opacity = '1';
        tombol.style.pointerEvents = 'auto';
    }, 500);
}

function handleMenuClick(modalFunction) {
    closeJendelaNavigasiBaru();
    setTimeout(() => {
        if (typeof modalFunction === 'function') modalFunction();
    }, 550);
}

// Kompatibilitas jika ada elemen lama yang masih memanggil toggleFabMenu
function toggleFabMenu() {
    mulaiAnimasiTransaksi();
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

// ==========================================
// FUNGSI MEMBUKA MODAL PENGELUARAN
// ==========================================
function openModalPengeluaran() {
  const modal = document.getElementById('modal-pengeluaran');
  if (modal) {
    modal.classList.remove('hidden');
  } else {
    console.error("Modal #modal-pengeluaran tidak ditemukan!");
  }
}

function closeModalPengeluaran() {
  const modal = document.getElementById('modal-pengeluaran');
  if (modal) {
    modal.classList.add('hidden');
  }
}