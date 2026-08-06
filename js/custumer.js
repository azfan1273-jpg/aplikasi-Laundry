// State Management (Wadah Penampung Data)
let dataPelanggan = [];
let pelangganTerpilih = null;

// Fungsi Cari Pelanggan
function searchCustomer(keyword) {
    const customerList = document.getElementById('customerList');
    if (!customerList) return;

    if (!keyword || keyword.trim() === '') {
        renderCustomerList(dataPelanggan);
        return;
    }

    const filtered = dataPelanggan.filter(c => 
        (c.nama && c.nama.toLowerCase().includes(keyword.toLowerCase())) ||
        (c.no_hp && c.no_hp.includes(keyword))
    );

    renderCustomerList(filtered);
}

// Render Daftar Pelanggan
function renderCustomerList(list) {
    const customerList = document.getElementById('customerList');
    if (!customerList) return;

    if (!list || list.length === 0) {
        customerList.innerHTML = `
            <div class="empty-state p-4 text-center text-secondary">
                <i class="ri-user-search-line fs-1"></i>
                <p class="mb-0">Tidak ada pelanggan ditemukan</p>
            </div>
        `;
        return;
    }

    customerList.innerHTML = list.map(item => `
        <div class="customer-item p-3 border-bottom d-flex justify-content-between align-items-center" 
             onclick="selectCustomer('${item.id}')" style="cursor: pointer;">
            <div>
                <h6 class="mb-1 fw-bold">${escapeHtml(item.nama || '')}</h6>
                <small class="text-secondary"><i class="ri-phone-line"></i> ${escapeHtml(item.no_hp || '')}</small>
            </div>
            <i class="ri-arrow-right-s-line fs-4 text-secondary"></i>
        </div>
    `).join('');
}

// Ambil Data Pelanggan dari Supabase
async function fetchCustomers() {
    try {
        const { data, error } = await supabase
            .from('pelanggan')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        dataPelanggan = data || [];
        renderCustomerList(dataPelanggan);
    } catch (err) {
        console.error('Error fetching customers:', err);
        if (typeof showNotification === 'function') {
            showNotification('Gagal memuat data pelanggan', 'danger');
        }
    }
}

// Buka/Tutup Form Pelanggan Baru (Fleksibel)
function toggleFormCustomerBaru() {
    // Cari elemen form berdasarkan beberapa ID / Selektor yang mungkin
    const form = document.getElementById('formCustomerBaru') 
              || document.getElementById('formAddCustomer')
              || document.querySelector('.form-customer-baru');
              
    const btnText = document.getElementById('btnTextFormCustomer')
                 || document.querySelector('#btnToggleCustomer span');

    if (!form) {
        console.error("Elemen form customer tidak ditemukan di HTML!");
        alert("Elemen form tidak ditemukan di halaman!");
        return;
    }

    // Cek apakah form menggunakan Bootstrap 'd-none' atau inline CSS display
    const isHidden = form.classList.contains('d-none') || 
                     window.getComputedStyle(form).display === 'none';

    if (isHidden) {
        form.classList.remove('d-none');
        form.style.display = 'block';
        if (btnText) btnText.textContent = 'BATAL';
    } else {
        form.classList.add('d-none');
        form.style.display = 'none';
        if (btnText) btnText.textContent = 'TAMBAH CUSTOMER BARU';
        resetFormCustomerBaru();
    }
}

// Reset Form
function resetFormCustomerBaru() {
    const nameInput = document.getElementById('newCustomerName');
    const phoneInput = document.getElementById('newCustomerPhone');
    
    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
}

// Simpan Pelanggan Baru
async function saveCustomerBaru() {
    const nameInput = document.getElementById('newCustomerName');
    const phoneInput = document.getElementById('newCustomerPhone');

    if (!nameInput || !phoneInput) return;

    const nama = nameInput.value.trim();
    const no_hp = phoneInput.value.trim();

    if (!nama) {
        alert('Nama pelanggan wajib diisi!');
        return;
    }

    if (!no_hp) {
        alert('Nomor HP wajib diisi!');
        return;
    }

    try {
        const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        
        const payload = {
            nama: nama,
            no_hp: no_hp
        };

        if (currentUser && currentUser.id) {
            payload.user_id = currentUser.id;
        }

        const { data, error } = await supabase
            .from('pelanggan')
            .insert([payload])
            .select();

        if (error) throw error;

        alert('Pelanggan berhasil ditambahkan!');
        
        toggleFormCustomerBaru();
        await fetchCustomers();

        if (data && data.length > 0) {
            selectCustomer(data[0].id);
        }

    } catch (err) {
        console.error('Error saving customer:', err);
        alert('Gagal menyimpan pelanggan: ' + err.message);
    }
}

// Pilih Pelanggan
function selectCustomer(customerId) {
    const item = dataPelanggan.find(c => String(c.id) === String(customerId));
    if (!item) return;

    pelangganTerpilih = item;

    const selectedCustomerName = document.getElementById('selectedCustomerName');
    const selectedCustomerPhone = document.getElementById('selectedCustomerPhone');
    const customerInputSection = document.getElementById('customerInputSection');
    const selectedCustomerDisplay = document.getElementById('selectedCustomerDisplay');

    if (selectedCustomerName) selectedCustomerName.textContent = item.nama;
    if (selectedCustomerPhone) selectedCustomerPhone.textContent = item.no_hp;

    if (customerInputSection) customerInputSection.classList.add('d-none');
    if (selectedCustomerDisplay) selectedCustomerDisplay.classList.remove('d-none');

    if (typeof hideModal === 'function') {
        hideModal('modalCustomer');
    }
    
    if (typeof onCustomerSelected === 'function') {
        onCustomerSelected(item);
    }
}

// Reset Pilihan
function resetSelectedCustomer() {
    pelangganTerpilih = null;

    const customerInputSection = document.getElementById('customerInputSection');
    const selectedCustomerDisplay = document.getElementById('selectedCustomerDisplay');

    if (customerInputSection) customerInputSection.classList.remove('d-none');
    if (selectedCustomerDisplay) selectedCustomerDisplay.classList.add('d-none');

    if (typeof onCustomerReset === 'function') {
        onCustomerReset();
    }
}

// Registrasi Fungsi Global
window.searchCustomer = searchCustomer;
window.toggleFormCustomerBaru = toggleFormCustomerBaru;
window.saveCustomerBaru = saveCustomerBaru;
window.selectCustomer = selectCustomer;
window.resetSelectedCustomer = resetSelectedCustomer;
window.fetchCustomers = fetchCustomers;

document.addEventListener('DOMContentLoaded', () => {
    fetchCustomers();
});