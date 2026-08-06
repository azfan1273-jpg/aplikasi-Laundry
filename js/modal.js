// ==========================================
// FIX BUG 2 & 3: Modal Header & Hak Akses
// ==========================================

/**
 * FIX BUG 2: Membuka Modal Kasir dengan Header Nama User (Bukan Email)
 */
function bukaModalEditKasir(id, nama, email) {
  const modalElement = document.getElementById('modalKasir');
  const modalTitle = document.getElementById('modalKasirTitle');
  const inputNama = document.getElementById('modalKasirNama');
  const inputEmail = document.getElementById('modalKasirEmail');

  // FIX HEADER: Tampilkan NAMA pada judul modal, bukan Email
  if (modalTitle) {
    modalTitle.textContent = "Detail Kasir: " + (nama || "Kasir");
  }

  // Isi input body form modal
  if (inputNama) inputNama.value = nama || '';
  if (inputEmail) inputEmail.value = email || '';

  // Tampilkan Modal (Bootstrap/Vanilla)
  if (modalElement) {
    modalElement.classList.add('show');
    modalElement.style.display = 'block';
  }
}

/**
 * Fungsi untuk menutup Modal Kasir & Reset Header
 */
function tutupModalKasir() {
  const modalElement = document.getElementById('modalKasir');
  const modalTitle = document.getElementById('modalKasirTitle');

  if (modalElement) {
    modalElement.classList.remove('show');
    modalElement.style.display = 'none';
  }

  // Reset Judul Modal ke Default
  if (modalTitle) {
    modalTitle.textContent = "Detail Kasir";
  }
}

/**
 * FIX BUG 3: Pengaturan Modal Layanan / Izin Akses untuk Kasir
 */
function aturIzinAksesModalLayanan() {
  // Ambil role user aktif dari localStorage
  const userRole = localStorage.getItem('user_role') || 'kasir';

  const btnTambahLayanan = document.getElementById('btnTambahLayanan');
  const actionAksiLayanan = document.querySelectorAll('.aksi-layanan-admin');
  const modalTitleLayanan = document.getElementById('modalLayananTitle');

  if (userRole === 'kasir') {
    // Sembunyikan tombol kelola / tambah layanan untuk Kasir
    if (btnTambahLayanan) btnTambahLayanan.style.display = 'none';
    
    actionAksiLayanan.forEach(el => {
      el.style.display = 'none';
    });

    if (modalTitleLayanan) {
      modalTitleLayanan.textContent = "Daftar Layanan (Mode Baca)";
    }
  } else {
    // Tampilkan penuh jika yang login adalah Admin
    if (btnTambahLayanan) btnTambahLayanan.style.display = 'inline-block';
    
    actionAksiLayanan.forEach(el => {
      el.style.display = 'block';
    });

    if (modalTitleLayanan) {
      modalTitleLayanan.textContent = "Kelola Layanan & Pricing";
    }
  }
}

// Jalankan pengecekan izin modal saat dokumen selesai dimuat
document.addEventListener('DOMContentLoaded', function () {
  aturIzinAksesModalLayanan();
});