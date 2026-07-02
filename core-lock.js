/* ============================================================
   CORE-LOCK.JS — Modul Kunci Record (Lego Brick #8)
   ------------------------------------------------------------
   Dipakai oleh: app yang punya konsep "data yang sudah di-export/
   difinalisasi jadi terkunci dari edit" (mis. IP: tanggal yang
   sudah export Excel tidak bisa diedit lagi sampai dibuka kuncinya)

   Modul ini TIDAK bikin tampilan apa pun — cuma "otak" pengecekan
   & pengubahan status kunci. Anda yang panggil dari UI sendiri
   (banner kunci, disable input, dsb) sesuai desain app masing-masing.
   Combo paling umum: dipakai bareng CoreDB (penyimpanan) dan
   CoreConfirm (dialog konfirmasi buka kunci).

   CARA PAKAI:
   1. <script src="core-lock.js"></script>
   2. Tentukan nama field penanda kunci pada object record Anda
      (default 'exported', boleh diganti, mis. 'finalisasi'):
        CoreLock.init({ field: 'exported' });

   3. Cek status kunci dari sebuah record (object state Anda):
        CoreLock.cek(state)   // -> true/false

   4. Kunci / buka kunci record (mengubah object-nya langsung,
      lalu Anda yang simpan ke storage seperti biasa):
        CoreLock.kunci(state);    // dipanggil setelah export berhasil
        CoreLock.buka(state);     // dipanggil setelah konfirmasi unlock

   5. Helper untuk cek status record lain by key (mis. tanggal lain),
      dipasangkan dengan CoreDB — berguna untuk fitur "buka kunci
      tanggal X" tanpa harus pindah ke tanggal itu dulu:
        const status = await CoreLock.cekKey(tglLain, {
          get: CoreDB.get   // fungsi async(key) -> object|null
        });
        // status: 'tidakAda' | 'terkunci' | 'tidakTerkunci'

        await CoreLock.bukaKey(tglLain, {
          get: CoreDB.get, put: CoreDB.put
        });
   ============================================================ */
(function(){

  let cfg = { field: 'exported' };

  function init(opts){
    cfg = Object.assign({}, cfg, opts || {});
  }

  function cek(record){
    return !!(record && record[cfg.field] === true);
  }

  function kunci(record){
    if(record) record[cfg.field] = true;
    return record;
  }

  function buka(record){
    if(record) record[cfg.field] = false;
    return record;
  }

  // status record lain by key, tanpa perlu memuatnya sebagai state aktif
  async function cekKey(key, io){
    const rec = await io.get(key);
    if(!rec) return 'tidakAda';
    return cek(rec) ? 'terkunci' : 'tidakTerkunci';
  }

  // buka kunci record lain by key langsung simpan kembali
  async function bukaKey(key, io){
    const rec = await io.get(key);
    if(!rec) return false;
    buka(rec);
    await io.put(rec);
    return true;
  }

  window.CoreLock = { init, cek, kunci, buka, cekKey, bukaKey };
})();
