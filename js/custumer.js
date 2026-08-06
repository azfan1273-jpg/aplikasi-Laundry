async function openModalPilihPelanggan() {
  openModalWithHistory('modal-pelanggan');
  if(supabaseClient && currentToko) {
    const res = await supabaseClient.from('pelanggan').select('*').eq('toko_id', currentToko.id).order('id', {ascending: false});
    allPelanggan = res.data || [];
    renderPelangganList(allPelanggan);
  }
}
function closeModalPilihPelanggan() { closeModalWithHistory('modal-pelanggan'); }

function renderPelangganList(data) {
  const container = document.getElementById('list-pelanggan-container');
  if(!data.length) { container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">Belum ada pelanggan.</p>'; return; }
  container.innerHTML = data.map(function(p) {
    var nm = p.nama || p.nama_pelanggan || 'Customer';
    return '<div class="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100">' +
      '<div class="flex items-center gap-2.5"><div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">👤</div>' +
      '<div><p class="font-extrabold text-slate-800 text-xs">' + nm + '</p><p class="text-[10px] text-slate-400">' + (p.no_hp || '08-') + '</p></div></div>' +
      '<button onclick="selectCustomer(' + p.id + ', \'' + nm + '\', \'' + (p.no_hp||'') + '\')" class="bg-indigo-300 text-indigo-900 font-bold text-[11px] px-3 py-1.5 rounded-lg">PILIH</button>' +
    '</div>';
  }).join('');
}

function filterPelangganList() {
  var q = document.getElementById('search-pelanggan').value.toLowerCase();
  var filtered = allPelanggan.filter(p => (p.nama||p.nama_pelanggan||'').toLowerCase().includes(q) || (p.no_hp && p.no_hp.includes(q)));
  renderPelangganList(filtered);
}

function selectCustomer(id, nama, no_hp) {
  selectedPelanggan = { id: id, nama: nama, no_hp: no_hp };
  document.getElementById('display-pelanggan').innerHTML = 
    '<div class="flex items-center gap-2 mt-1"><div class="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">👤</div>' +
    '<div><p class="font-extrabold text-slate-800 text-xs">' + nama + '</p><p class="text-[10px] text-slate-400">' + (no_hp || '-') + '</p></div></div>';
  closeModalPilihPelanggan();
}

function toggleFormCustomerBaru() { document.getElementById('form-customer-baru').classList.toggle('hidden'); }

async function simpanCustomerBaru() {
  const nama = document.getElementById('new_nama_pelanggan').value;
  const no_hp = document.getElementById('new_no_hp').value;
  if(!nama) { showToast("Isi nama customer!", "error"); return; }
  if(currentToko) {
    const res = await supabaseClient.from('pelanggan').insert([{ nama: nama, no_hp: no_hp, toko_id: currentToko.id }]).select().single();
    if(res.data) {
      showToast(`Customer ${nama} berhasil disimpan!`, "success");
      selectCustomer(res.data.id, (res.data.nama||res.data.nama_pelanggan), res.data.no_hp);
      document.getElementById('new_nama_pelanggan').value = ''; document.getElementById('new_no_hp').value = ''; toggleFormCustomerBaru();
    } else {
      showToast("Gagal menyimpan customer baru.", "error");
    }
  }
}