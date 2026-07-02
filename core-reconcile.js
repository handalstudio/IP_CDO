/* ============================================================
   CORE-RECONCILE.JS — Modul Pencocokan Data Sistem vs Struk Fisik (Lego Brick #13)
   ------------------------------------------------------------
   Dipakai oleh: app bertipe KATALOG yang punya tahap "cocokkan dulu
   dengan struk fisik sebelum export terbuka" (mis. IP — total & jumlah
   item dari aplikasi harus sama dengan angka di struk kasir sebelum
   tombol Export Excel aktif).

   Modul ini TIDAK bikin tampilan apa pun — Anda yang sediakan kolom
   input & badge hasil cocok/tidak di HTML, modul ini hitung & simpan
   (dengan debounce) hasilnya.

   CARA PAKAI:
   1. <script src="core-reconcile.js"></script>
   2. Saat app mulai (atau tiap pindah tanggal), beri tahu field apa
      saja yang perlu dicocokkan, dan dari mana ambil angka sistemnya:
        CoreReconcile.init({
          fields: [
            { key:'omzet', label:'Total',       getNilaiSistem: ()=>totalOmzet() },
            { key:'item',  label:'Jumlah item', getNilaiSistem: ()=>totalItem()  }
          ],
          getStruk: ()=>state.struk,                    // ambil object struk yang lagi tersimpan
          simpanStruk: async (struk)=>{                 // dipanggil (di-debounce) tiap user mengetik
            state.struk = struk; await save();
          },
          debounceMs: 400
        });

   3. Tiap kali salah satu input struk berubah (oninput):
        function hitungCocok(){
          const hasil = CoreReconcile.cocokkan({
            omzet: document.getElementById('inOmzet').value,
            item: document.getElementById('inItem').value
          });
          // hasil.status -> 'netral' | 'ok' | 'beda'
          // hasil.pesan  -> teks ringkas buat badge
          // hasil.detail -> teks rincian selisih per field (kosong kalau cocok/netral)
          box.className = 'cocok '+(hasil.status==='ok'?'ok':hasil.status==='beda'?'beda':'netral');
          box.textContent = hasil.pesan;
          det.textContent = hasil.detail;
          setExport(hasil.status==='ok');
        }

   4. Cek status cocok kapan saja TANPA baca DOM (mis. untuk tahu boleh
      kirim WA atau tidak), pakai struk yang sudah tersimpan di state:
        CoreReconcile.sudahCocok()   // -> true/false

   5. Saat mau pindah tanggal/restore/reset — pastikan perubahan struk
      yang masih ditunda (debounce) ke-simpan dulu supaya tidak hilang
      atau salah tempat:
        await CoreReconcile.flush();
   ============================================================ */
(function(){

  let cfg = {
    fields: [],            // [{key, label, getNilaiSistem: fn}]
    getStruk: function(){ return {}; },
    simpanStruk: null,     // async fn(struk)
    debounceMs: 400
  };
  let _timer = null;
  let _pending = null;

  function init(opts){
    cfg = Object.assign({}, cfg, opts || {});
  }

  function bersihkanAngka(raw){
    return String(raw==null ? '' : raw).replace(/\D/g,'');
  }

  // rawValues: { key: rawStringDariInput, ... } — field yang tidak dikirim akan
  // dipertahankan dari struk yang sudah tersimpan (getStruk()).
  function cocokkan(rawValues){
    rawValues = rawValues || {};
    const strukLama = cfg.getStruk() || {};
    const struk = Object.assign({}, strukLama);

    cfg.fields.forEach(f => {
      if(rawValues[f.key] !== undefined){
        const bersih = bersihkanAngka(rawValues[f.key]);
        // hanya timpa kalau field DOM memang berisi nilai; kalau kosong tapi
        // struk lama sudah ada isi, pertahankan supaya tidak tertimpa angka kosong
        if(bersih !== '' || strukLama[f.key] === undefined) struk[f.key] = bersih;
      }
    });

    _pending = struk;
    if(cfg.simpanStruk){
      clearTimeout(_timer);
      _timer = setTimeout(() => {
        _timer = null;
        const p = _pending; _pending = null;
        cfg.simpanStruk(p);
      }, cfg.debounceMs);
    }

    const semuaTerisi = cfg.fields.every(f => struk[f.key] !== undefined && struk[f.key] !== '');
    if(!semuaTerisi){
      return { status:'netral', pesan:'Isi semua angka dari struk', detail:'', struk, perField:[] };
    }

    const perField = cfg.fields.map(f => {
      const sistem = f.getNilaiSistem();
      const nilaiStruk = +struk[f.key];
      return { key:f.key, label:f.label, sistem, struk:nilaiStruk, selisih: sistem-nilaiStruk };
    });
    const cocokSemua = perField.every(p => p.selisih === 0);

    if(cocokSemua){
      return { status:'ok', pesan:'✓ Cocok semua — data valid, siap export', detail:'', struk, perField };
    }

    const rincian = perField.filter(p => p.selisih !== 0).map(p => {
      const arah = p.selisih > 0 ? 'aplikasi lebih besar' : 'aplikasi lebih kecil';
      return `${p.label} selisih ${Math.abs(p.selisih).toLocaleString('id-ID')} (${arah})`;
    });
    return { status:'beda', pesan:'✗ Belum cocok — export terkunci', detail: rincian.join(' · '), struk, perField };
  }

  // Cek status cocok pakai struk yang sudah tersimpan (tanpa baca DOM),
  // berguna mis. untuk menentukan boleh-tidaknya tombol kirim WA tampil.
  function sudahCocok(){
    const struk = cfg.getStruk() || {};
    const semuaTerisi = cfg.fields.every(f => struk[f.key] !== undefined && struk[f.key] !== '' && !isNaN(+struk[f.key]));
    if(!semuaTerisi) return false;
    return cfg.fields.every(f => f.getNilaiSistem() === +struk[f.key]);
  }

  // Pastikan perubahan struk yang masih ditunda (debounce) ke-simpan dulu —
  // panggil ini SEBELUM ganti tanggal/restore/reset data.
  async function flush(){
    if(_timer){
      clearTimeout(_timer); _timer = null;
      if(_pending && cfg.simpanStruk){
        const p = _pending; _pending = null;
        await cfg.simpanStruk(p);
      }
    }
  }

  window.CoreReconcile = { init, cocokkan, sudahCocok, flush };
})();
