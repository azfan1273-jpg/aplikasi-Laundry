// ==========================================
// FILE: js/custumer.js (VERSI FIX & FULL)
// ==========================================

var allPelanggan = window.allPelanggan || [];
var selectedPelanggan = window.selectedPelanggan || null;

// FUNGSI UTAMA: SIMPAN PELANGGAN BARU
async function simpanCustomerBaru(e) {
  if (e && e.preventDefault) e.preventDefault();

  console.log("-> Memproses Simpan Customer Baru...");

  // Cari input Nama dari berbagai ID/Placeholder
  const namaInput = document.getElementById('new_nama_pelanggan')
                 || document.getElementById('nama_pelanggan')
                 || document.getElementById('pelanggan_nama')
                 || document.getElementById('input_nama_customer')
                 || document.querySelector('#modal-pelanggan input[placeholder*="Nama"]')
                 || document.querySelector('#modal-pilih-pelanggan input[placeholder*="Nama"]')
                 || document.querySelector('input[placeholder*="Nama"]');

  // Cari input No HP
  const hpInput = document.getElementById('new_no_hp')
               || document.getElementById('no_hp_pelanggan')
               || document.getElementById('pelanggan_hp')
               || document.getElementById('input_hp_customer')
               || document.querySelector('#modal-pelanggan input[placeholder*="Hp"]')
               || document.querySelector('#modal-pilih-pelanggan input[placeholder*="08"]')
               || document.querySelector('input[placeholder*="08"]');

  const nama = namaInput?.value?.trim();
  const no_hp = hpInput?.value?.trim() || '-';

  if (!nama) {
    if (typeof showToast === 'function') showToast('Harap isi Nama Pelanggan!', 'error');
    else alert('Harap isi Nama Pelanggan!');
    if (namaInput) namaInput.focus();
    return;
  }

  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);

  if (!client) {
    if (typeof showToast === 'function') showToast('Koneksi Supabase belum siap!', 'error');
    else alert('Koneksi Supabase belum siap!');
    return;
  }

  try {
    const userRes = await client.auth.getUser();
    const userId = userRes?.data?.user?.id || null;

    const payload = {
      nama: nama,
      no_hp: no_hp
    };

    if (userId) {
      payload.user_id = userId;
    }

    // Ambil toko_id jika ada
    let tokoId = (typeof currentToko !== 'undefined' && currentToko?.id) ? currentToko.id : localStorage.getItem('toko_id');
    if (tokoId) payload.toko_id = tokoId;

    console.log("Mengirim data pelanggan ke Supabase:", payload);

    const { data, error } = await client
      .from('pelanggan')
      .insert([payload])
      .select();

    if (error) {
      console.error('Supabase Error:', error);
      if (typeof showToast === 'function') showToast('Gagal menyimpan: ' + error.message, 'error');
      else alert('Gagal menyimpan pelanggan: ' + error.message);
      return;
    }

    const newCustomer = data && data[0] ? data[0] : { id: Date.now(), nama: nama, no_hp: no_hp };

    if (typeof showToast === 'function') showToast('Pelanggan "' + nama + '" tersimpan!', 'success');
    else alert('Berhasil! Pelanggan "' + nama + '" telah tersimpan.');

    // Masukkan ke Cache Global
    if (!window.allPelanggan) window.allPelanggan = [];
    window.allPelanggan.unshift(newCustomer);

    // Reset Input Form
    if (namaInput) namaInput.value = '';
    if (hpInput) hpInput.value = '';

    const formCustomer = document.getElementById('form-customer-baru');
    if (formCustomer) formCustomer.classList.add('hidden');

    // Otomatis pilih pelanggan
    selectCustomer(newCustomer.id, newCustomer.nama, newCustomer.no_hp);

  } catch (err) {
    console.error('Catch Error simpan customer:', err);
    if (typeof showToast === 'function') showToast('Terjadi kesalahan sistem', 'error');
  }
}

// Toggle Form Customer Baru
function toggleFormCustomerBaru() { 
  const form = document.getElementById('form-customer-baru');
  if (form) {
    form.classList.toggle('hidden');
  } else {
    document.querySelectorAll('.form-add-customer').forEach(el => el.classList.toggle('hidden'));
  }
}

// Memilih Pelanggan & Memasukkan ke UI POS
function selectCustomer(id, nama, no_hp) {
  selectedPelanggan = { id: id, nama: nama, no_hp: no_hp };
  window.selectedPelanggan = selectedPelanggan;
  
  const displayLabel = document.getElementById('selectedCustomerName')
                    || document.getElementById('nama-pelanggan-pos')
                    || document.getElementById('label_customer');

  if (displayLabel) {
    displayLabel.textContent = nama + (no_hp && no_hp !== '-' ? ' (' + no_hp + ')' : '');
    displayLabel.className = 'text-sm font-bold text-blue-600';
  }

  closeModalPilihPelanggan();
}

// Menutup Modal Pilih Pelanggan Universal
function closeModalPilihPelanggan() {
  const modal = document.getElementById('modal-pelanggan') 
             || document.getElementById('modal-pilih-pelanggan');

  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.style.display = 'none';
  }

  if (typeof closeModalWithHistory === 'function') {
    closeModalWithHistory('modal-pelanggan');
  }
}

// HANDLER EVENT LISTENER AUTOMATIS SAAT TOMBOL DIKLIK
document.addEventListener('click', function(e) {
  const btn = e.target.closest('button') || e.target;
  const txt = (btn.textContent || '').trim().toLowerCase();

  if (txt === 'simpan customer' || txt === 'simpan pelanggan') {
    e.preventDefault();
    simpanCustomerBaru(e);
  }

  if (txt === 'tambah customer baru' || txt === 'tambah pelanggan baru') {
    e.preventDefault();
    toggleFormCustomerBaru();
  }
});

// Registrasi Fungsi Global
window.simpanCustomerBaruAsli = simpanCustomerBaru;
window.simpanCustomerBaru = simpanCustomerBaru;
window.simpanPelangganBaru = simpanCustomerBaru;
window.toggleFormCustomerBaru = toggleFormCustomerBaru;
window.selectCustomer = selectCustomer;
window.closeModalPilihPelanggan = closeModalPilihPelanggan;