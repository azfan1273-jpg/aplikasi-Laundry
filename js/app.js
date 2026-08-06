// ==========================================
// FILE: js/app.js
// ==========================================

// Pindah Tab Navigasi Utama (Beranda, Order, Report, Setting)
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

// Membuka Modal Kelola Akun & Analitik (Dari Topbar & Tombol Buka)
function openModalJendelaAkunWithChart() {
  const modal = document.getElementById('modal-jendela-akun');
  if (modal) {
    modal.classList.remove('hidden');
    if (typeof renderTrafficChart === 'function') {
      renderTrafficChart();
    }
  }
}

// Membuka Modal Kelola Layanan
function openModalKelolaLayanan() {
  const modal = document.getElementById('modal-kelola-layanan');
  if (modal) {
    modal.classList.remove('hidden');
    if (typeof renderKelolaLayananList === 'function') {
      renderKelolaLayananList();
    }
  }
}

// Tutup Modal via Tombol X atau Backdrop
function closeModalWithHistory(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
  }
}

function closeOnBackdrop(event, modalId) {
  if (event.target.id === modalId) {
    closeModalWithHistory(modalId);
  }
}

// TOGGLE MENU FAB (TOMBOL + MELAYANG KE ATAS)
function toggleFabMenu() {
  const backdrop = document.getElementById('fab-backdrop');
  const sideMenu = document.getElementById('fab-side-menu');
  const icon = document.getElementById('fab-icon');

  if (!sideMenu) return;

  const isOpen = !sideMenu.classList.contains('opacity-0');

  if (isOpen) {
    // TUTUP MENU
    sideMenu.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
    sideMenu.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
    
    if (backdrop) {
      backdrop.classList.add('opacity-0', 'pointer-events-none');
      backdrop.classList.remove('opacity-100', 'pointer-events-auto');
    }

    if (icon) {
      icon.style.transform = 'rotate(0deg)';
    }
  } else {
    // BUKA MENU MELAYANG KE ATAS
    sideMenu.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
    sideMenu.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');

    if (backdrop) {
      backdrop.classList.remove('opacity-0', 'pointer-events-none');
      backdrop.classList.add('opacity-100', 'pointer-events-auto');
    }

    if (icon) {
      icon.style.transform = 'rotate(45deg)';
    }
  }
}

// Inisialisasi Aplikasi saat Load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Aplikasi Laundry Siap.');
});