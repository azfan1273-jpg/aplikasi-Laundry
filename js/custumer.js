// 1. Fungsi untuk menampilkan / menyembunyikan form input customer baru
function toggleFormCustomerBaru() {
    const form = document.getElementById('formCustomerBaru') || document.getElementById('formAddCustomer');
    if (form) {
        if (form.style.display === 'none' || form.style.display === '') {
            form.style.display = 'block';
        } else {
            form.style.display = 'none';
        }
    } else {
        // Jika elemen form tidak ketemu dengan ID, coba toggle class hidden
        console.log("Form pemicu toggleFormCustomerBaru diklik");
    }
}

// 2. Fungsi untuk menyimpan data ke database Supabase
async function saveCustomer(e) {
    if (e) e.preventDefault();

    // Ambil nilai dari inputan
    const nameInput = document.getElementById('customerName') || document.querySelector('input[placeholder*="Nama"]');
    const phoneInput = document.getElementById('customerPhone') || document.querySelector('input[placeholder*="Hp"]');

    if (!nameInput || !phoneInput) {
        alert("Input nama atau nomor HP tidak ditemukan!");
        return;
    }

    const nama = nameInput.value.trim();
    const no_hp = phoneInput.value.trim();

    if (!nama || !no_hp) {
        alert("Nama dan No HP wajib diisi!");
        return;
    }

    console.log("Mengirim data ke Supabase:", { nama, no_hp });

    try {
        // Tembak ke tabel 'pelanggan' dengan kolom 'nama' dan 'no_hp'
        const { data, error } = await supabase
            .from('pelanggan')
            .insert([
                { 
                    nama: nama, 
                    no_hp: no_hp 
                }
            ]);

        if (error) {
            console.error("Error Supabase:", error);
            alert("Gagal menyimpan: " + error.message);
            return;
        }

        alert("Berhasil! Pelanggan " + nama + " berhasil disimpan.");
        
        // Reset inputan
        nameInput.value = '';
        phoneInput.value = '';
        
        // Refresh halaman otomatis agar data terbaru muncul
        location.reload();

    } catch (err) {
        console.error("System Error:", err);
        alert("Terjadi kesalahan sistem: " + err.message);
    }
}

// Pastikan fungsi terdaftar di window browser
window.toggleFormCustomerBaru = toggleFormCustomerBaru;
window.saveCustomer = saveCustomer;