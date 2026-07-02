/* ============================================================
   CORE-SETTINGS.JS — Modul Pengaturan Outlet & Nomor WA (Lego Brick #2)
   ------------------------------------------------------------
   Dipakai oleh: SEMUA app Chicken Day (IP, RO, dan outlet baru)

   Modul ini TIDAK membuat tampilan apa pun (beda dengan core-pin.js).
   Ini cuma "otak"-nya: simpan, ambil, dan validasi data. Tampilan
   form input (nama outlet, nomor WA) tetap Anda buat sendiri di
   index.html masing-masing app, sesuai desain app itu.

   CARA PAKAI:
   1. <script src="core-settings.js"></script>
   2. Saat app mulai (atau sekali saja), atur dulu nama key-nya:
        CoreSettings.init({
          outletKey: 'cda_outlet',   // boleh sama di semua app 1 outlet
          waKey: 'cda_nomor_wa'
        });
   3. Ambil nilai:
        CoreSettings.getOutlet()      // -> 'Ampel' atau ''
        CoreSettings.getWaNumber()    // -> '6281234567890' atau ''
   4. Simpan nilai (otomatis divalidasi):
        const hasil = CoreSettings.setOutlet(inputValue);
        if(!hasil.ok){ toast(hasil.pesan); }

        const hasil2 = CoreSettings.setWaNumber(inputValue);
        if(!hasil2.ok){ toast(hasil2.pesan); }
   ============================================================ */
(function(){

  let cfg = {
    outletKey: 'core_outlet',
    waKey: 'core_nomor_wa'
  };

  function init(opts){
    cfg = Object.assign({}, cfg, opts||{});
  }

  function getOutlet(){
    return localStorage.getItem(cfg.outletKey) || '';
  }

  function setOutlet(val){
    val = (val||'').trim();
    if(!val) return { ok:false, pesan:'Nama outlet tidak boleh kosong' };
    localStorage.setItem(cfg.outletKey, val);
    return { ok:true, pesan:'✓ Tersimpan: '+val, value:val };
  }

  function getWaNumber(){
    return localStorage.getItem(cfg.waKey) || '';
  }

  // Validasi nomor WA: harus angka saja, diawali kode negara 62, panjang wajar.
  // (aturan ini diambil dari validasi yang sudah ada di app IP — dipertahankan
  //  supaya kebiasaan input staf tidak berubah)
  function setWaNumber(val){
    const bersih = (val||'').trim().replace(/\D/g,'');
    if(!bersih) return { ok:false, pesan:'Nomor tidak boleh kosong' };
    if(!bersih.startsWith('62')) return { ok:false, pesan:'Nomor harus diawali kode negara 62 (mis. 6281234567890)' };
    if(bersih.length<10 || bersih.length>15) return { ok:false, pesan:'Panjang nomor tidak wajar — cek kembali nomornya' };
    localStorage.setItem(cfg.waKey, bersih);
    return { ok:true, pesan:'✓ Tersimpan: '+bersih, value:bersih };
  }

  window.CoreSettings = { init, getOutlet, setOutlet, getWaNumber, setWaNumber };
})();
