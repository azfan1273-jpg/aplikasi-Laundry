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

// FUNGSI SIMPAN PELANGGAN BARU (FIX SUPABASE CLIENT & TOKO ID)
async function simpanCustomerBaru(e) {
  if (e && e.preventDefault) e.preventDefault();

  const namaInput = document.getElementById('new_nama_pelanggan');
  const hpInput = document.getElementById('new_no_hp');

  const nama = namaInput?.value?.trim();
  const no_hp = hpInput?.value?.trim() || '';

  if (!nama) {
    alert('Harap isi Nama Pelanggan!');
    return;
  }

  // Gunakan client Supabase yang aktif di aplikasi kamu
  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);

  if (!client) {
    alert('Koneksi Supabase belum siap. Harap refresh halaman.');
    return;
  }

  try {
    // Ambil data user & toko yang sedang aktif
    const userRes = await client.auth.getUser();
    const userId = userRes?.data?.user?.id || null;
    const tokoId = (typeof currentToko !== 'undefined' && currentToko?.id) ? currentToko.id : (localStorage.getItem('toko_id') || null);

    const payload = {
      nama: nama,
      no_hp: no_hp,
      user_id: userId
    };

    // Tambahkan toko_id jika ketersediaan kolom/data ada
    if (tokoId) payload.toko_id = tokoId;

    const { data, error } = await client
      .from('pelanggan')
      .insert([payload])
      .select();

    if (error) {
      console.error('Error insert pelanggan:', error);
      alert('Gagal menyimpan pelanggan: ' + error.message);
      return;
    }

    alert('Pelanggan berhasil disimpan!');

    // Reset Input & Hide Form
    if (namaInput) namaInput.value = '';
    if (hpInput) hpInput.value = '';
    const formCustomerBaru = document.getElementById('form-customer-baru');
    if (formCustomerBaru) formCustomerBaru.classList.add('hidden');

    // Update Label Pelanggan Terpilih di Modal POS
    const label = document.getElementById('selectedCustomerName');
    if (label) {
      label.textContent = nama;
      label.className = 'text-sm font-bold text-indigo-600';
    }

    // Refresh list pelanggan & tutup modal
    if (typeof openModalPilihPelanggan === 'function') {
      openModalPilihPelanggan();
    }
    if (typeof closeModalPilihPelanggan === 'function') {
      closeModalPilihPelanggan();
    }

  } catch (err) {
    console.error('Error catch simpan pelanggan:', err);
    alert('Terjadi kesalahan sistem: ' + err.message);
  }
}