async function preloadLayanan() {
  if(supabaseClient && currentToko) {
    const res = await supabaseClient.from('layanan').select('*').eq('toko_id', currentToko.id).order('id', {ascending: true});
    allLayanan = res.data || [];
  }
}

async function renderKelolaLayananList() {
  await preloadLayanan();
  const container = document.getElementById('list-kelola-layanan-container');
  if(!allLayanan.length) {
    container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">Belum ada layanan.</p>';
    return;
  }
  container.innerHTML = allLayanan.map(l => {
    return '<div class="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-200">' +
      '<div>' +
        '<p class="font-extrabold text-slate-800 text-xs">' + l.nama_layanan + '</p>' +
        '<p class="text-[10px] text-slate-500">Rp ' + l.harga.toLocaleString() + ' / ' + l.satuan + ' • Est: ' + (l.estimasi_hari || 1) + ' Hari</p>' +
      '</div>' +
      '<button onclick="hapusLayanan(' + l.id + ')" class="bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[10px] px-2.5 py-1.5 rounded-lg">Hapus</button>' +
    '</div>';
  }).join('');
}

async function tambahLayananBaru() {
  const nama = document.getElementById('new_nama_layanan').value;
  const harga = parseFloat(document.getElementById('new_harga_layanan').value);
  const satuan = document.getElementById('new_satuan_layanan').value;
  const estimasi = parseFloat(document.getElementById('new_estimasi_hari').value) || 1;

  if(!nama || isNaN(harga)) {
    showToast("Nama layanan dan harga wajib diisi dengan benar!", "error");
    return;
  }

  if(currentToko) {
    const { error } = await supabaseClient.from('layanan').insert([{
      nama_layanan: nama,
      harga: harga,
      satuan: satuan,
      estimasi_hari: estimasi,
      toko_id: currentToko.id
    }]);

    if(!error) {
      showToast("Layanan baru berhasil ditambahkan! 🎉", "success");
      document.getElementById('new_nama_layanan').value = '';
      document.getElementById('new_harga_layanan').value = '';
      document.getElementById('new_estimasi_hari').value = '';
      renderKelolaLayananList();
      preloadLayanan();
    } else {
      showToast("Gagal menambah layanan: " + error.message, "error");
    }
  }
}

async function hapusLayanan(id) {
  if(confirm("Yakin ingin menghapus layanan ini?")) {
    const { error } = await supabaseClient.from('layanan').delete().eq('id', id);
    if(!error) {
      showToast("Layanan berhasil dihapus.", "success");
      renderKelolaLayananList();
      preloadLayanan();
    } else {
      showToast("Gagal menghapus layanan.", "error");
    }
  }
}

function resetPOSState() {
  selectedPelanggan = null; 
  cartLayanan = [];
  document.getElementById('display-pelanggan').innerHTML = '<p class="text-xs text-slate-400 italic">Silahkan Pilih Customer Terlebih Dahulu.</p>';
  renderCartLayanan();
  document.getElementById('form-opsional').classList.add('hidden');
}

function openModalDetailOrder(txItem) {
  activeOrderDetail = txItem;
  var nmPel = txItem.pelanggan ? (txItem.pelanggan.nama || txItem.pelanggan.nama_pelanggan || 'Pelanggan #' + txItem.pelanggan_id) : 'Tanpa Nama';
  var hpPel = txItem.pelanggan ? (txItem.pelanggan.no_hp || '08-') : '08-';

  document.getElementById('detail-nota-id').innerText = 'Nota #' + txItem.id;
  document.getElementById('detail-nama-pelanggan').innerText = nmPel;
  document.getElementById('detail-hp-pelanggan').innerText = hpPel;
  document.getElementById('detail-parfum').innerText = txItem.parfum || 'Standard';
  
  const itemsContainer = document.getElementById('detail-layanan-list-container');
  const items = globalItemCache[txItem.id] || [];
  if(items.length > 0) {
    itemsContainer.innerHTML = items.map(it => {
      var layName = it.layanan ? it.layanan.nama_layanan : 'Layanan';
      var sat = it.layanan ? it.layanan.satuan : 'Kg';
      return '<div class="flex justify-between items-center text-xs py-1 border-b border-slate-100 last:border-0">' +
        '<div><span class="font-extrabold text-slate-800">' + layName + '</span> <span class="text-slate-400">(' + it.qty + ' ' + sat + ')</span></div>' +
        '<span class="font-bold text-blue-600">Rp ' + (it.subtotal ? it.subtotal.toLocaleString() : '0') + '</span>' +
      '</div>';
    }).join('');
  } else {
    itemsContainer.innerHTML = '<p class="text-xs text-slate-400 italic">Tidak ada rincian item.</p>';
  }
  
  document.getElementById('detail-tgl-masuk').innerText = formatDateIndo(txItem.created_at);
  document.getElementById('detail-tgl-selesai').innerText = formatDateIndo(txItem.estimasi_selesai);
  document.getElementById('detail-status-bayar').innerText = txItem.status_pembayaran || 'Belum Lunas';
  document.getElementById('detail-catatan').innerText = txItem.catatan || 'Tidak ada catatan';
  document.getElementById('detail-total-price').innerText = 'Rp ' + (txItem.total_harga ? txItem.total_harga.toLocaleString() : '0');

  openModalWithHistory('modal-detail-order');
}

function openModalDetailOrderById(id) {
  var item = globalTxCache.find(x => x.id === id);
  if(item) openModalDetailOrder(item);
}

function closeModalDetailOrder() { closeModalWithHistory('modal-detail-order'); }

function openModalEditOrder() {
// --- KODE GEMBOK TAMBAHAN ---
  const perms = getTokoPermissions();
  if (currentUserProfile && currentUserProfile.role !== 'owner' && !perms.is_manager && !perms.akses_edit_order) {
    showToast("Kasir tidak diizinkan mengubah/edit data order!", "error");
    return;
  }
  // ----------------------------

  // ... (isi kode lama openModalEditOrder di bawahnya) ...  
  
    if(!activeOrderDetail) return;
    var perms = getTokoPermissions();
  if(currentProfile && currentProfile.role === 'kasir' && !perms.is_manager && !perms.akses_edit_order) {
    showToast("Izin edit/batal order dikunci oleh Owner!", "error");
    return;
  }
  document.getElementById('edit_parfum').value = activeOrderDetail.parfum || 'Standard';
  document.getElementById('edit_catatan').value = activeOrderDetail.catatan || '';
  openModalWithHistory('modal-edit-order');
}

function closeModalEditOrder() { closeModalWithHistory('modal-edit-order'); }

async function simpanEditOrderFinal() {
  if(!activeOrderDetail) return;
  const newParfum = document.getElementById('edit_parfum').value;
  const newCatatan = document.getElementById('edit_catatan').value;

  const { error } = await supabaseClient.from('transaksi').update({
    parfum: newParfum,
    catatan: newCatatan
  }).eq('id', activeOrderDetail.id);

  if(!error) {
    showToast("Orderan #" + activeOrderDetail.id + " berhasil diperbarui! ✅", "success");
    closeModalEditOrder();
    closeModalDetailOrder();
    loadDataHome();
  } else {
    showToast("Gagal memperbarui orderan!", "error");
  }
}

async function actionLanjutProses() {
  if(!activeOrderDetail) return;
  var statusSekarang = activeOrderDetail.status_laundry || 'Diterima';
  var nextStatus = 'Dicuci';

  if(statusSekarang === 'Diterima') nextStatus = 'Dicuci';
  else if(statusSekarang === 'Dicuci') nextStatus = 'Disetrika';
  else if(statusSekarang === 'Disetrika') nextStatus = 'Siap Diambil';
  else if(statusSekarang === 'Siap Diambil') nextStatus = 'Selesai';
  else nextStatus = 'Selesai';

  const { error } = await supabaseClient.from('transaksi').update({ status_laundry: nextStatus }).eq('id', activeOrderDetail.id);
  
  if(!error) {
    showToast("Status order #" + activeOrderDetail.id + " berhasil diubah menjadi " + nextStatus + "!", "success");
    closeModalDetailOrder();
    loadDataHome();
  } else {
    showToast("Gagal mengubah status order.", "error");
  }
}

async function actionBatalkanOrder() {
// --- KODE GEMBOK TAMBAHAN ---
  const perms = getTokoPermissions();
  if (currentUserProfile && currentUserProfile.role !== 'owner' && !perms.is_manager && !perms.akses_edit_order) {
    showToast("Kasir tidak diizinkan membatalkan order!", "error");
    return;
  }
  // ----------------------------

  // ... (isi kode lama actionBatalkanOrder di bawahnya) ...

    if(!activeOrderDetail) return;
    var perms = getTokoPermissions();
  if(currentProfile && currentProfile.role === 'kasir' && !perms.is_manager && !perms.akses_edit_order) {
    showToast("Izin pembatalan order dikunci oleh Owner!", "error");
    return;
  }
  if(confirm("Apakah Anda yakin ingin membatalkan orderan #" + activeOrderDetail.id + "?")) {
    const { error } = await supabaseClient.from('transaksi').update({ status_laundry: 'Batal' }).eq('id', activeOrderDetail.id);
    if(!error) {
        showToast("Orderan #" + activeOrderDetail.id + " telah dibatalkan.", "info");
        closeModalDetailOrder();
        loadDataHome();
    } else {
        showToast("Gagal membatalkan order.", "error");
    }
  }
}

async function actionBayarOrder() {
  if(!activeOrderDetail) return;
  const { error } = await supabaseClient.from('transaksi').update({ status_pembayaran: 'Lunas' }).eq('id', activeOrderDetail.id);
  
  if(!error) {
    showToast("Pembayaran LUNAS untuk order #" + activeOrderDetail.id + "!", "success");
    closeModalDetailOrder();
    loadDataHome();
  } else {
    showToast("Gagal memproses pembayaran.", "error");
  }
}

function kirimNotifikasiWA() {
  if(!activeOrderDetail) return;
  var pelName = activeOrderDetail.pelanggan ? (activeOrderDetail.pelanggan.nama || activeOrderDetail.pelanggan.nama_pelanggan) : 'Pelanggan';
  var hp = activeOrderDetail.pelanggan ? activeOrderDetail.pelanggan.no_hp : '';
  
  if(!hp || hp.length < 5) {
    showToast("Nomor HP pelanggan tidak valid!", "error");
    return;
  }

  var formattedHp = hp.replace(/[^0-9]/g, '');
  if(formattedHp.startsWith('0')) formattedHp = '62' + formattedHp.substring(1);

  var template = (currentToko && currentToko.wa_template) ? currentToko.wa_template : "Halo Kak {nama_pelanggan}, orderan Nota #{id_nota} sudah selesai! Total: Rp {total_harga}. Terima kasih!";
  
  var msg = template
    .replace('{nama_pelanggan}', pelName)
    .replace('{id_nota}', activeOrderDetail.id)
    .replace('{total_harga}', (activeOrderDetail.total_harga || 0).toLocaleString());

  var waUrl = "https://wa.me/" + formattedHp + "?text=" + encodeURIComponent(msg);
  window.open(waUrl, '_blank');
}

async function openModalPilihLayanan() {
  openModalWithHistory('modal-layanan');
  if(supabaseClient && currentToko) { 
    const res = await supabaseClient.from('layanan').select('*').eq('toko_id', currentToko.id); 
    allLayanan = res.data || []; 
    renderLayananList(allLayanan); 
  }
}
function closeModalPilihLayanan() { closeModalWithHistory('modal-layanan'); }

function renderLayananList(data) {
  const container = document.getElementById('list-layanan-container');
  if(!data.length) { container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">Belum ada layanan.</p>'; return; }
  container.innerHTML = data.map(function(l) {
    var estText = l.estimasi_hari ? (l.estimasi_hari < 1 ? (l.estimasi_hari * 24) + ' Jam' : l.estimasi_hari + ' Hari') : '1 Hari';
    return '<div class="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">' +
      '<div class="flex items-center gap-2.5"><span class="text-xl">🧺</span>' +
      '<div><p class="font-extrabold text-slate-800 text-xs">' + l.nama_layanan + '</p>' +
      '<p class="text-[10px] text-slate-500 mt-0.5">Rp ' + l.harga.toLocaleString() + ' / ' + l.satuan + ' • Estimasi: <span class="font-bold text-amber-600">' + estText + '</span></p></div></div>' +
      '<button onclick="openModalQty(' + l.id + ')" class="bg-indigo-300 text-indigo-900 font-bold text-[11px] px-3.5 py-1.5 rounded-xl">PILIH</button>' +
    '</div>';
  }).join('');
}

function filterLayananList() {
  var q = document.getElementById('search-layanan').value.toLowerCase();
  renderLayananList(allLayanan.filter(l => l.nama_layanan.toLowerCase().includes(q)));
}

var tempLayananId = null;
function openModalQty(layananId) { tempLayananId = layananId; document.getElementById('input-qty-value').value = 1; openModalWithHistory('modal-qty'); }
function closeModalQty() { closeModalWithHistory('modal-qty'); }

function confirmQtyLayanan() {
  const qty = parseFloat(document.getElementById('input-qty-value').value) || 1;
  const l = allLayanan.find(item => item.id === tempLayananId);
  if(!l) return;
  
  cartLayanan.push({
    layanan: l,
    qty: qty,
    subtotal: l.harga * qty
  });

  showToast(`Layanan ${l.nama_layanan} ditambahkan (${qty})`, "info");
  renderCartLayanan();
  closeModalQty(); 
  closeModalPilihLayanan();
}

function removeCartItem(index) {
  cartLayanan.splice(index, 1);
  showToast("Layanan dihapus dari keranjang.", "info");
  renderCartLayanan();
}

function renderCartLayanan() {
  const container = document.getElementById('display-layanan-list');
  const formOpsional = document.getElementById('form-opsional');
  
  if(cartLayanan.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 italic text-center py-2">Belum ada layanan yang ditambahkan.</p>';
    document.getElementById('display-total-harga').innerText = 'Rp 0';
    formOpsional.classList.add('hidden');
    return;
  }

  let totalSemua = 0;
  container.innerHTML = cartLayanan.map((item, idx) => {
    totalSemua += item.subtotal;
    var estText = item.layanan.estimasi_hari ? (item.layanan.estimasi_hari < 1 ? (item.layanan.estimasi_hari * 24) + ' Jam' : item.layanan.estimasi_hari + ' Hari') : '1 Hari';
    return '<div class="p-3 bg-white rounded-xl border border-slate-100 flex justify-between items-center gap-2">' +
      '<div class="flex-1 overflow-hidden">' +
        '<p class="font-extrabold text-slate-800 text-xs truncate">' + item.layanan.nama_layanan + '</p>' +
        '<p class="text-[10px] text-slate-400 mt-0.5">Rp ' + item.layanan.harga.toLocaleString() + ' / ' + item.layanan.satuan + ' • Qty: ' + item.qty + ' ' + item.layanan.satuan + '</p>' +
        '<p class="text-[10px] text-amber-600 font-bold mt-0.5">Est: ' + estText + '</p>' +
      '</div>' +
      '<div class="text-right shrink-0">' +
        '<p class="font-black text-blue-600 text-xs">Rp ' + item.subtotal.toLocaleString() + '</p>' +
        '<button onclick="removeCartItem(' + idx + ')" class="text-[10px] text-rose-600 font-bold mt-1">Hapus</button>' +
      '</div>' +
    '</div>';
  }).join('');

  document.getElementById('display-total-harga').innerText = 'Rp ' + totalSemua.toLocaleString();
  formOpsional.classList.remove('hidden');
}

async function submitOrderFinal() {
  if(!selectedPelanggan) { showToast("Pilih customer dulu!", "error"); return; }
  if(cartLayanan.length === 0) { showToast("Tambahkan minimal 1 layanan!", "error"); return; }
  if(!currentToko) return;

  const parfum = document.getElementById('pilih_parfum').value;
  const catatan = document.getElementById('catatan_order').value || '';
  
  let totalSemuaHarga = 0;
  let maxHariEst = 1;
  cartLayanan.forEach(item => {
    totalSemuaHarga += item.subtotal;
    let h = item.layanan.estimasi_hari !== undefined ? parseFloat(item.layanan.estimasi_hari) : 1;
    if(h > maxHariEst) maxHariEst = h;
  });

  const tglSelesai = new Date();
  tglSelesai.setTime(tglSelesai.getTime() + (maxHariEst * 24 * 60 * 60 * 1000));

  const resHeader = await supabaseClient.from('transaksi').insert([{
    pelanggan_id: selectedPelanggan.id,
    total_harga: totalSemuaHarga,
    parfum: parfum,
    catatan: catatan,
    estimasi_selesai: tglSelesai.toISOString(),
    status_laundry: 'Diterima',
    toko_id: currentToko.id
  }]).select().single();

  if(resHeader.error || !resHeader.data) {
    showToast("Gagal menyimpan transaksi utama!", "error");
    return;
  }

  const newTransaksiId = resHeader.data.id;

  let hasError = false;
  for(let item of cartLayanan) {
    const resItem = await supabaseClient.from('transaksi_item').insert([{
      transaksi_id: newTransaksiId,
      layanan_id: item.layanan.id,
      qty: item.qty,
      subtotal: item.subtotal
    }]);
    if(resItem.error) hasError = true;
  }

  if(!hasError) {
    showToast("PESANAN BERHASIL DISIMPAN! 🎉", "success");
    closeModalPOS();
    loadDataHome();
  } else { 
    showToast("Transaksi tersimpan sebagian.", "error");
  }
}

async function filterOrderTab(status) {
  currentOrderTab = status;

  var tabs = document.getElementById('panel-order').querySelectorAll('.tab-order-btn');
  tabs.forEach(function(tb) { tb.classList.remove('active'); });
  var activeTabBtn = document.getElementById('tab-' + status);
  if(activeTabBtn) activeTabBtn.classList.add('active');

  const container = document.getElementById('list-order-status');
  if(!container || !supabaseClient) return;

  var filtered = globalTxCache.filter(function(t) {
    var st = t.status_laundry || 'Diterima';
    if (status === 'Antrian') return st === 'Diterima';
    if (status === 'Proses') return st === 'Dicuci' || st === 'Disetrika' || st === 'Siap Diambil';
    if (status === 'Selesai') return st === 'Selesai';
    if (status === 'Batal') return st === 'Batal';
    return true;
  });

  if(!filtered.length) {
    container.innerHTML = '<p class="text-xs text-slate-400 text-center py-10">Tidak ada orderan di kategori ' + status + '.</p>';
    return;
  }

  container.innerHTML = filtered.map(function(t) {
    var namaPel = t.pelanggan.nama || t.pelanggan.nama_pelanggan || 'Pelanggan #' + t.pelanggan_id;
    var items = globalItemCache[t.id] || [];
    var summaryLayanan = items.length > 0 ? items.map(i => (i.layanan ? i.layanan.nama_layanan : 'Layanan') + ' (' + i.qty + ' ' + (i.layanan ? i.layanan.satuan : 'Kg') + ')') .join(', ') : 'Multi Layanan';

    return '<div onclick="openModalDetailOrderById(' + t.id + ')" class="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 cursor-pointer active:scale-[0.99] transition">' +
      '<div class="flex justify-between items-start">' +
        '<div class="max-w-[220px]">' +
          '<p class="font-extrabold text-slate-900 text-sm truncate">' + namaPel + ' <span class="text-[10px] text-slate-400 font-normal">#' + t.id + '</span></p>' +
          '<p class="text-xs text-slate-500 mt-0.5 truncate">' + summaryLayanan + '</p>' +
        '</div>' +
        '<p class="font-black text-blue-600 text-sm">Rp ' + (t.total_harga ? t.total_harga.toLocaleString() : '0') + '</p>' +
      '</div>' +
      '<div class="flex justify-between items-center pt-2 border-t border-slate-200/60 text-xs">' +
        '<div class="flex items-center gap-2">' +
          '<span class="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md">' + (t.status_laundry || 'Diterima') + '</span>' +
          '<span class="text-[10px] text-slate-400">Est: ' + (t.estimasi_selesai ? new Date(t.estimasi_selesai).toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : '-') + '</span>' +
        '</div>' +
        '<span class="text-[11px] text-blue-600 font-bold">Detail ➔</span>' +
      '</div>' +
    '</div>';
  }).join('');
}