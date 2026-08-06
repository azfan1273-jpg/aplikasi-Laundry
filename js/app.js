// ==========================================
// FILE: js/app.js
// ==========================================

// 1. MEMBUKA MODAL KELOLA AKUN & ANALITIK (HEADER TOPBAR & TOMBOL BUKA)
function openModalJendelaAkunWithChart() {
  const modal = document.getElementById('modal-jendela-akun');
  if (modal) {
    modal.classList.remove('hidden');

    // SET EMAIL USER DI HEADER MODAL
    const accountModalEmail = document.getElementById('account-modal-email');
    if (accountModalEmail) {
      const currentUserEmail = localStorage.getItem('user_email') || 
                               (typeof currentUser !== 'undefined' && currentUser ? currentUser.email : null) || 
                               '';
      
      if (currentUserEmail) {
        accountModalEmail.textContent = currentUserEmail;
      } else if (typeof supabaseClient !== 'undefined') {
        supabaseClient.auth.getUser().then(({ data }) => {
          if (data && data.user) {
            accountModalEmail.textContent = data.user.email;
          }
        });
      }
    }

    if (typeof renderTrafficChart === 'function') {
      try { renderTrafficChart(); } catch(e) { console.log(e); }
    }
  } else {
    console.error("Modal #modal-jendela-akun tidak ditemukan!");
  }
}

// 2. MEMBUKA MODAL KELOLA LAYANAN
function openModalKelolaLayanan() {
  const modal = document.getElementById('modal-kelola-layanan');
  if (modal) {
    modal.classList.remove('hidden');
  } else {
    console.error("Modal #modal-kelola-layanan tidak ditemukan!");
  }
}

// 3. FUNGSI MENUTUP MODAL
function closeModalWithHistory(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
  }
}

function closeOnBackdrop(event, modalId) {
  if (event.target && event.target.id === modalId) {
    closeModalWithHistory(modalId);
  }
}

// 4. ANIMASI TOGGLE TOMBOL FAB (+)
function toggleFabMenu() {
  const backdrop = document.getElementById('fab-backdrop');
  const sideMenu = document.getElementById('fab-side-menu');
  const icon = document.getElementById('fab-icon');

  if (!sideMenu) return;

  const isHidden = sideMenu.classList.contains('opacity-0') || sideMenu.classList.contains('pointer-events-none');

  if (isHidden) {
    // TAMPILKAN MENU MELAYANG KE ATAS
    sideMenu.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
    sideMenu.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');

    if (backdrop) {
      backdrop.classList.remove('opacity-0', 'pointer-events-none');
      backdrop.classList.add('opacity-100', 'pointer-events-auto');
    }
    if (icon) icon.style.transform = 'rotate(45deg)';
  } else {
    // SEMBUNYIKAN MENU
    sideMenu.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
    sideMenu.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');

    if (backdrop) {
      backdrop.classList.add('opacity-0', 'pointer-events-none');
      backdrop.classList.remove('opacity-100', 'pointer-events-auto');
    }
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
}

// 5. NAVIGASI TAB UTAMA
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