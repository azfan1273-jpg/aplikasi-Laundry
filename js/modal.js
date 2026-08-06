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

// --- GEMBOK AKSES KELOLA LAYANAN ---
function openModalKelolaLayanan() {
  if (typeof getTokoPermissions === 'function' && typeof currentUserProfile !== 'undefined' && currentUserProfile) {
    const perms = getTokoPermissions();
    if (currentUserProfile.role !== 'owner' && !perms.is_manager && !perms.akses_layanan) {
      if (typeof showToast === 'function') showToast("Anda tidak memiliki izin mengelola layanan & harga!", "error");
      return;
    }
  }

  const modal = document.getElementById('modal-kelola-layanan');
  if (modal) modal.classList.remove('hidden');
  if (typeof renderKelolaLayananList === 'function') renderKelolaLayananList();
}

function closeModalKelolaLayanan() {
  closeModalWithHistory('modal-kelola-layanan');
}

// --- GEMBOK AKSES PENGELUARAN ---
function openModalPengeluaran() {
  if (typeof getTokoPermissions === 'function' && typeof currentUserProfile !== 'undefined' && currentUserProfile) {
    const perms = getTokoPermissions();
    if (currentUserProfile.role !== 'owner' && !perms.is_manager && !perms.akses_pengeluaran) {
      if (typeof showToast === 'function') showToast("Anda tidak memiliki izin mencatat pengeluaran!", "error");
      return;
    }
  }

  const inputNominal = document.getElementById('input_nominal_pengeluaran');
  if (inputNominal) inputNominal.value = '';
  
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

function openModalPOS() {
  if (typeof resetPOSState === 'function') resetPOSState();
  const modal = document.getElementById('modal-pos');
  if (modal) modal.classList.remove('hidden');
}

function closeModalPOS() {
  closeModalWithHistory('modal-pos');
}