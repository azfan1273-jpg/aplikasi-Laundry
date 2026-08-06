console.log("App.js berhasil dibaca");
function switchTab(tabName, pushHistory = true) {
function switchTab(tab) {
  // --- KODE GEMBOK TAMBAHAN (Mulai) ---
  if (tab === 'report') {
    const perms = getTokoPermissions();
    if (currentUserProfile && currentUserProfile.role !== 'owner' && !perms.is_manager && !perms.akses_laporan) {
      showToast("Akses Menu Laporan dibatasi oleh Owner!", "error");
      return; // Stop, jangan lanjut buka tab
    }
  }
  // --- KODE GEMBOK TAMBAHAN (Selesai) ---

  // ... (biarkan semua kode lama switchTab di bawah sini tetap seperti semula) ...
}

    if(tabName === 'report' && currentProfile && currentProfile.role === 'kasir') {
    var perms = getTokoPermissions();
    if(!perms.is_manager && !perms.akses_laporan) {
      showToast("Akses Laporan dikunci khusus Owner!", "error");
      return;
    }
  }

  
  currentActiveTab = tabName;

  const fabContainer = document.getElementById('fab-container');
  if (fabContainer) {
    if (tabName === 'home') fabContainer.classList.remove('hidden');
    else {
      fabContainer.classList.add('hidden');
      if (fabContainer.classList.contains('fab-active')) toggleFabMenu();
    }
  }

  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  var target = document.getElementById('panel-' + tabName);
  if(target) target.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => { 
    b.classList.remove('text-blue-600', 'font-bold'); 
    b.classList.add('text-slate-400', 'font-medium'); 
  });
  
  var btn = document.getElementById('nav-' + tabName);
  if(btn) { 
    btn.classList.remove('text-slate-400', 'font-medium'); 
    btn.classList.add('text-blue-600', 'font-bold'); 
  }

  if (pushHistory && tabName !== 'home') window.history.pushState({ tab: tabName }, "");

  if (tabName === 'order') filterOrderTab(currentOrderTab);
  if (tabName === 'report') loadReport();
}

async function triggerManualRefresh() {
  const icon = document.getElementById('refresh-icon');
  if (icon) icon.classList.add('spinning');
  
  await loadDataHome();
  await preloadLayanan();
  if (currentActiveTab === 'order') filterOrderTab(currentOrderTab);
  if (currentActiveTab === 'report') loadReport();
  
  setTimeout(() => {
    if (icon) icon.classList.remove('spinning');
    showToast("Data berhasil diperbarui! 🔄", "info");
  }, 600);
}

async function simpanPengeluaranBaru() {
  const ket = document.getElementById('input_keterangan_pengeluaran').value;
  const nom = parseFloat(document.getElementById('input_nominal_pengeluaran').value);

  if(!ket || isNaN(nom) || nom <= 0) {
    showToast("Harap isi keterangan dan nominal pengeluaran dengan benar!", "error");
    return;
  }

  if(supabaseClient && currentToko) {
    const { error } = await supabaseClient.from('pengeluaran').insert([{
      keterangan: ket,
      nominal: nom,
      toko_id: currentToko.id
    }]);

    if(!error) {
      showToast("Pengeluaran berhasil dicatat! 💸", "success");
      closeModalPengeluaran();
      loadDataHome();
    } else {
      showToast("Gagal menyimpan pengeluaran: " + error.message, "error");
    }
  }
}

async function loadDataHome() {
  if (!supabaseClient || !currentToko) return;
  
  const res = await supabaseClient.from('transaksi').select('*').eq('toko_id', currentToko.id).order('id', { ascending: false });
  const data = res.data || [];
  
  const resPel = await supabaseClient.from('pelanggan').select('*').eq('toko_id', currentToko.id);
  const resLay = await supabaseClient.from('layanan').select('*').eq('toko_id', currentToko.id);
  const resItems = await supabaseClient.from('transaksi_item').select('*');
  const resPengeluaran = await supabaseClient.from('pengeluaran').select('*').eq('toko_id', currentToko.id);
  
  const mapPel = {}; 
  allPelanggan = resPel.data || [];
  allPelanggan.forEach(p => mapPel[p.id] = p);
  
  const mapLay = {}; (resLay.data || []).forEach(l => mapLay[l.id] = l);

  globalPengeluaranCache = resPengeluaran.data || [];

  globalItemCache = {};
  (resItems.data || []).forEach(it => {
    if(!globalItemCache[it.transaksi_id]) globalItemCache[it.transaksi_id] = [];
    globalItemCache[it.transaksi_id].push({
      ...it,
      layanan: mapLay[it.layanan_id] || { nama_layanan: 'Layanan', satuan: 'Kg', harga: 0 }
    });
  });

  globalTxCache = data.map(t => {
    return {
      ...t,
      pelanggan: mapPel[t.pelanggan_id] || { nama: 'Customer #' + t.pelanggan_id, no_hp: '-' }
    };
  });

  var totalOmsetHariIni = 0, totalPengeluaranHariIni = 0, totalSelesai = 0, totalAktif = 0, totalHarusSelesai = 0, totalTerlambat = 0;
  var now = new Date();
  var todayString = now.toDateString(); 

  var txHariIni = [];
  var omsetBulanIni = 0;
  var currentMonth = now.getMonth();
  var currentYear = now.getFullYear();

  for(var i = 0; i < globalTxCache.length; i++) { 
    var t = globalTxCache[i];
    var st = t.status_laundry || 'Diterima';
    var tglBuat = t.created_at ? new Date(t.created_at) : null;

    var isHariIni = tglBuat && (tglBuat.toDateString() === todayString);

    if (tglBuat && tglBuat.getMonth() === currentMonth && tglBuat.getFullYear() === currentYear && st !== 'Batal') {
      omsetBulanIni += (t.total_harga || 0);
    }

    if (isHariIni) {
      txHariIni.push(t);
      if (st !== 'Batal') {
        totalOmsetHariIni += (t.total_harga || 0);
      }
    }
    
    if(st === 'Selesai') {
      totalSelesai++;
    } else if(st !== 'Batal') {
      totalAktif++;
      if(t.estimasi_selesai && new Date(t.estimasi_selesai) < now) {
        totalTerlambat++;
      } else if(t.estimasi_selesai) {
        var tglEst = new Date(t.estimasi_selesai);
        if(tglEst.toDateString() === todayString) {
          totalHarusSelesai++;
        }
      }
    }
  }

  globalPengeluaranCache.forEach(p => {
    var tglP = p.created_at ? new Date(p.created_at) : null;
    if(tglP && tglP.toDateString() === todayString) {
      totalPengeluaranHariIni += (p.nominal || 0);
    }
  });

  document.getElementById('stat-aktif').innerText = totalAktif;
  document.getElementById('stat-harus-selesai').innerText = totalHarusSelesai;
  document.getElementById('stat-terlambat').innerText = totalTerlambat;
  document.getElementById('stat-selesai').innerText = totalSelesai;
  document.getElementById('stat-omset').innerText = 'Rp ' + totalOmsetHariIni.toLocaleString();
  document.getElementById('count-masuk').innerText = txHariIni.length + ' Order';

  document.getElementById('home-footer-pengeluaran').innerText = 'Rp ' + totalPengeluaranHariIni.toLocaleString();

  updateTargetProgressBar(omsetBulanIni);

  const container = document.getElementById('list-home');
  if(container) {
    if(!txHariIni.length) { 
      container.innerHTML = '<p class="text-xs text-slate-400 text-center py-6">Belum ada orderan masuk hari ini.</p>'; 
      return; 
    }
    
    container.innerHTML = txHariIni.map((t, idx) => {
      var nmPel = t.pelanggan.nama || t.pelanggan.nama_pelanggan || 'Customer';
      var items = globalItemCache[t.id] || [];
      var summaryLayanan = items.length > 0 ? items.map(i => (i.layanan ? i.layanan.nama_layanan : 'Layanan') + ' (' + i.qty + ' ' + (i.layanan ? i.layanan.satuan : 'Kg') + ')') .join(', ') : 'Multi Layanan';
      var stColor = t.status_laundry === 'Batal' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800';

      return '<div onclick="openModalDetailOrderById(' + t.id + ')" class="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex justify-between items-center cursor-pointer active:scale-[0.99] transition">' +
        '<div class="flex items-center gap-2.5"><span class="w-5 h-5 bg-blue-100 text-blue-700 font-bold text-[10px] rounded-full flex items-center justify-center shrink-0">' + (idx+1) + '</span>' +
        '<div class="max-w-[200px] sm:max-w-xs">' +
          '<p class="font-extrabold text-slate-900 text-xs truncate">' + nmPel + ' <span class="text-[9px] text-slate-400 font-normal">#' + t.id + '</span></p>' +
          '<p class="text-[11px] text-slate-500 mt-0.5 truncate">' + summaryLayanan + '</p>' +
          '<div class="flex items-center gap-1.5 mt-0.5">' +
            '<span class="text-[8px] font-bold px-1.5 py-0.5 rounded ' + stColor + '">' + (t.status_laundry || 'Diterima') + '</span>' +
            '<span class="text-[9px] text-slate-400">Est: ' + (t.estimasi_selesai ? new Date(t.estimasi_selesai).toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : '-') + '</span>' +
          '</div>' +
        '</div></div>' +
        '<p class="font-black text-blue-600 text-xs">Rp ' + (t.total_harga ? t.total_harga.toLocaleString() : '0') + '</p>' +
      '</div>';
    }).join('');
  }
}

// DIAGRAM TRAFFIC PENDAPATAN
function openModalJendelaAkunWithChart() {
  if (currentProfile && currentProfile.role === 'kasir') {
    showToast("Akses Analitik dikunci khusus Owner!", "error");
    return;
  }
  openModalWithHistory('modal-jendela-akun');
  if(currentUser && currentUser.email) {
    var emailEl = document.getElementById('account-modal-email');
    if(emailEl) emailEl.innerText = currentUser.email;
  }
  setTimeout(() => renderTrafficPendapatanChart(), 150);
}

function renderTrafficPendapatanChart() {
  var canvas = document.getElementById('trafficPendapatanChart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, 750, 150);

  var now = new Date();
  var todayStr = now.toDateString();
  var chartData = [];

  for (var h = 0; h < 24; h++) {
    var pendapatan = globalTxCache.reduce((sum, t) => {
      var tgl = t.created_at ? new Date(t.created_at) : null;
      if (tgl && tgl.toDateString() === todayStr && tgl.getHours() === h && t.status_laundry !== 'Batal') {
        return sum + (t.total_harga || 0);
      }
      return sum;
    }, 0);

    var pengeluaran = globalPengeluaranCache.reduce((sum, p) => {
      var tgl = p.created_at ? new Date(p.created_at) : null;
      if (tgl && tgl.toDateString() === todayStr && tgl.getHours() === h) {
        return sum + (p.nominal || 0);
      }
      return sum;
    }, 0);

    var sisaModal = pendapatan - pengeluaran;

    chartData.push({
      hourLabel: (h < 10 ? '0' + h : h) + ':00',
      pendapatan: pendapatan,
      pengeluaran: pengeluaran,
      sisaModal: sisaModal
    });
  }

  var maxVal = 50000;
  chartData.forEach(d => {
    var peak = Math.max(d.pendapatan, d.pengeluaran, Math.abs(d.sisaModal));
    if (peak > maxVal) maxVal = peak;
  });

  var paddingLeft = 35;
  var paddingBottom = 120;
  var chartWidth = 730 - paddingLeft;
  var heightMax = 95;

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(paddingLeft, 15); ctx.lineTo(paddingLeft, paddingBottom);
  ctx.moveTo(paddingLeft, paddingBottom); ctx.lineTo(730, paddingBottom);
  ctx.stroke();

  var stepX = chartWidth / 24;

  chartData.forEach((d, idx) => {
    var x = paddingLeft + (idx * stepX) + (stepX / 2);

    var yPendapatan = paddingBottom - ((d.pendapatan / maxVal) * heightMax);
    var yPengeluaran = paddingBottom - ((d.pengeluaran / maxVal) * heightMax);

    var isProfit = d.sisaModal >= 0;
    var color = (d.pendapatan === 0 && d.pengeluaran === 0) ? "#cbd5e1" : (isProfit ? "#10b981" : "#ef4444");

    var yHigh = Math.min(yPendapatan, yPengeluaran);
    var yLow = Math.max(yPendapatan, yPengeluaran);

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, yHigh);
    ctx.lineTo(x, paddingBottom);
    ctx.stroke();

    var bodyHeight = Math.max(4, yLow - yHigh);

    ctx.fillStyle = color;
    ctx.fillRect(x - 4, yHigh, 8, bodyHeight);

    if (idx % 2 === 0) {
      ctx.fillStyle = "#64748b";
      ctx.font = "8px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(d.hourLabel, x, paddingBottom + 15);
    }
  });
}

window.onload = function() { 
  checkUserSession();

  if (supabaseClient) {
    supabaseClient
      .channel('public:transaksi')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaksi' }, payload => {
        if(currentUser) {
          loadDataHome();
          if (currentActiveTab === 'order') filterOrderTab(currentOrderTab);
          if (currentActiveTab === 'report') loadReport();
        }
      })
      .subscribe();
  }
};