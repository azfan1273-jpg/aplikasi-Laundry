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
    // Kueri relasi JOIN ke tabel pelanggan untuk ambil nama
    let query = client.from('transaksi').select('*, pelanggan(nama, no_hp)');

    let tokoId = (typeof currentToko !== 'undefined' && currentToko?.id) ? currentToko.id : localStorage.getItem('toko_id');
    const userRes = await client.auth.getUser();
    const userId = userRes?.data?.user?.id;

    if (tokoId) {
      query = query.eq('toko_id', tokoId);
    } else if (userId) {
      query = query.eq('user_id', userId);
    }

    let { data: orders, error } = await query.order('id', { ascending: false });

    if (error || !orders) {
      const fallback = await client.from('transaksi').select('*, pelanggan(nama, no_hp)').order('id', { ascending: false });
      if (fallback.data) {
        orders = fallback.data;
        error = null;
      }
    }

    if (error) throw error;

    let rawOrders = orders || [];

    let filteredOrders = rawOrders.filter(o => {
      const st = (o.status_laundry || o.status || 'Diterima').trim();
      
      if (currentFilterTab === 'Antrian') {
        return st === 'Antrian' || st === 'Diterima' || st === 'Baru' || st === 'Proses';
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

    container.innerHTML = filteredOrders.map(o => {
      const notaNum = o.id ? String(o.id).padStart(6, '0') : '000000';
      // Prioritaskan nama dari relasi tabel pelanggan
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
    // Tarik detail data dari tabel 'transaksi' beserta relasi pelanggan
    const { data: order, error } = await client
      .from('transaksi')
      .select('*, pelanggan(nama, no_hp)')
      .eq('id', orderId)
      .maybeSingle();

    if (error || !order) {
      console.error("Gagal mengambil detail order:", error);
      return;
    }

    activeOrderDetail = order;

    // Isikan data ke elemen UI Modal
    const notaIdEl = document.getElementById('detail-nota-id');
    const namaPelEl = document.getElementById('detail-nama-pelanggan');
    const hpPelEl = document.getElementById('detail-hp-pelanggan');
    const statusBayarEl = document.getElementById('detail-status-bayar');
    const tglMasukEl = document.getElementById('detail-tgl-masuk');
    const totalPriceEl = document.getElementById('detail-total-price');

    const notaNum = String(order.id).padStart(6, '0');
    const namaPel = (order.pelanggan && order.pelanggan.nama) ? order.pelanggan.nama : (order.nama_pelanggan || 'Pelanggan Umum');
    const hpPel = (order.pelanggan && order.pelanggan.no_hp) ? order.pelanggan.no_hp : '08-';
    const totalHargaFormatted = 'Rp ' + Math.round(order.total_harga || 0).toLocaleString('id-ID');

    if (notaIdEl) notaIdEl.textContent = `Nota #${notaNum}`;
    if (namaPelEl) namaPelEl.textContent = namaPel;
    if (hpPelEl) hpPelEl.textContent = hpPel;
    if (statusBayarEl) statusBayarEl.textContent = order.status_pembayaran || 'Belum Lunas';
    if (tglMasukEl) tglMasukEl.textContent = order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID') : '-';
    if (totalPriceEl) totalPriceEl.textContent = totalHargaFormatted;

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

// FIX ERROR: FUNGSI LANJUT PROSES ORDER
async function actionLanjutProses() {
  if (!activeOrderDetail) return;

  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);
  if (!client) return;

  const currentStatus = (activeOrderDetail.status_laundry || activeOrderDetail.status || 'Diterima').trim();
  let nextStatus = 'Proses';

  if (currentStatus === 'Diterima' || currentStatus === 'Antrian') {
    nextStatus = 'Proses';
  } else if (currentStatus === 'Proses') {
    nextStatus = 'Selesai';
  } else {
    if (typeof showToast === 'function') showToast("Order ini sudah selesai!", "info");
    return;
  }

  try {
    const { error } = await client
      .from('transaksi')
      .update({ status_laundry: nextStatus })
      .eq('id', activeOrderDetail.id);

    if (error) throw error;

    if (typeof showToast === 'function') {
      showToast(`Status Order #${activeOrderDetail.id} diubah jadi ${nextStatus}! 🎉`, "success");
    }

    closeModalDetailOrder();
    
    // Refresh daftar order & data beranda
    if (typeof loadOrderDataList === 'function') loadOrderDataList();
    if (typeof loadDataHome === 'function') loadDataHome();

  } catch (err) {
    console.error("Error actionLanjutProses:", err);
    if (typeof showToast === 'function') showToast("Gagal memperbarui status order", "error");
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

// Expose fungsi ke scope global
window.actionBayarOrder = actionBayarOrder;
window.closeModalPembayaran = closeModalPembayaran;
window.prosesBayarFinal = prosesBayarFinal;