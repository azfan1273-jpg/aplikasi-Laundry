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

// 1. Sembunyikan "Daftar Layanan Saat Ini" di Gambar 1 (Modal Kelola Layanan)
function renderKelolaLayananList() {
  const container = document.getElementById('list-kelola-layanan-container');
  if (container) {
    container.innerHTML = '';
    // Sembunyikan pembungkusnya jika ada
    if (container.parentElement) {
      container.parentElement.style.display = 'none';
    }
  }
}

// Variable Global Filter Kategori Layanan (Default: kiloan)
window.currentCategoryLayanan = window.currentCategoryLayanan || 'kiloan';

// FUNGSI GANTI TAB KATEGORI
function switchCategoryLayanan(cat) {
  window.currentCategoryLayanan = cat;
  
  // Toggle style tombol tab
  const btnKiloan = document.getElementById('tab-layanan-kiloan');
  const btnSatuan = document.getElementById('tab-layanan-satuan');

  if (btnKiloan && btnSatuan) {
    if (cat === 'kiloan') {
      btnKiloan.className = 'flex-1 py-1.5 text-center font-extrabold text-xs rounded-xl bg-blue-600 text-white shadow-sm transition';
      btnSatuan.className = 'flex-1 py-1.5 text-center font-extrabold text-xs rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition';
    } else {
      btnSatuan.className = 'flex-1 py-1.5 text-center font-extrabold text-xs rounded-xl bg-blue-600 text-white shadow-sm transition';
      btnKiloan.className = 'flex-1 py-1.5 text-center font-extrabold text-xs rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition';
    }
  }

  // Render ulang list
  renderLayananPOS();
}

// ==========================================
// RENDER DAFTAR LAYANAN DENGAN BUNGKUS TAB (KILOAN & SATUAN)
// ==========================================
async function renderLayananPOS(keyword = '') {
  console.log("-> Memuat daftar layanan POS terpisah Kiloan/Satuan...");

  let container = document.getElementById('list-layanan-container')
               || document.querySelector('#modal-layanan .scroll-area')
               || document.querySelector('#modal-layanan .space-y-2');

  if (!container) {
    const allP = document.querySelectorAll('#modal-layanan p, #modal-layanan div');
    allP.forEach(el => {
      if (el.textContent.includes('Memuat layanan')) {
        container = el.parentElement;
      }
    });
  }

  if (!container) return;

  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);
  if (!client) return;

  try {
    let query = client.from('layanan').select('*');
    let tokoId = (typeof currentToko !== 'undefined' && currentToko?.id) ? currentToko.id : localStorage.getItem('toko_id');
    if (tokoId) {
      query = query.eq('toko_id', tokoId);
    }

    const { data: listLayanan, error } = await query;
    if (error) throw error;

    let rawData = listLayanan || [];

    // BACA URUTAN CUSTOM DARI LOCALSTORAGE
    const savedOrderJson = localStorage.getItem('layanan_custom_order');
    if (savedOrderJson) {
      try {
        const savedOrderIds = JSON.parse(savedOrderJson);
        rawData.sort((a, b) => {
          let indexA = savedOrderIds.indexOf(a.id);
          let indexB = savedOrderIds.indexOf(b.id);
          if (indexA === -1) indexA = 999;
          if (indexB === -1) indexB = 999;
          return indexA - indexB;
        });
      } catch (e) {
        console.warn("Gagal parse saved order:", e);
      }
    } else {
      rawData.sort((a, b) => b.id - a.id);
    }

    window.allLayananCache = rawData;

    // 1. FILTER BERDASARKAN SEARCH KEYWORD
    let filtered = window.allLayananCache;
    if (keyword) {
      filtered = filtered.filter(item => 
        (item.nama_layanan || '').toLowerCase().includes(keyword.toLowerCase())
      );
    }

    // 2. FILTER BERDASARKAN KATEGORI (KILOAN VS SATUAN)
    const activeCat = window.currentCategoryLayanan || 'kiloan';
    filtered = filtered.filter(item => {
      const sat = (item.satuan || 'kg').toLowerCase().trim();
      if (activeCat === 'kiloan') {
        return sat === 'kg' || sat === 'kilo' || sat === 'kiloan';
      } else {
        return sat !== 'kg' && sat !== 'kilo' && sat !== 'kiloan';
      }
    });

    // HEADER TAB DOCKING KATEGORI
    const tabHeaderHTML = `
      <div class="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-3">
        <button type="button" id="tab-layanan-kiloan" onclick="switchCategoryLayanan('kiloan')" class="flex-1 py-1.5 text-center font-extrabold text-xs rounded-xl ${activeCat === 'kiloan' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} transition">
          🧺 Layanan Kiloan
        </button>
        <button type="button" id="tab-layanan-satuan" onclick="switchCategoryLayanan('satuan')" class="flex-1 py-1.5 text-center font-extrabold text-xs rounded-xl ${activeCat === 'satuan' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} transition">
          👔 Layanan Satuan
        </button>
      </div>
    `;

    if (!filtered || filtered.length === 0) {
      container.innerHTML = tabHeaderHTML + `<p class="text-xs text-slate-400 text-center py-6 italic">Tidak ada layanan ${activeCat === 'kiloan' ? 'Kiloan' : 'Satuan'} ditemukan.</p>`;
      return;
    }

    // RENDER LIST ITEM
    const listItemsHTML = filtered.map((item, idx) => `
      <div data-id="${item.id}" class="layanan-item p-3 bg-white rounded-2xl border border-slate-200 text-xs mb-2 flex justify-between items-center shadow-sm hover:border-blue-400 transition-all">
        <div class="flex items-center gap-2">
          <!-- TOMBOL REORDER -->
          <div class="flex flex-col gap-0.5">
            <button type="button" onclick="geserPosisiLayanan(${item.id}, 'up')" class="w-6 h-5 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded flex items-center justify-center font-bold text-[10px] active:scale-90 transition" title="Naikkan Ke Atas">
              ▲
            </button>
            <button type="button" onclick="geserPosisiLayanan(${item.id}, 'down')" class="w-6 h-5 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded flex items-center justify-center font-bold text-[10px] active:scale-90 transition" title="Turunkan Ke Bawah">
              ▼
            </button>
          </div>

          <div>
            <p class="font-extrabold text-slate-800 text-xs">${item.nama_layanan}</p>
            <p class="text-[10px] text-slate-500 mt-0.5">
              Rp ${(item.harga || 0).toLocaleString('id-ID')} / ${item.satuan || 'Kg'} • Est: ${item.estimasi_hari || 1} Hari
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <button type="button" onclick="pilihLayananKeKeranjang(${item.id}, '${item.nama_layanan}', ${item.harga}, '${item.satuan}')" class="bg-blue-600 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl shadow-sm hover:bg-blue-700 active:scale-95 transition">
            + Pilih
          </button>
          <button type="button" onclick="hapusLayananBaru(${item.id})" class="text-rose-500 hover:text-rose-700 font-bold text-[11px] bg-rose-50 px-2 py-1.5 rounded-xl transition" title="Hapus Layanan">
            🗑️
          </button>
        </div>
      </div>
    `).join('');

    container.innerHTML = tabHeaderHTML + listItemsHTML;

  } catch (err) {
    console.error('Error renderLayananPOS:', err);
    if (container) container.innerHTML = '<p class="text-xs text-rose-500 text-center py-4">Gagal memuat daftar layanan.</p>';
  }
}

// FUNGSI GESER URUTAN BERDASARKAN ID
function geserPosisiLayanan(id, direction) {
  if (!window.allLayananCache || window.allLayananCache.length === 0) return;

  let list = window.allLayananCache;
  let index = list.findIndex(item => item.id === id);
  if (index === -1) return;

  let targetIndex = direction === 'up' ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= list.length) return;

  // Tukar posisi item
  let temp = list[index];
  list[index] = list[targetIndex];
  list[targetIndex] = temp;

  // Simpan urutan ID baru
  const newOrderIds = list.map(item => item.id);
  localStorage.setItem('layanan_custom_order', JSON.stringify(newOrderIds));

  // Render ulang
  renderLayananPOS();
}

// Register Window Global
window.switchCategoryLayanan = switchCategoryLayanan;
window.renderLayananPOS = renderLayananPOS;
window.geserPosisiLayanan = geserPosisiLayanan;

// FUNGSI INIT DRAG & DROP
function initDragAndDropLayanan(container) {
  let draggedItem = null;

  const items = container.querySelectorAll('.drag-item');

  items.forEach(item => {
    item.addEventListener('dragstart', function(e) {
      draggedItem = this;
      setTimeout(() => this.classList.add('opacity-40', 'scale-[0.98]'), 0);
    });

    item.addEventListener('dragend', function() {
      this.classList.remove('opacity-40', 'scale-[0.98]');
      draggedItem = null;
      simpanUrutanLayanan(container);
    });

    item.addEventListener('dragover', function(e) {
      e.preventDefault();
    });

    item.addEventListener('dragenter', function(e) {
      e.preventDefault();
      if (this !== draggedItem) {
        this.classList.add('border-blue-500', 'bg-blue-50/30');
      }
    });

    item.addEventListener('dragleave', function() {
      this.classList.remove('border-blue-500', 'bg-blue-50/30');
    });

    item.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('border-blue-500', 'bg-blue-50/30');
      if (this !== draggedItem) {
        const allItems = Array.from(container.querySelectorAll('.drag-item'));
        const draggedIndex = allItems.indexOf(draggedItem);
        const targetIndex = allItems.indexOf(this);

        if (draggedIndex < targetIndex) {
          this.after(draggedItem);
        } else {
          this.before(draggedItem);
        }
      }
    });
  });
}

// SIMPAN URUTAN BARU KE LOCALSTORAGE
function simpanUrutanLayanan(container) {
  const items = container.querySelectorAll('.drag-item');
  const orderIds = Array.from(items).map(item => parseInt(item.getAttribute('data-id'))).filter(Boolean);

  localStorage.setItem('layanan_custom_order', JSON.stringify(orderIds));
  console.log("Urutan posisi layanan baru disimpan:", orderIds);
}

// Fungsi Memilih Layanan ke Transaksi
function pilihLayananKeKeranjang(id, nama, harga, satuan) {
  if (typeof window.tambahKeKeranjang === 'function') {
    window.tambahKeKeranjang({ id, nama_layanan: nama, harga, satuan, qty: 1 });
  } else if (typeof window.selectLayanan === 'function') {
    window.selectLayanan(id, nama, harga, satuan);
  } else {
    if (typeof showToast === 'function') showToast(`Layanan ${nama} dipilih!`, 'success');
  }

  // Tutup Modal Pilih Layanan
  if (typeof closeModalPilihLayanan === 'function') {
    closeModalPilihLayanan();
  }
}

// FUNGSI UTAMA: SIMPAN LAYANAN BARU
async function prosesSimpanLayananBaru(e) {
  if (e && e.preventDefault) e.preventDefault();

  console.log("-> Memproses Simpan Layanan Baru...");

  const modal = document.getElementById('modal-kelola-layanan') || document;
  const inputs = Array.from(modal.querySelectorAll('input'));
  const selectEl = modal.querySelector('select');

  let namaInput = document.getElementById('new_nama_layanan') || document.getElementById('nama_layanan');
  let hargaInput = document.getElementById('new_harga_layanan') || document.getElementById('harga_layanan');
  let satuanInput = document.getElementById('new_satuan_layanan') || document.getElementById('satuan_layanan') || selectEl;
  let estimasiInput = document.getElementById('new_estimasi_hari') || document.getElementById('estimasi_hari');

  if (!namaInput && inputs.length > 0) namaInput = inputs[0];
  if (!hargaInput && inputs.length > 1) hargaInput = inputs[1];
  if (!estimasiInput && inputs.length > 2) estimasiInput = inputs[2];

  const nama_layanan = namaInput?.value?.trim();
  let rawHarga = hargaInput?.value?.toString().replace(/[^0-9]/g, '') || '0';
  const harga = parseFloat(rawHarga) || 0;
  const satuan = satuanInput?.value || 'Kg';
  const estimasi_hari = parseFloat(estimasiInput?.value) || 1;

  if (!nama_layanan) {
    if (typeof showToast === 'function') showToast('Harap isi Nama Layanan!', 'error');
    else alert('Harap isi Nama Layanan!');
    if (namaInput) namaInput.focus();
    return;
  }

  if (harga <= 0) {
    if (typeof showToast === 'function') showToast('Harap isi Harga Layanan yang valid!', 'error');
    else alert('Harap isi Harga Layanan yang valid!');
    if (hargaInput) hargaInput.focus();
    return;
  }

  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);
  if (!client) return;

  try {
    const userRes = await client.auth.getUser();
    const userId = userRes?.data?.user?.id || null;

    let tokoId = (typeof currentToko !== 'undefined' && currentToko?.id) ? currentToko.id : localStorage.getItem('toko_id');

    const payload = {
      nama_layanan: nama_layanan,
      harga: harga,
      satuan: satuan,
      estimasi_hari: estimasi_hari,
      user_id: userId
    };

    if (tokoId) payload.toko_id = tokoId;

    const { error } = await client.from('layanan').insert([payload]);

    if (error) {
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

    // Tutup modal kelola layanan jika perlu
    if (typeof closeModalKelolaLayanan === 'function') closeModalKelolaLayanan();

    // Refresh daftar di Gambar 2
    renderLayananPOS();

  } catch (err) {
    console.error('Catch simpan layanan:', err);
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
    renderLayananPOS();
  } catch (err) {
    console.error('Catch hapus layanan:', err);
  }
}

// Live Search Filter di Gambar 2
document.addEventListener('input', function(e) {
  if (e.target && (e.target.placeholder || '').toLowerCase().includes('cari layanan')) {
    renderLayananPOS(e.target.value.trim());
  }
});

// AUTOMATIC EVENT LISTENER
document.addEventListener('click', function(e) {
  const btn = e.target.closest('button') || e.target;
  const txt = (btn.textContent || '').trim().toLowerCase();

  if (txt.includes('simpan layanan baru') || txt.includes('simpan layanan')) {
    e.preventDefault();
    prosesSimpanLayananBaru(e);
  }
});

// Register Global
window.prosesSimpanLayananBaru = prosesSimpanLayananBaru;
window.renderKelolaLayananList = renderKelolaLayananList;
window.renderLayananPOS = renderLayananPOS;
window.pilihLayananKeKeranjang = pilihLayananKeKeranjang;
window.hapusLayananBaru = hapusLayananBaru;