// ==========================================
// KONTROL DAFTAR ORDER & TRANSAKSI
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
  if (typeof supabaseClient === 'undefined' || !supabaseClient || !currentToko) return;

  const container = document.getElementById('list-order-status');
  if (!container) return;

  container.innerHTML = '<p class="text-xs text-slate-400 text-center py-10">Memuat data order...</p>';

  try {
    const { data: orders, error } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('toko_id', currentToko.id)
      .eq('status', currentFilterTab);

    if (error || !orders || orders.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-400 text-center py-10">Tidak ada orderan di status ini.</p>';
      return;
    }

    container.innerHTML = orders.map(o => `
      <div onclick="openModalDetailOrder('${o.id}')" class="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex justify-between items-center cursor-pointer hover:border-blue-300 transition">
        <div>
          <h4 class="font-extrabold text-slate-800 text-xs">Nota #${o.id.toString().substring(0,6)} - ${o.nama_pelanggan || 'Pelanggan'}</h4>
          <p class="text-[10px] text-slate-400 mt-0.5">${o.total_harga ? 'Rp ' + o.total_harga.toLocaleString() : 'Rp 0'}</p>
        </div>
        <span class="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-lg">${o.status}</span>
      </div>
    `).join('');

  } catch (err) {
    console.error("Error loadOrderDataList:", err);
    container.innerHTML = '<p class="text-xs text-rose-500 text-center py-10">Gagal memuat data order.</p>';
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