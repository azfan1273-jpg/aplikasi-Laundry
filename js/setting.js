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
// TIMPA FUNGSI tambahLayananBaru SAJA DI js/setting.js
// ==========================================
async function tambahLayananBaru(e) {
  if (e && e.preventDefault) e.preventDefault();

  const namaInput = document.getElementById('new_nama_layanan');
  const hargaInput = document.getElementById('new_harga_layanan');
  const satuanInput = document.getElementById('new_satuan_layanan');
  const estimasiInput = document.getElementById('new_estimasi_hari');

  const nama_layanan = namaInput?.value?.trim();
  const harga = parseFloat(hargaInput?.value) || 0;
  const satuan = satuanInput?.value || 'Kg';
  const estimasi_hari = parseFloat(estimasiInput?.value) || 1;

  if (!nama_layanan || harga <= 0) {
    alert('Harap isi Nama Layanan dan Harga yang valid!');
    return;
  }

  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);

  if (!client) {
    alert('Koneksi Supabase belum siap. Harap refresh halaman!');
    return;
  }

  try {
    // 1. Ambil user_id dari sesi aktif
    const userRes = await client.auth.getUser();
    const userId = userRes?.data?.user?.id || null;

    // 2. Ambil toko_id dari memori atau localStorage
    let tokoId = (typeof currentToko !== 'undefined' && currentToko?.id) 
                 ? currentToko.id 
                 : localStorage.getItem('toko_id');

    // 3. Fallback: Ambil ID toko dari database jika toko_id belum ter-set
    if (!tokoId) {
      const { data: tokoData } = await client.from('toko').select('id').limit(1).maybeSingle();
      if (tokoData && tokoData.id) {
        tokoId = tokoData.id;
        localStorage.setItem('toko_id', tokoId);
      }
    }

    // 4. Susun Payload
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

    // 5. Insert ke Supabase
    const { data, error } = await client
      .from('layanan')
      .insert([payload])
      .select();

    if (error) {
      console.error('Error Insert Layanan:', error);
      alert('Gagal menyimpan layanan: ' + error.message);
      return;
    }

    alert('Layanan "' + nama_layanan + '" berhasil ditambahkan!');

    // Reset Form Input
    if (namaInput) namaInput.value = '';
    if (hargaInput) hargaInput.value = '';
    if (estimasiInput) estimasiInput.value = '';

    // Refresh daftar layanan jika ada fungsinya
    if (typeof renderKelolaLayananList === 'function') renderKelolaLayananList();

  } catch (err) {
    console.error('Catch simpan layanan:', err);
    alert('Terjadi kesalahan sistem: ' + err.message);
  }
}

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

// ==========================================
// FIX TARGET OMSET (DITARUH DI JS/REPORT.JS)
// ==========================================
function simpanTargetOmset(e) {
  if (e && e.preventDefault) e.preventDefault();

  const inputs = document.querySelectorAll('input');
  let targetInput = null;

  inputs.forEach(inp => {
    if (inp.value == '15' || inp.value == '15000000' || inp.placeholder.includes('15') || inp.parentElement.textContent.includes('TARGET OMSET')) {
      targetInput = inp;
    }
  });

  if (!targetInput) targetInput = document.querySelector('input[type="number"]') || inputs[0];

  let rawVal = targetInput ? targetInput.value : '15000000';
  let cleanVal = rawVal.toString().replace(/[^0-9]/g, '');
  let nominal = parseFloat(cleanVal);

  if (isNaN(nominal) || nominal <= 0) {
    alert('Harap masukkan nominal target yang valid!');
    return;
  }

  if (nominal < 1000) nominal = nominal * 1000000;

  localStorage.setItem('target_omset_bulanan', nominal);
  updateProgressTargetOmset();

  alert('Target Omset Bulanan berhasil disimpan: Rp ' + nominal.toLocaleString('id-ID'));
}

function updateProgressTargetOmset() {
  const targetSaved = parseFloat(localStorage.getItem('target_omset_bulanan')) || 15000000;
  
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

  document.querySelectorAll('p, span, div, td').forEach(el => {
    if (el.children.length === 0) {
      if (el.textContent.includes('Target:') || el.textContent.includes('Target :')) {
        el.textContent = 'Target: Rp ' + targetSaved.toLocaleString('id-ID');
      }
      if (el.textContent.includes('Tercapai:') || el.textContent.includes('Tercapai :')) {
        el.textContent = 'Tercapai: Rp ' + omsetBulanIni.toLocaleString('id-ID');
      }
    }
  });

  let persen = Math.min(Math.round((omsetBulanIni / targetSaved) * 100), 100);
  
  document.querySelectorAll('div, span').forEach(el => {
    if (el.textContent.trim().endsWith('%') && el.textContent.trim().length <= 4) {
      el.textContent = persen + '%';
    }
  });
}

// Daftarkan ke Global Window
window.simpanTargetOmset = simpanTargetOmset;
window.updateProgressTargetOmset = updateProgressTargetOmset;

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(updateProgressTargetOmset, 800);
});