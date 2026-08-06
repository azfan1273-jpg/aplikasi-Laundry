async function loadReport() {
  if(!globalTxCache) return;

  var todayString = new Date().toDateString();

  var totalOmset = 0;
  var totalPendapatan = 0;
  var totalPengeluaran = 0;
  var countOrder = 0;
  var countSelesai = 0;
  var countBatal = 0;

  globalTxCache.forEach(t => {
    var tgl = t.created_at ? new Date(t.created_at) : null;
    if(tgl && tgl.toDateString() === todayString) {
      countOrder++;
      var st = t.status_laundry || 'Diterima';
      var harga = t.total_harga || 0;

      if (st !== 'Batal') totalOmset += harga;
      if (t.status_pembayaran === 'Lunas' && st !== 'Batal') totalPendapatan += harga;
      if (st === 'Selesai') countSelesai++;
      if (st === 'Batal') countBatal++;
    }
  });

  globalPengeluaranCache.forEach(p => {
    var tgl = p.created_at ? new Date(p.created_at) : null;
    if(tgl && tgl.toDateString() === todayString) {
      totalPengeluaran += (p.nominal || 0);
    }
  });

  document.getElementById('rpt-stat-omset').innerText = 'Rp ' + totalOmset.toLocaleString();
  document.getElementById('rpt-stat-pendapatan').innerText = 'Rp ' + totalPendapatan.toLocaleString();
  document.getElementById('rpt-stat-pengeluaran').innerText = 'Rp ' + totalPengeluaran.toLocaleString();
  document.getElementById('rpt-stat-order').innerText = countOrder;
  document.getElementById('rpt-stat-selesai').innerText = countSelesai;
  document.getElementById('rpt-stat-batal').innerText = countBatal;

  renderReportSubContent();
}

function switchReportSubTab(sub) {
  currentReportSubTab = sub;
  document.querySelectorAll('.tab-report-btn').forEach(btn => btn.classList.remove('active'));
  var activeBtn = document.getElementById('subtab-' + sub);
  if(activeBtn) activeBtn.classList.add('active');

  renderReportSubContent();
}

function renderReportSubContent() {
  const container = document.getElementById('list-report');
  if(!container) return;

  if (currentReportSubTab === 'transaksi') {
    container.innerHTML = 
      '<div class="grid grid-cols-1 gap-2.5 text-xs">' +
        renderReportCard('Semua Transaksi', '📊', 'Lihat seluruh riwayat orderan laundry', 'semua_transaksi') +
        renderReportCard('Transaksi per Layanan', '🧺', 'Laporan orderan berdasarkan jenis layanan', 'transaksi_layanan') +
        renderReportCard('Transaksi Belum Selesai', '⏳', 'Daftar orderan aktif / antrian / proses', 'transaksi_proses') +
        renderReportCard('Transaksi Selesai', '✅', 'Daftar orderan yang sudah rampung', 'transaksi_selesai') +
        renderReportCard('Transaksi Batal', '❌', 'Daftar orderan yang telah dibatalkan', 'transaksi_batal') +
      '</div>';

  } else if (currentReportSubTab === 'keuangan') {
    container.innerHTML = 
      '<div class="grid grid-cols-1 gap-2.5 text-xs">' +
        renderReportCard('Laporan Omset', '💰', 'Total potensi pendapatan dari orderan', 'keuangan_omset') +
        renderReportCard('Laporan Pendapatan', '📈', 'Total uang masuk/lunas riil', 'keuangan_pendapatan') +
        renderReportCard('Laporan Operasional', '💸', 'Rincian biaya pengeluaran toko', 'keuangan_operasional') +
        renderReportCard('Laporan Piutang', '📋', 'Daftar tagihan laundry belum lunas', 'keuangan_piutang') +
        renderReportCard('Laporan Laba & Rugi', '📊', 'Kalkulasi bersih pendapatan vs pengeluaran', 'keuangan_labarugi') +
      '</div>';

  } else if (currentReportSubTab === 'pelanggan') {
    container.innerHTML = 
      '<div class="grid grid-cols-1 gap-2.5 text-xs">' +
        renderReportCard('Ringkasan Pelanggan', '👥', 'Total statistik dan gambaran umum customer', 'pelanggan_ringkasan') +
        renderReportCard('Detail Pelanggan', '📄', 'Daftar kontak & histori order tiap customer', 'pelanggan_detail') +
        renderReportCard('Top Customer', '👑', 'Pelanggan paling sering / terbanyak order', 'pelanggan_top') +
        renderReportCard('Reward Pelanggan', '🎁', 'Poin / program promo & kesetiaan', 'pelanggan_reward') +
      '</div>';
  }
}

function renderReportCard(title, icon, desc, type) {
  return '<div onclick="openModalSubReport(\'' + title + '\', \'' + type + '\')" class="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-200/80 flex items-center justify-between cursor-pointer active:scale-[0.98] transition">' +
    '<div class="flex items-center gap-3">' +
      '<div class="w-9 h-9 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-lg">' + icon + '</div>' +
      '<div>' +
        '<p class="font-extrabold text-slate-800 text-xs">' + title + '</p>' +
        '<p class="text-[10px] text-slate-400 mt-0.5">' + desc + '</p>' +
      '</div>' +
    '</div>' +
    '<span class="text-slate-400 font-bold text-xs">➔</span>' +
  '</div>';
}

function openModalSubReport(title, type) {
  const container = document.getElementById('list-report-modal-container');

  if (type === 'semua_transaksi' || type === 'transaksi_layanan' || type === 'transaksi_batal') {
    renderModalFilterableReport(type, title);
  } else if (type === 'transaksi_proses' || type === 'transaksi_selesai' || type === 'keuangan_piutang') {
    renderModalListDirectReport(type, title);
  } else if (type.startsWith('keuangan_')) {
    renderModalKeuanganReport(type, title);
  } else if (type === 'pelanggan_ringkasan') {
    renderModalRingkasanPelanggan();
  } else if (type === 'pelanggan_detail') {
    renderModalListDetailPelanggan();
  } else if (type === 'pelanggan_top') {
    renderModalTopCustomer();
  } else {
    container.innerHTML = 
      '<div class="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center space-y-2 py-8 my-4">' +
        '<span class="text-3xl">📊</span>' +
        '<h4 class="font-black text-blue-900 text-sm">' + title + '</h4>' +
        '<p class="text-xs text-blue-600">Fitur laporan ini siap disesuaikan pada langkah berikutnya.</p>' +
      '</div>';
  }

  openModalWithHistory('modal-detail-laporan');
}

function renderModalRingkasanPelanggan() {
  const container = document.getElementById('list-report-modal-container');
  var totalPel = allPelanggan.length;
  var now = new Date();
  var sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

  var rankS = 0, rankA = 0, rankB = 0, rankC = 0, rankD = 0, countDihapus = 0;

  allPelanggan.forEach(p => {
    if (p.is_deleted) { countDihapus++; return; }
    var pelTxList = globalTxCache.filter(t => {
      if (t.pelanggan_id !== p.id || t.status_laundry === 'Batal') return false;
      var tgl = t.created_at ? new Date(t.created_at) : new Date();
      return tgl >= sevenDaysAgo && tgl <= now;
    });

    var totalSpend7Hari = pelTxList.reduce((sum, t) => sum + (t.total_harga || 0), 0);

    if (totalSpend7Hari >= 300000) rankS++;
    else if (totalSpend7Hari >= 200000) rankA++;
    else if (totalSpend7Hari >= 100000) rankB++;
    else if (totalSpend7Hari >= 50000) rankC++;
    else rankD++;
  });

  container.innerHTML = 
    '<div class="space-y-4 py-2">' +
      '<div class="text-center border-b pb-3 border-slate-100">' +
        '<h3 class="font-extrabold text-slate-900 text-base">Ringkasan Pelanggan</h3>' +
        '<div class="w-10 h-0.5 bg-rose-500 mx-auto mt-1 rounded-full"></div>' +
      '</div>' +

      '<div class="p-4 bg-slate-50 border border-slate-200/80 rounded-3xl text-center space-y-3 shadow-sm">' +
        '<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 font-black text-xl shadow-inner">' + totalPel + '</div>' +
        '<div><h4 class="font-extrabold text-slate-800 text-sm">Total Jumlah Pelanggan</h4><p class="text-[10px] text-slate-400 mt-0.5">Statistik Rank Pelanggan (7 Hari Terakhir GMT+7)</p></div>' +
        '<div class="pt-2 flex justify-center items-center"><canvas id="pelangganChart" width="220" height="100" class="mx-auto"></canvas></div>' +
      '</div>' +

      '<div class="grid grid-cols-3 gap-3 text-center pt-2">' +
        '<div class="space-y-1"><div class="w-10 h-10 bg-cyan-50 border border-cyan-200 rounded-2xl flex items-center justify-center mx-auto text-cyan-600 text-lg shadow-sm">💎</div><p class="text-[10px] font-bold text-slate-600">Rank S</p><p class="font-black text-slate-800 text-sm">' + rankS + '</p><p class="text-[8px] text-slate-400">≥ 300k</p></div>' +
        '<div class="space-y-1"><div class="w-10 h-10 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-amber-600 text-lg shadow-sm">🥇</div><p class="text-[10px] font-bold text-slate-600">Rank A</p><p class="font-black text-slate-800 text-sm">' + rankA + '</p><p class="text-[8px] text-slate-400">200k - 300k</p></div>' +
        '<div class="space-y-1"><div class="w-10 h-10 bg-slate-100 border border-slate-300 rounded-2xl flex items-center justify-center mx-auto text-slate-600 text-lg shadow-sm">🥈</div><p class="text-[10px] font-bold text-slate-600">Rank B</p><p class="font-black text-slate-800 text-sm">' + rankB + '</p><p class="text-[8px] text-slate-400">100k - 200k</p></div>' +
        '<div class="space-y-1 pt-2"><div class="w-10 h-10 bg-amber-100/60 border border-amber-300 rounded-2xl flex items-center justify-center mx-auto text-amber-800 text-lg shadow-sm">🥉</div><p class="text-[10px] font-bold text-slate-600 leading-tight">Rank C</p><p class="font-black text-slate-800 text-sm">' + rankC + '</p><p class="text-[8px] text-slate-400">50k - 100k</p></div>' +
        '<div class="space-y-1 pt-2"><div class="w-10 h-10 bg-slate-200/70 border border-slate-300 rounded-2xl flex items-center justify-center mx-auto text-slate-700 text-lg shadow-sm">🎖️</div><p class="text-[10px] font-bold text-slate-600 leading-tight">Rank D</p><p class="font-black text-slate-800 text-sm">' + rankD + '</p><p class="text-[8px] text-slate-400">&lt; 50k</p></div>' +
        '<div class="space-y-1 pt-2"><div class="w-10 h-10 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto text-rose-600 text-lg shadow-sm">🗑️</div><p class="text-[10px] font-bold text-slate-600 leading-tight">Dihapus</p><p class="font-black text-slate-800 text-sm">' + countDihapus + '</p><p class="text-[8px] text-slate-400">Nonaktif</p></div>' +
      '</div>' +
    '</div>';

  setTimeout(() => {
    var canvas = document.getElementById('pelangganChart');
    if (canvas) {
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,220,100);
      var maxVal = Math.max(rankS, rankA, rankB, rankC, rankD, 1);
      var drawBar = (x, val, color, label) => {
        var h = (val / maxVal) * 55;
        ctx.fillStyle = color; ctx.fillRect(x, 70 - h, 25, h);
        ctx.fillStyle = "#64748b"; ctx.font = "8px sans-serif"; ctx.fillText(label, x + 4, 85);
      };
      drawBar(10, rankS, "#06b6d4", "S"); drawBar(45, rankA, "#f59e0b", "A"); drawBar(80, rankB, "#94a3b8", "B");
      drawBar(115, rankC, "#d97706", "C"); drawBar(150, rankD, "#64748b", "D"); drawBar(185, countDihapus, "#f43f5e", "Del");
    }
  }, 100);
}

function renderModalListDetailPelanggan() {
  const container = document.getElementById('list-report-modal-container');
  if (!allPelanggan.length) { container.innerHTML = '<p class="text-xs text-slate-400 text-center py-10">Belum ada data pelanggan.</p>'; return; }

  container.innerHTML = 
    '<div class="space-y-3 py-2">' +
      '<div class="text-center border-b pb-3 border-slate-100"><h3 class="font-extrabold text-slate-900 text-base">Detail Data Pelanggan</h3><p class="text-[10px] text-slate-400 mt-0.5">Klik nama pelanggan untuk membuka histori lengkap</p><div class="w-10 h-0.5 bg-rose-500 mx-auto mt-1 rounded-full"></div></div>' +
      '<div class="space-y-2">' +
        allPelanggan.map(p => {
          var nm = p.nama || p.nama_pelanggan || 'Customer';
          var hp = p.no_hp || '08-';
          return '<div onclick="openProfilePelangganDetail(' + p.id + ')" class="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-200/80 flex items-center justify-between cursor-pointer active:scale-[0.98] transition">' +
            '<div class="flex items-center gap-3"><div class="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-extrabold text-xs">' + nm.charAt(0).toUpperCase() + '</div><div><p class="font-extrabold text-slate-800 text-xs">' + nm + '</p><p class="text-[10px] text-slate-400 mt-0.5">HP : ' + hp + '</p></div></div>' +
            '<span class="text-blue-600 font-bold text-xs">Detail ➔</span>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
}

function renderModalTopCustomer() {
  const container = document.getElementById('list-report-modal-container');
  if (!allPelanggan.length) { container.innerHTML = '<p class="text-xs text-slate-400 text-center py-10">Belum ada data pelanggan.</p>'; return; }

  var topList = allPelanggan.map(p => {
    var nm = p.nama || p.nama_pelanggan || 'Customer';
    var hp = p.no_hp || '08-';
    var txList = globalTxCache.filter(t => t.pelanggan_id === p.id && t.status_laundry !== 'Batal');
    var totalBelanja = txList.reduce((sum, t) => sum + (t.total_harga || 0), 0);
    return { id: p.id, nama: nm, no_hp: hp, totalBelanja: totalBelanja, totalOrder: txList.length };
  });

  topList.sort((a, b) => b.totalBelanja - a.totalBelanja);

  container.innerHTML = 
    '<div class="space-y-3 py-2">' +
      '<div class="text-center border-b pb-3 border-slate-100"><h3 class="font-extrabold text-slate-900 text-base">👑 Top Customer</h3><p class="text-[10px] text-slate-400 mt-0.5">Daftar pelanggan diurutkan dari total pengeluaran terbanyak</p><div class="w-10 h-0.5 bg-rose-500 mx-auto mt-1 rounded-full"></div></div>' +
      '<div class="space-y-2">' +
        topList.map((p, idx) => {
          var rankNum = idx + 1;
          var badgeStyle = "bg-slate-100 text-slate-600";
          var medalIcon = "";
          if (rankNum === 1) { badgeStyle = "bg-amber-400 text-white font-black shadow-md"; medalIcon = "🥇 "; }
          else if (rankNum === 2) { badgeStyle = "bg-slate-300 text-slate-800 font-black"; medalIcon = "🥈 "; }
          else if (rankNum === 3) { badgeStyle = "bg-amber-700/80 text-white font-black"; medalIcon = "🥉 "; }

          return '<div onclick="openProfilePelangganDetail(' + p.id + ')" class="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-200/80 flex items-center justify-between cursor-pointer active:scale-[0.98] transition">' +
            '<div class="flex items-center gap-3 max-w-[200px] sm:max-w-xs"><div class="w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ' + badgeStyle + '">' + rankNum + '</div><div class="truncate"><p class="font-extrabold text-slate-800 text-xs truncate">' + medalIcon + p.nama + '</p><p class="text-[10px] text-slate-400 mt-0.5">' + p.totalOrder + ' Orderan • HP: ' + p.no_hp + '</p></div></div>' +
            '<div class="text-right shrink-0"><p class="font-black text-blue-600 text-xs">Rp ' + p.totalBelanja.toLocaleString() + '</p><p class="text-[9px] text-emerald-600 font-bold mt-0.5">Top #' + rankNum + '</p></div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
}

function openProfilePelangganDetail(pelangganId) {
  const pel = allPelanggan.find(p => p.id === pelangganId);
  if (!pel) return;

  const container = document.getElementById('list-profile-modal-container');
  var nm = pel.nama || pel.nama_pelanggan || 'Customer';
  var hp = pel.no_hp || '08-';

  var pelTxList = globalTxCache.filter(t => t.pelanggan_id === pelangganId);
  var totalUang = 0, tagihanBelumLunas = 0, jumlahTrx = pelTxList.length, jumlahTrxBatal = 0, totalBeratKg = 0;
  var trxPertama = '-', trxTerakhir = '-';

  if (pelTxList.length > 0) {
    var sorted = [...pelTxList].sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    trxPertama = formatDateIndo(sorted[0].created_at);
    trxTerakhir = formatDateIndo(sorted[sorted.length - 1].created_at);

    pelTxList.forEach(t => {
      var st = t.status_laundry || 'Diterima';
      var stBayar = t.status_pembayaran || 'Belum Lunas';
      var hrg = t.total_harga || 0;

      if (st === 'Batal') jumlahTrxBatal++;
      else {
        totalUang += hrg;
        if (stBayar !== 'Lunas') tagihanBelumLunas += hrg;
      }

      var items = globalItemCache[t.id] || [];
      items.forEach(it => {
        var sat = (it.layanan ? it.layanan.satuan : 'Kg').toLowerCase();
        if (sat === 'kg') totalBeratKg += (it.qty || 0);
      });
    });
  }

  container.innerHTML = 
    '<div class="space-y-4 py-2">' +
      '<div class="flex flex-col items-center justify-center text-center space-y-1 border-b pb-4 border-slate-100"><div class="w-16 h-16 bg-blue-100 border-2 border-dashed border-blue-400 rounded-full flex items-center justify-center text-2xl font-black text-blue-600 shadow-sm">' + nm.charAt(0).toUpperCase() + '</div><h3 class="font-extrabold text-slate-900 text-base mt-1">' + nm + '</h3><p class="text-xs font-bold text-slate-400">' + hp + '</p></div>' +
      '<div class="space-y-2"><h4 class="font-black text-slate-900 text-xs tracking-wide">Data Transaksi</h4><div class="space-y-2 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100"><div class="flex justify-between"><span>Total Uang Transaksi</span><span class="font-bold text-slate-900">Rp ' + totalUang.toLocaleString() + '</span></div><div class="flex justify-between"><span>Tagihan Belum Lunas</span><span class="font-bold text-rose-600">Rp ' + tagihanBelumLunas.toLocaleString() + '</span></div><div class="flex justify-between"><span>Jumlah Transaksi</span><span class="font-bold text-slate-900">' + jumlahTrx + ' Transaksi</span></div><div class="flex justify-between"><span>Rincian Berat</span><span class="font-bold text-slate-900">' + totalBeratKg.toFixed(1) + ' Kg</span></div><div class="flex justify-between"><span>Transaksi Pertama</span><span class="font-bold text-slate-800">' + trxPertama + '</span></div><div class="flex justify-between"><span>Transaksi Terakhir</span><span class="font-bold text-slate-800">' + trxTerakhir + '</span></div></div></div>' +
      '<div class="space-y-2 pt-2 border-t border-slate-100"><h4 class="font-black text-slate-900 text-xs tracking-wide">History Transaksi</h4>' + (!pelTxList.length ? '<p class="text-xs text-slate-400 text-center py-6">Belum ada riwayat transaksi.</p>' : '<div class="space-y-2">' + pelTxList.map(t => '<div onclick="openModalDetailOrderById(' + t.id + ')" class="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-start text-xs cursor-pointer active:scale-[0.98] transition"><div><p class="font-extrabold text-slate-800">TRX/' + String(t.id).padStart(8, '0') + '</p><p class="text-[10px] text-slate-400">' + formatDateIndo(t.created_at) + '</p></div><div class="text-right"><p class="font-extrabold ' + (t.status_pembayaran === 'Lunas' ? 'text-emerald-600' : 'text-rose-600') + '">' + (t.status_pembayaran||'Belum Bayar') + '</p><p class="text-[10px] text-slate-500 font-bold">Status : ' + (t.status_laundry||'Diterima').toUpperCase() + '</p></div></div>').join('') + '</div>') + '</div>' +
    '</div>';

  openModalWithHistory('modal-profile-pelanggan');
}

function renderModalFilterableReport(type, title) {
  const container = document.getElementById('list-report-modal-container');
  container.innerHTML = 
    '<div class="space-y-4 py-2"><div class="text-center border-b pb-3 border-slate-100"><h3 class="font-extrabold text-slate-900 text-base">Laporan Transaksi</h3><div class="w-10 h-0.5 bg-rose-500 mx-auto mt-1 rounded-full"></div></div>' +
    '<div class="space-y-1 text-xs"><label class="font-medium text-slate-600 text-[11px]">waktu</label><select id="report_time_filter" onchange="applyReportFilter(\'' + type + '\')" class="w-full p-3 border border-slate-300 rounded-xl bg-white font-bold text-xs outline-none focus:border-blue-500"><option value="hari_ini">Hari Ini</option><option value="seminggu">Seminggu</option><option value="bulan_ini">Bulan Ini</option><option value="30_hari">30 Hari</option></select></div>' +
    '<div class="pt-2 border-t border-slate-100"><p class="font-bold text-slate-800 text-sm">Total Transaksi</p><div class="flex justify-between items-center text-xs text-slate-400 font-bold mt-1"><span id="count_trx_report">0 TRANSAKSI</span><span id="unit_trx_report">0 Kg</span></div></div>' +
    '<div id="report_data_content" class="pt-4"></div></div>';
  applyReportFilter(type);
}

function renderModalKeuanganReport(type, title) {
  const container = document.getElementById('list-report-modal-container');
  container.innerHTML = 
    '<div class="space-y-4 py-2"><div class="text-center border-b pb-3 border-slate-100"><h3 class="font-extrabold text-slate-900 text-base">' + title + '</h3><div class="w-10 h-0.5 bg-rose-500 mx-auto mt-1 rounded-full"></div></div>' +
    '<div class="flex items-center gap-2 text-xs"><div class="flex-1 space-y-1"><label class="font-medium text-slate-600 text-[11px]">waktu</label><select id="keuangan_time_filter" onchange="applyKeuanganFilter(\'' + type + '\')" class="w-full p-3 border border-slate-300 rounded-xl bg-white font-bold text-xs outline-none focus:border-blue-500"><option value="hari_ini">Hari Ini</option><option value="seminggu">Seminggu</option><option value="bulan_ini">Bulan Ini</option><option value="30_hari">30 Hari</option></select></div></div>' +
    '<div class="pt-2 border-t border-slate-100 space-y-1"><p class="font-bold text-slate-800 text-sm">Total ' + title.replace('Laporan ', '') + '</p><h2 id="display_total_keuangan" class="text-emerald-600 font-black text-lg pt-1">Rp 0</h2></div>' +
    '<div id="keuangan_data_content" class="pt-4"></div></div>';
  applyKeuanganFilter(type);
}

function applyKeuanganFilter(type) {
  const timeVal = document.getElementById('keuangan_time_filter').value;
  var now = new Date();
  var isMatchDate = function(dateObj) {
    if (!dateObj) return false;
    if (timeVal === 'hari_ini') return dateObj.toDateString() === now.toDateString();
    else if (timeVal === 'seminggu') return Math.ceil(Math.abs(now - dateObj) / (1000 * 60 * 60 * 24)) <= 7;
    else if (timeVal === 'bulan_ini') return dateObj.getMonth() === now.getMonth() && dateObj.getFullYear() === now.getFullYear();
    return true;
  };

  var totalNominal = 0;
  var dataList = [];

  if (type === 'keuangan_omset') {
    dataList = globalTxCache.filter(t => isMatchDate(t.created_at ? new Date(t.created_at) : null) && t.status_laundry !== 'Batal');
    totalNominal = dataList.reduce((acc, curr) => acc + (curr.total_harga || 0), 0);
  } else if (type === 'keuangan_operasional') {
    dataList = globalPengeluaranCache.filter(p => isMatchDate(p.created_at ? new Date(p.created_at) : null));
    totalNominal = dataList.reduce((acc, curr) => acc + (curr.nominal || 0), 0);
  }

  document.getElementById('display_total_keuangan').innerText = 'Rp ' + totalNominal.toLocaleString();
  const contentEl = document.getElementById('keuangan_data_content');

  if (!dataList.length) {
    contentEl.innerHTML = '<p class="text-xs text-slate-400 text-center py-6">Tidak ada data.</p>';
  } else {
    contentEl.innerHTML = dataList.map(item => {
      var titleText = item.keterangan || (item.pelanggan ? item.pelanggan.nama : 'Transaksi #' + item.id);
      var valText = item.nominal || item.total_harga || 0;
      return '<div class="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-xs mb-2"><div><p class="font-bold text-slate-800">' + titleText + '</p><p class="text-[10px] text-slate-400 mt-0.5">' + formatDateIndo(item.created_at) + '</p></div><p class="font-black text-emerald-600">Rp ' + valText.toLocaleString() + '</p></div>';
    }).join('');
  }
}

function applyReportFilter(type) {
  const timeVal = document.getElementById('report_time_filter').value;
  var now = new Date();
  var filtered = globalTxCache.filter(t => {
    var tgl = t.created_at ? new Date(t.created_at) : new Date();
    if (timeVal === 'hari_ini') return tgl.toDateString() === now.toDateString();
    else if (timeVal === 'seminggu') return Math.ceil(Math.abs(now - tgl) / (1000 * 60 * 60 * 24)) <= 7;
    else if (timeVal === 'bulan_ini') return tgl.getMonth() === now.getMonth() && tgl.getFullYear() === now.getFullYear();
    return true;
  });

  document.getElementById('count_trx_report').innerText = filtered.length + ' TRANSAKSI';
  const contentEl = document.getElementById('report_data_content');

  if (!filtered.length) contentEl.innerHTML = '<p class="text-xs text-slate-400 text-center py-6">Tidak ada data.</p>';
  else {
    contentEl.innerHTML = filtered.map(t => {
      var nmPel = t.pelanggan.nama || t.pelanggan.nama_pelanggan || 'Customer';
      return '<div onclick="openModalDetailOrderById(' + t.id + ')" class="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-xs mb-2 cursor-pointer active:scale-[0.99] transition"><div><p class="font-bold text-slate-800">' + nmPel + ' <span class="text-[9px] text-slate-400 font-normal">#' + t.id + '</span></p><p class="text-[10px] text-slate-400 mt-0.5">' + formatDateIndo(t.created_at) + '</p></div><div class="text-right"><p class="font-black text-blue-600">Rp ' + (t.total_harga?t.total_harga.toLocaleString():'0') + '</p></div></div>';
    }).join('');
  }
}

function renderModalListDirectReport(type, title) {
  const container = document.getElementById('list-report-modal-container');
  var filtered = globalTxCache.filter(t => {
    var st = t.status_laundry || 'Diterima';
    if (type === 'transaksi_proses') return st !== 'Selesai' && st !== 'Batal';
    if (type === 'transaksi_selesai') return st === 'Selesai';
    return true;
  });

  container.innerHTML = '<div class="space-y-3 py-2 px-1"><div class="text-center border-b pb-3 border-slate-100"><h3 class="font-extrabold text-slate-900 text-base">' + title + '</h3></div><div class="space-y-2">' + filtered.map(t => '<div onclick="openModalDetailOrderById(' + t.id + ')" class="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-xs"><div><p class="font-extrabold text-slate-900">' + (t.pelanggan.nama||'Customer') + '</p><p class="text-[10px] text-slate-400">' + formatDateIndo(t.created_at) + '</p></div><p class="font-black text-blue-600">Rp ' + (t.total_harga||0).toLocaleString() + '</p></div>').join('') + '</div></div>';
}

// ==========================================
// FUNGSI SIMPAN PENGELUARAN BARU (FIXED PARSING)
// ==========================================
async function simpanPengeluaranBaru(e) {
  if (e && e.preventDefault) e.preventDefault();

  console.log("-> Tombol Simpan Pengeluaran Diklik!");

  // Cari input nominal & keterangan dari berbagai ID yang mungkin ada di HTML
  const nominalInput = document.getElementById('new_nominal_pengeluaran') 
                    || document.getElementById('pengeluaranNominal')
                    || document.getElementById('nominal_pengeluaran')
                    || document.getElementById('nominal')
                    || document.querySelector('#modal-pengeluaran input[type="number"]')
                    || document.querySelector('#modal-pengeluaran input[type="text"]');

  const ketInput = document.getElementById('new_keterangan_pengeluaran') 
                || document.getElementById('pengeluaranKeterangan')
                || document.getElementById('keterangan_pengeluaran')
                || document.getElementById('keterangan')
                || document.querySelector('#modal-pengeluaran input[placeholder*="ket"]')
                || document.querySelector('#modal-pengeluaran input[placeholder*="Ket"]');

  let rawValue = nominalInput?.value || '';

  // Bersihkan inputan: Hapus Rp, titik, koma, dan spasi
  let cleanValue = rawValue.toString().replace(/[^0-9]/g, '');
  let nominal = parseFloat(cleanValue);

  console.log("Nominal Asli:", rawValue, "-> Hasil Clean:", nominal);

  if (isNaN(nominal) || nominal <= 0) {
    alert('Harap masukkan nominal pengeluaran yang valid!');
    return;
  }

  const ketValue = ketInput?.value?.trim() || 'Pengeluaran';

  // Cek koneksi Supabase
  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);

  if (!client) {
    alert('Koneksi Supabase belum siap! Silakan refresh halaman.');
    return;
  }

  try {
    const userRes = await client.auth.getUser();
    const userId = userRes?.data?.user?.id || null;

    const payload = {
      nominal: nominal,
      keterangan: ketValue
    };

    if (userId) {
      payload.user_id = userId;
    }

    const { data, error } = await client
      .from('pengeluaran')
      .insert([payload])
      .select();

    if (error) {
      console.error('Error insert pengeluaran:', error);
      alert('Gagal menyimpan pengeluaran: ' + error.message);
      return;
    }

    alert('Pengeluaran sebesar Rp ' + nominal.toLocaleString('id-ID') + ' berhasil disimpan!');

    // Reset input
    if (nominalInput) nominalInput.value = '';
    if (ketInput) ketInput.value = '';

    // Sembunyikan modal/form pengeluaran
    const modal = document.getElementById('modal-pengeluaran') 
               || document.getElementById('form-pengeluaran-baru');
    if (modal) {
      modal.classList.add('hidden');
    }

    if (typeof fetchReport === 'function') {
      fetchReport();
    }

  } catch (err) {
    console.error('Catch simpan pengeluaran:', err);
    alert('Terjadi kesalahan sistem: ' + err.message);
  }
}

window.simpanPengeluaranBaru = simpanPengeluaranBaru;

// ==========================================
// FUNGSI MEMUAT & MENAMPILKAN DAFAR PENGELUARAN
// ==========================================
async function fetchPengeluaran() {
  const container = document.getElementById('list-pengeluaran-container') 
                 || document.getElementById('report-pengeluaran-list')
                 || document.getElementById('list-pengeluaran');

  if (!container) {
    console.log("Container list pengeluaran tidak ditemukan di HTML.");
    return;
  }

  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);

  if (!client) return;

  try {
    // Ambil data dari tabel pengeluaran
    const { data, error } = await client
      .from('pengeluaran')
      .select('*')
      .order('id', { ascending: false }); // Urutkan dari yang terbaru

    if (error) {
      console.error('Error fetch pengeluaran:', error);
      return;
    }

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-slate-400 text-xs italic">
          Belum ada catatan pengeluaran.
        </div>`;
      return;
    }

    // Render data ke tampilan HTML
    container.innerHTML = data.map(item => {
      const nominalFormatted = parseFloat(item.nominal || 0).toLocaleString('id-ID');
      const ket = item.keterangan || 'Pengeluaran';
      
      return `
        <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 mb-2">
          <div>
            <p class="font-bold text-slate-800 text-xs">${escapeHtml(ket)}</p>
            <p class="text-[10px] text-slate-400">${item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}</p>
          </div>
          <span class="font-extrabold text-red-500 text-xs">- Rp ${nominalFormatted}</span>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Catch fetch pengeluaran:', err);
  }
}

// Update fungsi simpanPengeluaranBaru agar memanggil fetchPengeluaran() di akhir
// Pastikan di dalam fungsi simpanPengeluaranBaru kamu panggil:
// await fetchPengeluaran();

// Panggil saat halaman laporan dibuka
window.fetchPengeluaran = fetchPengeluaran;

document.addEventListener('DOMContentLoaded', () => {
  fetchPengeluaran();
});

// ==========================================================
// TAMBAHAN FUNGSI PENGELUARAN (TIDAK MERUSAK KODE ATAS)
// ==========================================================

// 1. FUNGSI SIMPAN PENGELUARAN BARU
async function simpanPengeluaranBaru(e) {
  if (e && e.preventDefault) e.preventDefault();

  console.log("-> Memproses Simpan Pengeluaran...");

  // Cari input nominal & keterangan dari berbagai ID yang mungkin ada di HTML
  const nominalInput = document.getElementById('new_nominal_pengeluaran') 
                    || document.getElementById('pengeluaranNominal')
                    || document.getElementById('nominal_pengeluaran')
                    || document.getElementById('nominal')
                    || document.querySelector('#modal-pengeluaran input[type="number"]')
                    || document.querySelector('#modal-pengeluaran input[type="text"]');

  const ketInput = document.getElementById('new_keterangan_pengeluaran') 
                || document.getElementById('pengeluaranKeterangan')
                || document.getElementById('keterangan_pengeluaran')
                || document.getElementById('keterangan')
                || document.querySelector('#modal-pengeluaran input[placeholder*="ket"]')
                || document.querySelector('#modal-pengeluaran input[placeholder*="Ket"]');

  let rawValue = nominalInput?.value || '';

  // Bersihkan inputan: Hapus Rp, titik, koma, dan spasi
  let cleanValue = rawValue.toString().replace(/[^0-9]/g, '');
  let nominal = parseFloat(cleanValue);

  if (isNaN(nominal) || nominal <= 0) {
    alert('Harap masukkan nominal pengeluaran yang valid!');
    return;
  }

  const ketValue = ketInput?.value?.trim() || 'Pengeluaran Toko';

  // Cek koneksi Supabase
  const client = typeof supabaseClient !== 'undefined' ? supabaseClient : (typeof supabase !== 'undefined' ? supabase : null);

  if (!client) {
    alert('Koneksi Supabase belum siap! Silakan refresh halaman.');
    return;
  }

  try {
    const userRes = await client.auth.getUser();
    const userId = userRes?.data?.user?.id || null;

    const payload = {
      nominal: nominal,
      keterangan: ketValue
    };

    if (userId) {
      payload.user_id = userId;
    }

    const { data, error } = await client
      .from('pengeluaran')
      .insert([payload])
      .select();

    if (error) {
      console.error('Error insert pengeluaran:', error);
      alert('Gagal menyimpan pengeluaran: ' + error.message);
      return;
    }

    alert('Pengeluaran sebesar Rp ' + nominal.toLocaleString('id-ID') + ' berhasil disimpan!');

    // Reset input
    if (nominalInput) nominalInput.value = '';
    if (ketInput) ketInput.value = '';

    // Sembunyikan modal pengeluaran
    if (typeof closeModalWithHistory === 'function') {
      closeModalWithHistory('modal-pengeluaran');
    } else {
      const modal = document.getElementById('modal-pengeluaran') || document.getElementById('form-pengeluaran-baru');
      if (modal) modal.classList.add('hidden');
    }

    // Reload Laporan
    if (typeof loadReport === 'function') {
      loadReport();
    }

  } catch (err) {
    console.error('Catch simpan pengeluaran:', err);
    alert('Terjadi kesalahan sistem: ' + err.message);
  }
}

// 2. DAFTARKAN FUNGSI KE WINDOW GLOBAL
window.simpanPengeluaranBaru = simpanPengeluaranBaru;
window.loadReport = loadReport;
window.switchReportSubTab = switchReportSubTab;
window.openModalSubReport = openModalSubReport;