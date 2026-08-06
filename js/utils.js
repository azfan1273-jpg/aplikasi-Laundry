var currentUser = null;
var currentProfile = null;
var currentToko = null;
var isRegisterMode = false;

var allPelanggan = [];
var allLayanan = [];
var globalTxCache = [];
var globalPengeluaranCache = [];
var globalItemCache = {};

var selectedPelanggan = null;
var cartLayanan = []; 
var currentOrderTab = 'Antrian';
var currentReportSubTab = 'transaksi';
var activeOrderDetail = null;
var modalStack = [];
var currentActiveTab = 'home';

let touchStartY = 0;

window.addEventListener('touchstart', function(e) {
  if (e.touches.length === 1) touchStartY = e.touches[0].clientY;
}, { passive: false });

window.addEventListener('touchmove', function(e) {
  const touchCurrentY = e.touches[0].clientY;
  const touchDeltaY = touchCurrentY - touchStartY;
  const scrollable = e.target.closest('.scroll-area, #list-layanan-container, #list-pelanggan-container, #list-home, #list-order-status, #list-report, #list-kelola-layanan-container, #list-stat-modal-container, #list-report-modal-container, #list-profile-modal-container');

  if (!scrollable) {
    if (touchDeltaY > 0 && e.cancelable) e.preventDefault();
  } else {
    if (scrollable.scrollTop <= 0 && touchDeltaY > 0) {
      if (e.cancelable) e.preventDefault();
    }
  }
}, { passive: false });

// FUNGSI ACCORDION DROPDOWN
function toggleAccordion(accId) {
  const content = document.getElementById(accId);
  const arrow = document.getElementById('arrow-' + accId);
  
  if(content.classList.contains('hidden')) {
    content.classList.remove('hidden');
    if(arrow) arrow.innerText = '▲';
  } else {
    content.classList.add('hidden');
    if(arrow) arrow.innerText = '▼';
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'info') icon = 'ℹ️';

  toast.innerHTML = `<span class="toast-icon">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3000);
}

function formatDateIndo(dateString) {
  if(!dateString) return '-';
  var d = new Date(dateString);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}