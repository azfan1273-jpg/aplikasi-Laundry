// ==========================================
// FILE: js/setting.js (Modul Setting & Layanan)
// ==========================================

// Toggle Accordion di Jendela Akun
function toggleAccordion(accId) {
  const element = document.getElementById(accId);
  const arrow = document.getElementById(`arrow-${accId}`);
  if (!element) return;

  if (element.classList.contains('hidden')) {
    element.classList.remove('hidden');
    if (arrow) arrow.style.transform = 'rotate(180deg)';
    if (accId === 'acc-kasir' && typeof renderDaftarKasir === 'function') {
      renderDaftarKasir();
    }
  } else {
    element.classList.add('hidden');
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  }
}

// Toggle Form Input Kasir Baru
function toggleFormTambahKasir() {
  const formContainer = document.getElementById('form-tambah-kasir');
  if (!formContainer) return;
  formContainer.classList.toggle('hidden');
}

// Simpan Kasir Baru ke Supabase
async function simpanKasirBaru() {
  try {
    const inputNama = document.getElementById('new_kasir_nama');
    const inputEmail = document.getElementById('new_kasir_email');
    const inputPassword = document.getElementById('new_kasir_password');

    const nama = inputNama ? inputNama.value.trim() : '';
    const email = inputEmail ? inputEmail.value.trim() : '';
    const password = inputPassword ? inputPassword.value.trim() : '';

    if (!email || !password) {
      alert('Email dan Password kasir wajib diisi!');
      return;
    }

    const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);

    if (!client) {
      alert('Koneksi database Supabase belum siap.');
      return;
    }

    const { data: authData, error: authErr } = await client.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          nama_user: nama || email.split('@')[0],
          role: 'kasir'
        }
      }
    });

    if (authErr) {
      alert('Gagal membuat kasir: ' + authErr.message);
      return;
    }

    if (authData && authData.user) {
      await client.from('profiles').insert([{
        id: authData.user.id,
        toko_id: localStorage.getItem('toko_id') || null,
        role: 'kasir',
        nama_user: nama || email.split('@')[0],
        email: email
      }]);
    }

    alert('Akun kasir berhasil dibuat!');

    if (inputNama) inputNama.value = '';
    if (inputEmail) inputEmail.value = '';
    if (inputPassword) inputPassword.value = '';

    toggleFormTambahKasir();
    renderDaftarKasir();

  } catch (err) {
    console.error('Error simpanKasirBaru:', err);
    alert('Terjadi kesalahan saat menyimpan kasir.');
  }
}

// Render List Kasir
async function renderDaftarKasir() {
  const container = document.getElementById('list-kasir-container');
  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);
  
  if (!container || !client) return;

  try {
    container.innerHTML = '<p class="text-xs text-slate-400 italic">Memuat kasir...</p>';

    const { data: listKasir, error } = await client
      .from('profiles')
      .select('*')
      .eq('role', 'kasir');

    if (error) throw error;

    if (!listKasir || listKasir.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-400 italic">Belum ada kasir.</p>';
      return;
    }

    container.innerHTML = '';
    listKasir.forEach((kasir) => {
      const item = document.createElement('div');
      item.className = 'flex justify-between items-center p-2 bg-white rounded-xl border border-indigo-100 text-xs mb-1';
      item.innerHTML = `
        <div>
          <p class="font-bold text-slate-800">${kasir.nama_user || 'Kasir'}</p>
          <p class="text-[10px] text-slate-400">${kasir.email}</p>
        </div>
        <span class="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-md">Kasir</span>
      `;
      container.appendChild(item);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="text-xs text-rose-500">Gagal memuat kasir.</p>';
  }
}

// Render Daftar Layanan di Modal Kelola Layanan
async function renderKelolaLayananList() {
  const container = document.getElementById('list-kelola-layanan-container');
  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);

  if (!container || !client) return;

  try {
    container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4 italic">Memuat layanan...</p>';

    let query = client.from('layanan').select('*').order('id', { ascending: false });
    if (typeof currentToko !== 'undefined' && currentToko?.id) {
      query = query.eq('toko_id', currentToko.id);
    }

    const { data: listLayanan, error } = await query;

    if (error) throw error;

    if (!listLayanan || listLayanan.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4 italic">Belum ada data layanan.</p>';
      return;
    }

    container.innerHTML = '';
    listLayanan.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200 text-xs mb-2 shadow-sm';
      div.innerHTML = `
        <div>
          <p class="font-bold text-slate-800">${item.nama_layanan}</p>
          <p class="text-[10px] text-slate-500">Rp ${(item.harga || 0).toLocaleString('id-ID')} / ${item.satuan || 'Kg'} • Estimasi: ${item.estimasi_hari || 1} Hari</p>
        </div>
        <button type="button" onclick="hapusLayananBaru(${item.id})" class="text-rose-500 hover:text-rose-700 font-bold text-xs bg-rose-50 px-2.5 py-1 rounded-lg">Hapus</button>
      `;
      container.appendChild(div);
    });

  } catch (err) {
    console.error('Error renderKelolaLayananList:', err);
    container.innerHTML = '<p class="text-xs text-rose-500 text-center py-4">Gagal memuat layanan.</p>';
  }
}

// ==========================================
// FUNGSI SIMPAN LAYANAN BARU (PERBAIKAN FITUR)
// ==========================================
async function tambahLayananBaru(e) {
  if (e && e.preventDefault) e.preventDefault();

  console.log("-> Memproses Simpan Layanan Baru...");

  // Cari input berdasarkan ID atau posisi di modal layanan
  const namaInput = document.getElementById('new_nama_layanan')
                 || document.getElementById('nama_layanan')
                 || document.querySelector('#modal-kelola-layanan input[type="text"]')
                 || document.querySelector('#modal-layanan input[type="text"]');

  const hargaInput = document.getElementById('new_harga_layanan')
                  || document.getElementById('harga_layanan')
                  || document.querySelector('input[placeholder*="5500"]')
                  || document.querySelector('input[placeholder*="harga"]');

  const satuanInput = document.getElementById('new_satuan_layanan')
                   || document.getElementById('satuan_layanan')
                   || document.querySelector('select');

  const estimasiInput = document.getElementById('new_estimasi_hari')
                     || document.getElementById('estimasi_hari')
                     || document.querySelector('input[placeholder*="3"]');

  const nama_layanan = namaInput?.value?.trim();
  const harga = parseFloat(hargaInput?.value) || 0;
  const satuan = satuanInput?.value || 'Kg';
  const estimasi_hari = parseFloat(estimasiInput?.value) || 1;

  if (!nama_layanan || harga <= 0) {
    if (typeof showToast === 'function') showToast('Harap isi Nama Layanan & Harga yang valid!', 'error');
    else alert('Harap isi Nama Layanan dan Harga yang valid!');
    return;
  }

  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);

  if (!client) {
    if (typeof showToast === 'function') showToast('Koneksi Supabase belum siap!', 'error');
    else alert('Koneksi Supabase belum siap. Harap refresh halaman!');
    return;
  }

  try {
    const userRes = await client.auth.getUser();
    const userId = userRes?.data?.user?.id || null;

    let tokoId = (typeof currentToko !== 'undefined' && currentToko?.id) 
                 ? currentToko.id 
                 : localStorage.getItem('toko_id');

    const payload = {
      nama_layanan: nama_layanan,
      harga: harga,
      satuan: satuan,
      estimasi_hari: estimasi_hari,
      user_id: userId
    };

    if (tokoId) {
      payload.toko_id = tokoId;
    }

    console.log("Sending payload layanan to Supabase:", payload);

    const { data, error } = await client
      .from('layanan')
      .insert([payload])
      .select();

    if (error) {
      console.error('Error Insert Layanan:', error);
      if (typeof showToast === 'function') showToast('Gagal menyimpan: ' + error.message, 'error');
      else alert('Gagal menyimpan layanan: ' + error.message);
      return;
    }

    if (typeof showToast === 'function') showToast('Layanan "' + nama_layanan + '" tersimpan!', 'success');
    else alert('Layanan "' + nama_layanan + '" berhasil ditambahkan!');

    // Reset Form Input
    if (namaInput) namaInput.value = '';
    if (hargaInput) hargaInput.value = '';
    if (estimasiInput) estimasiInput.value = '';

    // Refresh daftar tampilan layanan
    if (typeof renderKelolaLayananList === 'function') renderKelolaLayananList();
    if (typeof renderLayananPOS === 'function') renderLayananPOS();

  } catch (err) {
    console.error('Catch simpan layanan:', err);
    if (typeof showToast === 'function') showToast('Terjadi kesalahan sistem', 'error');
  }
}

// AUTOMATIC EVENT LISTENER UNTUK TOMBOL "Simpan Layanan Baru"
document.addEventListener('click', function(e) {
  const btn = e.target.closest('button') || e.target;
  const txt = (btn.textContent || '').trim().toLowerCase();

  if (txt.includes('simpan layanan baru') || txt.includes('simpan layanan')) {
    e.preventDefault();
    tambahLayananBaru(e);
  }
});

// Register Global Window
window.tambahLayananBaruAsli = tambahLayananBaru;
window.tambahLayananBaru = tambahLayananBaru;
window.hapusLayananBaru = hapusLayananBaru;

// Hapus Layanan dari Supabase
async function hapusLayananBaru(id) {
  if (!confirm('Yakin ingin menghapus layanan ini?')) return;

  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);
  if (!client) return;

  try {
    const { error } = await client.from('layanan').delete().eq('id', id);
    if (error) {
      alert('Gagal menghapus layanan: ' + error.message);
      return;
    }
    alert('Layanan berhasil dihapus!');
    renderKelolaLayananList();
  } catch (err) {
    console.error('Catch hapus layanan:', err);
  }
}

// 1. Simpan Target Omset ke Penyimpanan Lokal
// ==========================================
// FUNGSI SIMPAN & AKTUATOR TARGET OMSET BULANAN
// ==========================================

function simpanTargetOmset(e) {
  if (e && e.preventDefault) e.preventDefault();

  // 1. Ambil input nominal
  const inputEl = document.querySelector('input[placeholder*="15"]') 
               || document.querySelector('#target_omset_input')
               || document.querySelector('.target-omset-input')
               || document.querySelector('input[value="15"]')
               || document.querySelector('input[type="number"]');

  let rawVal = inputEl ? inputEl.value : '';
  let cleanVal = rawVal.toString().replace(/[^0-9]/g, '');
  let nominalTarget = parseFloat(cleanVal);

  if (isNaN(nominalTarget) || nominalTarget <= 0) {
    alert('Harap masukkan nominal target yang valid!');
    return;
  }

  // Jika input hanya '66' atau angka kecil, otomatis kalikan jutaan (opsional)
  if (nominalTarget < 1000) {
    nominalTarget = nominalTarget * 1000000;
  }

  // 2. Simpan ke localStorage
  localStorage.setItem('target_omset_bulanan', nominalTarget);

  // 3. Update tampilan UI secara langsung
  updateProgressTargetOmset();

  alert('Target Omset Bulanan berhasil diperbarui menjadi Rp ' + nominalTarget.toLocaleString('id-ID'));
}

function updateProgressTargetOmset() {
  // Ambil nominal target dari localStorage (default 15 juta)
  const targetSaved = parseFloat(localStorage.getItem('target_omset_bulanan')) || 15000000;

  // 1. Hitung Omset Bulan Ini dari globalTxCache
  let omsetBulanIni = 0;
  const now = new Date();
  const txList = window.globalTxCache || [];

  txList.forEach(t => {
    const tgl = t.created_at ? new Date(t.created_at) : null;
    if (tgl && tgl.getMonth() === now.getMonth() && tgl.getFullYear() === now.getFullYear()) {
      if (t.status_laundry !== 'Batal') {
        omsetBulanIni += (t.total_harga || 0);
      }
    }
  });

  // 2. Cari elemen-elemen teks di HTML
  const allParagraphs = document.querySelectorAll('p, span, div');
  
  allParagraphs.forEach(el => {
    const txt = el.textContent.trim();
    
    // Update Teks Target
    if (txt.includes('Target:') || txt.includes('Target :')) {
      // Pastikan elemen tidak memiliki child elemen lain agar tidak menimpa struktur
      if (el.children.length === 0) {
        el.textContent = 'Target: Rp ' + targetSaved.toLocaleString('id-ID');
      }
    }

    // Update Teks Tercapai
    if (txt.includes('Tercapai:') || txt.includes('Tercapai :')) {
      if (el.children.length === 0) {
        el.textContent = 'Tercapai: Rp ' + omsetBulanIni.toLocaleString('id-ID');
      }
    }
  });

  // 3. Update Persentase Progress Bar
  let persen = Math.min(Math.round((omsetBulanIni / targetSaved) * 100), 100);

  // Update Badge Persen (misal 0%)
  const badgePersen = document.querySelector('.bg-emerald-500, [class*="0%"]');
  allParagraphs.forEach(el => {
    if (el.textContent.trim().endsWith('%') && el.textContent.trim().length <= 4) {
      el.textContent = persen + '%';
    }
  });

  // Update Lebar Progress Bar
  const progressBar = document.querySelector('.bg-emerald-200, .bg-emerald-300, .bg-emerald-400');
  if (progressBar && progressBar.firstElementChild) {
    progressBar.firstElementChild.style.width = persen + '%';
  }

  // 4. Set ulang nilai input box
  const inputEl = document.querySelector('input[placeholder*="15"]') 
               || document.querySelector('#target_omset_input');
  if (inputEl && !inputEl.value) {
    inputEl.value = targetSaved;
  }
}

// Register Global
window.simpanTargetOmset = simpanTargetOmset;
window.updateProgressTargetOmset = updateProgressTargetOmset;

// Panggil saat dokumen siap
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(updateProgressTargetOmset, 500);
});

// Export ke Window Scope
window.simpanTargetOmset = simpanTargetOmset;
window.updateProgressTargetOmset = updateProgressTargetOmset;

document.addEventListener('DOMContentLoaded', () => {
  updateProgressTargetOmset();
});