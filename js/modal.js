function openModalStatistik(type) {
  const titleEl = document.getElementById('modal-stat-title');
  const subTitleEl = document.getElementById('modal-stat-subtitle');
  const container = document.getElementById('list-stat-modal-container');

  var filtered = [];
  var now = new Date();
  var todayString = now.toDateString();

  if (type === 'Aktif') {
    titleEl.innerText = "🧺 Cucian Aktif";
    subTitleEl.innerText = "Orderan yang sedang berjalan/proses";
    filtered = globalTxCache.filter(t => {
      var st = t.status_laundry || 'Diterima';
      return st !== 'Selesai' && st !== 'Batal';
    });
  } else if (type === 'HarusSelesai') {
    titleEl.innerText = "⏰ Harus Selesai Hari Ini";
    subTitleEl.innerText = "Orderan estimasi selesai tanggal hari ini";
    filtered = globalTxCache.filter(t => {
      var st = t.status_laundry || 'Diterima';
      return (st !== 'Selesai' && st !== 'Batal') && t.estimasi_selesai && (new Date(t.estimasi_selesai).toDateString() === todayString);
    });
  } else if (type === 'Terlambat') {
    titleEl.innerText = "⚠️ Orderan Terlambat";
    subTitleEl.innerText = "Orderan melewati jadwal estimasi selesai";
    filtered = globalTxCache.filter(t => {
      var st = t.status_laundry || 'Diterima';
      return (st !== 'Selesai' && st !== 'Batal') && t.estimasi_selesai && (new Date(t.estimasi_selesai) < now);
    });
  } else if (type === 'Selesai') {
    titleEl.innerText = "✅ Orderan Selesai";
    subTitleEl.innerText = "Riwayat orderan yang sudah rampung";
    filtered = globalTxCache.filter(t => (t.status_laundry || 'Diterima') === 'Selesai');
  }

  if (!filtered.length) {
    container.innerHTML = '<p class="text-xs text-slate-400 text-center py-8">Tidak ada data orderan di kategori ini.</p>';
  } else {
    container.innerHTML = filtered.map((t, idx) => {
      var nmPel = t.pelanggan.nama || t.pelanggan.nama_pelanggan || 'Customer';
      var items = globalItemCache[t.id] || [];
      var summaryLayanan = items.length > 0 ? items.map(i => (i.layanan ? i.layanan.nama_layanan : 'Layanan') + ' (' + i.qty + ' ' + (i.layanan ? i.layanan.satuan : 'Kg') + ')') .join(', ') : 'Multi Layanan';

      return '<div onclick="openModalDetailOrderById(' + t.id + ')" class="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center cursor-pointer active:scale-[0.99] transition">' +
        '<div class="flex items-center gap-2.5"><span class="w-6 h-6 bg-blue-100 text-blue-700 font-bold text-xs rounded-full flex items-center justify-center shrink-0">' + (idx+1) + '</span>' +
        '<div class="max-w-[200px] sm:max-w-xs">' +
          '<p class="font-extrabold text-slate-900 text-xs truncate">' + nmPel + ' <span class="text-[9px] text-slate-400 font-normal">#' + t.id + '</span></p>' +
          '<p class="text-[11px] text-slate-500 mt-0.5 truncate">' + summaryLayanan + '</p>' +
          '<p class="text-[9px] text-amber-600 font-bold mt-0.5">Est: ' + (t.estimasi_selesai ? new Date(t.estimasi_selesai).toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : '-') + '</p>' +
        '</div></div>' +
        '<p class="font-black text-blue-600 text-xs">Rp ' + (t.total_harga ? t.total_harga.toLocaleString() : '0') + '</p>' +
      '</div>';
    }).join('');
  }

  openModalWithHistory('modal-rincian-statistik');
}

function openModalWithHistory(modalId) {
  const modalEl = document.getElementById(modalId);
  modalEl.classList.remove('hidden');
  if (!modalStack.includes(modalId)) {
    modalStack.push(modalId);
    window.history.pushState({ modal: modalId }, "");
  }
  const scrollElem = modalEl.querySelector('.scroll-area, #list-layanan-container, #list-pelanggan-container, #list-stat-modal-container, #list-report-modal-container, #list-profile-modal-container');
  if (scrollElem) scrollElem.scrollTop = 1;
}

function closeModalWithHistory(modalId) {
  document.getElementById(modalId).classList.add('hidden');
  modalStack = modalStack.filter(id => id !== modalId);
}

function closeOnBackdrop(event, modalId) {
  if (event.target.id === modalId) {
    if (modalId === 'modal-pos') closeModalPOS();
    else if (modalId === 'modal-detail-order') closeModalDetailOrder();
    else if (modalId === 'modal-edit-order') closeModalEditOrder();
    else if (modalId === 'modal-pelanggan') closeModalPilihPelanggan();
    else if (modalId === 'modal-layanan') closeModalPilihLayanan();
    else if (modalId === 'modal-qty') closeModalQty();
    else if (modalId === 'modal-kelola-layanan') closeModalKelolaLayanan();
    else if (modalId === 'modal-pengeluaran') closeModalPengeluaran();
    else closeModalWithHistory(modalId);
  }
}

function toggleFabMenu() {
  const container = document.getElementById('fab-container');
  const sideMenu = document.getElementById('fab-side-menu');
  const icon = document.getElementById('fab-icon');
  const backdrop = document.getElementById('fab-backdrop');
  const isOpen = container.classList.contains('fab-active');
  
  if (isOpen) {
    container.classList.remove('fab-active');
    container.style.bottom = '5rem'; 
    container.style.transform = 'translateY(0)';
    sideMenu.classList.add('opacity-0', 'pointer-events-none', 'translate-x-4');
    sideMenu.classList.remove('opacity-100', 'pointer-events-auto', 'translate-x-0');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    icon.innerText = '➕';
    icon.style.transform = 'rotate(0deg)';
  } else {
    container.classList.add('fab-active');
    container.style.bottom = '30%';
    container.style.transform = 'translateY(0)';
    sideMenu.classList.remove('opacity-0', 'pointer-events-none', 'translate-x-4');
    sideMenu.classList.add('opacity-100', 'pointer-events-auto', 'translate-x-0');
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    icon.innerText = '✕';
    icon.style.transform = 'rotate(90deg)';
  }
}

function openModalPengeluaran() {
// --- KODE GEMBOK TAMBAHAN ---
  const perms = getTokoPermissions();
  if (currentUserProfile && currentUserProfile.role !== 'owner' && !perms.is_manager && !perms.akses_pengeluaran) {
    showToast("Anda tidak memiliki izin mencatat pengeluaran!", "error");
    return;
  }
  // ----------------------------

  // ... (isi kode lama openModalPengeluaran di bawahnya biarkan saja) ...

    document.getElementById('input_keterangan_pengeluaran').value = '';
    document.getElementById('input_nominal_pengeluaran').value = '';
  openModalWithHistory('modal-pengeluaran');
}
function closeModalPengeluaran() { closeModalWithHistory('modal-pengeluaran'); }

function openModalPOS() { resetPOSState(); openModalWithHistory('modal-pos'); }
function closeModalPOS() { closeModalWithHistory('modal-pos'); }
// --- KODE GEMBOK TAMBAHAN ---
function openModalKelolaLayanan() {

    const perms = getTokoPermissions();
  if (currentUserProfile && currentUserProfile.role !== 'owner' && !perms.is_manager && !perms.akses_layanan) {
    showToast("Anda tidak memiliki izin mengelola layanan & harga!", "error");
    return;
  }
  // ----------------------------

  // ... (isi kode lama openModalKelolaLayanan di bawahnya biarkan saja) ...

    openModalWithHistory('modal-kelola-layanan');
    renderKelolaLayananList();
}
function closeModalKelolaLayanan() { closeModalWithHistory('modal-kelola-layanan'); }