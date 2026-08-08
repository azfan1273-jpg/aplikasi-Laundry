// ==========================================
// KONTROL DAFTAR ORDER & TRANSAKSI (FIX TABEL TRANSAKSI)
// ==========================================

let currentFilterTab = 'Antrian';

function filterOrderTab(status) {
  currentFilterTab = status;
  
  const btns = document.querySelectorAll('.tab-order-btn');
  btns.forEach(btn => btn.classList.remove('active'));

  const activeBtn = document.getElementById('tab-' + status);
  if (activeBtn) activeBtn.classList.add('active');

  loadOrderDataList();
}

async function loadOrderDataList() {
  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);
  if (!client) return;

  const container = document.getElementById('list-order-status');
  if (!container) return;

  container.innerHTML = '<p class="text-xs text-slate-400 text-center py-10">Memuat data order...</p>';

  try {
    let rawOrders = [];

    // 1. Jika data sudah ter-load di Beranda (globalTxCache), pakai data itu langsung
    if (window.globalTxCache && window.globalTxCache.length > 0) {
      rawOrders = window.globalTxCache;
    } else {
      // 2. Jika belum ada cache, tarik dari Supabase persis seperti cara Beranda
      let { data: listTx, error } = await client
        .from('transaksi')
        .select('*, pelanggan(nama, no_hp)')
        .order('id', { ascending: false });

      if (error) throw error;
      rawOrders = listTx || [];
      window.globalTxCache = rawOrders; // Simpan ke cache global
    }

    // 3. Filter status sesuai Tab Aktif (Antrian, Proses, Selesai, Batal)
    let filteredOrders = rawOrders.filter(o => {
      const st = (o.status_laundry || o.status || 'Diterima').trim();
      
      if (currentFilterTab === 'Antrian') {
        return st === 'Antrian' || st === 'Diterima' || st === 'Baru';
      } else if (currentFilterTab === 'Proses') {
        return st === 'Proses' || st === 'Cuci' || st === 'Setrika';
      } else if (currentFilterTab === 'Selesai') {
        return st === 'Selesai' || st === 'Diambil';
      } else if (currentFilterTab === 'Batal') {
        return st === 'Batal' || st === 'Cancelled';
      }
      return true;
    });

    if (filteredOrders.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-400 text-center py-10">Tidak ada orderan di status ini.</p>';
      return;
    }

    // 4. Render tampilan daftar order
    container.innerHTML = filteredOrders.map(o => {
      const notaNum = o.id ? String(o.id).padStart(6, '0') : '000000';
      const namaPel = (o.pelanggan && o.pelanggan.nama) ? o.pelanggan.nama : (o.nama_pelanggan || 'Pelanggan Umum');
      const totalHarga = o.total_harga ? 'Rp ' + Math.round(o.total_harga).toLocaleString('id-ID') : 'Rp 0';
      const statusText = o.status_laundry || o.status || 'Diterima';

      return `
        <div onclick="openModalDetailOrder('${o.id}')" class="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex justify-between items-center cursor-pointer hover:border-blue-300 active:scale-[0.98] transition shadow-sm mb-2">
          <div>
            <h4 class="font-extrabold text-slate-800 text-xs">Nota #${notaNum} - ${namaPel}</h4>
            <p class="text-[10px] text-slate-400 mt-0.5">${totalHarga} • ${o.status_pembayaran || 'Belum Lunas'}</p>
          </div>
          <span class="text-[10px] bg-blue-100 text-blue-700 font-black px-2.5 py-1 rounded-xl uppercase tracking-wider">${statusText}</span>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error("Error loadOrderDataList:", err);
    if (container) {
      container.innerHTML = `<p class="text-xs text-rose-500 text-center py-10">Gagal memuat data order</p>`;
    }
  }
}

// --- GEMBOK AKSES EDIT ORDER ---
function openModalEditOrder() {
  if (typeof getTokoPermissions === 'function' && typeof currentUserProfile !== 'undefined' && currentUserProfile) {
    const perms = getTokoPermissions();
    if (currentUserProfile.role !== 'owner' && !perms.is_manager && !perms.akses_edit_order) {
      if (typeof showToast === 'function') showToast("Kasir tidak diizinkan mengedit data order!", "error");
      return;
    }
  }

  const modal = document.getElementById('modal-edit-order');
  if (modal) modal.classList.remove('hidden');
}

function closeModalEditOrder() {
  if (typeof closeModalWithHistory === 'function') closeModalWithHistory('modal-edit-order');
}

// --- GEMBOK AKSES BATALKAN ORDER ---
async function actionBatalkanOrder() {
  // 1. Cek Hak Akses Kasir
  if (typeof getTokoPermissions === 'function' && typeof currentUserProfile !== 'undefined') {
    const perms = getTokoPermissions();
    if (currentUserProfile.role !== 'owner' && !perms.is_manager && !perms.akses_edit_order) {
      if (typeof showToast === 'function') showToast("Kasir tidak diizinkan membatalkan order!", "error");
      return;
    }
  }

  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);
  if (!client || !window.currentSelectedOrderId) {
    if (typeof showToast === 'function') showToast("ID Order tidak ditemukan!", "error");
    return;
  }

  if (confirm("Apakah Anda yakin ingin membatalkan order ini?")) {
    try {
      // 2. Kirim Perubahan Status ke Supabase
      const { error } = await client
        .from('transaksi')
        .update({ 
          status_laundry: 'Batal',
        })
        .eq('id', window.currentSelectedOrderId);

      if (error) {
        if (typeof showToast === 'function') showToast('Gagal membatalkan order: ' + error.message, 'error');
        return;
      }

      if (typeof showToast === 'function') showToast("Order berhasil dibatalkan. ❌", "success");
      
      // 3. Tutup Modal
      if (typeof closeModalDetailOrder === 'function') closeModalDetailOrder();

      // 4. Auto Refresh & Langsung Buka Tab Batal
      setTimeout(() => {
        if (typeof loadDataHome === 'function') loadDataHome();
        if (typeof loadReport === 'function') loadReport();
        if (typeof filterOrderTab === 'function') {
          filterOrderTab('Batal');
        } else if (typeof loadOrderDataList === 'function') {
          loadOrderDataList();
        }
      }, 300);

    } catch (err) {
      console.error('Error actionBatalkanOrder:', err);
    }
  }
}

// ==========================================
// FIX MODAL DETAIL ORDER & AKSI PROSES STATUS
// ==========================================

let activeOrderDetail = null;

async function openModalDetailOrder(orderId) {
  // Simpan ID Order ke variabel global
  window.currentSelectedOrderId = orderId;

  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);
  if (!client) return;

  const modal = document.getElementById('modal-detail-order');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  try {
    // 1. Tarik detail data dari tabel 'transaksi' beserta relasi pelanggan & layanan
    const { data: order, error } = await client
      .from('transaksi')
      .select('*, pelanggan(nama, no_hp), layanan(nama_layanan, harga, satuan, estimasi_hari)')
      .eq('id', orderId)
      .maybeSingle();

    if (error || !order) {
      console.error("Gagal mengambil detail order:", error);
      return;
    }

    activeOrderDetail = order;

    // 2. Isikan data ke elemen UI Modal
    const notaIdEl = document.getElementById('detail-nota-id');
    const namaPelEl = document.getElementById('detail-nama-pelanggan');
    const hpPelEl = document.getElementById('detail-hp-pelanggan');
    const statusBayarEl = document.getElementById('detail-status-bayar');
    const tglMasukEl = document.getElementById('detail-tgl-masuk');
    const totalPriceEl = document.getElementById('detail-total-price');

    // Elemen Parfum, Estimasi, Catatan, & List Layanan
    const parfumEl = document.getElementById('detail-parfum');
    const tglSelesaiEl = document.getElementById('detail-tgl-selesai');
    const catatanEl = document.getElementById('detail-catatan');
    const layananListContainer = document.getElementById('detail-layanan-list-container');

    const notaNum = String(order.id).padStart(6, '0');
    const namaPel = (order.pelanggan && order.pelanggan.nama) ? order.pelanggan.nama : (order.nama_pelanggan || 'Pelanggan Umum');
    const hpPel = (order.pelanggan && order.pelanggan.no_hp) ? order.pelanggan.no_hp : '08-';
    const totalHargaFormatted = 'Rp ' + Math.round(order.total_harga || 0).toLocaleString('id-ID');

    if (notaIdEl) notaIdEl.textContent = `Nota #${notaNum}`;
    if (namaPelEl) namaPelEl.textContent = namaPel;
    if (hpPelEl) hpPelEl.textContent = hpPel;
    if (statusBayarEl) statusBayarEl.textContent = order.status_pembayaran || 'Belum Lunas';
    
    // Format Tanggal Masuk
    if (tglMasukEl) {
      tglMasukEl.textContent = order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID') : '-';
    }

    // 3. RENDER DAFTAR LAYANAN / ITEM
    if (layananListContainer) {
      const namaLayanan = order.layanan ? order.layanan.nama_layanan : 'Layanan Laundry';
      const qty = parseFloat(order.berat_atau_jumlah) || 1;
      const satuan = order.layanan ? (order.layanan.satuan || 'Kg') : 'Kg';
      const hargaSatuan = order.layanan ? (order.layanan.harga || 0) : 0;
      const subtotal = order.total_harga || (hargaSatuan * qty);

      layananListContainer.innerHTML = `
        <div class="flex justify-between items-center p-2 bg-white rounded-xl border border-slate-200 text-xs shadow-sm">
          <div>
            <p class="font-extrabold text-slate-800">${namaLayanan}</p>
            <p class="text-[10px] text-slate-400 mt-0.5">${qty} ${satuan} × Rp ${hargaSatuan.toLocaleString('id-ID')}</p>
          </div>
          <p class="font-black text-blue-600 text-xs">Rp ${Math.round(subtotal).toLocaleString('id-ID')}</p>
        </div>
      `;
    }

    // 4. TAMPILKAN PARFUM
    if (parfumEl) {
      parfumEl.textContent = order.parfum || 'Standard / Original';
    }

    // 5. TAMPILKAN CATATAN ORDER
    if (catatanEl) {
      catatanEl.textContent = (order.catatan && order.catatan.trim() !== '') ? order.catatan : 'Tidak ada catatan';
    }

    // 6. HITUNG DAN TAMPILKAN ESTIMASI SELESAI
    if (tglSelesaiEl) {
      if (order.created_at) {
        const tglMasuk = new Date(order.created_at);
        const estimasiHari = order.layanan ? (parseFloat(order.layanan.estimasi_hari) || 1) : 1;
        tglMasuk.setDate(tglMasuk.getDate() + estimasiHari);
        tglSelesaiEl.textContent = tglMasuk.toLocaleDateString('id-ID');
      } else {
        tglSelesaiEl.textContent = '-';
      }
    }

    // Update teks tombol proses sesuai status saat ini
    const btnProses = document.getElementById('btn-lanjut-proses');
    if (btnProses) {
      const st = (order.status_laundry || order.status || 'Diterima').trim();
      if (st === 'Diterima' || st === 'Antrian') {
        btnProses.textContent = '⚡ Lanjut Proses Order (Ke Proses)';
      } else if (st === 'Proses') {
        btnProses.textContent = '✅ Tandai Selesai Order';
      } else {
        btnProses.textContent = '🎉 Order Sudah Selesai';
      }
    }

  } catch (err) {
    console.error("Error openModalDetailOrder:", err);
  }
}

function closeModalDetailOrder() {
  const modal = document.getElementById('modal-detail-order');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// Expose fungsi ke scope global
window.openModalDetailOrder = openModalDetailOrder;
window.actionLanjutProses = actionLanjutProses;
window.closeModalDetailOrder = closeModalDetailOrder;

// ==========================================
// FIX ACTION BAYAR & METODE PEMBAYARAN
// ==========================================

function actionBayarOrder() {
  if (!activeOrderDetail) return;

  const modalPembayaran = document.getElementById('modal-pembayaran');
  const totalLabel = document.getElementById('pembayaran-total-label');

  if (totalLabel) {
    const hrg = Math.round(activeOrderDetail.total_harga || 0).toLocaleString('id-ID');
    totalLabel.textContent = `Total Bayar: Rp ${hrg}`;
  }

  if (modalPembayaran) {
    modalPembayaran.classList.remove('hidden');
    modalPembayaran.classList.add('flex');
  }
}

function closeModalPembayaran() {
  const modalPembayaran = document.getElementById('modal-pembayaran');
  if (modalPembayaran) {
    modalPembayaran.classList.add('hidden');
    modalPembayaran.classList.remove('flex');
  }
}

async function prosesBayarFinal(metode) {
  if (!activeOrderDetail) return;

  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);
  if (!client) return;

  try {
    const { error } = await client
      .from('transaksi')
      .update({
        status_pembayaran: 'Lunas'
      })
      .eq('id', activeOrderDetail.id);

    if (error) throw error;

    if (typeof showToast === 'function') {
      showToast(`Pembayaran Rp ${Math.round(activeOrderDetail.total_harga || 0).toLocaleString('id-ID')} (${metode}) Berhasil! 🎉`, "success");
    }

    closeModalPembayaran();
    closeModalDetailOrder();

    if (typeof loadOrderDataList === 'function') loadOrderDataList();
    if (typeof loadDataHome === 'function') loadDataHome();

  } catch (err) {
    console.error("Error prosesBayarFinal:", err);
    if (typeof showToast === 'function') showToast("Gagal memproses pembayaran", "error");
  }
}

// FUNGSI UPDATE BADGE TOTAL PELANGGAN
async function updateBadgeTotalPelanggan() {
  const badgeEl = document.getElementById('badge-total-pelanggan');
  if (!badgeEl) return;

  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);
  if (!client) return;

  try {
    let tokoId = (typeof currentToko !== 'undefined' && currentToko?.id) ? currentToko.id : localStorage.getItem('toko_id');
    
    let query = client.from('pelanggan').select('id', { count: 'exact', head: true });
    if (tokoId) query = query.eq('toko_id', tokoId);

    const { count, error } = await query;
    if (error) throw error;

    badgeEl.textContent = (count || 0) + ' Orang';
  } catch (err) {
    console.error("Error updateBadgeTotalPelanggan:", err);
  }
}

// Otomatis jalankan saat load data order
const originalLoadOrderDataList = window.loadOrderDataList;
window.loadOrderDataList = async function() {
  if (typeof originalLoadOrderDataList === 'function') {
    await originalLoadOrderDataList();
  }
  updateBadgeTotalPelanggan();
};

window.updateBadgeTotalPelanggan = updateBadgeTotalPelanggan;

// Expose fungsi ke scope global
window.actionBayarOrder = actionBayarOrder;
window.closeModalPembayaran = closeModalPembayaran;
window.prosesBayarFinal = prosesBayarFinal;