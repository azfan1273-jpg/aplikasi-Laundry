// ==========================================
// NAVIGATION & DASHBOARD HOME
// ==========================================

function switchTab(tab) {
  // --- GEMBOK AKSES MENU LAPORAN ---
  if (tab === 'report') {
    if (typeof getTokoPermissions === 'function' && typeof currentUserProfile !== 'undefined' && currentUserProfile) {
      const perms = getTokoPermissions();
      if (currentUserProfile.role !== 'owner' && !perms.is_manager && !perms.akses_laporan) {
        if (typeof showToast === 'function') showToast("Akses Menu Laporan dibatasi oleh Owner!", "error");
        return;
      }
    }
  }

  // Sembunyikan semua panel
  const sections = document.querySelectorAll('.page-section');
  sections.forEach(sec => sec.classList.remove('active'));

  // Nonaktifkan semua tombol navigasi
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.classList.remove('text-blue-600', 'font-bold');
    btn.classList.add('text-slate-400', 'font-medium');
  });

  // Tampilkan panel yang dipilih
  const targetSec = document.getElementById('panel-' + tab);
  if (targetSec) targetSec.classList.add('active');

  // Aktifkan tombol navigasi yang dipilih
  const targetBtn = document.getElementById('nav-' + tab);
  if (targetBtn) {
    targetBtn.classList.remove('text-slate-400', 'font-medium');
    targetBtn.classList.add('text-blue-600', 'font-bold');
  }

  // Load data sesuai tab
  if (tab === 'order' && typeof loadOrderDataList === 'function') {
    loadOrderDataList();
  } else if (tab === 'report' && typeof loadReportData === 'function') {
    loadReportData();
  }
}

function toggleFabMenu() {
  const container = document.getElementById('fab-container');
  const sideMenu = document.getElementById('fab-side-menu');
  const backdrop = document.getElementById('fab-backdrop');
  const icon = document.getElementById('fab-icon');

  if (!container || !sideMenu || !backdrop || !icon) return;

  const isOpen = !sideMenu.classList.contains('opacity-0');

  if (isOpen) {
    sideMenu.classList.add('opacity-0', 'pointer-events-none', 'translate-x-4');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    icon.style.transform = 'rotate(0deg)';
  } else {
    sideMenu.classList.remove('opacity-0', 'pointer-events-none', 'translate-x-4');
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    icon.style.transform = 'rotate(45deg)';
  }
}

function toggleAccordion(accId) {
  const content = document.getElementById(accId);
  const arrow = document.getElementById('arrow-' + accId);

  if (!content) return;

  const isHidden = content.classList.contains('hidden');
  if (isHidden) {
    content.classList.remove('hidden');
    if (arrow) arrow.classList.add('rotate-180');
  } else {
    content.classList.add('hidden');
    if (arrow) arrow.classList.remove('rotate-180');
  }
}

async function loadDataHome() {
  if (typeof supabaseClient === 'undefined' || !supabaseClient || !currentToko) return;

  try {
    const { data: orderAktif } = await supabaseClient
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('toko_id', currentToko.id)
      .in('status', ['Antrian', 'Proses']);

    const { data: orderSelesai } = await supabaseClient
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('toko_id', currentToko.id)
      .eq('status', 'Selesai');

    const statAktifEl = document.getElementById('stat-aktif');
    const statSelesaiEl = document.getElementById('stat-selesai');

    if (statAktifEl) statAktifEl.innerText = orderAktif ? orderAktif.length : 0;
    if (statSelesaiEl) statSelesaiEl.innerText = orderSelesai ? orderSelesai.length : 0;

  } catch (err) {
    console.error("Error loadDataHome:", err);
  }
}