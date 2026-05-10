let _tumSiparisler = [];
let _aktifKod = null;
let _uretimKayit = null;
let _sevkKayit = null;
let _satirSayac = 0;

// Cache katmanı - sessionStorage kullanır (sekme bazlı, çakışmaz)
const Cache = (() => {
  const KEYS = {
    SIPARISLER: 'sktv3_siparisler',
    GIDERLER: 'sktv3_giderler',
    ODEMELER: 'sktv3_odemeler',
    TAHSILATLAR: 'sktv3_tahsilatlar',
  };

  function kaydet(key, veri) {
    try {
      sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), veri }));
    } catch (e) { console.warn('Cache kayıt hatası:', e); }
  }

  function oku(key, maxSureDk = 5) {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const { ts, veri } = JSON.parse(raw);
      const gecenDk = (Date.now() - ts) / 60000;
      if (gecenDk > maxSureDk) { sessionStorage.removeItem(key); return null; }
      return veri;
    } catch (e) { return null; }
  }

  function sil(key) {
    try { sessionStorage.removeItem(key); } catch (e) {}
  }

  function tumunuSil() {
    Object.values(KEYS).forEach(k => sil(k));
  }

  return { kaydet, oku, sil, tumunuSil, KEYS };
})();
