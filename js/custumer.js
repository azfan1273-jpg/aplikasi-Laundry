// Fungsi untuk menyimpan customer baru
async function saveCustomer(e) {
    if (e) e.preventDefault();

    // 1. Ambil nilai dari inputan form
    const nameInput = document.getElementById('customerName');
    const phoneInput = document.getElementById('customerPhone');

    if (!nameInput || !phoneInput) {
        alert("Error: Elemen input tidak ditemukan di halaman!");
        return;
    }

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name || !phone) {
        alert("Nama dan No HP wajib diisi!");
        return;
    }

    console.log("Memproses simpan customer:", { name, phone });

    try {
        // 2. Kirim data HANYA nama dan phone ke tabel customers
        const { data, error } = await supabase
            .from('customers')
            .insert([
                { 
                    nama: name, 
                    phone: phone 
                }
            ]);

        if (error) {
            console.error("Error Supabase:", error);
            alert("Gagal menyimpan ke database: " + error.message);
            return;
        }

        alert("Berhasil! Customer " + name + " telah tersimpan.");
        
        // Bersihkan inputan
        nameInput.value = '';
        phoneInput.value = '';
        
        // Refresh / tutup modal jika ada
        if (typeof hideModal === 'function') {
            hideModal('modalCustomer');
        } else {
            location.reload();
        }

    } catch (err) {
        console.error("System Error:", err);
        alert("Terjadi kesalahan sistem: " + err.message);
    }
}

// Pasang fungsi ke window supaya bisa dipanggil dari HTML
window.saveCustomer = saveCustomer;