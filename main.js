function _fmt(n) {
  if (n == null || isNaN(n)) return '0';
  return Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
function _fmtTl(n) {
  if (n == null || isNaN(n)) return '₺0';
  return '₺' + Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function _fmtTarih(str) {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function _esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// TOAST
let _toastTimer = null;
function toast(mesaj, tip = 'info', sure = 3000) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = mesaj;
  el.className = 'toast ' + tip;
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add('hidden'), sure);
}

function _aktifListeRender() {
  const container = document.getElementById('siparisListesi');
  if (!container) return;
  const arama = (document.getElementById('sipArama')?.value || '').toLowerCase();
  const durum = document.getElementById('sipDurumFiltre')?.value || 'tumu';

  // Sadece kapalı olmayanları göster
  let liste = _tumSiparisler.filter(s => s.durum !== 'kapali');
  if (durum !== 'tumu') liste = liste.filter(s => s.durum === durum);
  if (arama) liste = liste.filter(s =>
    s.musteriAdi?.toLowerCase().includes(arama) ||
    s.kod?.toLowerCase().includes(arama) ||
    s.marka?.toLowerCase().includes(arama) ||
    s.kalemler?.some(k => k.urunAdi?.toLowerCase().includes(arama) || k.renkKod?.toLowerCase().includes(arama))
  );
  liste.sort((a,b) => new Date(b.olusturmaZamani) - new Date(a.olusturmaZamani));

  if (liste.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">◈</div><p>${arama || durum !== 'tumu' ? 'Sonuç bulunamadı' : 'Henüz sipariş yok'}</p><span>${arama || durum !== 'tumu' ? 'Farklı filtre deneyin' : 'Yeni Sipariş butonuna tıklayarak başlayın'}</span></div>`;
    return;
  }
  container.innerHTML = '';
  liste.forEach(s => container.appendChild(_kartOlustur(s)));
  if (_aktifKod) {
    const k = container.querySelector('[data-kod="' + _aktifKod + '"]');
    if (k) k.classList.add('open');
  }
}

function _tamamlananListeRender() {
  const container = document.getElementById('tamamlananListesi');
  if (!container) return;
  const arama = (document.getElementById('tamArama')?.value || '').toLowerCase();

  let liste = _tumSiparisler.filter(s => s.durum === 'kapali');
  if (arama) liste = liste.filter(s =>
    s.musteriAdi?.toLowerCase().includes(arama) ||
    s.kod?.toLowerCase().includes(arama) ||
    s.marka?.toLowerCase().includes(arama)
  );
  liste.sort((a,b) => new Date(b.olusturmaZamani) - new Date(a.olusturmaZamani));

  // Top bar güncelle
  const tumKalemler = liste.flatMap(s => s.kalemler || []);
  const toplamSiparis = tumKalemler.reduce((t,k) => t+(Number(k.siparisMiktar)||0), 0);
  const toplamSevk = tumKalemler.reduce((t,k) => t+(Number(k.sevkMiktar)||0), 0);
  const sayiEl = document.getElementById('tamSiparisSayisi');
  const sipEl = document.getElementById('tamSiparisMiktar');
  const sevkEl = document.getElementById('tamSevkMiktar');
  if (sayiEl) sayiEl.textContent = liste.length;
  if (sipEl) sipEl.textContent = _fmt(toplamSiparis) + ' m';
  if (sevkEl) sevkEl.textContent = _fmt(toplamSevk) + ' m';

  if (liste.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">✓</div><p>Henüz tamamlanan sipariş yok</p><span>Kapatılan siparişler burada görünür</span></div>`;
    return;
  }
  container.innerHTML = '';
  liste.forEach(s => container.appendChild(_tamKartOlustur(s)));
}

function _tamKartOlustur(siparis) {
  const kart = document.createElement('div');
  kart.className = 'siparis-card kapali';
  kart.dataset.kod = siparis.kod;

  const borc = (siparis.kalemler||[]).reduce((t,k) => t+((Number(k.sevkMiktar)||0)*(Number(k.satisFiyat)||0)*(Number(k.satisKur)||0)), 0);
  const toplamSip = (siparis.kalemler||[]).reduce((t,k) => t+(Number(k.siparisMiktar)||0), 0);
  const toplamSevk = (siparis.kalemler||[]).reduce((t,k) => t+(Number(k.sevkMiktar)||0), 0);

  const satirlar = (siparis.kalemler||[]).map(k => {
    const farkUretim = (Number(k.uretimMiktar)||0) - (Number(k.siparisMiktar)||0);
    const fc = farkUretim===0?'kalem-fark-sifir':farkUretim>0?'kalem-fark-pos':'kalem-fark-neg';
    const fs = farkUretim===0?'+0':farkUretim>0?`+${_fmt(farkUretim)}`:_fmt(farkUretim);
    return `<tr>
      <td class="kalem-urun-adi">${_esc(k.urunAdi)}</td>
      <td><span class="kalem-renk">${_esc(k.renkKod||'—')}</span></td>
      <td class="kalem-sayi">${_fmt(k.siparisMiktar)}</td>
      <td class="kalem-sayi" style="font-weight:600;color:var(--color-success);">${_fmt(k.sevkMiktar||0)}</td>
      <td class="kalem-sayi">${_fmt(k.uretimMiktar||0)}</td>
      <td class="kalem-sayi ${fc}">${fs}</td>
      <td class="kalem-sayi">${k.satisFiyat?_fmt(k.satisFiyat)+' '+siparis.doviz:'—'}</td>
      <td class="kalem-sayi">${k.satisKur?_fmtTl(k.satisKur):'—'}</td>
      <td class="kalem-sayi" style="color:var(--color-success);font-weight:600;">${_fmtTl((Number(k.sevkMiktar)||0)*(Number(k.satisFiyat)||0)*(Number(k.satisKur)||0))}</td>
    </tr>`;
  }).join('');

  kart.innerHTML = `
    <div class="siparis-card-header">
      <span class="sip-kod">${_esc(siparis.kod)}</span>
      <span class="sip-musteri">${_esc(siparis.musteriAdi)}</span>
      <span class="sip-marka">${_esc(siparis.marka)}</span>
      <span style="font-size:11px;font-weight:600;background:#f3f4f6;color:#6b7280;padding:2px 8px;border-radius:4px;">KAPATILDI</span>
      <span style="font-size:11px;color:var(--text-muted);">${_fmt(toplamSip)}m → ${_fmt(toplamSevk)}m sevk</span>
      ${borc > 0 ? `<span class="sip-borc">${_fmtTl(borc)}</span>` : ''}
      <span class="sip-tarih">${_fmtTarih(siparis.tarih)} · ${_esc(siparis.doviz)}</span>
      <span class="sip-chevron">▼</span>
    </div>
    <div class="siparis-card-body">
      <table class="kalem-table">
        <thead><tr>
          <th>Ürün</th><th>Renk/Kod</th>
          <th style="text-align:right">Sipariş(M)</th>
          <th style="text-align:right">Sevk(M)</th>
          <th style="text-align:right">Üretim(M)</th>
          <th style="text-align:right">Fark(M)</th>
          <th style="text-align:right">Satış Fiyatı</th>
          <th style="text-align:right">Kur</th>
          <th style="text-align:right">Toplam TL</th>
        </tr></thead>
        <tbody>${satirlar}</tbody>
      </table>
      <div class="siparis-kapat-row">
        <button class="btn-duzenle btn-siparis-ac" data-kod="${_esc(siparis.kod)}">✎ Düzenle (Yeniden Aç)</button>
      </div>
    </div>`;

  kart.querySelector('.siparis-card-header').addEventListener('click', (e) => {
    if (e.target.closest('.btn-siparis-ac')) return;
    kart.classList.toggle('open');
  });

  return kart;
}

function _kartOlustur(siparis) {
  const kart = document.createElement('div');
  const kapali = siparis.durum === 'kapali';
  kart.className = 'siparis-card' + (kapali ? ' kapali' : '');
  kart.dataset.kod = siparis.kod;

  let toplamEksik = 0;
  (siparis.kalemler || []).forEach(k => {
    const fark = (k.uretimMiktar||0) - k.siparisMiktar;
    if (fark < 0) toplamEksik += Math.abs(fark);
  });

  const borc = (siparis.kalemler||[]).reduce((t,k) => t + ((k.sevkMiktar||0)*(k.satisFiyat||0)*(k.satisKur||0)), 0);

  kart.innerHTML = `
    <div class="siparis-card-header">
      <span class="sip-kod">${_esc(siparis.kod)}</span>
      <span class="sip-musteri">${_esc(siparis.musteriAdi)}</span>
      <span class="sip-marka">${_esc(siparis.marka)}</span>
      ${toplamEksik > 0 && !kapali ? `<span class="sip-fark-uyari">⚠ ${_fmt(toplamEksik)} m eksik</span>` : ''}
      ${kapali ? `<span style="font-size:11px;font-weight:600;background:#f3f4f6;color:#6b7280;padding:2px 8px;border-radius:4px;">KAPATILDI</span>` : ''}
      ${borc > 0 ? `<span class="sip-borc">Borç: ${_fmtTl(borc)}</span>` : ''}
      <span class="sip-tarih">${_fmtTarih(siparis.tarih)} · ${_esc(siparis.doviz)} · ${siparis.kalemler?.length||0} kalem</span>
      <span class="sip-chevron">▼</span>
    </div>
    <div class="siparis-card-body">
      ${_kalemTablosu(siparis, kapali)}
      <div class="siparis-kapat-row">
        ${!kapali
          ? `<button class="btn-kapat btn-siparis-kapat" data-kod="${_esc(siparis.kod)}">✓ Siparişi Kapat</button>
             <button class="btn-sil btn-siparis-sil" data-kod="${_esc(siparis.kod)}">🗑 Sil</button>`
          : `<button class="btn-duzenle btn-siparis-ac" data-kod="${_esc(siparis.kod)}">✎ Yeniden Aç</button>`
        }
      </div>
    </div>`;

  kart.querySelector('.siparis-card-header').addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    kart.classList.toggle('open');
  });

  const kapatBtn = kart.querySelector('.btn-siparis-kapat');
  if (kapatBtn) kapatBtn.addEventListener('click', () => _siparisKapat(siparis.kod));

  const silBtn = kart.querySelector('.btn-siparis-sil');
  if (silBtn) silBtn.addEventListener('click', () => _siparisSil(siparis.kod));

  const acBtn = kart.querySelector('.btn-siparis-ac');
  if (acBtn) acBtn.addEventListener('click', () => _siparisAc(siparis.kod));

  // Üretim / Sevk butonları
  kart.querySelectorAll('.btn-uretim-gir').forEach(btn => {
    btn.addEventListener('click', () => _uretimModalAc(siparis, btn.dataset.kalemId));
  });
  kart.querySelectorAll('.btn-sevk-gir').forEach(btn => {
    btn.addEventListener('click', () => _sevkModalAc(siparis, btn.dataset.kalemId));
  });
  kart.querySelectorAll('.btn-uretim-sil').forEach(btn => {
    btn.addEventListener('click', () => _uretimSil(btn.dataset.kalemId, siparis.kod));
  });
  kart.querySelectorAll('.btn-sevk-sil').forEach(btn => {
    btn.addEventListener('click', () => _sevkSil(btn.dataset.kalemId, siparis.kod));
  });

  return kart;
}

function _kalemTablosu(siparis, kapali) {
  const satirlar = (siparis.kalemler || []).map(k => {
    const uretimTam = (Number(k.uretimMiktar)||0) >= (Number(k.siparisMiktar)||0);
    const sevkTam = (Number(k.sevkMiktar)||0) >= (Number(k.siparisMiktar)||0);
    const fark = (Number(k.uretimMiktar)||0) - (Number(k.siparisMiktar)||0);
    const fc = fark===0?'kalem-fark-sifir':fark>0?'kalem-fark-pos':'kalem-fark-neg';
    const fs = fark===0?'+0':fark>0?`+${_fmt(fark)}`:_fmt(fark);
    const alisFiyatTl = (Number(k.alisFiyat)||0) * (Number(k.alisKur)||1);
    const satisFiyatTl = (Number(k.satisFiyat)||0) * (Number(k.satisKur)||1);

    return `<tr class="${uretimTam ? 'kalem-tam' : ''}">
      <td class="kalem-urun-adi">${_esc(k.urunAdi)}</td>
      <td><span class="kalem-renk">${_esc(k.renkKod||'—')}</span></td>
      <td class="kalem-sayi">${_fmt(k.siparisMiktar)}</td>
      <td class="kalem-sayi ${fc}">${_fmt(k.uretimMiktar||0)} <small class="${fc}">(${fs})</small></td>
      <td class="kalem-sayi">${k.alisFiyat ? _fmt(k.alisFiyat)+' '+_esc(siparis.doviz)+' / '+_fmtTl(alisFiyatTl) : '—'}</td>
      <td class="kalem-sayi">${_fmt(k.sevkMiktar||0)}</td>
      <td class="kalem-sayi">${k.satisFiyat ? _fmt(k.satisFiyat)+' '+_esc(siparis.doviz)+' / '+_fmtTl(satisFiyatTl) : '—'}</td>
      ${!kapali ? `
      <td class="kalem-aksiyonlar">
        ${!uretimTam
          ? `<button class="btn-sm btn-primary btn-uretim-gir" data-kalem-id="${_esc(k.id)}">+ Üretim</button>`
          : `<button class="btn-sm btn-ghost btn-uretim-sil" data-kalem-id="${_esc(k.id)}">↩ Üretim Sil</button>`
        }
        ${!sevkTam
          ? `<button class="btn-sm btn-success btn-sevk-gir" data-kalem-id="${_esc(k.id)}">+ Sevk</button>`
          : `<button class="btn-sm btn-ghost btn-sevk-sil" data-kalem-id="${_esc(k.id)}">↩ Sevk Sil</button>`
        }
      </td>` : '<td></td>'}
    </tr>`;
  }).join('');

  return `<table class="kalem-table">
    <thead><tr>
      <th>Ürün</th><th>Renk/Kod</th>
      <th style="text-align:right">Sipariş(M)</th>
      <th style="text-align:right">Üretim(M)</th>
      <th style="text-align:right">Alış Fiyatı</th>
      <th style="text-align:right">Sevk(M)</th>
      <th style="text-align:right">Satış Fiyatı</th>
      ${!kapali ? '<th style="text-align:center">İşlem</th>' : ''}
    </tr></thead>
    <tbody>${satirlar}</tbody>
  </table>`;
}

// ============================================================
// ÜRETİM MODAL
// ============================================================

function _uretimModalAc(siparis, kalemId) {
  const kalem = (siparis.kalemler||[]).find(k => k.id === kalemId);
  if (!kalem) return;
  _uretimKayit = { siparis, kalem };

  document.getElementById('uretimModalBaslik').textContent = _esc(kalem.urunAdi) + ' — Üretim Gir';
  document.getElementById('uretimTarih').value = new Date().toISOString().split('T')[0];
  document.getElementById('uretimMiktar').value = '';
  document.getElementById('uretimAlisFiyat').value = '';
  document.getElementById('uretimAlisKur').value = '';

  // Döviz seçimini ayarla
  const dovizSec = document.getElementById('uretimDoviz');
  if (dovizSec) dovizSec.value = siparis.doviz || 'EUR';

  document.getElementById('modalUretim').classList.remove('hidden');
  document.getElementById('uretimMiktar').focus();
}

async function _uretimKaydet() {
  if (!_uretimKayit) return;
  const { siparis, kalem } = _uretimKayit;

  const tarih = document.getElementById('uretimTarih').value;
  const miktar = parseFloat(document.getElementById('uretimMiktar').value) || 0;
  const alisFiyat = parseFloat(document.getElementById('uretimAlisFiyat').value) || 0;
  const alisKur = parseFloat(document.getElementById('uretimAlisKur').value) || 0;
  const doviz = document.getElementById('uretimDoviz')?.value || siparis.doviz || 'EUR';

  if (!tarih || miktar <= 0) { toast('Tarih ve miktar zorunlu', 'error'); return; }

  const btn = document.getElementById('btnUretimKaydet');
  btn.disabled = true; btn.textContent = 'Kaydediliyor...';

  const kayit = {
    id: 'UR_' + Date.now(),
    siparisKodu: siparis.kod,
    kalemId: kalem.id,
    miktar, alisFiyat, alisKur, doviz, tarih,
  };

  // Optimistik güncelle
  kalem.uretimMiktar = (Number(kalem.uretimMiktar)||0) + miktar;
  kalem.alisFiyat = alisFiyat;
  kalem.alisKur = alisKur;
  Cache.kaydet(Cache.KEYS.SIPARISLER, _tumSiparisler);
  document.getElementById('modalUretim').classList.add('hidden');
  _listeRender();
  toast('Üretim kaydedildi', 'success');

  try {
    await API.uretimKaydet(kayit);
  } catch(e) {
    toast('Üretim kaydı hatası: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Kaydet';
    _uretimKayit = null;
  }
}

async function _uretimSil(kalemId, siparisKodu) {
  if (!confirm('Üretim kaydını sıfırlamak istediğinize emin misiniz?')) return;
  const siparis = _tumSiparisler.find(s => s.kod === siparisKodu);
  if (!siparis) return;
  const kalem = (siparis.kalemler||[]).find(k => k.id === kalemId);
  if (!kalem) return;

  // Optimistik
  kalem.uretimMiktar = 0; kalem.alisFiyat = null; kalem.alisKur = null;
  Cache.kaydet(Cache.KEYS.SIPARISLER, _tumSiparisler);
  _listeRender();
  toast('Üretim sıfırlandı', 'info');

  try {
    await API.uretimSil(kalemId, siparisKodu);
  } catch(e) {
    toast('Silme hatası: ' + e.message, 'error');
  }
}

// ============================================================
// SEVK MODAL
// ============================================================

function _sevkModalAc(siparis, kalemId) {
  const kalem = (siparis.kalemler||[]).find(k => k.id === kalemId);
  if (!kalem) return;
  _sevkKayit = { siparis, kalem };

  document.getElementById('sevkModalBaslik').textContent = _esc(kalem.urunAdi) + ' — Sevk Gir';
  document.getElementById('sevkTarih').value = new Date().toISOString().split('T')[0];
  document.getElementById('sevkMiktar').value = '';
  document.getElementById('sevkSatisFiyat').value = '';
  document.getElementById('sevkSatisKur').value = '';

  // Döviz seçimini ayarla
  const dovizSec = document.getElementById('sevkDoviz');
  if (dovizSec) dovizSec.value = siparis.doviz || 'EUR';

  document.getElementById('modalSevk').classList.remove('hidden');
  document.getElementById('sevkMiktar').focus();
}

async function _sevkKaydet() {
  if (!_sevkKayit) return;
  const { siparis, kalem } = _sevkKayit;

  const tarih = document.getElementById('sevkTarih').value;
  const miktar = parseFloat(document.getElementById('sevkMiktar').value) || 0;
  const satisFiyat = parseFloat(document.getElementById('sevkSatisFiyat').value) || 0;
  const satisKur = parseFloat(document.getElementById('sevkSatisKur').value) || 0;
  const doviz = document.getElementById('sevkDoviz')?.value || siparis.doviz || 'EUR';

  if (!tarih || miktar <= 0) { toast('Tarih ve miktar zorunlu', 'error'); return; }

  const btn = document.getElementById('btnSevkKaydet');
  btn.disabled = true; btn.textContent = 'Kaydediliyor...';

  const kayit = {
    id: 'SK_' + Date.now(),
    siparisKodu: siparis.kod,
    kalemId: kalem.id,
    miktar, satisFiyat, satisKur, doviz, tarih,
  };

  // Optimistik güncelle
  kalem.sevkMiktar = (Number(kalem.sevkMiktar)||0) + miktar;
  kalem.satisFiyat = satisFiyat;
  kalem.satisKur = satisKur;
  Cache.kaydet(Cache.KEYS.SIPARISLER, _tumSiparisler);
  document.getElementById('modalSevk').classList.add('hidden');
  _listeRender();
  toast('Sevk kaydedildi', 'success');

  try {
    await API.sevkKaydet(kayit);
  } catch(e) {
    toast('Sevk kaydı hatası: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Kaydet';
    _sevkKayit = null;
  }
}

async function _sevkSil(kalemId, siparisKodu) {
  if (!confirm('Sevk kaydını sıfırlamak istediğinize emin misiniz?')) return;
  const siparis = _tumSiparisler.find(s => s.kod === siparisKodu);
  if (!siparis) return;
  const kalem = (siparis.kalemler||[]).find(k => k.id === kalemId);
  if (!kalem) return;

  // Optimistik
  kalem.sevkMiktar = 0; kalem.satisFiyat = null; kalem.satisKur = null;
  Cache.kaydet(Cache.KEYS.SIPARISLER, _tumSiparisler);
  _listeRender();
  toast('Sevk sıfırlandı', 'info');

  try {
    await API.sevkSil(kalemId, siparisKodu);
  } catch(e) {
    toast('Silme hatası: ' + e.message, 'error');
  }
}

// ============================================================
// SİPARİŞ KAPAT / AÇ / SİL
// ============================================================

async function _siparisKapat(kod) {
  if (!confirm('Siparişi kapatmak istediğinize emin misiniz?')) return;
  const siparis = _tumSiparisler.find(s => s.kod === kod);
  if (!siparis) return;

  siparis.durum = 'kapali';
  Cache.kaydet(Cache.KEYS.SIPARISLER, _tumSiparisler);
  _listeRender();
  toast(kod + ' kapatıldı', 'info');

  try {
    await API.siparisKapat(kod);
  } catch(e) {
    siparis.durum = 'bekliyor';
    Cache.kaydet(Cache.KEYS.SIPARISLER, _tumSiparisler);
    _listeRender();
    toast('Hata: ' + e.message, 'error');
  }
}

async function _siparisAc(kod) {
  const siparis = _tumSiparisler.find(s => s.kod === kod);
  if (!siparis) return;

  siparis.durum = 'bekliyor';
  Cache.kaydet(Cache.KEYS.SIPARISLER, _tumSiparisler);
  _listeRender();
  toast(kod + ' yeniden açıldı', 'info');

  try {
    await API.siparisAc(kod);
  } catch(e) {
    toast('Hata: ' + e.message, 'error');
  }
}

async function _siparisSil(kod) {
  if (!confirm(kod + ' siparişini tamamen silmek istediğinize emin misiniz?')) return;

  _tumSiparisler = _tumSiparisler.filter(s => s.kod !== kod);
  Cache.kaydet(Cache.KEYS.SIPARISLER, _tumSiparisler);
  _listeRender();
  toast(kod + ' silindi', 'info');

  try {
    await API.siparisSil(kod);
  } catch(e) {
    toast('Silme hatası: ' + e.message, 'error');
  }
}

// ============================================================
// ÜRETİM SAYFASI
// ============================================================

function _uretimSayfasiRender() {
  const container = document.getElementById('uretimListesi');
  if (!container) return;

  const bekleyenler = _tumSiparisler.filter(s => s.durum !== 'kapali' && (s.kalemler||[]).some(k => (Number(k.uretimMiktar)||0) < (Number(k.siparisMiktar)||0)));
  const tamamlananlar = _tumSiparisler.filter(s => s.durum !== 'kapali' && (s.kalemler||[]).every(k => (Number(k.uretimMiktar)||0) >= (Number(k.siparisMiktar)||0)) && (s.kalemler||[]).length > 0);

  container.innerHTML = `
    <div class="uretim-bekleyen">
      <div class="section-title">Üretim Bekleyenler <span class="badge">${bekleyenler.length}</span></div>
      ${bekleyenler.length === 0
        ? '<div class="empty-state"><p>Üretim bekleyen sipariş yok</p></div>'
        : bekleyenler.map(s => _uretimKartOlustur(s, false)).join('')
      }
    </div>
    <div class="uretim-tamamlanan" style="margin-top:24px;">
      <div class="section-title">Üretim Tamamlananlar <span class="badge badge-success">${tamamlananlar.length}</span></div>
      ${tamamlananlar.length === 0
        ? '<div class="empty-state"><p>Henüz tamamlanan yok</p></div>'
        : tamamlananlar.map(s => _uretimKartOlustur(s, true)).join('')
      }
    </div>`;

  // Event listener'ları ekle
  container.querySelectorAll('.btn-uretim-gir').forEach(btn => {
    const siparisKodu = btn.dataset.siparisKodu;
    const kalemId = btn.dataset.kalemId;
    const siparis = _tumSiparisler.find(s => s.kod === siparisKodu);
    if (siparis) btn.addEventListener('click', () => _uretimModalAc(siparis, kalemId));
  });
  container.querySelectorAll('.btn-uretim-sil').forEach(btn => {
    btn.addEventListener('click', () => _uretimSil(btn.dataset.kalemId, btn.dataset.siparisKodu));
  });
}

function _uretimKartOlustur(siparis, tamamlandi) {
  const satirlar = (siparis.kalemler||[]).map(k => {
    const tam = (Number(k.uretimMiktar)||0) >= (Number(k.siparisMiktar)||0);
    const fark = (Number(k.uretimMiktar)||0) - (Number(k.siparisMiktar)||0);
    const fc = fark===0?'kalem-fark-sifir':fark>0?'kalem-fark-pos':'kalem-fark-neg';
    const fs = fark===0?'+0':fark>0?`+${_fmt(fark)}`:_fmt(fark);
    return `<tr class="${tam?'kalem-tam':''}">
      <td class="kalem-urun-adi">${_esc(k.urunAdi)}</td>
      <td><span class="kalem-renk">${_esc(k.renkKod||'—')}</span></td>
      <td class="kalem-sayi">${_fmt(k.siparisMiktar)}</td>
      <td class="kalem-sayi ${fc}">${_fmt(k.uretimMiktar||0)} <small>(${fs})</small></td>
      <td class="kalem-sayi">${k.alisFiyat ? _fmt(k.alisFiyat)+' '+_esc(siparis.doviz) : '—'}</td>
      <td class="kalem-aksiyonlar">
        ${!tam
          ? `<button class="btn-sm btn-primary btn-uretim-gir" data-kalem-id="${_esc(k.id)}" data-siparis-kodu="${_esc(siparis.kod)}">+ Üretim</button>`
          : `<button class="btn-sm btn-ghost btn-uretim-sil" data-kalem-id="${_esc(k.id)}" data-siparis-kodu="${_esc(siparis.kod)}">↩ Sil</button>`
        }
      </td>
    </tr>`;
  }).join('');

  return `<div class="siparis-card ${tamamlandi?'uretim-tamam':''}">
    <div class="siparis-card-header" onclick="this.closest('.siparis-card').classList.toggle('open')">
      <span class="sip-kod">${_esc(siparis.kod)}</span>
      <span class="sip-musteri">${_esc(siparis.musteriAdi)}</span>
      <span class="sip-marka">${_esc(siparis.marka)}</span>
      <span class="sip-tarih">${_fmtTarih(siparis.tarih)}</span>
      <span class="sip-chevron">▼</span>
    </div>
    <div class="siparis-card-body">
      <table class="kalem-table">
        <thead><tr>
          <th>Ürün</th><th>Renk/Kod</th>
          <th style="text-align:right">Sipariş(M)</th>
          <th style="text-align:right">Üretim(M)</th>
          <th style="text-align:right">Alış Fiyatı</th>
          <th style="text-align:center">İşlem</th>
        </tr></thead>
        <tbody>${satirlar}</tbody>
      </table>
    </div>
  </div>`;
}

// ============================================================
// SATIŞ / SEVK SAYFASI
// ============================================================

function _sevkSayfasiRender() {
  const container = document.getElementById('sevkListesi');
  if (!container) return;

  const bekleyenler = _tumSiparisler.filter(s => s.durum !== 'kapali' && (s.kalemler||[]).some(k => (Number(k.sevkMiktar)||0) < (Number(k.siparisMiktar)||0)));
  const tamamlananlar = _tumSiparisler.filter(s => s.durum !== 'kapali' && (s.kalemler||[]).every(k => (Number(k.sevkMiktar)||0) >= (Number(k.siparisMiktar)||0)) && (s.kalemler||[]).length > 0);

  container.innerHTML = `
    <div class="sevk-bekleyen">
      <div class="section-title">Sevk Bekleyenler <span class="badge">${bekleyenler.length}</span></div>
      ${bekleyenler.length === 0
        ? '<div class="empty-state"><p>Sevk bekleyen sipariş yok</p></div>'
        : bekleyenler.map(s => _sevkKartOlustur(s, false)).join('')
      }
    </div>
    <div class="sevk-tamamlanan" style="margin-top:24px;">
      <div class="section-title">Sevk Tamamlananlar <span class="badge badge-success">${tamamlananlar.length}</span></div>
      ${tamamlananlar.length === 0
        ? '<div class="empty-state"><p>Henüz tamamlanan yok</p></div>'
        : tamamlananlar.map(s => _sevkKartOlustur(s, true)).join('')
      }
    </div>`;

  container.querySelectorAll('.btn-sevk-gir').forEach(btn => {
    const siparisKodu = btn.dataset.siparisKodu;
    const kalemId = btn.dataset.kalemId;
    const siparis = _tumSiparisler.find(s => s.kod === siparisKodu);
    if (siparis) btn.addEventListener('click', () => _sevkModalAc(siparis, kalemId));
  });
  container.querySelectorAll('.btn-sevk-sil').forEach(btn => {
    btn.addEventListener('click', () => _sevkSil(btn.dataset.kalemId, btn.dataset.siparisKodu));
  });
}

function _sevkKartOlustur(siparis, tamamlandi) {
  const satirlar = (siparis.kalemler||[]).map(k => {
    const tam = (Number(k.sevkMiktar)||0) >= (Number(k.siparisMiktar)||0);
    return `<tr class="${tam?'kalem-tam':''}">
      <td class="kalem-urun-adi">${_esc(k.urunAdi)}</td>
      <td><span class="kalem-renk">${_esc(k.renkKod||'—')}</span></td>
      <td class="kalem-sayi">${_fmt(k.siparisMiktar)}</td>
      <td class="kalem-sayi">${_fmt(k.sevkMiktar||0)}</td>
      <td class="kalem-sayi">${k.satisFiyat ? _fmt(k.satisFiyat)+' '+_esc(siparis.doviz) : '—'}</td>
      <td class="kalem-aksiyonlar">
        ${!tam
          ? `<button class="btn-sm btn-success btn-sevk-gir" data-kalem-id="${_esc(k.id)}" data-siparis-kodu="${_esc(siparis.kod)}">+ Sevk</button>`
          : `<button class="btn-sm btn-ghost btn-sevk-sil" data-kalem-id="${_esc(k.id)}" data-siparis-kodu="${_esc(siparis.kod)}">↩ Sil</button>`
        }
      </td>
    </tr>`;
  }).join('');

  return `<div class="siparis-card ${tamamlandi?'sevk-tamam':''}">
    <div class="siparis-card-header" onclick="this.closest('.siparis-card').classList.toggle('open')">
      <span class="sip-kod">${_esc(siparis.kod)}</span>
      <span class="sip-musteri">${_esc(siparis.musteriAdi)}</span>
      <span class="sip-marka">${_esc(siparis.marka)}</span>
      <span class="sip-tarih">${_fmtTarih(siparis.tarih)}</span>
      <span class="sip-chevron">▼</span>
    </div>
    <div class="siparis-card-body">
      <table class="kalem-table">
        <thead><tr>
          <th>Ürün</th><th>Renk/Kod</th>
          <th style="text-align:right">Sipariş(M)</th>
          <th style="text-align:right">Sevk(M)</th>
          <th style="text-align:right">Satış Fiyatı</th>
          <th style="text-align:center">İşlem</th>
        </tr></thead>
        <tbody>${satirlar}</tbody>
      </table>
    </div>
  </div>`;
}

// ============================================================
// MÜŞTERİ CARİ
// ============================================================

let _cariTahsilatlar = {};
let _cariAktifMusteri = null;

async function _cariYukle() {
  const container = document.getElementById('cariListesi');
  if (!container) return;

  container.innerHTML = '<div class="loading-row"><span class="spinner"></span> Yükleniyor...</div>';

  try {
    const tahsilatlar = await API.tahsilatlariGetir();
    _cariTahsilatlar = {};
    tahsilatlar.forEach(t => {
      if (!_cariTahsilatlar[t.musteriAdi]) _cariTahsilatlar[t.musteriAdi] = [];
      _cariTahsilatlar[t.musteriAdi].push(t);
    });
  } catch(e) {
    toast('Tahsilatlar yüklenemedi: ' + e.message, 'error');
  }

  _cariRender(container);
}

function _cariRender(container) {
  // Müşteri listesini siparişlerden çıkar
  const musteriler = [...new Set((_tumSiparisler||[]).map(s => s.musteriAdi))].sort();

  if (musteriler.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Henüz müşteri yok</p></div>';
    return;
  }

  container.innerHTML = '';

  musteriler.forEach(m => {
    const mSiparisler = (_tumSiparisler||[]).filter(s => s.musteriAdi === m);
    const tahsilatlar = _cariTahsilatlar[m] || [];

    const toplamBorc = mSiparisler.reduce((t,s) =>
      t + (s.kalemler||[]).reduce((kt,k) =>
        kt + (Number(k.sevkMiktar)||0)*(Number(k.satisFiyat)||0)*(Number(k.satisKur)||0), 0), 0);
    const toplamTahsilat = tahsilatlar.reduce((t,x) => t+(Number(x.tutar)||0), 0);
    const bakiye = toplamBorc - toplamTahsilat;

    const sipSatirlari = mSiparisler.map(s => {
      const sevkToplam = (s.kalemler||[]).reduce((t,k) =>
        t+(Number(k.sevkMiktar)||0)*(Number(k.satisFiyat)||0)*(Number(k.satisKur)||0), 0);
      return `<tr>
        <td>${_fmtTarih(s.tarih)}</td>
        <td><span style="font-family:var(--font-mono);font-size:11px;">${_esc(s.kod)}</span></td>
        <td>${_esc(s.marka)}</td>
        <td><span style="font-size:11px;padding:2px 6px;border-radius:4px;background:${s.durum==='kapali'?'#f3f4f6':'#eff6ff'};color:${s.durum==='kapali'?'#6b7280':'#1d4ed8'};">${s.durum}</span></td>
        <td style="text-align:right;font-weight:600;">${_fmtTl(sevkToplam)}</td>
      </tr>`;
    }).join('');

    const tahSatirlari = tahsilatlar.map(t => `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);">
        <span style="font-size:12px;color:var(--text-muted);min-width:80px;">${_fmtTarih(t.tarih)}</span>
        <span style="font-size:12px;flex:1;">${_esc(t.not||'—')}</span>
        <span style="font-size:13px;font-weight:600;color:var(--color-success);">+${_fmtTl(Number(t.tutar)||0)}</span>
        <button class="btn-sm btn-ghost" style="color:var(--color-danger);font-size:11px;" data-tahsilat-id="${_esc(t.id)}" data-musteri="${_esc(m)}">Sil</button>
      </div>`).join('');

    const kart = document.createElement('div');
    kart.className = 'siparis-card';
    kart.innerHTML = `
      <div class="siparis-card-header">
        <span class="sip-musteri" style="font-size:15px;font-weight:700;">${_esc(m)}</span>
        <span style="font-size:12px;color:var(--text-muted);">${mSiparisler.length} sipariş</span>
        <span style="font-size:12px;">Borç: <strong>${_fmtTl(toplamBorc)}</strong></span>
        <span style="font-size:12px;">Tahsilat: <strong style="color:var(--color-success);">${_fmtTl(toplamTahsilat)}</strong></span>
        <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:${bakiye>0?'var(--color-danger)':'var(--color-success)'};">Bakiye: ${_fmtTl(bakiye)}</span>
        <span class="sip-chevron">▼</span>
      </div>
      <div class="siparis-card-body" style="padding:0;">
        <div style="padding:12px 16px;">
          <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Siparişler</div>
          <table class="kalem-table" style="margin-bottom:16px;">
            <thead><tr>
              <th>Tarih</th><th>Kod</th><th>Marka</th><th>Durum</th>
              <th style="text-align:right">Sevk Tutarı</th>
            </tr></thead>
            <tbody>${sipSatirlari}</tbody>
          </table>

          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">Tahsilatlar</div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-sm btn-ghost" style="font-size:11px;" onclick="_cariRaporYazdir('${_esc(m)}')">🖨 Cari Rapor</button>
              <button class="btn btn-sm btn-primary" data-tahsilat-musteri="${_esc(m)}" style="font-size:11px;">+ Tahsilat Gir</button>
            </div>
          </div>
          <div class="cari-tahsilatlar" data-musteri="${_esc(m)}">
            ${tahSatirlari || '<div style="font-size:12px;color:var(--text-muted);padding:8px 0;">Henüz tahsilat yok</div>'}
          </div>
        </div>
      </div>`;

    kart.querySelector('.siparis-card-header').addEventListener('click', () => kart.classList.toggle('open'));

    kart.querySelector('[data-tahsilat-musteri]').addEventListener('click', () => {
      _cariAktifMusteri = m;
      document.getElementById('tahsilatTarih').value = new Date().toISOString().split('T')[0];
      document.getElementById('tahsilatTutar').value = '';
      document.getElementById('tahsilatNot').value = '';
      document.getElementById('tahsilatModalInfo').innerHTML = `Müşteri: <strong>${_esc(m)}</strong><br>Bakiye: <strong style="color:var(--color-danger);">${_fmtTl(bakiye)}</strong>`;
      document.getElementById('modalTahsilat').classList.remove('hidden');
      document.getElementById('tahsilatTutar').focus();
    });

    kart.querySelectorAll('[data-tahsilat-id]').forEach(btn => {
      btn.addEventListener('click', () => _tahsilatSil(btn.dataset.tahsilatId, btn.dataset.musteri));
    });

    container.appendChild(kart);
  });
}

async function _tahsilatKaydet() {
  if (!_cariAktifMusteri) return;
  const tarih = document.getElementById('tahsilatTarih').value;
  const tutar = parseFloat(document.getElementById('tahsilatTutar').value) || 0;
  const not = document.getElementById('tahsilatNot').value.trim().toUpperCase();
  if (!tarih || tutar <= 0) { toast('Tarih ve tutar zorunlu', 'error'); return; }

  const btn = document.getElementById('btnTahsilatKaydet');
  btn.disabled = true; btn.textContent = 'Kaydediliyor...';
  try {
    await API.tahsilatKaydet({
      id: 'TH_' + Date.now(),
      musteriAdi: _cariAktifMusteri,
      siparisKodu: '',
      tutar, tarih, not
    });
    document.getElementById('modalTahsilat').classList.add('hidden');
    toast('Tahsilat kaydedildi', 'success');
    await _cariYukle();
  } catch(e) { toast('Hata: ' + e.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Kaydet'; }
}

async function _tahsilatSil(id, musteriAdi) {
  if (!confirm('Bu tahsilatı silmek istediğinize emin misiniz?')) return;
  try {
    await API.tahsilatSil(id);
    toast('Tahsilat silindi', 'info');
    await _cariYukle();
  } catch(e) { toast('Hata: ' + e.message, 'error'); }
}

function _cariRaporYazdir(musteriAdi) {
  const musteriSiparisler = (_tumSiparisler || []).filter(s => s.musteriAdi === musteriAdi);
  const tahsilatlar = _cariTahsilatlar[musteriAdi] || [];
  const toplamBorc = musteriSiparisler.reduce((t,s) =>
    t + (s.kalemler||[]).reduce((kt,k) =>
      kt + (Number(k.sevkMiktar)||0)*(Number(k.satisFiyat)||0)*(Number(k.satisKur)||0), 0), 0);
  const toplamTahsilat = tahsilatlar.reduce((t,x) => t+(Number(x.tutar)||0), 0);
  const bakiye = toplamBorc - toplamTahsilat;

  const sipSatirlari = musteriSiparisler.map(s => {
    const sevkToplam = (s.kalemler||[]).reduce((t,k) =>
      t+(Number(k.sevkMiktar)||0)*(Number(k.satisFiyat)||0)*(Number(k.satisKur)||0), 0);
    return `${_fmtTarih(s.tarih).padEnd(12)}${s.kod.padEnd(16)}${(s.marka||'').substring(0,10).padEnd(12)}${_fmtTl(sevkToplam)}`;
  }).join('\n');

  const tahSatirlari = tahsilatlar.map(t =>
    `${_fmtTarih(t.tarih).padEnd(12)}${(t.not||'Tahsilat').substring(0,20).padEnd(22)}+${_fmtTl(Number(t.tutar)||0)}`
  ).join('\n');

  const rapor = `CARi HESAP EKSTRESI
${'='.repeat(55)}
Musteri  : ${musteriAdi}
Tarih    : ${new Date().toLocaleDateString('tr-TR')}
${'='.repeat(55)}

SiPARiSLER / BORC
${'-'.repeat(55)}
${'TARiH'.padEnd(12)}${'KOD'.padEnd(16)}${'MARKA'.padEnd(12)}${'TUTAR'}
${'-'.repeat(55)}
${sipSatirlari || '(Siparis yok)'}
${'-'.repeat(55)}
${'TOPLAM BORC'.padEnd(40)}${_fmtTl(toplamBorc)}

TAHSiLATLAR / ALACAK
${'-'.repeat(55)}
${tahSatirlari || '(Tahsilat yok)'}
${'-'.repeat(55)}
${'TOPLAM TAHSiLAT'.padEnd(40)}${_fmtTl(toplamTahsilat)}

${'='.repeat(55)}
${'BAKiYE (KALAN BORC)'.padEnd(40)}${_fmtTl(bakiye)}
${'='.repeat(55)}
SAKA TAKiP - Sistem Ciktisi`;

  const w = window.open('','_blank','width=700,height=600');
  w.document.write(`<!DOCTYPE html><html><head><title>Cari Rapor - ${musteriAdi}</title>
    <style>body{font-family:'Courier New',monospace;font-size:12px;padding:30px;white-space:pre;line-height:1.6;}@media print{body{padding:10px;}@page{margin:1cm;}}</style>
    </head><body>${rapor}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

// ============================================================
// KAR PAYI SAYFASI
// ============================================================

async function _karPayiYukle() {
  const container = document.getElementById('karPayiContainer');
  if (!container) return;

  try {
    const [giderler, odemeler, tahsilatlar] = await Promise.all([
      API.giderleriGetir(),
      API.odemeleriGetir(),
      API.tahsilatlariGetir(),
    ]);
    _karPayiRender(container, giderler, odemeler, tahsilatlar);
  } catch(e) {
    toast('Veriler yüklenemedi: ' + e.message, 'error');
  }
}

function _karPayiRender(container, giderler, odemeler, tahsilatlar) {
  // Toplam satış/maliyet hesapla
  let toplamSatis = 0, toplamMaliyet = 0;
  const siparisBazli = [];

  (_tumSiparisler||[]).filter(s => s.durum === 'kapali' || (s.kalemler||[]).some(k => Number(k.sevkMiktar) > 0)).forEach(s => {
    let satisTl = 0, maliyetTl = 0;
    (s.kalemler||[]).forEach(k => {
      satisTl += (Number(k.sevkMiktar)||0)*(Number(k.satisFiyat)||0)*(Number(k.satisKur)||0);
      maliyetTl += (Number(k.uretimMiktar)||0)*(Number(k.alisFiyat)||0)*(Number(k.alisKur)||0);
    });
    toplamSatis += satisTl;
    toplamMaliyet += maliyetTl;
    if (satisTl > 0 || maliyetTl > 0) {
      siparisBazli.push({ s, satisTl, maliyetTl });
    }
  });

  const toplamGider = (giderler||[]).reduce((t,g) => t+(Number(g.tutarTl)||Number(g.tutar)||0), 0);
  const brutKar = toplamSatis - toplamMaliyet;
  const netKar = brutKar - toplamGider;
  const benimPayim = netKar * 0.5;
  const giderPayim = toplamGider * 0.5;

  // Tahsilat toplamı
  const toplamTahsilat = (tahsilatlar||[]).reduce((t,x) => t+(Number(x.tutar)||0), 0);
  const alinanToplam = toplamTahsilat + (odemeler||[]).reduce((t,o) => t+(Number(o.tutar)||0), 0);
  const netAlacagim = benimPayim - alinanToplam;

  const sipSatirlari = siparisBazli.map(({s, satisTl, maliyetTl}) => {
    const brutKarS = satisTl - maliyetTl;
    const sipUretim = (s.kalemler||[]).reduce((t,k) => t+(Number(k.uretimMiktar)||0), 0);
    const sipSiparis = (s.kalemler||[]).reduce((t,k) => t+(Number(k.siparisMiktar)||0), 0);
    const fark = sipUretim - sipSiparis;
    return `<tr>
      <td>${_fmtTarih(s.tarih)}</td>
      <td>${_esc(s.musteriAdi)}</td>
      <td><span style="font-family:var(--font-mono);font-size:11px;">${_esc(s.kod)}</span></td>
      <td style="text-align:right">${_fmt(sipSiparis)}</td>
      <td style="text-align:right;color:${fark<0?'var(--color-danger)':'var(--color-success)'};font-weight:600;">${_fmt(sipUretim)}<small style="font-weight:400;"> (${fark>=0?'+':''}${_fmt(fark)})</small></td>
      <td style="text-align:right">${_fmtTl(satisTl)}</td>
      <td style="text-align:right">${_fmtTl(maliyetTl)}</td>
      <td style="text-align:right;font-weight:600;color:${brutKarS>=0?'var(--color-success)':'var(--color-danger)'};">${_fmtTl(brutKarS)}</td>
      <td style="text-align:right">${_fmtTl(brutKarS*0.5)}</td>
      <td style="text-align:right">${_fmtTl(brutKarS*0.5)}</td>
    </tr>`;
  }).join('');

  const giderSatirlari = (giderler||[]).map(g => `
    <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);">
      <span style="font-size:12px;color:var(--text-muted);min-width:80px;">${_fmtTarih(g.tarih)}</span>
      <span style="font-size:13px;flex:1;">${_esc(g.aciklama)}</span>
      <span style="font-size:12px;color:var(--text-muted);">${_esc(g.doviz||'TL')} ${_fmt(g.tutar)}</span>
      <span style="font-size:13px;font-weight:600;color:var(--color-danger);">-${_fmtTl(Number(g.tutarTl)||Number(g.tutar)||0)}</span>
      <button class="btn-sm btn-ghost" style="color:var(--color-danger);font-size:11px;" onclick="_giderSil('${_esc(g.id)}')">Sil</button>
    </div>`).join('');

  const odemeSatirlari = (odemeler||[]).map(o => `
    <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);">
      <span style="font-size:12px;color:var(--text-muted);min-width:80px;">${_fmtTarih(o.tarih)}</span>
      <span style="font-size:13px;flex:1;">${_esc(o.aciklama)}</span>
      <span style="font-size:12px;color:var(--text-muted);">${_esc(o.not||'')}</span>
      <span style="font-size:13px;font-weight:600;color:var(--color-success);">+${_fmtTl(Number(o.tutar)||0)}</span>
      <button class="btn-sm btn-ghost" style="color:var(--color-danger);font-size:11px;" onclick="_odemeSil('${_esc(o.id)}')">Sil</button>
    </div>`).join('');

  container.innerHTML = `
    <div class="metric-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px;">
      <div class="metric-card"><div class="metric-label">TOPLAM SATIŞ / TESLİMAT</div><div class="metric-value">${_fmtTl(toplamSatis)}</div></div>
      <div class="metric-card"><div class="metric-label">TOPLAM MALİYET</div><div class="metric-value">${_fmtTl(toplamMaliyet)}</div></div>
      <div class="metric-card"><div class="metric-label">BRÜT KAR</div><div class="metric-value" style="color:${brutKar>=0?'var(--color-success)':'var(--color-danger)'};">${_fmtTl(brutKar)}</div></div>
      <div class="metric-card"><div class="metric-label">BENİM PAYIM (%50)</div><div class="metric-value">${_fmtTl(benimPayim)}</div></div>
      <div class="metric-card"><div class="metric-label">GİDER PAYIM (%50)</div><div class="metric-value" style="color:var(--color-danger);">-${_fmtTl(giderPayim)}</div></div>
      <div class="metric-card" style="border:2px solid var(--color-primary);"><div class="metric-label">NET ALACAĞIM</div><div class="metric-value" style="color:${netAlacagim>0?'var(--color-danger)':'var(--color-success)'};">${_fmtTl(netAlacagim)}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
      <div class="metric-card"><div class="metric-label">ALINAN TOPLAM</div><div class="metric-value" style="color:var(--color-success);">${_fmtTl(alinanToplam)}</div></div>
      <div class="metric-card" style="border:2px solid var(--color-danger);"><div class="metric-label">KALAN ALACAĞIM</div><div class="metric-value" style="color:var(--color-danger);">${_fmtTl(Math.max(0,netAlacagim))}</div></div>
    </div>

    <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">SİPARİŞ BAZINDA KAR</div>
    <div style="overflow-x:auto;margin-bottom:20px;">
      <table class="kalem-table">
        <thead><tr>
          <th>Tarih</th><th>Müşteri</th><th>Sip. Kodu</th>
          <th style="text-align:right">Sip.(M)</th>
          <th style="text-align:right">Üretim(M)</th>
          <th style="text-align:right">Satış TL</th>
          <th style="text-align:right">Maliyet TL</th>
          <th style="text-align:right">Brüt Kar</th>
          <th style="text-align:right">Benim Payım</th>
          <th style="text-align:right">Şirket Payı</th>
        </tr></thead>
        <tbody>${sipSatirlari || '<tr><td colspan="10" style="text-align:center;color:var(--text-muted);padding:16px;">Henüz veri yok</td></tr>'}</tbody>
      </table>
    </div>

    <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">GİDERLER</div>
    <div style="margin-bottom:20px;">${giderSatirlari || '<div style="font-size:12px;color:var(--text-muted);padding:8px 0;">Henüz gider yok</div>'}</div>

    <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">ALDIĞIM ÖDEMELER</div>
    <div>${odemeSatirlari || '<div style="font-size:12px;color:var(--text-muted);padding:8px 0;">Henüz ödeme kaydı yok</div>'}</div>`;
}

async function _giderEkle() {
  const tarih = document.getElementById('giderTarih')?.value;
  const aciklama = document.getElementById('giderAciklama')?.value.trim().toUpperCase();
  const tutar = parseFloat(document.getElementById('giderTutar')?.value) || 0;
  const doviz = document.getElementById('giderDoviz')?.value || 'TL';
  const kur = parseFloat(document.getElementById('giderKur')?.value) || 1;
  const tutarTl = tutar * kur;

  if (!tarih || !aciklama || tutar <= 0) { toast('Tüm alanları doldurun', 'error'); return; }

  const btn = document.getElementById('btnGiderKaydet');
  if (btn) { btn.disabled = true; btn.textContent = 'Kaydediliyor...'; }

  try {
    await API.giderKaydet({ id: 'GD_'+Date.now(), tarih, aciklama, tutar, doviz, kur, tutarTl });
    document.getElementById('giderTutar').value = '';
    document.getElementById('giderAciklama').value = '';
    toast('Gider kaydedildi', 'success');
    await _karPayiYukle();
  } catch(e) { toast('Hata: ' + e.message, 'error'); }
  finally { if (btn) { btn.disabled = false; btn.textContent = 'Ekle'; } }
}

async function _giderSil(id) {
  if (!confirm('Bu gideri silmek istediğinize emin misiniz?')) return;
  try {
    await API.giderSil(id);
    toast('Gider silindi', 'info');
    await _karPayiYukle();
  } catch(e) { toast('Hata: ' + e.message, 'error'); }
}

async function _odemeEkle() {
  const tarih = document.getElementById('odemeTarih')?.value;
  const aciklama = document.getElementById('odemeAciklama')?.value.trim().toUpperCase();
  const tutar = parseFloat(document.getElementById('odemeTutar')?.value) || 0;
  const not = document.getElementById('odemeNot')?.value.trim() || '';

  if (!tarih || !aciklama || tutar <= 0) { toast('Tüm alanları doldurun', 'error'); return; }

  const btn = document.getElementById('btnOdemeKaydet');
  if (btn) { btn.disabled = true; btn.textContent = 'Kaydediliyor...'; }

  try {
    await API.odemeKaydet({ id: 'OD_'+Date.now(), tarih, aciklama, tutar, not });
    document.getElementById('odemeTutar').value = '';
    document.getElementById('odemeAciklama').value = '';
    toast('Ödeme kaydedildi', 'success');
    await _karPayiYukle();
  } catch(e) { toast('Hata: ' + e.message, 'error'); }
  finally { if (btn) { btn.disabled = false; btn.textContent = 'Ekle'; } }
}

async function _odemeSil(id) {
  if (!confirm('Bu ödeme kaydını silmek istediğinize emin misiniz?')) return;
  try {
    await API.odemeSil(id);
    toast('Ödeme silindi', 'info');
    await _karPayiYukle();
  } catch(e) { toast('Hata: ' + e.message, 'error'); }
}

// ============================================================
// YEDEK AL
// ============================================================

async function _yedekAl() {
  const btn = document.getElementById('btnYedekAl');
  btn.textContent = '⏳ Hazırlanıyor...';
  btn.disabled = true;
  try {
    const [giderler, odemeler, tahsilatlar] = await Promise.all([
      API.giderleriGetir(),
      API.odemeleriGetir(),
      API.tahsilatlariGetir(),
    ]);

    const yedek = {
      olusturmaTarihi: new Date().toISOString(),
      versiyon: '1.0',
      siparisler: _tumSiparisler || [],
      giderler: giderler || [],
      odemeler: odemeler || [],
      tahsilatlar: tahsilatlar || [],
    };

    const json = JSON.stringify(yedek, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const tarih = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `saka-takip-yedek-${tarih}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Yedek indirildi', 'success');
  } catch(e) {
    toast('Yedek alınamadı: ' + e.message, 'error');
  } finally {
    btn.textContent = '⬇ Yedek Al';
    btn.disabled = false;
  }
}
