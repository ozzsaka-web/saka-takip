function _bugunuAyarla() {
  const el = document.getElementById('sipTarih');
  if (el) el.value = new Date().toISOString().split('T')[0];
}

function _siparisKoduUret() {
  const d = new Date();
  const ay = String(d.getMonth()+1).padStart(2,'0');
  const yil = String(d.getFullYear()).slice(2);
  const prefix = 'STK-' + ay + yil + '-';
  const buAy = _tumSiparisler.filter(s => s.kod && s.kod.startsWith(prefix));
  return prefix + String(buAy.length + 1).padStart(3,'0');
}

function _urunSatiriEkle() {
  _satirSayac++;
  const id = 'urun_' + _satirSayac;
  const container = document.getElementById('urunListesi');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'urun-satir-form';
  div.dataset.id = id;
  div.innerHTML = `
    <input type="text" class="u-adi" placeholder="Ürün adı..." autocomplete="off" />
    <input type="text" class="u-renk" placeholder="Renk / Kod" autocomplete="off" />
    <input type="number" class="u-miktar" placeholder="0" min="0" step="0.01" />
    <input type="number" class="u-fiyat" placeholder="0.00" min="0" step="0.01" />
    <button class="btn-sil-urun" data-id="${id}" title="Sil">×</button>
  `;
  div.querySelector('.u-miktar').addEventListener('input', _formToplamHesapla);
  div.querySelector('.u-fiyat').addEventListener('input', _formToplamHesapla);
  container.appendChild(div);
  _formToplamHesapla();
}

function _urunSatiriSil(id) {
  const container = document.getElementById('urunListesi');
  if (!container) return;
  if (container.querySelectorAll('.urun-satir-form').length <= 1) {
    toast('En az bir ürün kalemi olmalı', 'error');
    return;
  }
  const div = container.querySelector('[data-id="' + id + '"]');
  if (div) div.remove();
  _formToplamHesapla();
}

function _formToplamHesapla() {
  const container = document.getElementById('urunListesi');
  if (!container) return;
  let toplam = 0;
  container.querySelectorAll('.urun-satir-form').forEach(div => {
    const m = parseFloat(div.querySelector('.u-miktar').value) || 0;
    const f = parseFloat(div.querySelector('.u-fiyat').value) || 0;
    toplam += m * f;
  });
  const el = document.getElementById('sipToplam');
  if (el) el.textContent = _fmt(toplam);
  const doviz = document.getElementById('sipDoviz');
  const label = document.getElementById('sipDovizLabel');
  if (doviz && label) label.textContent = doviz.value;
}

function _formuAc() {
  const panel = document.getElementById('siparisFormu');
  if (panel) panel.classList.remove('hidden');
  const kod = _siparisKoduUret();
  const kodEl = document.getElementById('yeniSiparisKodu');
  if (kodEl) { kodEl.textContent = kod; kodEl.dataset.kod = kod; }
  // Otomatik DERİSAN
  const markaEl = document.getElementById('sipMarka');
  if (markaEl) markaEl.value = 'DERİSAN';
  document.getElementById('sipMusteri')?.focus();
}

function _formuKapat() {
  document.getElementById('siparisFormu')?.classList.add('hidden');
  _formuSifirla();
}

function _formuSifirla() {
  document.getElementById('sipMusteri').value = '';
  document.getElementById('sipMarka').value = '';
  document.getElementById('sipDoviz').value = 'EUR';
  _bugunuAyarla();
  const c = document.getElementById('urunListesi');
  if (c) c.innerHTML = '';
  _satirSayac = 0;
  _urunSatiriEkle();
  _formToplamHesapla();
}

async function _siparisKaydet() {
  const tarih = document.getElementById('sipTarih').value;
  const musteri = document.getElementById('sipMusteri').value.trim().toUpperCase();
  const marka = document.getElementById('sipMarka').value.trim().toUpperCase();
  const doviz = document.getElementById('sipDoviz').value;
  const kod = document.getElementById('yeniSiparisKodu').dataset.kod;

  if (!tarih || !musteri || !marka) {
    toast('Tarih, müşteri ve marka zorunlu', 'error');
    return;
  }

  const container = document.getElementById('urunListesi');
  const kalemler = [];
  let hata = false;

  container.querySelectorAll('.urun-satir-form').forEach((div, i) => {
    const adi = div.querySelector('.u-adi').value.trim().toUpperCase();
    const renk = div.querySelector('.u-renk').value.trim().toUpperCase();
    const miktar = parseFloat(div.querySelector('.u-miktar').value) || 0;
    const fiyat = parseFloat(div.querySelector('.u-fiyat').value) || 0;
    if (!adi) { toast((i+1) + '. ürünün adı girilmemiş', 'error'); hata = true; return; }
    if (miktar <= 0) { toast((i+1) + '. ürünün miktarı 0\'dan büyük olmalı', 'error'); hata = true; return; }
    kalemler.push({
      id: kod + '_K' + String(i+1).padStart(2,'0'),
      siparisKodu: kod,
      urunAdi: adi,
      renkKod: renk,
      siparisMiktar: miktar,
      birimFiyat: fiyat,
      uretimMiktar: 0,
      sevkMiktar: 0,
      alisFiyat: null,
      alisKur: null,
      alisDoviz: doviz,
      satisFiyat: null,
      satisKur: null,
      satisDoviz: doviz,
    });
  });

  if (hata || kalemler.length === 0) return;

  const siparis = {
    kod, tarih,
    musteriAdi: musteri,
    marka, doviz,
    kalemler,
    durum: 'bekliyor',
    olusturmaZamani: new Date().toISOString(),
  };

  const btn = document.getElementById('btnSiparisKaydet');
  btn.disabled = true;
  btn.textContent = 'Kaydediliyor...';

  // OPTİMİSTİK: Önce hafızaya ekle, ekrana yansıt
  _tumSiparisler.unshift(siparis);
  Cache.kaydet(Cache.KEYS.SIPARISLER, _tumSiparisler);
  _formuKapat();
  _listeRender();
  toast(kod + ' kaydedildi', 'success');

  // Arka planda Sheets'e gönder
  try {
    await API.siparisKaydet(siparis);
  } catch (e) {
    // Hata olursa hafızadan geri al
    _tumSiparisler = _tumSiparisler.filter(s => s.kod !== kod);
    Cache.kaydet(Cache.KEYS.SIPARISLER, _tumSiparisler);
    _listeRender();
    toast('Kayıt hatası: ' + e.message + ' — sipariş geri alındı', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Siparişi Kaydet';
  }
}

async function _siparisleriYukle(zorunlu = false) {
  // Cache'de varsa kullan
  if (!zorunlu) {
    const cache = Cache.oku(Cache.KEYS.SIPARISLER, 10);
    if (cache && cache.length > 0) {
      _tumSiparisler = cache;
      _listeRender();
      return;
    }
  }

  const container = document.getElementById('siparisListesi');
  if (container) container.innerHTML = '<div class="loading-row"><span class="spinner"></span> Yükleniyor...</div>';

  try {
    _tumSiparisler = await API.siparislerGetir();
    Cache.kaydet(Cache.KEYS.SIPARISLER, _tumSiparisler);
    _listeRender();
  } catch (e) {
    toast('Siparişler yüklenemedi: ' + e.message, 'error');
    _listeRender();
  }
}
