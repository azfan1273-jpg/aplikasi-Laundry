// ==========================================
// FILE: js/setting.js (MODUL SETTING, LAYANAN, & TRANSAKSI POS)
// ==========================================

window.keranjangPOS = window.keranjangPOS || [];
window.allLayananCache = window.allLayananCache || [];

// 1. TOGGLE ACCORDION JENDELA AKUN
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

// 2. TOGGLE FORM INPUT KASIR BARU
function toggleFormTambahKasir() {
  const formContainer = document.getElementById('form-tambah-kasir');
  if (!formContainer) return;
  formContainer.classList.toggle('hidden');
}

// 3. SIMPAN KASIR BARU KE SUPABASE
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

// 4. RENDER DAFTAR KASIR
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

// 5. HELPER CONTAINER KELOLA LAYANAN
function renderKelolaLayananList() {
  const container = document.getElementById('list-kelola-layanan-container');
  if (container) {
    container.innerHTML = '';
    if (container.parentElement) {
      container.parentElement.style.display = 'none';
    }
  }
}

// ==========================================
// 6. RENDER DAFTAR LAYANAN (KILOAN & SATUAN + LIVE SEARCH + EDIT ✏️)
// ==========================================
async function renderLayananPOS(keyword = '') {
  console.log("-> Rendering Layanan POS dengan kata kunci:", keyword);

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

    // BACA URUTAN REORDER DARI LOCALSTORAGE
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

    // FILTER REALTIME SEARCH
    let filtered = window.allLayananCache;
    if (keyword && keyword.trim() !== '') {
      const cleanKey = keyword.trim().toLowerCase();
      filtered = filtered.filter(item => 
        (item.nama_layanan || '').toLowerCase().includes(cleanKey)
      );
    }

    // PEMISAHAN KILOAN VS SATUAN
    const listKiloan = filtered.filter(item => {
      const sat = (item.satuan || 'kg').toLowerCase().trim();
      return sat === 'kg' || sat === 'kilo' || sat === 'kiloan';
    });

    const listSatuan = filtered.filter(item => {
      const sat = (item.satuan || 'kg').toLowerCase().trim();
      return sat !== 'kg' && sat !== 'kilo' && sat !== 'kiloan';
    });

    // SINGLE ITEM TEMPLATE
    const renderSingleItem = (item) => `
      <div data-id="${item.id}" class="layanan-item p-2.5 bg-white rounded-xl border border-slate-100 text-xs flex justify-between items-center hover:border-blue-300 transition-all">
        <div class="flex items-center gap-2">
          <!-- REORDER BUTTONS -->
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
          <button type="button" onclick="pilihLayananKeKeranjang(${item.id}, '${item.nama_layanan.replace(/'/g, "\\'")}', ${item.harga}, '${item.satuan}')" class="bg-blue-600 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl shadow-sm hover:bg-blue-700 active:scale-95 transition">
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
            <h4 class="font-black text-xs text-slate-700 tracking-wide uppercase">Layanan Kiloan (${listKiloan.length})</h4>
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

// 7. FUNGSI GESER URUTAN POSISI LAYANAN (▲ ▼)
function geserPosisiLayanan(id, direction) {
  if (!window.allLayananCache || window.allLayananCache.length === 0) return;

  let list = window.allLayananCache;
  let index = list.findIndex(item => item.id === id);
  if (index === -1) return;

  let targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= list.length) return;

  let temp = list[index];
  list[index] = list[targetIndex];
  list[targetIndex] = temp;

  const newOrderIds = list.map(item => item.id);
  localStorage.setItem('layanan_custom_order', JSON.stringify(newOrderIds));

  renderLayananPOS();
}

// ==========================================
// 8. MODAL DINAMIS EDIT LAYANAN & HAPUS
// ==========================================
function bukaModalEditLayanan(id) {
  const item = (window.allLayananCache || []).find(l => l.id === id);
  if (!item) return;

  let modalEdit = document.getElementById('modal-edit-layanan');
  if (!modalEdit) {
    modalEdit = document.createElement('div');
    modalEdit.id = 'modal-edit-layanan';
    modalEdit.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 hidden';
    document.body.appendChild(modalEdit);
  }

  modalEdit.innerHTML = `
    <div class="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in duration-200">
      <div class="flex justify-between items-center border-b pb-3 border-slate-100">
        <h3 class="font-extrabold text-slate-800 text-sm">Edit Layanan</h3>
        <button type="button" onclick="tutupModalEditLayanan()" class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 transition">✕</button>
      </div>

      <form onsubmit="simpanPerubahanLayanan(event, ${item.id})" class="space-y-3 text-xs">
        <div>
          <label class="font-bold text-slate-600 mb-1 block">Nama Layanan</label>
          <input type="text" id="edit_nama_layanan" value="${item.nama_layanan || ''}" class="w-full p-3 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500" required />
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="font-bold text-slate-600 mb-1 block">Harga (Rp)</label>
            <input type="number" id="edit_harga_layanan" value="${item.harga || 0}" class="w-full p-3 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500" required />
          </div>
          <div>
            <label class="font-bold text-slate-600 mb-1 block">Satuan</label>
            <select id="edit_satuan_layanan" class="w-full p-3 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500 bg-white">
              <option value="Kg" ${item.satuan === 'Kg' ? 'selected' : ''}>Kg</option>
              <option value="Pcs" ${item.satuan === 'Pcs' ? 'selected' : ''}>Pcs</option>
              <option value="Meter" ${item.satuan === 'Meter' ? 'selected' : ''}>Meter</option>
              <option value="Pasang" ${item.satuan === 'Pasang' ? 'selected' : ''}>Pasang</option>
            </select>
          </div>
        </div>

        <div>
          <label class="font-bold text-slate-600 mb-1 block">Estimasi Selesai (Hari)</label>
          <input type="number" step="0.1" id="edit_estimasi_hari" value="${item.estimasi_hari || 1}" class="w-full p-3 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500" required />
        </div>

        <div class="pt-2 flex gap-2">
          <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl shadow-md active:scale-95 transition">
            Simpan Perubahan
          </button>
          <button type="button" onclick="hapusLayananBaru(${item.id})" class="bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold px-3 py-3 rounded-xl transition" title="Hapus Permanen">
            🗑️ Hapus
          </button>
        </div>
      </form>
    </div>
  `;

  modalEdit.classList.remove('hidden');
}

function tutupModalEditLayanan() {
  const modalEdit = document.getElementById('modal-edit-layanan');
  if (modalEdit) modalEdit.classList.add('hidden');
}

async function simpanPerubahanLayanan(e, id) {
  if (e && e.preventDefault) e.preventDefault();

  const nama = document.getElementById('edit_nama_layanan')?.value?.trim();
  const harga = parseFloat(document.getElementById('edit_harga_layanan')?.value) || 0;
  const satuan = document.getElementById('edit_satuan_layanan')?.value || 'Kg';
  const estimasi = parseFloat(document.getElementById('edit_estimasi_hari')?.value) || 1;

  if (!nama || harga <= 0) {
    alert('Harap isi Nama dan Harga Layanan yang valid!');
    return;
  }

  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);
  if (!client) return;

  try {
    const { error } = await client
      .from('layanan')
      .update({
        nama_layanan: nama,
        harga: harga,
        satuan: satuan,
        estimasi_hari: estimasi
      })
      .eq('id', id);

    if (error) {
      alert('Gagal memperbarui layanan: ' + error.message);
      return;
    }

    if (typeof showToast === 'function') showToast('Layanan berhasil diperbarui!', 'success');
    else alert('Layanan berhasil diperbarui!');

    tutupModalEditLayanan();
    renderLayananPOS();

  } catch (err) {
    console.error('Error simpanPerubahanLayanan:', err);
  }
}

// 9. SIMPAN LAYANAN BARU (MASTER FORM)
async function prosesSimpanLayananBaru(e) {
  if (e && e.preventDefault) e.preventDefault();

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

  if (!nama_layanan || harga <= 0) {
    alert('Harap isi Nama dan Harga Layanan dengan benar!');
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
      alert('Gagal menyimpan layanan: ' + error.message);
      return;
    }

    if (typeof showToast === 'function') showToast('Layanan tersimpan!', 'success');
    else alert('Layanan berhasil ditambahkan!');

    if (namaInput) namaInput.value = '';
    if (hargaInput) hargaInput.value = '';
    if (estimasiInput) estimasiInput.value = '';

    if (typeof closeModalKelolaLayanan === 'function') closeModalKelolaLayanan();
    renderLayananPOS();

  } catch (err) {
    console.error('Catch simpan layanan:', err);
  }
}

// 10. HAPUS LAYANAN DARI DATABASE
async function hapusLayananBaru(id) {
  if (!confirm('Yakin ingin menghapus layanan ini secara permanen?')) return;

  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);
  if (!client) return;

  try {
    const { error } = await client.from('layanan').delete().eq('id', id);
    if (error) {
      alert('Gagal menghapus layanan: ' + error.message);
      return;
    }

    tutupModalEditLayanan();
    renderLayananPOS();
  } catch (err) {
    console.error('Catch hapus layanan:', err);
  }
}

// ==========================================
// 11. BUKA MODAL LAYANAN & MULTI-ITEM KERANJANG POS
// ==========================================
function bukaModalPilihLayanan() {
  console.log("-> Membuka Modal Pilih Layanan (Z-Index High)...");

  let modal = document.getElementById('modal-layanan') 
           || document.getElementById('modal-pilih-layanan')
           || document.querySelector('.modal-layanan');

  if (modal) {
    // Paksa Z-Index tertinggi agar tampil di depan modal transaksi
    modal.style.zIndex = '99999';
    modal.classList.add('z-[99999]');

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.display = 'flex';
  }

  if (typeof renderLayananPOS === 'function') {
    renderLayananPOS();
  }
}

function pilihLayananKeKeranjang(id, nama, harga, satuan) {
  console.log("-> Memilih layanan ke keranjang:", nama);

  if (!window.keranjangPOS) window.keranjangPOS = [];

  const numHarga = typeof harga === 'number' ? harga : (parseFloat(String(harga).replace(/[^0-9.]/g, '')) || 0);

  const existingIndex = window.keranjangPOS.findIndex(item => item.id === id);

  if (existingIndex !== -1) {
    window.keranjangPOS[existingIndex].qty = (parseFloat(window.keranjangPOS[existingIndex].qty) || 1) + 1;
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
    showToast(`"${nama}" ditambahkan!`, 'success');
  }

  // Sembunyikan HANYA modal pilihan layanan
  const modalLayanan = document.getElementById('modal-layanan') || document.getElementById('modal-pilih-layanan');
  if (modalLayanan) {
    modalLayanan.classList.add('hidden');
    modalLayanan.classList.remove('flex');
    modalLayanan.style.display = 'none';
  }

  renderKeranjangPOS();
}

// 12. CARI KONTRAINER KERANJANG SECARA AKURAT
function getCartContainer() {
  let container = document.getElementById('cart-items-container') 
               || document.querySelector('[data-cart-container="true"]');
  if (container) return container;

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

  return null;
}

// 13. RENDER TAMPILAN KERANJANG DI MODAL ORDER
function renderKeranjangPOS() {
  const container = getCartContainer();
  const items = window.keranjangPOS || [];

  if (container) {
    if (items.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4 italic">Belum ada layanan yang ditambahkan.</p>';
    } else {
      container.innerHTML = items.map((item, index) => {
        const sat = (item.satuan || 'Kg').toLowerCase().trim();
        const isKiloan = sat === 'kg' || sat === 'kilo' || sat === 'kiloan';
        const stepVal = isKiloan ? "0.01" : "1";
        const currentQty = parseFloat(item.qty) || 0;
        const subtotal = (item.harga || 0) * currentQty;

        return `
          <div class="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-xs mb-2 shadow-sm">
            <div class="truncate mr-2">
              <p class="font-extrabold text-slate-800 text-xs truncate">${item.nama_layanan}</p>
              <p class="text-[10px] text-slate-400 mt-0.5">Rp ${(item.harga || 0).toLocaleString('id-ID')} / ${item.satuan}</p>
            </div>

            <div class="flex items-center gap-2.5 shrink-0">
              <!-- INPUT QTY BISA DIKETIK MANUAL & TIMBANGAN DESIMAL -->
              <div class="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5">
                <button type="button" onclick="ubahQtyKeranjang(${index}, -${isKiloan ? 0.5 : 1})" class="w-6 h-6 bg-white hover:bg-slate-200 rounded-lg text-slate-700 font-bold text-xs flex items-center justify-center active:scale-90 transition">-</button>
                
                <input 
                  type="text" 
                  inputmode="decimal"
                  value="${currentQty}" 
                  oninput="updateQtyManual(${index}, this.value)"
                  class="w-14 text-center font-black text-xs text-slate-800 bg-transparent outline-none p-0 focus:text-blue-600"
                />

                <button type="button" onclick="ubahQtyKeranjang(${index}, ${isKiloan ? 0.5 : 1})" class="w-6 h-6 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-bold text-xs flex items-center justify-center active:scale-90 transition">+</button>
              </div>

              <!-- SUB TOTAL PER ITEM -->
              <p class="font-black text-slate-800 text-xs min-w-[75px] text-right">
                Rp ${Math.round(subtotal).toLocaleString('id-ID')}
              </p>

              <!-- HAPUS ITEM -->
              <button type="button" onclick="hapusItemKeranjang(${index})" class="text-rose-400 hover:text-rose-600 font-bold text-xs p-1">✕</button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  hitungsDanUpdateTotalPrice();
}

// 14. UPDATE QTY DARI INPUT KETIK MANUAL
function updateQtyManual(index, val) {
  if (!window.keranjangPOS || !window.keranjangPOS[index]) return;

  let cleanVal = String(val).replace(',', '.');
  let numVal = parseFloat(cleanVal);
  if (isNaN(numVal) || numVal < 0) numVal = 0;

  window.keranjangPOS[index].qty = numVal;
  hitungsDanUpdateTotalPrice();
}

// 15. UBAH QTY TOMBOL + / -
function ubahQtyKeranjang(index, delta) {
  if (!window.keranjangPOS || !window.keranjangPOS[index]) return;

  let currentQty = parseFloat(window.keranjangPOS[index].qty) || 0;
  let newQty = currentQty + delta;

  if (newQty <= 0) {
    window.keranjangPOS.splice(index, 1);
  } else {
    window.keranjangPOS[index].qty = Math.round(newQty * 100) / 100;
  }

  renderKeranjangPOS();
}

// 16. HAPUS ITEM KERANJANG
function hapusItemKeranjang(index) {
  if (!window.keranjangPOS) return;
  window.keranjangPOS.splice(index, 1);
  renderKeranjangPOS();
}

// 17. KALKULASI TOTAL PRICE REALTIME
function hitungsDanUpdateTotalPrice() {
  const items = window.keranjangPOS || [];
  let total = 0;

  items.forEach(item => {
    let q = item.qty;
    if (typeof q === 'string') q = parseFloat(q.replace(',', '.')) || 0;
    let h = parseFloat(item.harga) || 0;
    total += (q * h);
  });

  window.totalHargaPOS = Math.round(total);
  const formattedTotal = 'Rp ' + window.totalHargaPOS.toLocaleString('id-ID');

  ['total-price-pos', 'total_harga', 'totalPrice', 'grand-total'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = formattedTotal;
  });

  const allDivs = document.querySelectorAll('div, section, p, span');
  allDivs.forEach(parent => {
    if ((parent.textContent || '').toUpperCase().includes('TOTAL PRICE')) {
      const priceVal = parent.querySelector('.text-lg, .font-black, .font-bold, .text-xl, h3, h4') || parent.nextElementSibling;
      if (priceVal && !priceVal.textContent.toUpperCase().includes('TOTAL PRICE')) {
        priceVal.textContent = formattedTotal;
      }
    }
  });
}

// ==========================================
// 18. EVENT LISTENERS AUTOMATIS & SEARCH
// ==========================================
document.addEventListener('input', function(e) {
  const target = e.target;
  if (!target) return;

  const modalLayanan = target.closest('#modal-layanan') 
                    || target.closest('#modal-pilih-layanan')
                    || document.getElementById('modal-layanan');

  if (modalLayanan && target.matches('input[type="text"], input:not([type])')) {
    renderLayananPOS(target.value.trim());
  }
});

document.addEventListener('click', function(e) {
  const btn = e.target.closest('button') || e.target;
  if (!btn) return;

  const txt = (btn.textContent || '').trim().toLowerCase();

  if (txt.includes('tambah layanan') || txt === '+ tambah layanan') {
    e.preventDefault();
    e.stopPropagation();
    bukaModalPilihLayanan();
  }

  if (txt.includes('simpan layanan baru') || txt.includes('simpan layanan')) {
    e.preventDefault();
    prosesSimpanLayananBaru(e);
  }
});

// ==========================================
// 19. REGISTRASI GLOBAL WINDOW SCOPE
// ==========================================
window.toggleAccordion = toggleAccordion;
window.toggleFormTambahKasir = toggleFormTambahKasir;
window.simpanKasirBaru = simpanKasirBaru;
window.renderDaftarKasir = renderDaftarKasir;

window.renderKelolaLayananList = renderKelolaLayananList;
window.renderLayananPOS = renderLayananPOS;
window.geserPosisiLayanan = geserPosisiLayanan;
window.bukaModalEditLayanan = bukaModalEditLayanan;
window.tutupModalEditLayanan = tutupModalEditLayanan;
window.simpanPerubahanLayanan = simpanPerubahanLayanan;
window.prosesSimpanLayananBaru = prosesSimpanLayananBaru;
window.hapusLayananBaru = hapusLayananBaru;

window.bukaModalPilihLayanan = bukaModalPilihLayanan;
window.handleTambahLayanan = bukaModalPilihLayanan;
window.pilihLayananKeKeranjang = pilihLayananKeKeranjang;
window.renderKeranjangPOS = renderKeranjangPOS;
window.updateQtyManual = updateQtyManual;
window.ubahQtyKeranjang = ubahQtyKeranjang;
window.hapusItemKeranjang = hapusItemKeranjang;
window.hitungsDanUpdateTotalPrice = hitungsDanUpdateTotalPrice;