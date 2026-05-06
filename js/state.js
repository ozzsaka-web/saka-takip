// Global değişkenler - sadece bir kez tanımlanır
if (typeof _tumSiparisler === 'undefined') var _tumSiparisler = [];
if (typeof _aktifKod === 'undefined') var _aktifKod = null;
if (typeof _uretimKayit === 'undefined') var _uretimKayit = null;
if (typeof _sevkKayit === 'undefined') var _sevkKayit = null;
if (typeof _satirSayac === 'undefined') var _satirSayac = 0;

// Cache katmanı - sessionStorage (sekme bazlı, çakışmaz)
const Cache = (() => {
  const KEYS = {
    SIPARISLER: 'sktv4_siparisler',
    GIDERLER: 'sktv4_giderler',
    ODEMELER: 'sktv4_odemeler',
    TAHSILATLAR: 'sktv4_tahsilatlar',
  };

  function kaydet(key, veri) {
    try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), veri })); }
    catch (e) { console.warn('Cache kayıt hatası:', e); }
  }

  function oku(key, maxSureDk = 10) {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const { ts, veri } = JSON.parse(raw);
      if ((Date.now() - ts) / 60000 > maxSureDk) { sessionStorage.removeItem(key); return null; }
      return veri;
    } catch (e) { return null; }
  }

  function sil(key) { try { sessionStorage.removeItem(key); } catch (e) {} }
  function tumunuSil() { Object.values(KEYS).forEach(k => sil(k)); }

  return { kaydet, oku, sil, tumunuSil, KEYS };
})();
