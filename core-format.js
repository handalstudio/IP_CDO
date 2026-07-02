/* ============================================================
   CORE-FORMAT.JS — Modul Format Angka & Tanggal Indonesia (Lego Brick #11)
   ------------------------------------------------------------
   Dipakai oleh: SEMUA app Chicken Day (IP, RO, dan outlet baru)

   Sebelumnya fungsi-fungsi format ini (Rupiah, tanggal panjang versi
   Indonesia, nama hari, format input ribuan berjalan) ditulis ulang
   manual di tiap app. Modul ini TIDAK bikin tampilan apa pun — murni
   fungsi format, dipanggil dari mana saja.

   CARA PAKAI:
   1. <script src="core-format.js"></script>
   2. Langsung pakai, tidak perlu init():
        CoreFormat.rupiah(125000)              // -> 'Rp 125.000'
        CoreFormat.todayStr()                  // -> '2026-07-01'
        CoreFormat.tglPanjang('2026-07-01')     // -> '1 Juli 2026'
        CoreFormat.namaHari('2026-07-01')       // -> 'Rabu'
        CoreFormat.tglHeader('2026-07-01')      // -> 'Rabu, 1 Juli 2026'

   3. Untuk input angka yang otomatis dapat titik ribuan saat diketik
      (mis. kolom "Total di struk"):
        <input oninput="CoreFormat.formatRibuan(this)">
        // value input langsung berubah jadi '125.000' saat diketik '125000'
        // ambil angka asli lagi pakai CoreFormat.bersihkanAngka(el.value)

   4. Membersihkan string berformat ribuan jadi angka murni lagi:
        CoreFormat.bersihkanAngka('125.000')   // -> '125000' (string, hanya digit)
   ============================================================ */
(function(){

  const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const NAMA_HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

  function rupiah(n){
    return 'Rp '+(n||0).toLocaleString('id-ID');
  }

  function bersihkanAngka(raw){
    return String(raw||'').replace(/\D/g,'');
  }

  // Dipasang di oninput sebuah <input>, otomatis menambah titik ribuan
  // saat user mengetik (mis. '125000' jadi '125.000' di layar).
  function formatRibuan(el){
    const raw = bersihkanAngka(el.value);
    el.value = raw ? Number(raw).toLocaleString('id-ID') : '';
  }

  function todayStr(){
    const d = new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }

  // tgl: string 'YYYY-MM-DD' -> '1 Juli 2026'
  function tglPanjang(tgl){
    const [y,m,d] = tgl.split('-');
    return `${+d} ${NAMA_BULAN[+m-1]} ${y}`;
  }

  // tgl: string 'YYYY-MM-DD' -> 'Rabu'
  function namaHari(tgl){
    return NAMA_HARI[new Date(tgl+'T00:00:00').getDay()];
  }

  // tgl: string 'YYYY-MM-DD' -> 'Rabu, 1 Juli 2026'
  function tglHeader(tgl){
    return namaHari(tgl)+', '+tglPanjang(tgl);
  }

  window.CoreFormat = {
    rupiah, bersihkanAngka, formatRibuan,
    todayStr, tglPanjang, namaHari, tglHeader
  };
})();
