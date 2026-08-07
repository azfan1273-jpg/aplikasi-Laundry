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

// ==========================================
// RENDER DAFTAR LAYANAN (DENGAN TOMBOL EDIT ✏️)
// ==========================================
async function renderLayananPOS(keyword = '') {
  console.log("-> Memuat daftar layanan dengan opsi Edit...");

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

    // BACA URUTAN TERSIMPAN DARI LOCALSTORAGE
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

    // FILTER SEARCH KEYWORD
    let filtered = window.allLayananCache;
    if (keyword) {
      filtered = filtered.filter(item => 
        (item.nama_layanan || '').toLowerCase().includes(keyword.toLowerCase())
      );
    }

    // MEMISAHKAN LAYANAN MENJADI 2 GRUP
    const listKiloan = filtered.filter(item => {
      const sat = (item.satuan || 'kg').toLowerCase().trim();
      return sat === 'kg' || sat === 'kilo' || sat === 'kiloan';
    });

    const listSatuan = filtered.filter(item => {
      const sat = (item.satuan || 'kg').toLowerCase().trim();
      return sat !== 'kg' && sat !== 'kilo' && sat !== 'kiloan';
    });

    // TEMPLATE ITEM SINGLE (GANTI TOMBOL HAPUS DENGAN EDIT ✏️)
    const renderSingleItem = (item) => `
      <div data-id="${item.id}" class="layanan-item p-2.5 bg-white rounded-xl border border-slate-100 text-xs flex justify-between items-center hover:border-blue-300 transition-all">
        <div class="flex items-center gap-2">
          <!-- TOMBOL REORDER -->
          <div class="flex flex-col gap-0.5">
            <button type="button" onclick="geserPosisiLayanan(${item.id}, 'up')" class="w-5 h-4 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded flex items-center justify-center font-bold text-[9px] active:scale-90 transition">
              ▲
            </button>
            <button type="button" onclick="geserPosisiLayanan(${item.id}, 'down')" class="w-5 h-4 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded flex items-center justify-center font-bold text-[9px] active:scale-90 transition">
              ▼
            </button>
          </div>

          <div>
            <p class="font-extrabold text-slate-800 text-xs">${item.nama_layanan}</p>
            <p class="text-[10px] text-slate-400 mt-0.5">
              Rp ${(item.harga || 0).toLocaleString('id-ID')} / ${item.satuan || 'Kg'} • Est: ${item.estimasi_hari || 1} Hari
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <button type="button" onclick="pilihLayananKeKeranjang(${item.id}, '${item.nama_layanan}', ${item.harga}, '${item.satuan}')" class="bg-blue-600 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl shadow-sm hover:bg-blue-700 active:scale-95 transition">
            + Pilih
          </button>
          <button type="button" onclick="bukaModalEditLayanan(${item.id})" class="text-slate-600 hover:text-blue-600 font-bold text-[11px] bg-slate-100 hover:bg-blue-50 px-2 py-1.5 rounded-xl transition" title="Edit Layanan">
            ✏️
          </button>
        </div>
      </div>
    `;

    let htmlOutput = '';

    if (listKiloan.length > 0) {
      htmlOutput += `
        <div class="p-3 bg-slate-50/80 rounded-2xl border-2 border-slate-200/80 mb-4 space-y-2">
          <div class="flex items-center gap-1.5 pb-1 border-b border-slate-200">
            <span class="text-sm">🧺</span>
            <h4 class="font-black text-xs text-slate-700 tracking-wide uppercase">Layanan Kiloan</h4>
          </div>
          <div class="space-y-2">
            ${listKiloan.map(renderSingleItem).join('')}
          </div>
        </div>
      `;
    }

    if (listSatuan.length > 0) {
      htmlOutput += `
        <div class="p-3 bg-slate-50/80 rounded-2xl border-2 border-slate-200/80 mb-2 space-y-2">
          <div class="flex items-center gap-1.5 pb-1 border-b border-slate-200">
            <span class="text-sm">👔</span>
            <h4 class="font-black text-xs text-slate-700 tracking-wide uppercase">Layanan Satuan</h4>
          </div>
          <div class="space-y-2">
            ${listSatuan.map(renderSingleItem).join('')}
          </div>
        </div>
      `;
    }

    if (!htmlOutput) {
      htmlOutput = '<p class="text-xs text-slate-400 text-center py-6 italic">Tidak ada layanan ditemukan.</p>';
    }

    container.innerHTML = htmlOutput;

  } catch (err) {
    console.error('Error renderLayananPOS:', err);
    if (container) container.innerHTML = '<p class="text-xs text-rose-500 text-center py-4">Gagal memuat daftar layanan.</p>';
  }
}

// ==========================================
// RENDER DAFTAR LAYANAN (DENGAN LIVE FILTER & DUA GRUP)
// ==========================================
async function renderLayananPOS(keyword = '') {
  console.log("-> Filtering layanan dengan kata kunci:", keyword);

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

    // BACA URUTAN TERSIMPAN DARI LOCALSTORAGE
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

    // 1. FILTER REALTIME BERDASARKAN KATA KUNCI PENCARIAN
    let filtered = window.allLayananCache;
    if (keyword && keyword.trim() !== '') {
      const cleanKey = keyword.trim().toLowerCase();
      filtered = filtered.filter(item => 
        (item.nama_layanan || '').toLowerCase().includes(cleanKey)
      );
    }

    // 2. MEMISAHKAN LAYANAN TERFILTER MENJADI 2 GRUP
    const listKiloan = filtered.filter(item => {
      const sat = (item.satuan || 'kg').toLowerCase().trim();
      return sat === 'kg' || sat === 'kilo' || sat === 'kiloan';
    });

    const listSatuan = filtered.filter(item => {
      const sat = (item.satuan || 'kg').toLowerCase().trim();
      return sat !== 'kg' && sat !== 'kilo' && sat !== 'kiloan';
    });

    // TEMPLATE ITEM SINGLE
    const renderSingleItem = (item) => `
      <div data-id="${item.id}" class="layanan-item p-2.5 bg-white rounded-xl border border-slate-100 text-xs flex justify-between items-center hover:border-blue-300 transition-all">
        <div class="flex items-center gap-2">
          <!-- TOMBOL REORDER -->
          <div class="flex flex-col gap-0.5">
            <button type="button" onclick="geserPosisiLayanan(${item.id}, 'up')" class="w-5 h-4 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded flex items-center justify-center font-bold text-[9px] active:scale-90 transition">
              ▲
            </button>
            <button type="button" onclick="geserPosisiLayanan(${item.id}, 'down')" class="w-5 h-4 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded flex items-center justify-center font-bold text-[9px] active:scale-90 transition">
              ▼
            </button>
          </div>

          <div>
            <p class="font-extrabold text-slate-800 text-xs">${item.nama_layanan}</p>
            <p class="text-[10px] text-slate-400 mt-0.5">
              Rp ${(item.harga || 0).toLocaleString('id-ID')} / ${item.satuan || 'Kg'} • Est: ${item.estimasi_hari || 1} Hari
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <button type="button" onclick="pilihLayananKeKeranjang(${item.id}, '${item.nama_layanan}', ${item.harga}, '${item.satuan}')" class="bg-blue-600 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl shadow-sm hover:bg-blue-700 active:scale-95 transition">
            + Pilih
          </button>
          <button type="button" onclick="bukaModalEditLayanan(${item.id})" class="text-slate-600 hover:text-blue-600 font-bold text-[11px] bg-slate-100 hover:bg-blue-50 px-2 py-1.5 rounded-xl transition" title="Edit Layanan">
            ✏️
          </button>
        </div>
      </div>
    `;

    let htmlOutput = '';

    // GRUP 1: LAYANAN KILOAN
    if (listKiloan.length > 0) {
      htmlOutput += `
        <div class="p-3 bg-slate-50/80 rounded-2xl border-2 border-slate-200/80 mb-4 space-y-2">
          <div class="flex items-center gap-1.5 pb-1 border-b border-slate-200">
            <span class="text-sm">🧺</span>
            <h4 class="font-black text-xs text-slate-700 tracking-wide uppercase">Layanan Kiloan (${listKiloan.length})</h4>
          </div>
          <div class="space-y-2">
            ${listKiloan.map(renderSingleItem).join('')}
          </div>
        </div>
      `;
    }

    // GRUP 2: LAYANAN SATUAN
    if (listSatuan.length > 0) {
      htmlOutput += `
        <div class="p-3 bg-slate-50/80 rounded-2xl border-2 border-slate-200/80 mb-2 space-y-2">
          <div class="flex items-center gap-1.5 pb-1 border-b border-slate-200">
            <span class="text-sm">👔</span>
            <h4 class="font-black text-xs text-slate-700 tracking-wide uppercase">Layanan Satuan (${listSatuan.length})</h4>
          </div>
          <div class="space-y-2">
            ${listSatuan.map(renderSingleItem).join('')}
          </div>
        </div>
      `;
    }

    if (!htmlOutput) {
      htmlOutput = `<div class="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200"><p class="text-xs text-slate-400 font-bold">Layanan "${keyword}" tidak ditemukan.</p></div>`;
    }

    container.innerHTML = htmlOutput;

  } catch (err) {
    console.error('Error renderLayananPOS:', err);
    if (container) container.innerHTML = '<p class="text-xs text-rose-500 text-center py-4">Gagal memuat daftar layanan.</p>';
  }
}

// ==========================================
// EVENT LISTENER PENCARIAN UNIVERSAL REALTIME
// ==========================================
document.addEventListener('input', function(e) {
  const target = e.target;
  if (!target) return;

  // Cek apakah inputan berada di dalam Modal Pilih Layanan
  const modalLayanan = target.closest('#modal-layanan') 
                    || target.closest('#modal-pilih-layanan')
                    || document.getElementById('modal-layanan');

  // Jika user mengetik di input box yang ada di modal layanan
  if (modalLayanan && target.matches('input[type="text"], input:not([type])')) {
    const keyword = target.value.trim();
    console.log("-> Typing detected in Modal Layanan:", keyword);
    renderLayananPOS(keyword);
  }
});

// Register Window Scope Global
window.bukaModalEditLayanan = bukaModalEditLayanan;
window.tutupModalEditLayanan = tutupModalEditLayanan;
window.simpanPerubahanLayanan = simpanPerubahanLayanan;

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

// ==========================================
// FIX KERANJANG POS & KALKULASI TOTAL PRICE (AKURAT)
// ==========================================

window.keranjangPOS = window.keranjangPOS || [];

// FUNGSI MEMILIH LAYANAN KE KERANJANG
function pilihLayananKeKeranjang(id, nama, harga, satuan) {
  console.log("-> Menambahkan ke keranjang:", id, nama, harga, satuan);

  if (!window.keranjangPOS) window.keranjangPOS = [];

  // Parse harga ke angka murni
  const numHarga = typeof harga === 'number' ? harga : (parseFloat(String(harga).replace(/[^0-9.]/g, '')) || 0);

  // Cek apakah item sudah ada di keranjang
  const existingIndex = window.keranjangPOS.findIndex(item => item.id === id || item.nama_layanan === nama);

  if (existingIndex !== -1) {
    window.keranjangPOS[existingIndex].qty = (window.keranjangPOS[existingIndex].qty || 1) + 1;
  } else {
    window.keranjangPOS.push({
      id: id,
      nama_layanan: nama,
      harga: numHarga,
      satuan: satuan || 'Kg',
      qty: 1
    });
  }

  if (typeof showToast === 'function') {
    showToast(`"${nama}" ditambahkan ke keranjang!`, 'success');
  }

  // Tutup Modal Pilih Layanan
  const modalLayanan = document.getElementById('modal-layanan') 
                    || document.getElementById('modal-pilih-layanan')
                    || document.querySelector('.modal-layanan');
  if (modalLayanan) {
    modalLayanan.classList.add('hidden');
    modalLayanan.classList.remove('flex');
    modalLayanan.style.display = 'none';
  }

  // Sync ke fungsi bawaan order jika ada
  if (typeof window.tambahKeKeranjang === 'function') {
    try { window.tambahKeKeranjang({ id, nama_layanan: nama, harga: numHarga, satuan, qty: 1 }); } catch(e){}
  }

  // Render Ulang Tampilan Keranjang
  setTimeout(() => {
    renderKeranjangPOS();
  }, 100);
}

// CARI KONTRAINER KERANJANG DI MODAL TRANSACTION SECARA AKURAT
function getCartContainer() {
  let container = document.getElementById('cart-items-container') 
               || document.querySelector('[data-cart-container="true"]');
  if (container) return container;

  // Cari elemen terkecil yang berisi teks "Belum ada layanan"
  const elements = Array.from(document.querySelectorAll('p, span, div'));
  for (let el of elements) {
    if (el.children.length === 0 && el.textContent.toLowerCase().includes('belum ada layanan')) {
      container = el.parentElement;
      if (container) {
        container.setAttribute('data-cart-container', 'true');
        container.id = 'cart-items-container';
        return container;
      }
    }
  }

  // Fallback: Cari kotak abu-abu di bawah header "Daftar Layanan"
  for (let el of elements) {
    if (el.children.length === 0 && el.textContent.toLowerCase().includes('daftar layanan')) {
      const headerParent = el.closest('div');
      if (headerParent && headerParent.nextElementSibling) {
        container = headerParent.nextElementSibling;
        container.setAttribute('data-cart-container', 'true');
        container.id = 'cart-items-container';
        return container;
      }
    }
  }

  return null;
}

// RENDER ITEM KERANJANG DI MODAL ORDER
function renderKeranjangPOS() {
  const container = getCartContainer();
  const items = window.keranjangPOS || [];

  if (container) {
    if (items.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4 italic">Belum ada layanan yang ditambahkan.</p>';
    } else {
      container.innerHTML = items.map((item, index) => `
        <div class="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-xs mb-2 shadow-sm">
          <div class="truncate mr-2">
            <p class="font-extrabold text-slate-800 text-xs truncate">${item.nama_layanan}</p>
            <p class="text-[10px] text-slate-400 mt-0.5">Rp ${(item.harga || 0).toLocaleString('id-ID')} / ${item.satuan}</p>
          </div>

          <div class="flex items-center gap-2.5 shrink-0">
            <!-- PENGATUR QTY / JUMLAH -->
            <div class="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5">
              <button type="button" onclick="ubahQtyKeranjang(${index}, -1)" class="w-6 h-6 bg-white hover:bg-slate-200 rounded-lg text-slate-700 font-bold text-xs flex items-center justify-center active:scale-90 transition">-</button>
              <span class="px-2 font-black text-xs text-slate-800">${item.qty}</span>
              <button type="button" onclick="ubahQtyKeranjang(${index}, 1)" class="w-6 h-6 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-bold text-xs flex items-center justify-center active:scale-90 transition">+</button>
            </div>

            <!-- SUB TOTAL ITEM -->
            <p class="font-black text-slate-800 text-xs min-w-[65px] text-right">
              Rp ${((item.harga || 0) * (item.qty || 1)).toLocaleString('id-ID')}
            </p>

            <!-- HAPUS ITEM -->
            <button type="button" onclick="hapusItemKeranjang(${index})" class="text-rose-400 hover:text-rose-600 font-bold text-xs p-1">✕</button>
          </div>
        </div>
      `).join('');
    }
  }

  // HITUNG & UPDATE TOTAL PRICE
  hitungsDanUpdateTotalPrice();
}

// UBAH QTY ITEM KERANJANG
function ubahQtyKeranjang(index, delta) {
  if (!window.keranjangPOS || !window.keranjangPOS[index]) return;

  window.keranjangPOS[index].qty = (window.keranjangPOS[index].qty || 1) + delta;

  if (window.keranjangPOS[index].qty <= 0) {
    window.keranjangPOS.splice(index, 1);
  }

  renderKeranjangPOS();
}

// HAPUS ITEM DARI KERANJANG
function hapusItemKeranjang(index) {
  if (!window.keranjangPOS) return;
  window.keranjangPOS.splice(index, 1);
  renderKeranjangPOS();
}

// HITUNG TOTAL HARGA DAN UPDATE KE UI
function hitungsDanUpdateTotalPrice() {
  const items = window.keranjangPOS || [];
  let total = 0;

  items.forEach(item => {
    total += (item.harga || 0) * (item.qty || 1);
  });

  window.totalHargaPOS = total;
  const formattedTotal = 'Rp ' + total.toLocaleString('id-ID');

  // Update elemen ID langsung
  const totalPriceEl = document.getElementById('total-price-pos') || document.getElementById('total_harga');
  if (totalPriceEl) {
    totalPriceEl.textContent = formattedTotal;
  }

  // Update elemen berdasarkan Teks "TOTAL PRICE"
  const allTexts = document.querySelectorAll('p, div, span, h3, h4, label');
  allTexts.forEach(el => {
    if (el.children.length === 0 && el.textContent.trim().toUpperCase() === 'TOTAL PRICE') {
      const parent = el.parentElement;
      if (parent) {
        const priceVal = parent.querySelector('.text-lg, .font-black, .font-bold, .text-xl, h3, h4') || el.nextElementSibling;
        if (priceVal && priceVal !== el) {
          priceVal.textContent = formattedTotal;
        }
      }
    }
  });
}

// REGISTER GLOBAL WINDOW
window.pilihLayananKeKeranjang = pilihLayananKeKeranjang;
window.renderKeranjangPOS = renderKeranjangPOS;
window.ubahQtyKeranjang = ubahQtyKeranjang;
window.hapusItemKeranjang = hapusItemKeranjang;
window.hitungsDanUpdateTotalPrice = hitungsDanUpdateTotalPrice;

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