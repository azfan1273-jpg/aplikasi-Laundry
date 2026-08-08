// ==========================================
// FILE: js/setting.js (MODUL SETTING, LAYANAN, PERMISSIONS & POS TRANSAKSI FULL FIX)
// ==========================================

if (!window.keranjangPOS) window.keranjangPOS = [];
if (!window.allLayananCache) window.allLayananCache = [];

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
    if (accId === 'acc-akses' && typeof loadPermissionsToForm === 'function') {
      loadPermissionsToForm();
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

// 5. BUKA & TUTUP MODAL KELOLA MASTER LAYANAN
function openModalKelolaLayanan() {
  if (currentUserProfile && currentUserProfile.role === 'kasir') {
    const perms = typeof getTokoPermissions === 'function' ? getTokoPermissions() : {};
    const canLayanan = perms.is_manager || perms.akses_layanan;
    
    if (!canLayanan) {
      if (typeof showToast === 'function') {
        showToast('Izin kelola master paket dibatasi oleh Owner! 🔒', 'error');
      } else {
        alert('Izin kelola master paket dibatasi oleh Owner! 🔒');
      }
      return;
    }
  }

  const modal = document.getElementById('modal-kelola-layanan');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.display = 'flex';
    modal.style.zIndex = '999999';
    if (typeof renderKelolaLayananList === 'function') {
      renderKelolaLayananList();
    }
  }
}

function closeModalKelolaLayanan() {
  const modal = document.getElementById('modal-kelola-layanan');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.style.display = 'none';
  }
}

// 6. RENDER LIST KELOLA LAYANAN DENGAN TOMBOL HAPUS
async function renderKelolaLayananList() {
  const container = document.getElementById('list-kelola-layanan-container');
  if (!container) return;

  if (container.parentElement) {
    container.parentElement.style.display = 'flex';
  }

  container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">Memuat data layanan...</p>';

  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);
  if (!client) return;

  let tokoId = (typeof currentToko !== 'undefined' && currentToko?.id) ? currentToko.id : localStorage.getItem('toko_id');

  try {
    let query = client.from('layanan').select('*');
    if (tokoId) query = query.eq('toko_id', tokoId);

    const { data: listLayanan, error } = await query;
    if (error) throw error;

    if (!listLayanan || listLayanan.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">Belum ada layanan terdaftar.</p>';
      return;
    }

    container.innerHTML = '';
    listLayanan.forEach(item => {
      const el = document.createElement('div');
      el.className = "flex justify-between items-center p-2.5 bg-white border border-slate-200 rounded-xl mb-1.5 shadow-sm";
      el.innerHTML = `
        <div>
          <p class="font-extrabold text-slate-800 text-xs">${item.nama_layanan}</p>
          <p class="text-[10px] text-slate-500 mt-0.5">Rp ${(item.harga || 0).toLocaleString('id-ID')} / ${item.satuan || 'Kg'} • Est: ${item.estimasi_hari || 1} Hari</p>
        </div>
        <button type="button" onclick="hapusLayananBaru(${item.id})" class="bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold px-2.5 py-1 rounded-lg text-[10px] transition">Hapus</button>
      `;
      container.appendChild(el);
    });

  } catch (err) {
    console.error("Error renderKelolaLayananList:", err);
    container.innerHTML = '<p class="text-xs text-rose-500 text-center py-4">Gagal memuat daftar layanan.</p>';
  }
}

// 7. RENDER DAFTAR LAYANAN POS (KILOAN & SATUAN + EDIT ✏️)
async function renderLayananPOS(keyword = '') {
  let container = document.getElementById('list-layanan-container')
               || document.querySelector('#modal-layanan .scroll-area')
               || document.querySelector('#modal-layanan .space-y-2');

  if (!container) return;

  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);
  if (!client) return;

  try {
    let query = client.from('layanan').select('*');
    let tokoId = (typeof currentToko !== 'undefined' && currentToko?.id) ? currentToko.id : localStorage.getItem('toko_id');
    if (tokoId) query = query.eq('toko_id', tokoId);

    const { data: listLayanan, error } = await query;
    if (error) throw error;

    let rawData = listLayanan || [];

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
      } catch (e) {}
    } else {
      rawData.sort((a, b) => b.id - a.id);
    }

    window.allLayananCache = rawData;

    let filtered = window.allLayananCache;
    if (keyword && keyword.trim() !== '') {
      const cleanKey = keyword.trim().toLowerCase();
      filtered = filtered.filter(item => 
        (item.nama_layanan || '').toLowerCase().includes(cleanKey)
      );
    }

    const listKiloan = filtered.filter(item => {
      const sat = (item.satuan || 'kg').toLowerCase().trim();
      return sat === 'kg' || sat === 'kilo' || sat === 'kiloan';
    });

    const listSatuan = filtered.filter(item => {
      const sat = (item.satuan || 'kg').toLowerCase().trim();
      return sat !== 'kg' && sat !== 'kilo' && sat !== 'kiloan';
    });

    const renderSingleItem = (item) => `
      <div data-id="${item.id}" class="layanan-item p-2.5 bg-white rounded-xl border border-slate-100 text-xs flex justify-between items-center hover:border-blue-300 transition-all">
        <div class="flex items-center gap-2">
          <div class="flex flex-col gap-0.5">
            <button type="button" onclick="geserPosisiLayanan(${item.id}, 'up')" class="w-5 h-4 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded flex items-center justify-center font-bold text-[9px] active:scale-90 transition">▲</button>
            <button type="button" onclick="geserPosisiLayanan(${item.id}, 'down')" class="w-5 h-4 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded flex items-center justify-center font-bold text-[9px] active:scale-90 transition">▼</button>
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
          <div class="space-y-2">${listKiloan.map(renderSingleItem).join('')}</div>
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
          <div class="space-y-2">${listSatuan.map(renderSingleItem).join('')}</div>
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

// 8. GESER POSISI LAYANAN
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

// 9. MODAL EDIT LAYANAN
function bukaModalEditLayanan(id) {
  const item = (window.allLayananCache || []).find(l => l.id === id);
  if (!item) return;

  let modalEdit = document.getElementById('modal-edit-layanan');
  if (!modalEdit) {
    modalEdit = document.createElement('div');
    modalEdit.id = 'modal-edit-layanan';
    modalEdit.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100000] flex items-center justify-center p-4 hidden';
    document.body.appendChild(modalEdit);
  }

  modalEdit.innerHTML = `
    <div class="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-100">
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
    renderKelolaLayananList();

  } catch (err) {
    console.error('Error simpanPerubahanLayanan:', err);
  }
}

// 10. TAMBAH LAYANAN BARU KE SUPABASE
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
    alert('Harap isi Nama dan Harga Layanan dengan benar!');
    return;
  }

  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);
  if (!client) return;

  try {
    let tokoId = (typeof currentToko !== 'undefined' && currentToko?.id) ? currentToko.id : localStorage.getItem('toko_id');

    const payload = {
      nama_layanan: nama_layanan,
      harga: harga,
      satuan: satuan,
      estimasi_hari: estimasi_hari
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

    renderKelolaLayananList();
    renderLayananPOS();

  } catch (err) {
    console.error('Catch simpan layanan:', err);
  }
}

// 11. HAPUS LAYANAN DARI SUPABASE
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
    renderKelolaLayananList();
    renderLayananPOS();
  } catch (err) {
    console.error('Catch hapus layanan:', err);
  }
}

// 12. BUKA MODAL LAYANAN POS (AMAN UNTUK PENGGUNAAN BERKALI-KALI)
function bukaModalPilihLayanan() {
  const modal = document.getElementById('modal-layanan') 
             || document.getElementById('modal-pilih-layanan');

  if (modal) {
    // Paksa tampilkan & tempatkan paling depan
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('z-index', '99999', 'important');
    modal.style.setProperty('pointer-events', 'auto', 'important');

    // Render ulang isi daftar layanan
    if (typeof renderLayananPOS === 'function') {
      renderLayananPOS();
    }
  }
}

function closeModalPilihLayanan() {
  const modal = document.getElementById('modal-layanan') 
             || document.getElementById('modal-pilih-layanan');

  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.style.setProperty('display', 'none', 'important');
    modal.style.setProperty('pointer-events', 'none', 'important');
  }
}

// Daftarkan ulang ke Window
window.bukaModalPilihLayanan = bukaModalPilihLayanan;
window.closeModalPilihLayanan = closeModalPilihLayanan;
window.handleTambahLayanan = bukaModalPilihLayanan;

// 13. SINKRONISASI PEMILIHAN ITEM KE KERANJANG
function pilihLayananKeKeranjang(id, nama, harga, satuan) {
  const numHarga = typeof harga === 'number' ? harga : (parseFloat(String(harga).replace(/[^0-9.]/g, '')) || 0);
  const itemData = {
    id: id,
    nama_layanan: nama,
    nama: nama,
    harga: numHarga,
    satuan: satuan || 'Kg',
    qty: 1
  };

  if (!window.keranjangPOS) window.keranjangPOS = [];
  const existingIndex = window.keranjangPOS.findIndex(item => item.id === id || item.nama_layanan === nama);

  if (existingIndex !== -1) {
    window.keranjangPOS[existingIndex].qty = (parseFloat(window.keranjangPOS[existingIndex].qty) || 1) + 1;
  } else {
    window.keranjangPOS.push(itemData);
  }

  if (typeof showToast === 'function') {
    showToast(`"${nama}" ditambahkan!`, 'success');
  }

  closeModalPilihLayanan();

  setTimeout(() => {
    renderKeranjangPOS();
    paksaHitungTotalPriceDOM();
  }, 50);
}

// 14. PENCARI CONTAINER KERANJANG
function getCartContainer() {
  let container = document.getElementById('cart-items-container') 
               || document.querySelector('[data-cart-container="true"]');
  if (container) return container;

  const elements = Array.from(document.querySelectorAll('p, span, div, section'));
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

// 15. UPDATE QTY KETIK MANUAL
function updateQtyManual(index, val) {
  if (!window.keranjangPOS || !window.keranjangPOS[index]) return;

  let cleanVal = String(val).replace(',', '.');
  let numVal = parseFloat(cleanVal);
  if (isNaN(numVal) || numVal < 0) numVal = 0;

  window.keranjangPOS[index].qty = numVal;

  const itemEl = document.getElementById(`cart-item-${index}`);
  if (itemEl) {
    const subtotalEl = itemEl.querySelector('.subtotal-item-val');
    const h = parseFloat(window.keranjangPOS[index].harga) || 0;
    if (subtotalEl) {
      subtotalEl.textContent = 'Rp ' + Math.round(h * numVal).toLocaleString('id-ID');
    }
  }

  paksaHitungTotalPriceDOM();
}

// 16. UBAH QTY TOMBOL + / -
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
  paksaHitungTotalPriceDOM();
}

// 17. HAPUS ITEM DARI KERANJANG
function hapusItemKeranjang(index) {
  if (!window.keranjangPOS) return;
  window.keranjangPOS.splice(index, 1);
  renderKeranjangPOS();
  paksaHitungTotalPriceDOM();
}

// 18. RENDER TAMPILAN KERANJANG TRANSAKSI
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
        const currentQty = parseFloat(item.qty) || 0;
        const subtotal = (item.harga || 0) * currentQty;

        return `
          <div id="cart-item-${index}" class="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-xs mb-2 shadow-sm">
            <div class="truncate mr-2">
              <p class="font-extrabold text-slate-800 text-xs truncate">${item.nama_layanan || item.nama}</p>
              <p class="text-[10px] text-slate-400 mt-0.5">Rp ${(item.harga || 0).toLocaleString('id-ID')} / ${item.satuan}</p>
            </div>

            <div class="flex items-center gap-2.5 shrink-0">
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

              <p class="subtotal-item-val font-black text-slate-800 text-xs min-w-[75px] text-right">
                Rp ${Math.round(subtotal).toLocaleString('id-ID')}
              </p>

              <button type="button" onclick="hapusItemKeranjang(${index})" class="text-rose-400 hover:text-rose-600 font-bold text-xs p-1">✕</button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  paksaHitungTotalPriceDOM();
}

// 19. HITUNG AUTOMATIC TOTAL PRICE POS
function paksaHitungTotalPriceDOM() {
  let total = 0;

  if (Array.isArray(window.keranjangPOS) && window.keranjangPOS.length > 0) {
    window.keranjangPOS.forEach(item => {
      let q = parseFloat(String(item.qty).replace(',', '.')) || 0;
      let h = typeof item.harga === 'number' ? item.harga : (parseFloat(String(item.harga).replace(/[^0-9.]/g, '')) || 0);
      total += (q * h);
    });
  }

  window.totalHargaPOS = Math.round(total);
  const formattedTotal = 'Rp ' + window.totalHargaPOS.toLocaleString('id-ID');

  const mainPosTotalPrice = document.getElementById('totalPricePOS');
  if (mainPosTotalPrice) mainPosTotalPrice.textContent = formattedTotal;

  ['total-price-pos', 'total_harga', 'totalPrice', 'grand-total', 'total-bayar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = formattedTotal;
  });
}

// 20. UPDATE REALTIME PERMISSIONS TOKO KE SUPABASE
async function updateTokoPermissions(keyPermission, isChecked) {
  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);
  if (!client) return;

  let tokoId = (typeof currentToko !== 'undefined' && currentToko?.id) 
               ? currentToko.id 
               : (typeof currentUserProfile !== 'undefined' && currentUserProfile?.toko_id) 
               ? currentUserProfile.toko_id 
               : localStorage.getItem('toko_id');

  if (!tokoId) return;

  let currentPerms = (currentToko && currentToko.permissions) ? currentToko.permissions : {};
  if (typeof currentPerms === 'string') {
    try { currentPerms = JSON.parse(currentPerms); } catch (e) { currentPerms = {}; }
  }

  currentPerms[keyPermission] = isChecked;

  try {
    const { data, error } = await client
      .from('toko')
      .update({ permissions: currentPerms })
      .eq('id', tokoId)
      .select()
      .single();

    if (error) throw error;

    if (data) {
      currentToko = data;
      if (typeof showToast === 'function') {
        showToast('Izin akses berhasil diperbarui! ⚡', 'success');
      }
    }
  } catch (err) {
    console.error('Error update permissions:', err);
    if (typeof showToast === 'function') {
      showToast('Gagal memperbarui izin ke database', 'error');
    }
  }
}

// 21. LOAD STATUS SAKELAR DARI DATABASE KE FORM
function loadPermissionsToForm() {
  if (typeof currentToko === 'undefined' || !currentToko) return;

  let perms = currentToko.permissions || {};
  if (typeof perms === 'string') {
    try { perms = JSON.parse(perms); } catch (e) { perms = {}; }
  }

  const elManager = document.getElementById('perm_is_manager');
  const elLaporan = document.getElementById('perm_akses_laporan');
  const elLayanan = document.getElementById('perm_akses_layanan');
  const elPengeluaran = document.getElementById('perm_akses_pengeluaran');
  const elEditOrder = document.getElementById('perm_akses_edit_order');

  if (elManager) elManager.checked = !!perms.is_manager;
  if (elLaporan) elLaporan.checked = !!perms.akses_laporan;
  if (elLayanan) elLayanan.checked = !!perms.akses_layanan;
  if (elPengeluaran) elPengeluaran.checked = !!perms.akses_pengeluaran;
  if (elEditOrder) elEditOrder.checked = !!perms.akses_edit_order;
}

// ==========================================
// PENGELOLA AROMA PARFUM DINAMIS
// ==========================================
const DEFAULT_PARFUM = ["Standard / Original", "Lavender", "Sakura", "Lily", "Snappy"];

function getDaftarParfum() {
  const saved = localStorage.getItem('lndr_daftar_parfum');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { }
  }
  return DEFAULT_PARFUM;
}

function saveDaftarParfum(list) {
  localStorage.setItem('lndr_daftar_parfum', JSON.stringify(list));
  renderParfumOptionsPOS();
}

function renderParfumOptionsPOS() {
  const selectPOS = document.getElementById('pos_parfum');
  const selectEdit = document.getElementById('edit_parfum');
  const list = getDaftarParfum();

  let optionsHTML = '';
  list.forEach(p => {
    optionsHTML += `<option value="${p}">${p}</option>`;
  });

  if (selectPOS) selectPOS.innerHTML = optionsHTML;
  if (selectEdit) selectEdit.innerHTML = optionsHTML;
}

function openModalKelolaParfum() {
  const modal = document.getElementById('modal-kelola-parfum');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    renderKelolaParfumList();
  }
}

function closeModalKelolaParfum() {
  const modal = document.getElementById('modal-kelola-parfum');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function renderKelolaParfumList() {
  const container = document.getElementById('list-kelola-parfum-container');
  if (!container) return;

  const list = getDaftarParfum();
  if (list.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">Belum ada aroma parfum.</p>';
    return;
  }

  let html = '';
  list.forEach((p, idx) => {
    html += `
      <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
        <span class="font-bold text-slate-700">🌸 ${p}</span>
        <button onclick="hapusParfum(${idx})" class="text-rose-600 hover:text-rose-800 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 text-[10px]">
          Hapus
        </button>
      </div>
    `;
  });

  container.innerHTML = html;
}

function tambahParfumBaru() {
  const input = document.getElementById('new_nama_parfum');
  const val = input ? input.value.trim() : '';

  if (!val) {
    if (typeof showToast === 'function') showToast('Masukkan nama aroma parfum!', 'error');
    return;
  }

  const list = getDaftarParfum();
  if (list.includes(val)) {
    if (typeof showToast === 'function') showToast('Aroma parfum ini sudah ada!', 'error');
    return;
  }

  list.push(val);
  saveDaftarParfum(list);
  if (input) input.value = '';
  renderKelolaParfumList();
  if (typeof showToast === 'function') showToast('Aroma parfum berhasil ditambahkan! 🎉', 'success');
}

function hapusParfum(index) {
  const list = getDaftarParfum();
  if (list.length <= 1) {
    if (typeof showToast === 'function') showToast('Minimal harus ada 1 aroma parfum!', 'error');
    return;
  }

  list.splice(index, 1);
  saveDaftarParfum(list);
  renderKelolaParfumList();
  if (typeof showToast === 'function') showToast('Aroma parfum berhasil dihapus', 'success');
}

// Inisialisasi Otomatis saat DOM Siap
document.addEventListener('DOMContentLoaded', () => {
  if (typeof renderParfumOptionsPOS === 'function') renderParfumOptionsPOS();
  if (typeof paksaHitungTotalPriceDOM === 'function') paksaHitungTotalPriceDOM();
});

// REGISTRASI GLOBAL SCOPE WINDOW
window.toggleAccordion = toggleAccordion;
window.toggleFormTambahKasir = toggleFormTambahKasir;
window.simpanKasirBaru = simpanKasirBaru;
window.renderDaftarKasir = renderDaftarKasir;

window.openModalKelolaLayanan = openModalKelolaLayanan;
window.closeModalKelolaLayanan = closeModalKelolaLayanan;
window.renderKelolaLayananList = renderKelolaLayananList;
window.renderLayananPOS = renderLayananPOS;
window.geserPosisiLayanan = geserPosisiLayanan;
window.bukaModalEditLayanan = bukaModalEditLayanan;
window.tutupModalEditLayanan = tutupModalEditLayanan;
window.simpanPerubahanLayanan = simpanPerubahanLayanan;
window.tambahLayananBaru = tambahLayananBaru;
window.hapusLayananBaru = hapusLayananBaru;

window.bukaModalPilihLayanan = bukaModalPilihLayanan;
window.closeModalPilihLayanan = closeModalPilihLayanan;
window.handleTambahLayanan = bukaModalPilihLayanan;
window.pilihLayananKeKeranjang = pilihLayananKeKeranjang;
window.renderKeranjangPOS = renderKeranjangPOS;
window.updateQtyManual = updateQtyManual;
window.ubahQtyKeranjang = ubahQtyKeranjang;
window.hapusItemKeranjang = hapusItemKeranjang;
window.hitungsDanUpdateTotalPrice = paksaHitungTotalPriceDOM;
window.paksaHitungTotalPriceDOM = paksaHitungTotalPriceDOM;

window.updateTokoPermissions = updateTokoPermissions;
window.loadPermissionsToForm = loadPermissionsToForm;
window.openModalKelolaParfum = openModalKelolaParfum;
window.closeModalKelolaParfum = closeModalKelolaParfum;
window.tambahParfumBaru = tambahParfumBaru;
window.hapusParfum = hapusParfum;