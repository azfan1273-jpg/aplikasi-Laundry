// ==========================================
// KONTROL DAFTAR ORDER & TRANSAKSI (FIX FULL)
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
    let query = client.from('orders').select('*');

    // 1. Filter toko_id / user_id yang fleksibel
    let tokoId = (typeof currentToko !== 'undefined' && currentToko?.id) ? currentToko.id : localStorage.getItem('toko_id');
    const userRes = await client.auth.getUser();
    const userId = userRes?.data?.user?.id;

    if (tokoId) {
      query = query.eq('toko_id', tokoId);
    } else if (userId) {
      query = query.eq('user_id', userId);
    }

    let { data: orders, error } = await query.order('id', { ascending: false });

    if (error) throw error;

    let rawOrders = orders || [];

    // 2. Filter berdasarkan Tab Status (Antrian, Proses, Selesai, Batal)
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

    container.innerHTML = filteredOrders.map(o => {
      const notaNum = o.id ? String(o.id).padStart(6, '0') : '000000';
      const namaPel = o.nama_pelanggan || o.pelanggan_nama || (o.pelanggan ? o.pelanggan.nama : 'Pelanggan');
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
      container.innerHTML = `<p class="text-xs text-rose-500 text-center py-10">Gagal memuat data order: ${err.message || err}</p>`;
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
function actionBatalkanOrder() {
  if (typeof getTokoPermissions === 'function' && typeof currentUserProfile !== 'undefined' && currentUserProfile) {
    const perms = getTokoPermissions();
    if (currentUserProfile.role !== 'owner' && !perms.is_manager && !perms.akses_edit_order) {
      if (typeof showToast === 'function') showToast("Kasir tidak diizinkan membatalkan order!", "error");
      return;
    }
  }

  if (confirm("Apakah Anda yakin ingin membatalkan order ini?")) {
    if (typeof showToast === 'function') showToast("Order dibatalkan.", "info");
    closeModalDetailOrder();
  }
}

function openModalDetailOrder(orderId) {
  const modal = document.getElementById('modal-detail-order');
  if (modal) modal.classList.remove('hidden');
}

function closeModalDetailOrder() {
  if (typeof closeModalWithHistory === 'function') closeModalWithHistory('modal-detail-order');
}

// Inisialisasi otomatis saat script dimuat
document.addEventListener('DOMContentLoaded', () => {
  loadOrderDataList();
});