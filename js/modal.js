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
  // 1. Pengecekan Izin Akses Kasir
  if (typeof currentUserProfile !== 'undefined' && currentUserProfile) {
    const isOwner = currentUserProfile.role === 'owner';
    
    if (!isOwner) {
      let perms = { akses_layanan: false, is_manager: false };
      
      if (typeof getTokoPermissions === 'function') {
        perms = getTokoPermissions();
      }

      // Jika bukan Owner, bukan Manager, dan tidak ada izin layanan -> Tampilkan Notif
      if (!perms.is_manager && !perms.akses_layanan) {
        if (typeof showToast === 'function') {
          showToast("Anda tidak memiliki izin mengelola layanan & harga!", "error");
        }
        return;
      }
    }
  }

  // 2. Buka Modal
  const modal = document.getElementById('modal-kelola-layanan');
  if (modal) {
    modal.classList.remove('hidden');
  }

  // 3. Render List Layanan
  if (typeof renderKelolaLayananList === 'function') {
    await renderKelolaLayananList();
  }
}

// --- OPEN MODAL PENGELUARAN ---
function openModalPengeluaran() {
  if (typeof currentUserProfile !== 'undefined' && currentUserProfile) {
    const isOwner = currentUserProfile.role === 'owner';
    
    if (!isOwner) {
      let perms = { akses_pengeluaran: false, is_manager: false };
      
      if (typeof getTokoPermissions === 'function') {
        perms = getTokoPermissions();
      }

      if (!perms.is_manager && !perms.akses_pengeluaran) {
        if (typeof showToast === 'function') {
          showToast("Anda tidak memiliki izin mencatat pengeluaran!", "error");
        }
        return;
      }
    }
  }

  const inputNominal = document.getElementById('input_nominal_pengeluaran');
  const inputKet = document.getElementById('input_keterangan_pengeluaran');
  if (inputNominal) inputNominal.value = '';
  if (inputKet) inputKet.value = '';

  const modal = document.getElementById('modal-pengeluaran');
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