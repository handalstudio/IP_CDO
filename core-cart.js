/* ============================================================
   CORE-CART.JS — Mesin Keranjang untuk App Tipe "Katalog" (Lego Brick #5)
   ------------------------------------------------------------
   v2 — PEMBARUAN: sekarang mendukung BEBERAPA keranjang sekaligus
   lewat pola buatInstance() (sama seperti core-db.js), untuk app yang
   butuh lebih dari 1 keranjang independen — mis. keranjang utama
   ("nota berjalan") DAN keranjang terpisah saat mengedit nota yang
   sudah tersimpan.

   Dipakai oleh: app bertipe seperti IP — user CARI MENU dari daftar,
   lalu masukkan ke keranjang dengan qty, baru disimpan jadi 1 nota.

   BEDA dengan core-pin.js dkk: modul ini TIDAK bikin tampilan sendiri,
   karena tampilan keranjang/daftar menu itu beda-beda desainnya per app.
   Modul ini cuma "otak"-nya — Anda yang panggil fungsi-fungsi ini dari
   tombol/event di HTML Anda, lalu Anda render hasilnya ke HTML sendiri.

   CARA PAKAI — KERANJANG TUNGGAL (paling umum, cukup pakai CoreCart langsung):
   1. <script src="core-cart.js"></script>
   2. Siapkan daftar menu dalam bentuk array (boleh dari menu.js Anda):
        const ITEMS = [{id:1, nama:'Ayam Goreng', harga:15000, kat:'Makanan', ch:0}, ...];
        CoreCart.init({ items: ITEMS });

   3. Cari menu (dipanggil tiap user mengetik di kolom cari):
        const hasil = CoreCart.cari(teksKetikan, channelOpsional);
        // hasil = array menu yang cocok, sudah diurutkan dari yang paling sering dipakai
        // lalu Anda render sendiri ke HTML

   4. Tambah ke keranjang:
        CoreCart.tambah(idMenu);
        const isiKeranjang = CoreCart.getKeranjang();  // {idMenu: {item, qty}}
        const total = CoreCart.getTotal();
        // lalu Anda render isiKeranjang ke HTML sendiri

   5. Ubah qty / hapus item dari keranjang:
        CoreCart.ubahQty(idMenu, +1);   // tambah 1
        CoreCart.ubahQty(idMenu, -1);   // kurang 1 (otomatis hapus kalau jadi 0)
        CoreCart.hapus(idMenu);

   6. Simpan keranjang jadi 1 nota (mengembalikan objek nota siap disimpan):
        const nota = CoreCart.checkout();
        // nota = {waktu, items:[...], total}
        // -> Anda push ke array transaksi Anda sendiri & simpan ke storage
        // Setelah checkout(), keranjang otomatis kosong lagi.

   ------------------------------------------------------------
   CARA PAKAI — KERANJANG KEDUA (mis. untuk modal "Edit Nota"):

        const editCart = CoreCart.buatInstance();
        editCart.init({ items: ITEMS, frekuensiKey: 'cda_frekuensi_menu' });

        // muat isi nota yang sudah tersimpan ke keranjang edit ini:
        editCart.muat(notaTersimpan.items);   // [{id,nama,harga,qty,ch}, ...]

        // render & ubah qty sama persis seperti keranjang utama:
        editCart.getKeranjang(); editCart.getTotal();
        editCart.ubahQty(id, +1); editCart.hapus(id);

        // setelah selesai edit, ambil array item siap disimpan kembali ke nota:
        const itemsBaru = editCart.getItemsArray();   // [{id,nama,harga,qty,ch}, ...]
        const totalBaru = editCart.getTotal();
        // -> timpa nota lama: state.trx[i] = {...state.trx[i], items:itemsBaru, total:totalBaru}

        editCart.kosongkanKeranjang();   // panggil saat modal ditutup
   ============================================================ */
(function(){

  function buatInstance(){
    let ITEMS = [];
    let keranjang = {};
    const FREK_KEY_DEFAULT = 'core_frekuensi_menu';
    let frekKey = FREK_KEY_DEFAULT;

    function init(opts){
      opts = opts || {};
      ITEMS = opts.items || [];
      frekKey = opts.frekuensiKey || FREK_KEY_DEFAULT;
      keranjang = {};
    }

    function normalize(s){ return String(s||'').toLowerCase().replace(/\s+/g,' ').trim(); }

    function getFrekuensi(){
      try{ return JSON.parse(localStorage.getItem(frekKey) || '{}'); }
      catch(e){ return {}; }
    }
    function tambahFrekuensi(itemsArr){
      const f = getFrekuensi();
      itemsArr.forEach(it=>{ f[it.id] = (f[it.id]||0) + it.qty; });
      localStorage.setItem(frekKey, JSON.stringify(f));
    }

    // Cari menu: cocokkan tiap kata-kunci (boleh lebih dari 1 kata), urutkan
    // berdasar paling sering dipakai. channel opsional (mis. 0=reguler, 1=ojol).
    function cari(teks, channel){
      const q = normalize(teks);
      const frek = getFrekuensi();
      let list = ITEMS;
      if(channel !== undefined && channel !== null) list = list.filter(it=>it.ch===channel);
      if(q){
        const tokens = q.split(' ');
        list = list.filter(it=>{
          const n = normalize(it.nama);
          return tokens.every(t=>n.includes(t));
        });
      }
      list = [...list].sort((a,b)=>(frek[b.id]||0)-(frek[a.id]||0));
      return list.map(it=>Object.assign({}, it, { favorit: !q && (frek[it.id]>0) }));
    }

    function tambah(id){
      const it = ITEMS.find(x=>x.id===id);
      if(!it) return null;
      if(keranjang[id]) keranjang[id].qty++;
      else keranjang[id] = { item: it, qty: 1 };
      return it;
    }

    function ubahQty(id, delta){
      if(!keranjang[id]) return;
      keranjang[id].qty += delta;
      if(keranjang[id].qty <= 0) delete keranjang[id];
    }

    function hapus(id){ delete keranjang[id]; }

    function getKeranjang(){ return keranjang; }

    function getTotal(){
      return Object.values(keranjang).reduce((s,r)=>s+r.item.harga*r.qty, 0);
    }

    function kosongkanKeranjang(){ keranjang = {}; }

    // Isi keranjang langsung dari array item yang sudah ada (mis. dari nota
    // tersimpan yang mau diedit). nama/harga/ch diambil dari data yang dikirim
    // sendiri (bukan dari ITEMS), jadi tetap akurat walau harga master berubah.
    function muat(itemsArr){
      keranjang = {};
      (itemsArr||[]).forEach(it=>{
        const master = ITEMS.find(x=>x.id===it.id) || {};
        keranjang[it.id] = {
          item: { id: it.id, nama: it.nama, harga: it.harga, ch: it.ch, kat: master.kat },
          qty: it.qty
        };
      });
    }

    // Bentuk array item siap disimpan (sama persis format yang dipakai checkout()),
    // TANPA mengosongkan keranjang atau mencatat frekuensi — dipakai saat
    // menyimpan ulang nota yang sedang diedit.
    function getItemsArray(){
      return Object.keys(keranjang).map(id=>({
        id: +id,
        nama: keranjang[id].item.nama,
        harga: keranjang[id].item.harga,
        qty: keranjang[id].qty,
        ch: keranjang[id].item.ch
      }));
    }

    // Selesai belanja -> jadi 1 nota. Otomatis catat frekuensi & kosongkan keranjang.
    function checkout(){
      const items = getItemsArray();
      if(!items.length) return null;
      const nota = { waktu: new Date().toISOString(), items, total: getTotal() };
      tambahFrekuensi(items);
      kosongkanKeranjang();
      return nota;
    }

    return {
      init, cari, tambah, ubahQty, hapus, muat,
      getKeranjang, getTotal, getItemsArray, kosongkanKeranjang, checkout
    };
  }

  // Instance default (cukup untuk app dengan 1 keranjang, kasus paling umum)
  const utama = buatInstance();

  window.CoreCart = Object.assign({ buatInstance }, utama);
})();
