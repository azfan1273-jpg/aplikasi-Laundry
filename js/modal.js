// ==========================================
// UTILITY KONTROL MODAL & BACKDROP
// ==========================================

function closeModalWithHistory(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

function closeOnBackdrop(event, modalId) {
  if (event.target.id === modalId) {
    closeModalWithHistory(modalId);
  }
}

function openModalJendelaAkunWithChart() {
  const modal = document.getElementById('modal-jendela-akun');
  if (modal) modal.classList.remove('hidden');

  if (typeof loadDaftarKasirList === 'function') loadDaftarKasirList();
  if (typeof loadPermissionSwitches === 'function') loadPermissionSwitches();
}

// --- OPEN MODAL KELOLA LAYANAN ---
async function openModalKelolaLayanan() {
  // 1. Cek Gembok Izin
  if (typeof getTokoPermissions === 'function' && typeof currentUserProfile !== 'undefined' && currentUserProfile) {
    const perms = getTokoPermissions();
    if (currentUserProfile.role !== 'owner' && !perms.is_manager && !perms.akses_layanan) {
      if (typeof showToast === 'function') showToast("Anda tidak memiliki izin mengelola layanan & harga!", "error");
      return;
    }
  }

  // 2. Buka Modal Terlebih Dahulu agar Kasir Melihat Respons Langsung
  const modal = document.getElementById('modal-kelola-layanan');
  if (modal) modal.classList.remove('hidden');

  // 3. Render List Layanan secara Aman
  if (typeof renderKelolaLayananList === 'function') {
    try {
      await renderKelolaLayananList();
    } catch (e) {
      console.error("Error render kelola layanan:", e);
    }
  }
}

function closeModalKelolaLayanan() {
  closeModalWithHistory('modal-kelola-layanan');
}

// --- OPEN MODAL PENGELUARAN ---
function openModalPengeluaran() {
  // 1. Cek Gembok Izin
  if (typeof getTokoPermissions === 'function' && typeof currentUserProfile !== 'undefined' && currentUserProfile) {
    const perms = getTokoPermissions();
    if (currentUserProfile.role !== 'owner' && !perms.is_manager && !perms.akses_pengeluaran) {
      if (typeof showToast === 'function') showToast("Anda tidak memiliki izin mencatat pengeluaran!", "error");
      return;
    }
  }

  const inputNominal = document.getElementById('input_nominal_pengeluaran');
  const inputKet = document.getElementById('input_keterangan_pengeluaran');
  if (inputNominal) inputNominal.value = '';
  if (inputKet) inputKet.value = '';

  const modal = document.getElementById('modal-pengeluaran');
  if (modal) modal.classList.remove('hidden');
}

function closeModalPengeluaran() {
  closeModalWithHistory('modal-pengeluaran');
}

function openModalStatistik(tipe) {
  const modal = document.getElementById('modal-rincian-statistik');
  const title = document.getElementById('modal-stat-title');
  if (title) title.innerText = "Rincian Order: " + tipe;
  if (modal) modal.classList.remove('hidden');
}

// --- OPEN MODAL POS / TRANSAKSI BARU ---
function openModalPOS() {
  if (typeof resetPOSState === 'function') resetPOSState();
  
  const modal = document.getElementById('modal-pos');
  if (modal) modal.classList.remove('hidden');
}

function closeModalPOS() {
  closeModalWithHistory('modal-pos');
}