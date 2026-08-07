// ==========================================
// FILE: js/app.js (Sistem Utama & Proteksi)
// ==========================================

// 1. MEMBUKA MODAL KELOLA AKUN & ANALITIK (DENGAN CEK HAK AKSES KASIR)
async function openModalJendelaAkunWithChart() {
  try {
    const topbarEmail = document.getElementById('topbar-user-email')?.textContent?.trim() || '';
    const settingEmail = document.getElementById('setting-user-email')?.textContent?.trim() || '';
    const activeEmail = topbarEmail || settingEmail;

    let userRole = localStorage.getItem('user_role');

    const isOwnerEmail = activeEmail.includes('superadmin') || 
                         activeEmail.includes('owner') || 
                         activeEmail === 'superadmin.lndr@gmail.com';

    if (isOwnerEmail) {
      userRole = 'owner';
      localStorage.setItem('user_role', 'owner');
    }

    if (userRole === 'kasir' || activeEmail.includes('kasir')) {
      if (typeof showToast === 'function') {
        showToast('Akses Ditolak: Menu Kelola Akun khusus Owner/Admin!', 'error');
      } else {
        alert('Akses Ditolak: Menu Kelola Akun khusus Owner/Admin!');
      }
      return;
    }

    const modal = document.getElementById('modal-jendela-akun');
    if (!modal) return;

    modal.classList.remove('hidden');

    const accountModalEmail = document.getElementById('account-modal-email');
    if (accountModalEmail && activeEmail) {
      accountModalEmail.textContent = activeEmail;
    }

    if (typeof renderTrafficChart === 'function') {
      try { renderTrafficChart(); } catch (err) { console.log(err); }
    }

  } catch (err) {
    console.error('Error cek akses kelola akun:', err);
  }
}

// 2. MEMBUKA MODAL KELOLA LAYANAN
function openModalKelolaLayanan() {
  const modal = document.getElementById('modal-kelola-layanan');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (typeof renderKelolaLayananList === 'function') {
      try {
        renderKelolaLayananList();
      } catch (err) {
        console.log('Error render kelola layanan:', err);
      }
    }
  }
}

function closeModalKelolaLayanan() {
  const modal = document.getElementById('modal-kelola-layanan');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// 3. FUNGSI MENUTUP MODAL (AMAN)
function closeModalWithHistory(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
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
    }, 600);
}

function toggleFabMenu() {
    mulaiAnimasiTransaksi();
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

// ==========================================
// 6. HAK AKSES KASIR
// ==========================================
function terapkanHakAksesKasir() {
  const userRole = localStorage.getItem('user_role');
  if (userRole === 'kasir') {
    const menuKelolaAkun = document.getElementById('setting-owner-kasir');
    if (menuKelolaAkun) {
      menuKelolaAkun.style.display = 'none';
    }
  }
}

// ==========================================
// 7. FUNGSI MODAL PENGELUARAN
// ==========================================
function openModalPengeluaran() {
  const modal = document.getElementById('modal-pengeluaran');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  } else {
    console.error("Modal #modal-pengeluaran tidak ditemukan!");
  }
}

function closeModalPengeluaran() {
  const modal = document.getElementById('modal-pengeluaran');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// ==========================================
// 8. FUNGSI MODAL POS & INTERAKSI TRANSAKSI
// ==========================================
function bukaModalPOS() {
  const modalPos = document.getElementById('modalPOS') || 
                   document.getElementById('modal-pos') || 
                   document.getElementById('modal-transaksi');
                   
  if (modalPos) {
    modalPos.classList.remove('hidden');
    modalPos.classList.add('flex');
  }
  if (typeof renderKeranjangPOS === 'function') {
    renderKeranjangPOS();
  }
  hitungTotalPOSApp();
}

function tutupModalPOS() {
  const modal = document.getElementById('modalPOS') || 
                document.getElementById('modal-pos') || 
                document.getElementById('modal-transaksi');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// --- LOGIKA HUBUNGAN DENGAN MODAL PELANGGAN & LAYANAN ---

function handleCariPelanggan(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  
  const modalPelanggan = document.getElementById('modal-pelanggan');
  if (modalPelanggan) {
    modalPelanggan.classList.remove('hidden');
    modalPelanggan.classList.add('flex');
  }
  
  if (typeof openModalPilihPelanggan === 'function') {
    try { openModalPilihPelanggan(); } catch (err) { console.log(err); }
  }
  if (typeof renderPelangganPOS === 'function') {
    try { renderPelangganPOS(); } catch (err) { console.log(err); }
  }
}

function handleTambahLayanan(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  
  const modalLayanan = document.getElementById('modal-layanan');
  if (modalLayanan) {
    modalLayanan.classList.remove('hidden');
    modalLayanan.classList.add('flex');
  }
  
  if (typeof openModalPilihLayanan === 'function') {
    try { openModalPilihLayanan(); } catch (err) { console.log(err); }
  }
  if (typeof renderLayananPOS === 'function') {
    try { renderLayananPOS(); } catch (err) { console.log(err); }
  }
}

function closeModalPilihPelanggan() {
  const modal = document.getElementById('modal-pelanggan');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function closeModalPilihLayanan() {
  const modal = document.getElementById('modal-layanan');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// --- WRAPPER SIMPAN PELANGGAN & LAYANAN BARU ---
function simpanCustomerBaru(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (typeof window.simpanCustomerBaruAsli === 'function') {
    window.simpanCustomerBaruAsli(e);
  } else if (typeof window.prosesSimpanCustomerBaru === 'function') {
    window.prosesSimpanCustomerBaru();
  } else if (typeof simpanCustomer === 'function') {
    simpanCustomer();
  }
}

// --- WRAPPER SIMPAN LAYANAN BARU ---
function tambahLayananBaru(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (typeof window.prosesSimpanLayananBaru === 'function') {
    window.prosesSimpanLayananBaru(e);
  } else if (typeof window.tambahLayananBaruAsli === 'function') {
    window.tambahLayananBaruAsli(e);
  }
}

// --- LOGIKA VALIDASI DAN PROSES PESAN ---

function handleProsesPesan(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }

  const customerLabel = document.getElementById('selectedCustomerName')?.textContent?.trim();
  const cartContainer = document.getElementById('cartItemsContainer');
  
  // 1. Cek Pelanggan
  if (!customerLabel || customerLabel.includes('Silahkan Pilih Customer Terlebih Dahulu.')) {
    if (typeof showToast === 'function') {
      showToast('Harap isi kolom Pelanggan Terlebih dahulu..!!', 'error');
    } else {
      alert('Harap isi kolom Pelanggan Terlebih dahulu..!!');
    }
    return;
  }

  // 2. Cek Keranjang Layanan
  if (!cartContainer || cartContainer.textContent.includes('Belum ada layanan yang ditambahkan.')) {
    if (typeof showToast === 'function') {
      showToast('Harap isi kolom Layanan Terlebih dahulu..!!', 'error');
    } else {
      alert('Harap isi kolom Layanan Terlebih dahulu..!!');
    }
    return;
  }

  // 3. Simpan Order
  if (typeof simpanOrderPOS === 'function') {
    simpanOrderPOS();
  } else {
    if (typeof showToast === 'function') {
      showToast('Transaksi Berhasil Diproses!', 'success');
    } else {
      alert('Transaksi Berhasil Diproses!');
    }
    tutupModalPOS();
  }
}

// Inisialisasi Listener Tombol POS
function initPOSListeners() {
  const btnClosePOS = document.getElementById('btnClosePOS');
  if (btnClosePOS) {
    btnClosePOS.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      tutupModalPOS();
    };
  }

  const btnSearchCustomer = document.getElementById('btnSearchCustomer');
  if (btnSearchCustomer) {
    btnSearchCustomer.onclick = handleCariPelanggan;
  }

  const btnAddService = document.getElementById('btnAddService');
  if (btnAddService) {
    btnAddService.onclick = handleTambahLayanan;
  }

  const btnSubmitPOS = document.getElementById('btnSubmitPOS');
  if (btnSubmitPOS) {
    btnSubmitPOS.onclick = handleProsesPesan;
  }
}

// Inisialisasi Load
document.addEventListener('DOMContentLoaded', () => {
  console.log('App JS terload dengan aman.');
  setTimeout(terapkanHakAksesKasir, 500);
  initPOSListeners();
});

// ==========================================
// FIX TRANSAKSI & AUTOMATIC TOTAL PRICE CALCULATOR
// ==========================================

function hitungTotalPOSApp() {
  const items = window.keranjangPOS || [];
  let total = 0;

  // Hitung total harga berdasarkan array keranjangPOS
  items.forEach(item => {
    let q = parseFloat(String(item.qty).replace(',', '.')) || 0;
    let h = parseFloat(String(item.harga).replace(/[^0-9.]/g, '')) || 0;
    total += (q * h);
  });

  const totalFix = Math.round(total);
  const formattedTotal = 'Rp ' + totalFix.toLocaleString('id-ID');

  // Tembak langsung ID totalPricePOS yang ada di index.html baris 840
  const targetIds = ['totalPricePOS', 'total-price-pos', 'total_harga', 'totalPrice', 'grand-total', 'total-bayar'];
  
  targetIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = formattedTotal;
    }
  });
}

// Dengar event interaksi klik dan input tanpa bentrok Observer
document.addEventListener('click', () => setTimeout(hitungTotalPOSApp, 50));
document.addEventListener('input', () => setTimeout(hitungTotalPOSApp, 50));

window.hitungTotalPOSApp = hitungTotalPOSApp;