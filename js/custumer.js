// ==========================================
// FILE: js/custumer.js
// ==========================================

var allPelanggan = [];
var selectedPelanggan = null;

// FUNGSI UTAMA: SIMPAN PELANGGAN BARU
async function simpanCustomerBaru(e) {
  if (e && e.preventDefault) e.preventDefault();

  console.log("-> Tombol Simpan Customer Diklik!");

  const namaInput = document.getElementById('new_nama_pelanggan');
  const hpInput = document.getElementById('new_no_hp');

  const nama = namaInput?.value?.trim();
  const no_hp = hpInput?.value?.trim() || '';

  if (!nama) {
    alert('Harap isi Nama Pelanggan!');
    return;
  }

  // Pilih client Supabase yang tersedia
  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);

  if (!client) {
    alert('Koneksi Supabase belum siap! Silakan refresh halaman.');
    return;
  }

  try {
    // Payload paling aman tanpa Foreign Key yang bisa bikin bentrok
    const payload = {
      nama: nama,
      no_hp: no_hp
    };

    console.log("Mengirim data ke Supabase:", payload);

    const { data, error } = await client
      .from('pelanggan')
      .insert([payload])
      .select();

    if (error) {
      console.error('Supabase Error:', error);
      alert('Gagal menyimpan ke database: ' + error.message);
      return;
    }

    alert('Berhasil! Pelanggan "' + nama + '" telah tersimpan.');

    // Reset Form Input
    if (namaInput) namaInput.value = '';
    if (hpInput) hpInput.value = '';

    const formCustomer = document.getElementById('form-customer-baru');
    if (formCustomer) formCustomer.classList.add('hidden');

    // Otomatis pilih pelanggan jika ada fungsinya
    if (typeof selectCustomer === 'function' && data && data[0]) {
      selectCustomer(data[0].id, data[0].nama, data[0].no_hp);
    }

  } catch (err) {
    console.error('Catch Error:', err);
    alert('Terjadi kesalahan sistem: ' + err.message);
  }
}

// Toggle Form Customer Baru
function toggleFormCustomerBaru() { 
  const form = document.getElementById('form-customer-baru');
  if (form) form.classList.toggle('hidden'); 
}

// Memilih Pelanggan & Memasukkan ke UI POS
function selectCustomer(id, nama, no_hp) {
  selectedPelanggan = { id: id, nama: nama, no_hp: no_hp };
  
  const displayLabel = document.getElementById('selectedCustomerName');
  if (displayLabel) {
    displayLabel.textContent = nama + (no_hp ? ' (' + no_hp + ')' : '');
    displayLabel.className = 'text-sm font-bold text-indigo-600';
  }

  if (typeof closeModalPilihPelanggan === 'function') {
    closeModalPilihPelanggan();
  }
}

// Menutup Modal Pilih Pelanggan
function closeModalPilihPelanggan() {
  const modal = document.getElementById('modal-pelanggan');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// Registrasi Fungsi Global Supaya Bisa Dipanggil HTML
window.simpanCustomerBaru = simpanCustomerBaru;
window.toggleFormCustomerBaru = toggleFormCustomerBaru;
window.selectCustomer = selectCustomer;
window.closeModalPilihPelanggan = closeModalPilihPelanggan;