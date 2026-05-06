const API = (() => {

  const CONFIG = {
      SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwUeHdeJIJG_mb4Iy7yIeFJMon8CJ6lx6cEj0UtMJYjZazcRABLAXq36MtiooZd9M9m/exec',
    SPREADSHEET_ID: '1KJ4P-BZLR3kSeaT2H7hv9FiDvHzR-tUM79trPcucKus',
    SIPARIS_KOD_PREFIX: 'STK',
  };

  async function _istek(action, payload = {}) {
    const body = JSON.stringify({ action, ...payload });

    let res;

    try {
      res = await fetch(CONFIG.SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
        redirect: 'follow'
      });
    } catch (e) {
      const url =
        CONFIG.SCRIPT_URL +
        '?action=' + encodeURIComponent(action) +
        '&payload=' + encodeURIComponent(body);

      res = await fetch(url, {
        method: 'GET',
        redirect: 'follow'
      });
    }

    if (!res.ok) throw new Error('HTTP ' + res.status);

    const text = await res.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new Error('Geçersiz yanıt: ' + text.substring(0, 100));
    }

    if (json.status === 'error') throw new Error(json.message);

    return json.data;
  }

  async function testBaglanti() {
    try {
      await _istek('ping', {});
      _statusGuncelle(true);
      return true;
    } catch (e) {
      _statusGuncelle(false);
      return false;
    }
  }

  function _statusGuncelle(bagli) {
    const dot = document.getElementById('statusDot');
    const txt = document.getElementById('statusText');

    if (!dot || !txt) return;

    dot.className = 'status-dot ' + (bagli ? 'connected' : 'error');
    txt.textContent = bagli ? 'Sheets bağlı' : 'Bağlantı yok';
  }

  return {
    testBaglanti,
    siparislerGetir: () => _istek('siparislerGetir', {}),
    siparisKaydet: (siparis) => _istek('siparisKaydet', { siparis }),
    siparisKapat: (siparisKodu) => _istek('siparisKapat', { siparisKodu }),
    siparisAc: (siparisKodu) => _istek('siparisAc', { siparisKodu }),
    uretimKaydet: (kayit) => _istek('uretimKaydet', { kayit }),
    sevkKaydet: (kayit) => _istek('sevkKaydet', { kayit }),
    giderKaydet: (kayit) => _istek('giderKaydet', { kayit }),
    giderleriGetir: () => _istek('giderleriGetir', {}),
    giderSil: (id) => _istek('giderSil', { id }),
    odemeKaydet: (kayit) => _istek('odemeKaydet', { kayit }),
    odemeleriGetir: () => _istek('odemeleriGetir', {}),
    odemeSil: (id) => _istek('odemeSil', { id }),
    tahsilatKaydet: (kayit) => _istek('tahsilatKaydet', { kayit }),
    tahsilatlariGetir: (musteriAdi) => _istek('tahsilatlariGetir', { musteriAdi }),
    tahsilatSil: (id) => _istek('tahsilatSil', { id }),
    siparisSil: (siparisKodu) => _istek('siparisSil', { siparisKodu }),
    uretimSil: (kalemId, siparisKodu) => _istek('uretimSil', { kalemId, siparisKodu }),
    sevkSil: (kalemId, siparisKodu) => _istek('sevkSil', { kalemId, siparisKodu }),
  };

})();
