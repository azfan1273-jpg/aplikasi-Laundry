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
// test saja
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

// FIX 1: FUNGSI MENUTUP MODAL PILIH LAYANAN
function closeModalPilihLayanan() {
  const modal = document.getElementById('modal-layanan') 
             || document.getElementById('modal-pilih-layanan');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.style.display = 'none';
  }
}

// --- WRAPPER SIMPAN PELANGGAN & LAYANAN BARU ---
function simpanCustomerBaru(e) {
  if (e && e.preventDefault) e.preventDefault();
  // Langsung panggil fungsi dari js/custumer.js
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

// ==========================================
// FIX PROSES SIMPAN TRANSAKSI POS KE SUPABASE
// ==========================================

async function simpanOrderPOS() {
  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);
  
  if (!client) {
    if (typeof showToast === 'function') showToast('Koneksi Supabase belum siap!', 'error');
    else alert('Koneksi Supabase belum siap!');
    return;
  }

  // 1. Ambil Data Pelanggan Terpilih
  const pelangganObj = window.selectedPelanggan || null;
  const pelangganId = pelangganObj ? pelangganObj.id : null;

  // 2. Ambil Data Keranjang POS
  const keranjang = window.keranjangPOS || [];
  if (keranjang.length === 0) {
    if (typeof showToast === 'function') showToast('Keranjang layanan masih kosong!', 'error');
    return;
  }

  // 3. Hitung Total Harga dan Kuantitas
  let totalHarga = window.totalHargaPOS || 0;
  if (totalHarga === 0) {
    keranjang.forEach(item => {
      let q = parseFloat(String(item.qty).replace(',', '.')) || 0;
      let h = typeof item.harga === 'number' ? item.harga : (parseFloat(String(item.harga).replace(/[^0-9.]/g, '')) || 0);
      totalHarga += (q * h);
    });
  }

  const primaryItem = keranjang[0];
  const totalQty = keranjang.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0);

  try {
    const userRes = await client.auth.getUser();
    const userId = userRes?.data?.user?.id || null;
    let tokoId = (typeof currentToko !== 'undefined' && currentToko?.id) ? currentToko.id : localStorage.getItem('toko_id');

    // Payload murni sesuai kolom tabel 'transaksi' di Supabase kamu
    const payload = {
      pelanggan_id: pelangganId,
      layanan_id: primaryItem ? primaryItem.id : null,
      berat_atau_jumlah: totalQty,
      total_harga: Math.round(totalHarga),
      status_pembayaran: 'Belum Lunas'
    };

    if (userId) payload.user_id = userId;
    if (tokoId) payload.toko_id = tokoId;

    console.log("Mengirim transaksi ke Supabase:", payload);

    const { data, error } = await client
      .from('transaksi')
      .insert([payload])
      .select();

    if (error) {
      console.error("Error Supabase insert transaksi:", error);
      if (typeof showToast === 'function') showToast('Gagal menyimpan: ' + error.message, 'error');
      else alert('Gagal menyimpan transaksi: ' + error.message);
      return;
    }

    if (typeof showToast === 'function') showToast('Transaksi Berhasil Disimpan ke Database! 🎉', 'success');
    else alert('Berhasil! Transaksi telah tersimpan.');

    // Reset Form Modal POS
    window.keranjangPOS = [];
    window.selectedPelanggan = null;
    
    const customerLabel = document.getElementById('selectedCustomerName');
    if (customerLabel) {
      customerLabel.textContent = 'Silahkan Pilih Customer Terlebih Dahulu.';
      customerLabel.className = 'text-sm font-semibold text-gray-400 italic';
    }

    if (typeof renderKeranjangPOS === 'function') renderKeranjangPOS();
    tutupModalPOS();

    // Reload daftar order di layar
    if (typeof loadOrderDataList === 'function') loadOrderDataList();

  } catch (err) {
    console.error("Catch Error simpanOrderPOS:", err);
    if (typeof showToast === 'function') showToast('Terjadi kesalahan sistem', 'error');
  }
}

// 4. PEMBARUAN HANDLER TOMBOL PESAN
function handleProsesPesan(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }

  const customerLabel = document.getElementById('selectedCustomerName')?.textContent?.trim() || '';
  
  // Validasi Pelanggan
  if (!customerLabel || customerLabel.includes('Silahkan Pilih Customer Terlebih Dahulu.')) {
    if (typeof showToast === 'function') showToast('Harap isi kolom Pelanggan Terlebih dahulu..!!', 'error');
    else alert('Harap isi kolom Pelanggan Terlebih dahulu..!!');
    return;
  }

  // Validasi Keranjang
  const hasCartItems = Array.isArray(window.keranjangPOS) && window.keranjangPOS.length > 0;
  if (!hasCartItems) {
    if (typeof showToast === 'function') showToast('Harap isi kolom Layanan Terlebih dahulu..!!', 'error');
    else alert('Harap isi kolom Layanan Terlebih dahulu..!!');
    return;
  }

  // Panggil fungsi simpan asli ke Supabase
  simpanOrderPOS();
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

// Pembungkus bukaModalPOS
const originalBukaModalPOS = bukaModalPOS;
bukaModalPOS = function() {
  if (typeof originalBukaModalPOS === 'function') originalBukaModalPOS();
  initPOSListeners();
};

// Inisialisasi Load
document.addEventListener('DOMContentLoaded', () => {
  console.log('App JS terload dengan aman.');
  setTimeout(terapkanHakAksesKasir, 500);
  initPOSListeners();
});

// ==========================================
// FIX TRANSAKSI & AUTOMATIC TOTAL PRICE CALCULATOR
// ==========================================

// 1. Dengar event klik di tombol "+ Tambah Layanan"
document.addEventListener('click', function(e) {
  const btn = e.target.closest('button') || e.target;
  if (!btn) return;

  const txt = (btn.textContent || '').trim().toLowerCase();
  
  if (txt.includes('tambah layanan') || txt === '+ tambah layanan') {
    if (typeof bukaModalPilihLayanan === 'function') {
      bukaModalPilihLayanan();
    }
  }
});

// 2. Kalkulator Otomatis Menjumlahkan Seluruh Subtotal di Modal Order
function hitungTotalPOSApp() {
  let total = 0;

  // Cari semua teks harga di dalam modal transaksi
  const modalOrder = document.getElementById('modal-order') 
                  || document.getElementById('modalPOS') 
                  || document.getElementById('modal-transaksi')
                  || document;

  const priceElements = modalOrder.querySelectorAll('p, span, div');
  priceElements.forEach(el => {
    // Ambil harga item yang ada di baris keranjang (sebelah tombol X)
    if (el.children.length === 0 && el.textContent.includes('Rp')) {
      const parent = el.parentElement;
      const textUpper = (parent?.textContent || '').toUpperCase();
      
      // Pastikan bukan elemen TOTAL PRICE utama
      if (!textUpper.includes('TOTAL PRICE')) {
        const num = parseFloat(el.textContent.replace(/[^0-9]/g, '')) || 0;
        if (num > 0 && parent.querySelector('button, input')) {
          total += num;
        }
      }
    }
  });

  // Jika hitung dari DOM tidak ketemu, hitung dari Array global
  if (total === 0 && window.keranjangPOS && window.keranjangPOS.length > 0) {
    window.keranjangPOS.forEach(item => {
      let q = parseFloat(String(item.qty).replace(',', '.')) || 0;
      let h = parseFloat(String(item.harga).replace(/[^0-9.]/g, '')) || 0;
      total += (q * h);
    });
  }

  const formattedTotal = 'Rp ' + Math.round(total).toLocaleString('id-ID');

  // Update Teks Angka TOTAL PRICE
  priceElements.forEach(el => {
    if (el.children.length === 0 && el.textContent.trim().toUpperCase() === 'TOTAL PRICE') {
      const parent = el.parentElement;
      if (parent) {
        const priceVal = parent.querySelector('.text-lg, .font-black, .font-bold, .text-xl, h3, h4') || el.nextElementSibling;
        if (priceVal && priceVal !== el) {
          priceVal.textContent = formattedTotal;
        }
      }
    }
  });
}

// 3. Jalankan Pemantau Perubahan DOM Otomatis
const posAppObserver = new MutationObserver(() => {
  hitungTotalPOSApp();
});

if (document.body) {
  posAppObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
}

window.hitungTotalPOSApp = hitungTotalPOSApp;