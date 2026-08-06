// ==========================================
// FILE: js/custumer.js (VERSI FIXED & CLEAN)
// ==========================================

var allPelanggan = [];
var selectedPelanggan = null;

// Menutup Modal Pilih Pelanggan
function closeModalPilihPelanggan() {
  if (typeof closeModalWithHistory === 'function') {
    closeModalWithHistory('modal-pelanggan');
  } else {
    const modal = document.getElementById('modal-pelanggan');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }
}

// Render List Pelanggan di Modal
function renderPelangganList(data) {
  const container = document.getElementById('list-pelanggan-container');
  if (!container) return;

  if (!data || !data.length) { 
    container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4 italic">Belum ada pelanggan.</p>'; 
    return; 
  }

  container.innerHTML = data.map(function(p) {
    var nm = p.nama || p.nama_pelanggan || 'Customer';
    var hp = p.no_hp || '08-';
    return '<div class="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 mb-1.5">' +
      '<div class="flex items-center gap-2.5"><div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">👤</div>' +
      '<div><p class="font-extrabold text-slate-800 text-xs">' + nm + '</p><p class="text-[10px] text-slate-400">' + hp + '</p></div></div>' +
      '<button type="button" onclick="selectCustomer(' + p.id + ', \'' + nm + '\', \'' + hp + '\')" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition">PILIH</button>' +
    '</div>';
  }).join('');
}

// Filter Pencarian Pelanggan
function filterPelangganList() {
  var input = document.getElementById('search-pelanggan');
  if (!input) return;
  var q = input.value.toLowerCase();
  var filtered = allPelanggan.filter(p => (p.nama || p.nama_pelanggan || '').toLowerCase().includes(q) || (p.no_hp && p.no_hp.includes(q)));
  renderPelangganList(filtered);
}

// Memilih Pelanggan & Memasukkan ke UI POS
function selectCustomer(id, nama, no_hp) {
  selectedPelanggan = { id: id, nama: nama, no_hp: no_hp };
  
  const displayLabel = document.getElementById('selectedCustomerName');
  if (displayLabel) {
    displayLabel.textContent = nama + (no_hp ? ' (' + no_hp + ')' : '');
    displayLabel.className = 'text-sm font-bold text-indigo-600';
  }

  const oldDisplay = document.getElementById('display-pelanggan');
  if (oldDisplay) {
    oldDisplay.innerHTML = 
      '<div class="flex items-center gap-2 mt-1"><div class="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">👤</div>' +
      '<div><p class="font-extrabold text-slate-800 text-xs">' + nama + '</p><p class="text-[10px] text-slate-400">' + (no_hp || '-') + '</p></div></div>';
  }

  closeModalPilihPelanggan();
}

// Toggle Form Customer Baru
function toggleFormCustomerBaru() { 
  const form = document.getElementById('form-customer-baru');
  if (form) form.classList.toggle('hidden'); 
}

// FUNGSI UTAMA: SIMPAN PELANGGAN BARU LANGSUNG KE SUPABASE
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

  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);

  if (!client) {
    alert('Koneksi Supabase belum siap. Harap muat ulang halaman.');
    return;
  }

  try {
    const userRes = await client.auth.getUser();
    const userId = userRes?.data?.user?.id || null;

    // Payload Dasar (Pasti didukung oleh tabel pelanggan)
    const payload = {
      nama: nama,
      no_hp: no_hp
    };

    if (userId) {
      payload.user_id = userId;
    }

    // Cobalah insert data
    const { data, error } = await client
      .from('pelanggan')
      .insert([payload])
      .select();

    if (error) {
      console.error('Error insert pelanggan:', error);
      alert('Gagal menyimpan pelanggan: ' + error.message);
      return;
    }

    alert('Pelanggan "' + nama + '" berhasil disimpan!');

    // Reset Form & Sembunyikan Form Tambah
    if (namaInput) namaInput.value = '';
    if (hpInput) hpInput.value = '';
    const formCustomer = document.getElementById('form-customer-baru');
    if (formCustomer) formCustomer.classList.add('hidden');

    // Otomatis pilih pelanggan baru ini
    if (data && data[0]) {
      selectCustomer(data[0].id, data[0].nama, data[0].no_hp);
    } else {
      selectCustomer(null, nama, no_hp);
    }

  } catch (err) {
    console.error('Catch simpan customer:', err);
    alert('Terjadi kesalahan sistem: ' + err.message);
  }
}

// Registrasi Fungsi ke Global Window
window.simpanCustomerBaru = simpanCustomerBaru;
window.toggleFormCustomerBaru = toggleFormCustomerBaru;
window.selectCustomer = selectCustomer;
window.filterPelangganList = filterPelangganList;
window.closeModalPilihPelanggan = closeModalPilihPelanggan;