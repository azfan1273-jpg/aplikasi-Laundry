// ==========================================
// FILE: js/custumer.js (VERSI FIX FULL & RENDER LIST)
// ==========================================

var allPelanggan = window.allPelanggan || [];
var selectedPelanggan = window.selectedPelanggan || null;

// FUNGSI UTAMA: RENDER DAFTAR PELANGGAN DI MODAL POS
async function renderPelangganPOS(keyword = '') {
  console.log("-> Memuat daftar pelanggan di Modal POS...");

  // Cari container list di Modal Pelanggan
  let container = document.getElementById('list-pelanggan-container')
               || document.querySelector('#modal-pelanggan .scroll-area')
               || document.querySelector('#modal-pelanggan .space-y-2');

  // Fallback pencarian tempat teks "Memuat pelanggan..."
  if (!container) {
    const allP = document.querySelectorAll('#modal-pelanggan p, #modal-pelanggan div');
    allP.forEach(el => {
      if (el.textContent.includes('Memuat pelanggan')) {
        container = el.parentElement;
      }
    });
  }

  if (!container) return;

  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);

  if (!client) {
    container.innerHTML = '<p class="text-xs text-rose-500 text-center py-6">Koneksi database belum siap.</p>';
    return;
  }

  try {
    let query = client.from('pelanggan').select('*').order('id', { ascending: false });

    // Tambah filter toko_id jika ada
    let tokoId = (typeof currentToko !== 'undefined' && currentToko?.id) ? currentToko.id : localStorage.getItem('toko_id');
    if (tokoId) {
      query = query.eq('toko_id', tokoId);
    }

    const { data: listPelanggan, error } = await query;

    if (error) throw error;

    const { data: listPelanggan, error } = await query;

    // 1. URUTKAN DATA SESUAI ALPHABET A-Z NAMA PELANGGAN
    rawData.sort((a, b) => {
      const namaA = (a.nama || a.nama_pelanggan || '').toLowerCase();
      const namaB = (b.nama || b.nama_pelanggan || '').toLowerCase();
      return namaA.localeCompare(namaB);
    });

    window.allPelanggan = rawData;

    // 2. FILTER SEARCH KEYWORD
    let filtered = window.allPelanggan;
    if (keyword && keyword.trim() !== '') {
      const cleanKey = keyword.trim().toLowerCase();
      filtered = filtered.filter(p => 
        (p.nama || p.nama_pelanggan || '').toLowerCase().includes(cleanKey) ||
        (p.no_hp || '').toLowerCase().includes(cleanKey)
      );
    }

    if (!filtered || filtered.length === 0) {
      container.innerHTML = `<div class="text-center py-8"><p class="text-xs text-slate-400 font-bold">Pelanggan ${keyword ? '"' + keyword + '"' : ''} tidak ditemukan.</p></div>`;
      return;
    }

    // 3. KELOMPOKKAN PELANGGAN BERDASARKAN HURUF PERTAMA (ALPHABET GROUPING)
    const grouped = {};
    filtered.forEach(p => {
      const nama = (p.nama || p.nama_pelanggan || 'Pelanggan').trim();
      const initial = nama.charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(initial) ? initial : '#';

      if (!grouped[letter]) {
        grouped[letter] = [];
      }
      grouped[letter].push(p);
    });

    // 4. RENDER HTML BERDASARKAN GRUP ALPHABET
    let htmlOutput = '';

    Object.keys(grouped).sort().forEach(letter => {
      const pelList = grouped[letter];

      htmlOutput += `
        <div class="mb-3 space-y-2">
          <!-- HEADER HURUF ALPHABET -->
          <div class="flex items-center gap-2 px-1">
            <div class="w-6 h-6 bg-blue-600 text-white font-black text-[11px] rounded-lg flex items-center justify-center shadow-sm">
              ${letter}
            </div>
            <div class="h-[1px] flex-1 bg-slate-200"></div>
          </div>

          <!-- LIST PELANGGAN DI BAWAH HURUF -->
          <div class="space-y-2">
            ${pelList.map(item => {
              const nama = item.nama || item.nama_pelanggan || 'Pelanggan';
              const no_hp = item.no_hp || '-';

              return `
                <div onclick="selectCustomer(${item.id}, '${nama.replace(/'/g, "\\'")}', '${no_hp}')" class="p-3 bg-white hover:bg-blue-50/50 rounded-2xl border border-slate-200/80 flex items-center justify-between cursor-pointer active:scale-[0.98] transition shadow-sm hover:border-blue-300">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xs shrink-0">
                      ${nama.charAt(0).toUpperCase()}
                    </div>
                    <div class="truncate">
                      <p class="font-extrabold text-slate-800 text-xs truncate">${nama}</p>
                      <p class="text-[10px] text-slate-400 mt-0.5">HP: ${no_hp}</p>
                    </div>
                  </div>
                  <button type="button" class="bg-blue-50 text-blue-600 font-extrabold text-[11px] px-3 py-1.5 rounded-xl hover:bg-blue-600 hover:text-white transition shrink-0">
                    Pilih
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = htmlOutput;

  } catch (err) {
    console.error('Error renderPelangganPOS:', err);
    if (container) {
      container.innerHTML = '<p class="text-xs text-rose-500 text-center py-6">Gagal memuat data pelanggan.</p>';
    }
  }
}

    // Render list pelanggan
    container.innerHTML = filtered.map(item => {
      const nama = item.nama || item.nama_pelanggan || 'Pelanggan';
      const no_hp = item.no_hp || '-';
      
      return `
        <div onclick="selectCustomer(${item.id}, '${nama.replace(/'/g, "\\'")}', '${no_hp}')" class="p-3 bg-white hover:bg-blue-50/50 rounded-2xl border border-slate-200/80 flex items-center justify-between cursor-pointer active:scale-[0.98] transition mb-2 shadow-sm hover:border-blue-300">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xs shrink-0">
              ${nama.charAt(0).toUpperCase()}
            </div>
            <div class="truncate">
              <p class="font-extrabold text-slate-800 text-xs truncate">${nama}</p>
              <p class="text-[10px] text-slate-400 mt-0.5">HP: ${no_hp}</p>
            </div>
          </div>
          <button type="button" class="bg-blue-50 text-blue-600 font-extrabold text-[11px] px-3 py-1.5 rounded-xl hover:bg-blue-600 hover:text-white transition shrink-0">
            Pilih
          </button>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Error renderPelangganPOS:', err);
    if (container) {
      container.innerHTML = '<p class="text-xs text-rose-500 text-center py-6">Gagal memuat data pelanggan.</p>';
    }
  }
}

// FUNGSI UTAMA: SIMPAN PELANGGAN BARU
async function simpanCustomerBaru(e) {
  if (e && e.preventDefault) e.preventDefault();

  console.log("-> Memproses Simpan Customer Baru...");

  const namaInput = document.getElementById('new_nama_pelanggan')
                 || document.getElementById('nama_pelanggan')
                 || document.getElementById('pelanggan_nama')
                 || document.getElementById('input_nama_customer')
                 || document.querySelector('#modal-pelanggan input[placeholder*="Nama"]')
                 || document.querySelector('#modal-pilih-pelanggan input[placeholder*="Nama"]')
                 || document.querySelector('input[placeholder*="Nama"]');

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

    if (userId) payload.user_id = userId;

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

    if (!window.allPelanggan) window.allPelanggan = [];
    window.allPelanggan.unshift(newCustomer);

    if (namaInput) namaInput.value = '';
    if (hpInput) hpInput.value = '';

    const formCustomer = document.getElementById('form-customer-baru');
    if (formCustomer) formCustomer.classList.add('hidden');

    // Otomatis pilih pelanggan & refresh list
    selectCustomer(newCustomer.id, newCustomer.nama, newCustomer.no_hp);
    renderPelangganPOS();

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

// EVENT LISTENER PENCARIAN REALTIME DI MODAL PELANGGAN
document.addEventListener('input', function(e) {
  const target = e.target;
  if (!target) return;

  const modalPelanggan = target.closest('#modal-pelanggan') || target.closest('#modal-pilih-pelanggan');

  if (modalPelanggan && target.matches('input[type="text"], input:not([type])')) {
    const keyword = target.value.trim();
    renderPelangganPOS(keyword);
  }
});

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
window.renderPelangganPOS = renderPelangganPOS;
window.fetchPelanggan = renderPelangganPOS;
window.openModalPilihPelanggan = renderPelangganPOS;
window.simpanCustomerBaruAsli = simpanCustomerBaru;
window.simpanCustomerBaru = simpanCustomerBaru;
window.simpanPelangganBaru = simpanCustomerBaru;
window.toggleFormCustomerBaru = toggleFormCustomerBaru;
window.selectCustomer = selectCustomer;
window.closeModalPilihPelanggan = closeModalPilihPelanggan;