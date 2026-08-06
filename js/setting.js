function toggleFormTambahKasir() {
  document.getElementById('form-tambah-kasir').classList.toggle('hidden');
}

async function simpanKasirBaru() {
  const email = document.getElementById('new_kasir_email').value;
  const password = document.getElementById('new_kasir_password').value;

  if(!email || !password) {
    showToast("Isi email dan password kasir!", "error");
    return;
  }

  if(!currentToko) {
    showToast("Data toko tidak ditemukan!", "error");
    return;
  }

  try {
    const tempSupabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });

    const { data, error } = await tempSupabase.auth.signUp({ email, password });

    if (error) {
      showToast("Gagal mendaftarkan kasir: " + error.message, "error");
      return;
    }

    if (data && data.user) {
      await new Promise(resolve => setTimeout(resolve, 500));

      const { error: profError } = await supabaseClient
        .from('profiles')
        .update({
          toko_id: currentToko.id,
          role: 'kasir',
          nama_user: 'Kasir ' + email.split('@')[0]
        })
        .eq('id', data.user.id);

      if (profError) {
        showToast("Gagal menyambungkan profil kasir: " + profError.message, "error");
        return;
      }

      showToast("Akun Kasir " + email + " Berhasil Dibuat! 🎉", "success");
      document.getElementById('new_kasir_email').value = '';
      document.getElementById('new_kasir_password').value = '';
      toggleFormTambahKasir();
      loadDaftarKasirList();
    }
  } catch (err) {
    showToast("Terjadi kesalahan: " + err.message, "error");
  }
}

async function loadDaftarKasirList() {
  if (!currentToko) return;
  const res = await supabaseClient.from('profiles').select('*').eq('toko_id', currentToko.id).eq('role', 'kasir');
  const container = document.getElementById('list-kasir-container');
  const data = res.data || [];

  if (!data.length) {
    container.innerHTML = '<p class="text-[10px] text-slate-400 italic py-2">Belum ada akun kasir terdaftar.</p>';
  } else {
    container.innerHTML = data.map(k => 
      '<div class="flex justify-between items-center p-2.5 bg-white rounded-xl border border-indigo-100 text-[11px] shadow-sm">' +
        '<div><p class="font-extrabold text-slate-800">' + (k.nama_user || 'Kasir') + '</p><p class="text-[9px] text-slate-400">ID: ' + k.id.substring(0,8) + '</p></div>' +
        '<span class="text-[8px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase">Aktif</span>' +
      '</div>'
    ).join('');
  }
}

// PENGATURAN AKSES KASIR (PERMISSIONS)
function getTokoPermissions() {
  if (currentToko && currentToko.permissions) {
    return currentToko.permissions;
  }
  return {
    akses_laporan: false,
    akses_layanan: false,
    akses_pengeluaran: false,
    akses_edit_order: false,
    is_manager: false
  };
}

function loadPermissionSwitches() {
  var perms = getTokoPermissions();
  var elLaporan = document.getElementById('perm_akses_laporan');
  var elLayanan = document.getElementById('perm_akses_layanan');
  var elPengeluaran = document.getElementById('perm_akses_pengeluaran');
  var elEdit = document.getElementById('perm_akses_edit_order');
  var elManager = document.getElementById('perm_is_manager');

  if(elLaporan) elLaporan.checked = perms.akses_laporan || false;
  if(elLayanan) elLayanan.checked = perms.akses_layanan || false;
  if(elPengeluaran) elPengeluaran.checked = perms.akses_pengeluaran || false;
  if(elEdit) elEdit.checked = perms.akses_edit_order || false;
  if(elManager) elManager.checked = perms.is_manager || false;
}

async function togglePermission(key) {
  if (!currentToko) return;
  var perms = getTokoPermissions();
  
  var checkbox = document.getElementById('perm_' + key);
  if (!checkbox) return;
  
  perms[key] = checkbox.checked;

  if (key === 'is_manager' && checkbox.checked) {
    perms.akses_laporan = true;
    perms.akses_layanan = true;
    perms.akses_pengeluaran = true;
    perms.akses_edit_order = true;
    loadPermissionSwitches();
  }

  const { error } = await supabaseClient
    .from('toko')
    .update({ permissions: perms })
    .eq('id', currentToko.id);

  if (!error) {
    currentToko.permissions = perms;
    showToast("Izin akses kasir berhasil diperbarui! ⚙️", "success");
  } else {
    showToast("Gagal memperbarui izin akses: " + error.message, "error");
  }
}

// PENYIMPANAN TARGET OMSET BULANAN
function updateTargetProgressBar(currentOmsetBulanIni) {
  var targetVal = (currentToko && currentToko.target_omset) ? parseFloat(currentToko.target_omset) : 15000000;
  var percent = Math.min(100, Math.round((currentOmsetBulanIni / targetVal) * 100));
  
  var badge = document.getElementById('target-percentage-badge');
  var bar = document.getElementById('target-progress-bar');
  var txtOmset = document.getElementById('display-omset-bulan-ini');
  var txtTarget = document.getElementById('display-target-omset');

  if(badge) badge.innerText = percent + '%';
  if(bar) bar.style.width = percent + '%';
  if(txtOmset) txtOmset.innerText = 'Rp ' + currentOmsetBulanIni.toLocaleString();
  if(txtTarget) txtTarget.innerText = 'Rp ' + targetVal.toLocaleString();
}

async function simpanTargetOmset() {
  var val = parseFloat(document.getElementById('input_target_omset').value);
  if(isNaN(val) || val <= 0) {
    showToast("Masukkan nominal target omset yang valid!", "error");
    return;
  }
  if(!currentToko) return;

  const { error } = await supabaseClient
    .from('toko')
    .update({ target_omset: val })
    .eq('id', currentToko.id);

  if(!error) {
    currentToko.target_omset = val;
    showToast("Target omset bulanan diperbarui! 🎯", "success");
    document.getElementById('input_target_omset').value = '';
    loadDataHome();
  } else {
    showToast("Gagal menyimpan target omset: " + error.message, "error");
  }
}

function loadSettingsToForm() {
  if(!currentToko) return;
  var paperEl = document.getElementById('setting_paper_size');
  var footerEl = document.getElementById('setting_struk_footer');
  var waEl = document.getElementById('setting_wa_template');
  var namaTokoEl = document.getElementById('edit_nama_toko');

  if(paperEl) paperEl.value = currentToko.paper_size || '58mm';
  if(footerEl) footerEl.value = currentToko.struk_footer || '';
  if(waEl) waEl.value = currentToko.wa_template || '';
  if(namaTokoEl) namaTokoEl.value = currentToko.nama_toko || '';
}

async function simpanPengaturanStruk() {
  var size = document.getElementById('setting_paper_size').value;
  var footer = document.getElementById('setting_struk_footer').value;
  if(!currentToko) return;

  const { error } = await supabaseClient.from('toko').update({ paper_size: size, struk_footer: footer }).eq('id', currentToko.id);
  if(!error) {
    currentToko.paper_size = size;
    currentToko.struk_footer = footer;
    showToast("Pengaturan struk tersimpan! 🖨️", "success");
  } else {
    showToast("Gagal menyimpan pengaturan struk.", "error");
  }
}

async function simpanTemplateWA() {
  var tmpl = document.getElementById('setting_wa_template').value;
  if(!currentToko) return;

  const { error } = await supabaseClient.from('toko').update({ wa_template: tmpl }).eq('id', currentToko.id);
  if(!error) {
    currentToko.wa_template = tmpl;
    showToast("Template pesan WhatsApp tersimpan! 📲", "success");
  } else {
    showToast("Gagal menyimpan template WA.", "error");
  }
}

async function simpanProfilDanPassOwner() {
  var newNama = document.getElementById('edit_nama_toko').value;
  var newPass = document.getElementById('edit_owner_pass').value;

  if(!newNama) {
    showToast("Nama toko tidak boleh kosong!", "error");
    return;
  }

  if(currentToko) {
    const { error } = await supabaseClient.from('toko').update({ nama_toko: newNama }).eq('id', currentToko.id);
    if(!error) {
      currentToko.nama_toko = newNama;
      document.getElementById('topbar-nama-toko').innerText = newNama;
      showToast("Profil Toko diperbarui! 🔑", "success");
    }
  }

  if(newPass && newPass.length >= 6) {
    const { error: passErr } = await supabaseClient.auth.updateUser({ password: newPass });
    if(!passErr) {
      showToast("Password Owner berhasil diperbarui!", "success");
      document.getElementById('edit_owner_pass').value = '';
    } else {
      showToast("Gagal ubah password: " + passErr.message, "error");
    }
  }
}