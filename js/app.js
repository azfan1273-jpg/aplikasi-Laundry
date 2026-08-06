// ==========================================
// FILE: js/app.js
// ==========================================

// 1. MEMBUKA MODAL KELOLA AKUN & ANALITIK (DENGAN FIX EMAIL OWNER)
function openModalJendelaAkunWithChart() {
  const modal = document.getElementById('modal-jendela-akun');
  if (!modal) return;

  // Buka modal
  modal.classList.remove('hidden');

  // FIX EMAIL: Samakan email modal dengan email Owner di Topbar / Panel Setting
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

  // Render chart jika fungsi tersedia
  if (typeof renderTrafficChart === 'function') {
    try {
      renderTrafficChart();
    } catch (err) {
      console.log('Error render chart:', err);
    }
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