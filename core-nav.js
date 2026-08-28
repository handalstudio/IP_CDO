/* ============================================================
   CORE-NAV.JS — Modul Navigasi Back Button (Lego Brick #24)
   ------------------------------------------------------------
   Dipakai oleh: SEMUA app Chicken Day (IP, RO, Absensi, POS Kasir)
   yang punya modal / panel / halaman detail yang seharusnya
   ditutup oleh tombol back HP — bukan menutup seluruh app.

   MASALAH YANG DISELESAIKAN:
   PWA standalone (di-install ke Home Screen) tidak otomatis
   mencatat "riwayat" saat kita buka modal/detail secara JS murni
   (bukan ganti URL). Akibatnya tombol back HP (hardware/gesture)
   dianggap sistem sebagai "tidak ada lagi yang bisa dimundurkan"
   → app langsung close/minimize. Modul ini menambal itu dengan
   history.pushState() sebagai "jangkar" tiap kali sebuah layer
   dibuka, lalu menangkap event popstate saat back ditekan.

   Sekaligus menyediakan pola umum "Tekan sekali lagi untuk keluar"
   di halaman utama (opsional, aktif secara default).

   CARA PAKAI:
   1. <script src="core-nav.js"></script> — taruh SETELAH core-toast.js
      kalau mau pesan "tekan sekali lagi" tampil sbg toast (opsional,
      kalau CoreToast tidak ada, fallback ke console.log).

   2. Panggil sekali di awal (boleh di dalam DOMContentLoaded):
        CoreNav.init();
      Bisa override default:
        CoreNav.init({
          confirmExit: true,               // default true
          confirmExitMsg: 'Tekan sekali lagi untuk keluar',
          confirmExitWindow: 2000          // ms
        });

   3. Setiap kali BUKA modal/panel/detail, daftarkan cara menutupnya:
        const navId = CoreNav.push(() => {
          // kode untuk SEMBUNYIKAN modal/panel di sini
          document.getElementById('modalDetail').classList.remove('show');
        }, 'modalDetail'); // label opsional, utk debug

   4. Tombol "X" / "Batal" DI DALAM modal itu JANGAN langsung
      menyembunyikan modal — panggil CoreNav.pop() saja:
        btnTutup.onclick = () => CoreNav.pop();
      CoreNav.pop() akan memicu history.back() → popstate → callback
      yang didaftarkan di langkah 3 otomatis jalan. Dengan begitu,
      baik user tap tombol back HP maupun tap "X" di layar,
      hasilnya konsisten (modal tertutup sekali, tidak dobel).

   CATATAN:
   - Modul ini murni menambah (aditif), tidak mengubah modul lain.
   - Kalau app punya modal bertumpuk (modal di atas modal), cukup
     panggil push() lagi tiap buka layer baru — modul ini bekerja
     sebagai stack (LIFO), back akan menutup dari yang paling atas.
   - reset() disediakan untuk kasus darurat (mis. pindah "halaman"
     besar di app yang butuh bersihkan seluruh stack tanpa memicu
     callback satu-satu).
   ============================================================ */
(function(){

  let layers = [];
  let counter = 0;
  let exitArmed = false;
  let exitTimer = null;
  let inited = false;

  let cfg = {
    confirmExit: true,
    confirmExitMsg: 'Tekan sekali lagi untuk keluar',
    confirmExitWindow: 2000
  };

  function pushGuard(){
    history.pushState({ coreNavGuard: true, ts: Date.now() }, '', location.href);
  }

  function handlePopState(){
    // Ada layer terbuka (modal/panel/detail) -> tutup yang paling atas
    if(layers.length > 0){
      const layer = layers.pop();
      exitArmed = false;
      if(exitTimer){ clearTimeout(exitTimer); exitTimer = null; }
      try{
        layer.onBack && layer.onBack();
      }catch(err){
        console.error('[CoreNav] error saat menutup layer' + (layer.label ? ' "' + layer.label + '"' : '') + ':', err);
      }
      return;
    }

    // Tidak ada layer terbuka -> posisi "halaman utama"
    if(!cfg.confirmExit){
      return; // biarkan app keluar seperti biasa
    }

    if(exitArmed){
      // Back kedua dalam window waktu -> biarkan benar-benar keluar
      exitArmed = false;
      if(exitTimer){ clearTimeout(exitTimer); exitTimer = null; }
      return;
    }

    // Back pertama di halaman utama -> batalkan exit, kasih peringatan
    pushGuard();
    exitArmed = true;
    if(window.CoreToast && typeof window.CoreToast.show === 'function'){
      window.CoreToast.show(cfg.confirmExitMsg, cfg.confirmExitWindow);
    } else {
      console.log('[CoreNav] ' + cfg.confirmExitMsg);
    }
    exitTimer = setTimeout(() => { exitArmed = false; }, cfg.confirmExitWindow);
  }

  function init(opts){
    if(inited) return;
    inited = true;
    Object.assign(cfg, opts || {});
    window.addEventListener('popstate', handlePopState);
    pushGuard();
  }

  function push(onBack, label){
    if(!inited){
      console.warn('[CoreNav] push() dipanggil sebelum init() — auto-init dengan default.');
      init();
    }
    const id = ++counter;
    layers.push({ id, onBack, label: label || null });
    history.pushState({ coreNavLayer: id }, '', location.href);
    return id;
  }

  function pop(){
    if(layers.length === 0) return false;
    history.back();
    return true;
  }

  function stackSize(){
    return layers.length;
  }

  function reset(){
    layers = [];
    exitArmed = false;
    if(exitTimer){ clearTimeout(exitTimer); exitTimer = null; }
  }

  window.CoreNav = { init, push, pop, stackSize, reset };
})();
