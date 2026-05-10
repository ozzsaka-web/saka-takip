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
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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
      <span class="sip-kod">${siparis.kod}</span>
      <span class="sip-musteri">${_esc(siparis.musteriAdi)}</span>
      <span class="sip-marka">${_esc(siparis.marka)}</span>
      <span style="font-size:11px;font-weight:600;background:#f3f4f6;color:#6b7280;padding:2px 8px;border-radius:4px;">KAPATILDI</span>
      <span style="font-size:11px;color:var(--text-muted);">${_fmt(toplamSip)}m → ${_fmt(toplamSevk)}m sevk</span>
      ${borc > 0 ? `<span class="sip-borc">${_fmtTl(borc)}</span>` : ''}
      <span class="sip-tarih">${_fmtTarih(siparis.tarih)} · ${siparis.doviz}</span>
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
        <button class="btn-duzenle btn-siparis-ac" data-kod="${siparis.kod}">✎ Düzenle (Yeniden Aç)</button>
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
      <span class="sip-kod">${siparis.kod}</span>
      <span class="sip-musteri">${_esc(siparis.musteriAdi)}</span>
      <span class="sip-marka">${_esc(siparis.marka)}</span>
      ${toplamEksik > 0 && !kapali ? `<span class="sip-fark-uyari">⚠ ${_fmt(toplamEksik)} m eksik</span>` : ''}
      ${kapali ? `<span style="font-size:11px;font-weight:600;background:#f3f4f6;color:#6b7280;padding:2px 8px;border-radius:4px;">KAPATILDI</span>` : ''}
      ${borc > 0 ? `<span class="sip-borc">Borç: ${_fmtTl(borc)}</span>` : ''}
      <span class="sip-tarih">${_fmtTarih(siparis.tarih)} · ${siparis.doviz} · ${siparis.kalemler?.length||0} kalem</span>
      <span class="sip-chevron">▼</span>
    </div>
    <div class="siparis-card-body">
      ${_kalemTablosu(siparis, kapali)}
      <div class="siparis-kapat-row">
        ${!kapali
          ? `<button class="btn btn-sm btn-ghost btn-siparis-kapat" data-kod="${siparis.kod}">Siparişi Kapat</button>`
          : `<button class="btn-duzenle btn-siparis-ac" data-kod="${siparis.kod}">✎ Düzenle (Yeniden Aç)</button>`}
          <button class="btn-sil" data-kod="${siparis.kod}">Sil</button>
      </div>
    </div>
  `;

kart.querySelector('.btn-sil').addEventListener('click', async (e) => {
  e.stopPropagation();

  const kod = siparis.kod;

  if (!confirm(kod + ' silinsin mi?')) return;

  try {
    await API.siparisSil(kod);
    _tumSiparisler = [];
    await _siparisleriYukle();
  } catch (err) {
    alert('Silme hatası: ' + err.message);
  }
});

  kart.querySelector('.siparis-card-header').addEventListener('click', (e) => {
    if (e.target.closest('.btn-siparis-kapat') || e.target.closest('.btn-siparis-ac')) return;
    const acikti = kart.classList.contains('open');
    document.querySelectorAll('.siparis-card.open').forEach(k => k.classList.remove('open'));
    if (!acikti) { kart.classList.add('open'); _aktifKod = siparis.kod; }
    else _aktifKod = null;
  });

  return kart;
}

function _kalemTablosu(siparis, kapali) {
  const satirlar = (siparis.kalemler||[]).map(k => {
    const fark = (k.uretimMiktar||0) - k.siparisMiktar;
    const farkClass = fark===0?'kalem-fark-sifir':fark>0?'kalem-fark-pos':'kalem-fark-neg';
    const farkStr = fark===0?'+0':fark>0?`+${_fmt(fark)}`:_fmt(fark);
    const uretimVar = (k.uretimMiktar||0) > 0;
    const durum = _kalemDurum(k);
    const toplamDoviz = (k.alisFiyat||0)*(k.uretimMiktar||0);
    const toplamTl = toplamDoviz*(k.alisKur||0);
    return `
      <tr>
        <td><div class="kalem-urun-adi">${_esc(k.urunAdi)}</div></td>
        <td><span class="kalem-renk">${_esc(k.renkKod||'—')}</span></td>
        <td class="kalem-sayi">${_fmt(k.siparisMiktar)}</td>
        <td class="kalem-sayi" style="font-weight:600">${_fmt(k.uretimMiktar||0)}</td>
        <td class="kalem-sayi ${farkClass}">${farkStr}</td>
        <td class="kalem-sayi">${k.alisFiyat?_fmt(k.alisFiyat)+' '+siparis.doviz:'—'}</td>
        <td class="kalem-sayi">${k.alisKur?_fmtTl(k.alisKur):'—'}</td>
        <td class="kalem-sayi">${toplamDoviz>0?_fmt(toplamDoviz)+' '+siparis.doviz:'—'}</td>
        <td class="kalem-sayi">${toplamTl>0?_fmtTl(toplamTl):'—'}</td>
        <td><span class="kalem-durum ${_durumClass(durum)}">${durum}</span></td>
        <td>
          <div class="kalem-aksiyonlar">
            <button class="btn-uretim ${uretimVar?'girildi':''}" data-kalem-id="${k.id}" data-siparis-kod="${siparis.kod}" ${kapali?'disabled':''}>
              ${uretimVar?'✓ Üretim':'Üretim Gir'}
            </button>
            <button class="btn-sevk" data-kalem-id="${k.id}" data-siparis-kod="${siparis.kod}" ${(!uretimVar||kapali)?'disabled':''}>
              Sevk Gir
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  return `<table class="kalem-table">
    <thead><tr>
      <th>Ürün</th><th>Renk/Kod</th>
      <th style="text-align:right">Sipariş (M)</th>
      <th style="text-align:right">Üretim (M)</th>
      <th style="text-align:right">Fark (M)</th>
      <th style="text-align:right">Alış Fiyatı</th>
      <th style="text-align:right">Kur (TL)</th>
      <th style="text-align:right">Toplam Döviz</th>
      <th style="text-align:right">Toplam TL</th>
      <th>Durum</th><th></th>
    </tr></thead>
    <tbody>${satirlar}</tbody>
  </table>`;
}

function _kalemDurum(k) {
  const u = k.uretimMiktar||0, s = k.sevkMiktar||0;
  if (s>0 && s>=u) return 'Tamamlandı';
  if (s>0) return 'Kısmi Sevk';
  if (u>0 && u>=k.siparisMiktar) return 'Sevke Hazır';
  if (u>0) return 'Üretimde';
  return 'Bekliyor';
}

function _durumClass(d) {
  return { 'Bekliyor':'durum-bekliyor','Üretimde':'durum-uretimde','Sevke Hazır':'durum-sevke-hazir','Kısmi Sevk':'durum-uretimde','Tamamlandı':'durum-tamamlandi' }[d]||'durum-bekliyor';
}

// ÜRETİM MODAL
function _uretimModalAc(kalemId, siparisKodu) {
  const siparis = _tumSiparisler.find(s => s.kod===siparisKodu);
  if (!siparis) return;
  const kalem = siparis.kalemler.find(k => k.id===kalemId);
  if (!kalem) return;
  _uretimKayit = { kalem, siparis };
  document.getElementById('uretimModalInfo').innerHTML =
    `Sipariş: <strong>${siparisKodu}</strong><br>Ürün: <strong>${_esc(kalem.urunAdi)}</strong>${kalem.renkKod?' — '+_esc(kalem.renkKod):''}<br>Sipariş: <strong>${_fmt(kalem.siparisMiktar)} m</strong> | Mevcut Üretim: <strong>${_fmt(kalem.uretimMiktar||0)} m</strong>`;
  document.getElementById('uretimMiktar').value = '';
  document.getElementById('uretimAlisFiyat').value = kalem.alisFiyat||'';
  document.getElementById('uretimAlisKur').value = kalem.alisKur||'';
  document.getElementById('uretimAlisDoviz').value = kalem.alisDoviz || siparis.doviz || 'EUR';
  document.getElementById('uretimHesap').textContent = '';
  document.getElementById('modalUretim').classList.remove('hidden');
  document.getElementById('uretimMiktar').focus();
}

function _uretimHesapla() {
  const m = parseFloat(document.getElementById('uretimMiktar').value)||0;
  const a = parseFloat(document.getElementById('uretimAlisFiyat').value)||0;
  const k = parseFloat(document.getElementById('uretimAlisKur').value)||0;
  const el = document.getElementById('uretimHesap');
  const dovizLabel = document.getElementById('uretimAlisDoviz')?.value || _uretimKayit?.siparis?.doviz || '';
  if (m>0&&a>0&&k>0) {
    const td = m*a, ttl = td*k;
    el.textContent = `${_fmt(m)} m × ${a} ${dovizLabel} = ${_fmt(td)} ${dovizLabel}   →   ${_fmtTl(ttl)}`;
  } else el.textContent='';
}

async function _uretimKaydet() {
  if (!_uretimKayit) return;
  const {kalem, siparis} = _uretimKayit;
  const miktar = parseFloat(document.getElementById('uretimMiktar').value)||0;
  const alis = parseFloat(document.getElementById('uretimAlisFiyat').value)||0;
  const kur = parseFloat(document.getElementById('uretimAlisKur').value)||0;
  if (miktar<=0){toast('Üretim miktarı girilmeli','error');return;}
  if (alis<=0){toast('Alış fiyatı girilmeli','error');return;}
  if (kur<=0){toast('Alış kuru girilmeli','error');return;}
  const alisDoviz = document.getElementById('uretimAlisDoviz')?.value || siparis.doviz || 'EUR';
  const kayit = { id:'UR_'+Date.now(), siparisKodu:siparis.kod, kalemId:kalem.id, miktar, alisFiyat:alis, alisKur:kur, alisDoviz, tarih:new Date().toISOString() };
  const btn = document.getElementById('btnUretimKaydet');
  btn.disabled=true; btn.textContent='Kaydediliyor...';

  // OPTİMİSTİK: Önce hafızada güncelle
  const eskiUretim = kalem.uretimMiktar || 0;
  const eskiAlis = kalem.alisFiyat;
  const eskiKur = kalem.alisKur;
  kalem.uretimMiktar = eskiUretim + miktar;
  kalem.alisFiyat = alis;
  kalem.alisKur = kur;
  kalem.alisDoviz = alisDoviz;
  Cache.kaydet(Cache.KEYS.SIPARISLER, _tumSiparisler);
  document.getElementById('modalUretim').classList.add('hidden');
  toast('Üretim kaydedildi', 'success');
  _listeRender();

  try {
    await API.uretimKaydet(kayit);
  } catch(e) {
    // Geri al
    kalem.uretimMiktar = eskiUretim;
    kalem.alisFiyat = eskiAlis;
    kalem.alisKur = eskiKur;
    Cache.kaydet(Cache.KEYS.SIPARISLER, _tumSiparisler);
    _listeRender();
    toast('Üretim kaydedilemedi: ' + e.message, 'error');
  }
  finally { btn.disabled=false; btn.textContent='Kaydet'; }
}

// SEVK MODAL
function _sevkModalAc(kalemId, siparisKodu) {
  const siparis = _tumSiparisler.find(s => s.kod===siparisKodu);
  if (!siparis) return;
  const kalem = siparis.kalemler.find(k => k.id===kalemId);
  if (!kalem) return;
  if (!(kalem.uretimMiktar>0)){toast('Önce üretim bilgisi girilmeli','error');return;}
  _sevkKayit = { kalem, siparis };
  document.getElementById('sevkModalInfo').innerHTML =
    `Sipariş: <strong>${siparisKodu}</strong><br>Ürün: <strong>${_esc(kalem.urunAdi)}</strong>${kalem.renkKod?' — '+_esc(kalem.renkKod):''}<br>Üretim: <strong>${_fmt(kalem.uretimMiktar)} m</strong> | Mevcut Sevk: <strong>${_fmt(kalem.sevkMiktar||0)} m</strong>`;
  document.getElementById('sevkMiktar').value='';
  document.getElementById('sevkSatisFiyat').value=kalem.satisFiyat||kalem.birimFiyat||'';
  document.getElementById('sevkSatisKur').value=kalem.satisKur||'';
  document.getElementById('sevkSatisDoviz').value = kalem.satisDoviz || siparis.doviz || 'EUR';
  document.getElementById('sevkHesap').textContent='';
  document.getElementById('modalSevk').classList.remove('hidden');
  document.getElementById('sevkMiktar').focus();
}

function _sevkHesapla() {
  const m = parseFloat(document.getElementById('sevkMiktar').value)||0;
  const s = parseFloat(document.getElementById('sevkSatisFiyat').value)||0;
  const k = parseFloat(document.getElementById('sevkSatisKur').value)||0;
  const el = document.getElementById('sevkHesap');
  const dovizLabel2 = document.getElementById('sevkSatisDoviz')?.value || _sevkKayit?.siparis?.doviz || '';
  if (m>0&&s>0&&k>0) {
    const td=m*s, ttl=td*k;
    el.textContent=`${_fmt(m)} m × ${s} ${dovizLabel2} = ${_fmt(td)} ${dovizLabel2}   →   ${_fmtTl(ttl)}`;
  } else el.textContent='';
}

async function _sevkKaydet() {
  if (!_sevkKayit) return;
  const {kalem, siparis} = _sevkKayit;
  const miktar = parseFloat(document.getElementById('sevkMiktar').value)||0;
  const satis = parseFloat(document.getElementById('sevkSatisFiyat').value)||0;
  const kur = parseFloat(document.getElementById('sevkSatisKur').value)||0;
  if (miktar<=0){toast('Sevk miktarı girilmeli','error');return;}
  if (satis<=0){toast('Satış fiyatı girilmeli','error');return;}
  if (kur<=0){toast('Satış kuru girilmeli','error');return;}
  const satisDoviz = document.getElementById('sevkSatisDoviz')?.value || siparis.doviz || 'EUR';
  const kayit = { id:'SK_'+Date.now(), siparisKodu:siparis.kod, kalemId:kalem.id, miktar, satisFiyat:satis, satisKur:kur, satisDoviz, tarih:new Date().toISOString() };
  const btn = document.getElementById('btnSevkKaydet');
  btn.disabled=true; btn.textContent='Kaydediliyor...';

  // OPTİMİSTİK: Önce hafızada güncelle
  const eskiSevk = kalem.sevkMiktar || 0;
  const eskiSatis = kalem.satisFiyat;
  const eskiSatisKur = kalem.satisKur;
  kalem.sevkMiktar = eskiSevk + miktar;
  kalem.satisFiyat = satis;
  kalem.satisKur = kur;
  kalem.satisDoviz = satisDoviz;
  Cache.kaydet(Cache.KEYS.SIPARISLER, _tumSiparisler);
  document.getElementById('modalSevk').classList.add('hidden');
  toast('Sevk kaydedildi', 'success');
  _listeRender();

  try {
    await API.sevkKaydet(kayit);
  } catch(e) {
    // Geri al
    kalem.sevkMiktar = eskiSevk;
    kalem.satisFiyat = eskiSatis;
    kalem.satisKur = eskiSatisKur;
    Cache.kaydet(Cache.KEYS.SIPARISLER, _tumSiparisler);
    _listeRender();
    toast('Sevk kaydedilemedi: ' + e.message, 'error');
  }
  finally { btn.disabled=false; btn.textContent='Kaydet'; }
}

async function _siparisKapat(kod) {
  if (!confirm(kod + ' siparişini kapatmak istediğinize emin misiniz?')) return;
  const s = _tumSiparisler.find(x => x.kod === kod);
  if (s) { s.durum = 'kapali'; Cache.kaydet(Cache.KEYS.SIPARISLER, _tumSiparisler); _listeRender(); toast(kod+' kapatıldı','info'); }
  try { await API.siparisKapat(kod); }
  catch(e) { if(s){s.durum='bekliyor';Cache.kaydet(Cache.KEYS.SIPARISLER,_tumSiparisler);_listeRender();} toast('Hata: '+e.message,'error'); }
}

async function _siparisAc(kod) {
  if (!confirm(kod + ' siparişini yeniden açmak istediğinize emin misiniz?')) return;
  const s = _tumSiparisler.find(x => x.kod === kod);
  if (s) { s.durum = 'bekliyor'; Cache.kaydet(Cache.KEYS.SIPARISLER, _tumSiparisler); _listeRender(); toast(kod+' yeniden açıldı','success'); }
  try { await API.siparisAc(kod); }
  catch(e) { if(s){s.durum='kapali';Cache.kaydet(Cache.KEYS.SIPARISLER,_tumSiparisler);_listeRender();} toast('Hata: '+e.message,'error'); }
}

// ============================================================
// OLAY DİNLEYİCİLER
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Navigasyon
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.getElementById('page-'+item.dataset.page)?.classList.add('active');
      item.classList.add('active');
    });
  });

  // Form
  document.getElementById('btnYeniSiparis')?.addEventListener('click', _formuAc);
  document.getElementById('btnFormuKapat')?.addEventListener('click', _formuKapat);
  document.getElementById('btnIptal')?.addEventListener('click', _formuKapat);
  document.getElementById('btnUrunEkle')?.addEventListener('click', _urunSatiriEkle);
  document.getElementById('btnSiparisKaydet')?.addEventListener('click', _siparisKaydet);
  document.getElementById('sipDoviz')?.addEventListener('change', _formToplamHesapla);

  document.getElementById('urunListesi')?.addEventListener('click', e => {
    const btn = e.target.closest('.btn-sil-urun');
    if (btn) _urunSatiriSil(btn.dataset.id);
  });

  // Arama / filtre
  document.getElementById('sipArama')?.addEventListener('input', _listeRender);
  document.getElementById('sipDurumFiltre')?.addEventListener('change', _listeRender);

  // Sipariş listesi delegation
  document.getElementById('siparisListesi')?.addEventListener('click', e => {
    const uBtn = e.target.closest('.btn-uretim:not(:disabled)');
    if (uBtn) { _uretimModalAc(uBtn.dataset.kalemId, uBtn.dataset.siparisKod); return; }
    const sBtn = e.target.closest('.btn-sevk:not(:disabled)');
    if (sBtn) { _sevkModalAc(sBtn.dataset.kalemId, sBtn.dataset.siparisKod); return; }
    const kBtn = e.target.closest('.btn-siparis-kapat');
    if (kBtn) { _siparisKapat(kBtn.dataset.kod); return; }
  });

  // Tamamlananlar listesi delegation
  document.getElementById('tamamlananListesi')?.addEventListener('click', e => {
    const aBtn = e.target.closest('.btn-siparis-ac');
    if (aBtn) { _siparisAc(aBtn.dataset.kod); return; }
  });

  // Tamamlananlar arama
  document.getElementById('tamArama')?.addEventListener('input', _tamamlananListeRender);

  // Üretim modal
  document.getElementById('btnUretimModalKapat')?.addEventListener('click', () => document.getElementById('modalUretim').classList.add('hidden'));
  document.getElementById('btnUretimIptal')?.addEventListener('click', () => document.getElementById('modalUretim').classList.add('hidden'));
  document.getElementById('btnUretimKaydet')?.addEventListener('click', _uretimKaydet);
  ['uretimMiktar','uretimAlisFiyat','uretimAlisKur'].forEach(id => document.getElementById(id)?.addEventListener('input', _uretimHesapla));
  document.getElementById('uretimAlisDoviz')?.addEventListener('change', _uretimHesapla);
  document.getElementById('modalUretim')?.addEventListener('click', e => { if(e.target===e.currentTarget) e.currentTarget.classList.add('hidden'); });

  // Sevk modal
  document.getElementById('btnSevkModalKapat')?.addEventListener('click', () => document.getElementById('modalSevk').classList.add('hidden'));
  document.getElementById('btnSevkIptal')?.addEventListener('click', () => document.getElementById('modalSevk').classList.add('hidden'));
  document.getElementById('btnSevkKaydet')?.addEventListener('click', _sevkKaydet);
  ['sevkMiktar','sevkSatisFiyat','sevkSatisKur'].forEach(id => document.getElementById(id)?.addEventListener('input', _sevkHesapla));
  document.getElementById('sevkSatisDoviz')?.addEventListener('change', _sevkHesapla);
  document.getElementById('modalSevk')?.addEventListener('click', e => { if(e.target===e.currentTarget) e.currentTarget.classList.add('hidden'); });

  // İlk yükleme
  _bugunuAyarla();
  _urunSatiriEkle();
  await API.testBaglanti();
  await _siparisleriYukle();
  // Kâr payı açılınca yüklensin, başlangıçta yükleme
  // await _kpYukle();

  // Kar payı butonları
  document.getElementById('btnGiderEkle')?.addEventListener('click', () => {
    document.getElementById('giderTarih').value = new Date().toISOString().split('T')[0];
    document.getElementById('giderTutar').value = '';
    document.getElementById('giderAciklama').value = '';
    document.getElementById('giderDoviz').value = 'TL';
    document.getElementById('modalGider').classList.remove('hidden');
    document.getElementById('giderAciklama').focus();
  });
  document.getElementById('btnOdemeEkle')?.addEventListener('click', () => {
    document.getElementById('odemeTarih').value = new Date().toISOString().split('T')[0];
    document.getElementById('odemeTutar').value = '';
    document.getElementById('odemeNot').value = '';
    document.getElementById('modalOdeme').classList.remove('hidden');
    document.getElementById('odemeTutar').focus();
  });
  document.getElementById('btnGiderModalKapat')?.addEventListener('click', () => document.getElementById('modalGider').classList.add('hidden'));
  document.getElementById('btnGiderIptal')?.addEventListener('click', () => document.getElementById('modalGider').classList.add('hidden'));
  document.getElementById('modalGider')?.addEventListener('click', e => { if(e.target===e.currentTarget) e.currentTarget.classList.add('hidden'); });
  document.getElementById('btnOdemeModalKapat')?.addEventListener('click', () => document.getElementById('modalOdeme').classList.add('hidden'));
  document.getElementById('btnOdemeIptal')?.addEventListener('click', () => document.getElementById('modalOdeme').classList.add('hidden'));
  document.getElementById('modalOdeme')?.addEventListener('click', e => { if(e.target===e.currentTarget) e.currentTarget.classList.add('hidden'); });
  document.getElementById('btnGiderKaydet')?.addEventListener('click', _giderKaydet);
  document.getElementById('btnOdemeKaydet')?.addEventListener('click', _odemeKaydet);
  document.getElementById('btnKpRapor')?.addEventListener('click', _kpRaporYazdir);

  // Gider/ödeme akordion + silme - event delegation
  document.getElementById('kpGiderListesi')?.addEventListener('click', e => {
    const silBtn = e.target.closest('.btn-sil-kucuk');
    if (silBtn) { _giderSil(silBtn.dataset.id); return; }
    const header = e.target.closest('.kp-satir-header');
    if (header) header.closest('.kp-satir').classList.toggle('open');
  });
  document.getElementById('kpOdemeListesi')?.addEventListener('click', e => {
    const silBtn = e.target.closest('.btn-sil-kucuk');
    if (silBtn) { _odemeSil(silBtn.dataset.id); return; }
    const header = e.target.closest('.kp-satir-header');
    if (header) header.closest('.kp-satir').classList.toggle('open');
  });

  // Kâr payı sayfası açılınca yükle
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.dataset.page === 'karpay') item.addEventListener('click', _kpYukle);
    if (item.dataset.page === 'uretimler') item.addEventListener('click', _uretimlerRender);
    if (item.dataset.page === 'sevk') item.addEventListener('click', _sevkRender);
    if (item.dataset.page === 'cari') item.addEventListener('click', _cariYukle);
  });

  // Tahsilat modal
  document.getElementById('btnTahsilatModalKapat')?.addEventListener('click', () => document.getElementById('modalTahsilat').classList.add('hidden'));
  document.getElementById('btnTahsilatIptal')?.addEventListener('click', () => document.getElementById('modalTahsilat').classList.add('hidden'));
  document.getElementById('modalTahsilat')?.addEventListener('click', e => { if(e.target===e.currentTarget) e.currentTarget.classList.add('hidden'); });
  document.getElementById('btnTahsilatKaydet')?.addEventListener('click', _tahsilatKaydet);

  // Tamamlananlar sayfası - Yeniden Aç delegation
  document.getElementById('tamamlananListesi')?.addEventListener('click', e => {
    const aBtn = e.target.closest('.btn-siparis-ac');
    if (aBtn) _siparisAc(aBtn.dataset.kod);
  });

  // Yedek Al
  document.getElementById('btnYedekAl')?.addEventListener('click', _yedekAl);
});

// ============================================================
// ÜRETİMLER SAYFASI
// ============================================================

function _uretimlerRender() {
  const container = document.getElementById('uretimlerListesi');
  if (!container) return;

  const liste = (_tumSiparisler || []).filter(s =>
    s.kalemler && s.kalemler.some(k => (k.uretimMiktar || 0) > 0)
  );

  if (!_tumSiparisler || _tumSiparisler.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚙</div><p>Henüz üretim kaydı yok</p><span>Siparişler sayfasından üretim bilgisi girin</span></div>`;
    return;
  }

  container.innerHTML = '';
  liste.forEach(s => {
    const kart = document.createElement('div');
    kart.className = 'siparis-card';
    kart.style.marginBottom = '10px';

    const toplamSiparis = s.kalemler.reduce((t, k) => t + (Number(k.siparisMiktar)||0), 0);
    const toplamUretim = s.kalemler.reduce((t, k) => t + (Number(k.uretimMiktar)||0), 0);
    const toplamFark = toplamUretim - toplamSiparis;
    const farkRenk = toplamFark === 0 ? 'var(--text-muted)' : toplamFark > 0 ? 'var(--color-success)' : 'var(--color-danger)';
    const farkStr = toplamFark === 0 ? '±0' : toplamFark > 0 ? `+${_fmt(toplamFark)}` : _fmt(toplamFark);

    kart.innerHTML = `
      <div class="siparis-card-header">
        <span class="sip-kod">${s.kod}</span>
        <span class="sip-musteri">${_esc(s.musteriAdi)}</span>
        <span class="sip-marka">${_esc(s.marka)}</span>
        <span style="font-size:11px;color:var(--text-muted);margin-left:auto;">${_fmtTarih(s.tarih)} · ${s.doviz}</span>
        <button class="btn btn-sm btn-ghost" style="font-size:11px;" onclick="_uretimFisiYazdir('${s.kod}')">🖨 Üretim Fişi</button>
        <span class="sip-chevron">▼</span>
      </div>
      <div class="siparis-card-body">
        <table class="kalem-table">
          <thead><tr>
            <th>Ürün</th><th>Renk / Kod</th>
            <th style="text-align:right">Sipariş (M)</th>
            <th style="text-align:right">Üretim (M)</th>
            <th style="text-align:right">Fark (M)</th>
            <th style="text-align:right">Alış Fiyatı</th>
            <th style="text-align:right">Kur (TL)</th>
            <th style="text-align:right">Toplam Döviz</th>
            <th style="text-align:right">Toplam TL</th>
          </tr></thead>
          <tbody>
            ${s.kalemler.map(k => {
              const fark = (Number(k.uretimMiktar)||0) - (Number(k.siparisMiktar)||0);
              const fc = fark===0?'kalem-fark-sifir':fark>0?'kalem-fark-pos':'kalem-fark-neg';
              const fs = fark===0?'+0':fark>0?`+${_fmt(fark)}`:_fmt(fark);
              const toplamDoviz = (Number(k.alisFiyat)||0) * (Number(k.uretimMiktar)||0);
              const toplamTl = toplamDoviz * (Number(k.alisKur)||0);
              return `<tr>
                <td class="kalem-urun-adi">${_esc(k.urunAdi)}</td>
                <td><span class="kalem-renk">${_esc(k.renkKod||'—')}</span></td>
                <td class="kalem-sayi">${_fmt(k.siparisMiktar)}</td>
                <td class="kalem-sayi" style="font-weight:600;">${_fmt(k.uretimMiktar||0)}</td>
                <td class="kalem-sayi ${fc}">${fs}</td>
                <td class="kalem-sayi">${k.alisFiyat ? _fmt(k.alisFiyat)+' '+s.doviz : '—'}</td>
                <td class="kalem-sayi">${k.alisKur ? _fmtTl(k.alisKur) : '—'}</td>
                <td class="kalem-sayi">${toplamDoviz>0?_fmt(toplamDoviz)+' '+s.doviz:'—'}</td>
                <td class="kalem-sayi">${toplamTl>0?_fmtTl(toplamTl):'—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;

    kart.querySelector('.siparis-card-header').addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      kart.classList.toggle('open');
    });

    container.appendChild(kart);
  });
}

function _uretimFisiYazdir(siparisKodu) {
  const s = (_tumSiparisler || []).find(x => x.kod === siparisKodu);
  if (!s) return;

  const satirlar = s.kalemler.map(k => {
    const fark = (Number(k.uretimMiktar)||0) - (Number(k.siparisMiktar)||0);
    const farkStr = fark===0?'+0':fark>0?`+${_fmt(fark)}`:_fmt(fark);
    const toplamDoviz = (Number(k.alisFiyat)||0) * (Number(k.uretimMiktar)||0);
    const toplamTl = toplamDoviz * (Number(k.alisKur)||0);
    return `${(k.urunAdi||'').substring(0,16).padEnd(17)}${(k.renkKod||'').substring(0,10).padEnd(11)}${_fmt(k.siparisMiktar).padEnd(9)}${_fmt(k.uretimMiktar||0).padEnd(9)}${farkStr.padEnd(8)}${_fmtTl(toplamTl)}`;
  }).join('\n');

  const toplamSiparis = s.kalemler.reduce((t,k) => t+(Number(k.siparisMiktar)||0), 0);
  const toplamUretim = s.kalemler.reduce((t,k) => t+(Number(k.uretimMiktar)||0), 0);
  const toplamFark = toplamUretim - toplamSiparis;

  const icerik = `URETiM FiSi
${'='.repeat(60)}
Siparis Kodu : ${s.kod}
Musteri      : ${s.musteriAdi}
Marka        : ${s.marka}
Tarih        : ${_fmtTarih(s.tarih)}
Doviz        : ${s.doviz}
${'='.repeat(60)}

${'URUN'.padEnd(17)}${'RENK/KOD'.padEnd(11)}${'SiP(M)'.padEnd(9)}${'URE(M)'.padEnd(9)}${'FARK'.padEnd(8)}${'TOPLAM TL'}
${'-'.repeat(60)}
${satirlar}
${'-'.repeat(60)}
${'TOPLAM'.padEnd(17)}${''.padEnd(11)}${_fmt(toplamSiparis).padEnd(9)}${_fmt(toplamUretim).padEnd(9)}${(toplamFark>=0?'+':'')+_fmt(toplamFark)}

${'='.repeat(60)}
SAKA TAKiP - Sistem Ciktisi
${'='.repeat(60)}`;

  const w = window.open('','_blank','width=700,height=600');
  w.document.write(`<!DOCTYPE html><html><head><title>Uretim Fisi - ${s.kod}</title>
    <style>body{font-family:'Courier New',monospace;font-size:12px;padding:30px;white-space:pre;line-height:1.6;}@media print{body{padding:10px;}@page{margin:1cm;}}</style>
    </head><body>${icerik}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

// ============================================================
// SATIŞ / SEVK SAYFASI
// ============================================================

function _sevkRender() {
  const container = document.getElementById('sevkListesi');
  if (!container) return;

  const liste = (_tumSiparisler || []).filter(s =>
    s.kalemler && s.kalemler.some(k => (k.sevkMiktar || 0) > 0)
  );

  if (liste.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⇗</div><p>Henüz sevk kaydı yok</p><span>Siparişler sayfasından sevk bilgisi girin</span></div>`;
    return;
  }

  container.innerHTML = '';
  liste.forEach(s => {
    const kart = document.createElement('div');
    kart.className = 'siparis-card';
    kart.style.marginBottom = '10px';

    kart.innerHTML = `
      <div class="siparis-card-header">
        <span class="sip-kod">${s.kod}</span>
        <span class="sip-musteri">${_esc(s.musteriAdi)}</span>
        <span class="sip-marka">${_esc(s.marka)}</span>
        <span style="font-size:11px;color:var(--text-muted);margin-left:auto;">${_fmtTarih(s.tarih)} · ${s.doviz}</span>
        <button class="btn btn-sm btn-ghost" style="font-size:11px;" onclick="_sevkFisiYazdir('${s.kod}')">🖨 Sevk Fişi</button>
        <span class="sip-chevron">▼</span>
      </div>
      <div class="siparis-card-body">
        <table class="kalem-table">
          <thead><tr>
            <th>Ürün</th><th>Renk / Kod</th>
            <th style="text-align:right">Üretim (M)</th>
            <th style="text-align:right">Sevk (M)</th>
            <th style="text-align:right">Fark (M)</th>
            <th style="text-align:right">Satış Fiyatı</th>
            <th style="text-align:right">Kur (TL)</th>
            <th style="text-align:right">Toplam Döviz</th>
            <th style="text-align:right">Toplam TL</th>
          </tr></thead>
          <tbody>
            ${s.kalemler.map(k => {
              const fark = (Number(k.sevkMiktar)||0) - (Number(k.uretimMiktar)||0);
              const fc = fark===0?'kalem-fark-sifir':fark>0?'kalem-fark-pos':'kalem-fark-neg';
              const fs = fark===0?'+0':fark>0?`+${_fmt(fark)}`:_fmt(fark);
              const toplamDoviz = (Number(k.satisFiyat)||0) * (Number(k.sevkMiktar)||0);
              const toplamTl = toplamDoviz * (Number(k.satisKur)||0);
              return `<tr>
                <td class="kalem-urun-adi">${_esc(k.urunAdi)}</td>
                <td><span class="kalem-renk">${_esc(k.renkKod||'—')}</span></td>
                <td class="kalem-sayi">${_fmt(k.uretimMiktar||0)}</td>
                <td class="kalem-sayi" style="font-weight:600;">${_fmt(k.sevkMiktar||0)}</td>
                <td class="kalem-sayi ${fc}">${fs}</td>
                <td class="kalem-sayi">${k.satisFiyat ? _fmt(k.satisFiyat)+' '+s.doviz : '—'}</td>
                <td class="kalem-sayi">${k.satisKur ? _fmtTl(k.satisKur) : '—'}</td>
                <td class="kalem-sayi">${toplamDoviz>0?_fmt(toplamDoviz)+' '+s.doviz:'—'}</td>
                <td class="kalem-sayi">${toplamTl>0?_fmtTl(toplamTl):'—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;

    kart.querySelector('.siparis-card-header').addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      kart.classList.toggle('open');
    });

    container.appendChild(kart);
  });
}

function _sevkFisiYazdir(siparisKodu) {
  const s = (_tumSiparisler || []).find(x => x.kod === siparisKodu);
  if (!s) return;

  const satirlar = s.kalemler.map(k => {
    const fark = (Number(k.sevkMiktar)||0) - (Number(k.uretimMiktar)||0);
    const farkStr = fark===0?'+0':fark>0?`+${_fmt(fark)}`:_fmt(fark);
    const toplamDoviz = (Number(k.satisFiyat)||0) * (Number(k.sevkMiktar)||0);
    const toplamTl = toplamDoviz * (Number(k.satisKur)||0);
    return `${(k.urunAdi||'').substring(0,16).padEnd(17)}${(k.renkKod||'').substring(0,10).padEnd(11)}${_fmt(k.uretimMiktar||0).padEnd(9)}${_fmt(k.sevkMiktar||0).padEnd(9)}${farkStr.padEnd(8)}${_fmtTl(toplamTl)}`;
  }).join('\n');

  const toplamUretim = s.kalemler.reduce((t,k) => t+(Number(k.uretimMiktar)||0), 0);
  const toplamSevk = s.kalemler.reduce((t,k) => t+(Number(k.sevkMiktar)||0), 0);
  const toplamTutar = s.kalemler.reduce((t,k) => t+((Number(k.satisFiyat)||0)*(Number(k.sevkMiktar)||0)*(Number(k.satisKur)||0)), 0);

  const icerik = `SEVK FiSi
${'='.repeat(60)}
Siparis Kodu : ${s.kod}
Musteri      : ${s.musteriAdi}
Marka        : ${s.marka}
Tarih        : ${_fmtTarih(s.tarih)}
Doviz        : ${s.doviz}
${'='.repeat(60)}

${'URUN'.padEnd(17)}${'RENK/KOD'.padEnd(11)}${'URE(M)'.padEnd(9)}${'SEVK(M)'.padEnd(9)}${'FARK'.padEnd(8)}${'TOPLAM TL'}
${'-'.repeat(60)}
${satirlar}
${'-'.repeat(60)}
${'TOPLAM'.padEnd(17)}${''.padEnd(11)}${_fmt(toplamUretim).padEnd(9)}${_fmt(toplamSevk).padEnd(9)}${''.padEnd(8)}${_fmtTl(toplamTutar)}

${'='.repeat(60)}
SAKA TAKiP - Sistem Ciktisi
${'='.repeat(60)}`;

  const w = window.open('','_blank','width=700,height=600');
  w.document.write(`<!DOCTYPE html><html><head><title>Sevk Fisi - ${s.kod}</title>
    <style>body{font-family:'Courier New',monospace;font-size:12px;padding:30px;white-space:pre;line-height:1.6;}@media print{body{padding:10px;}@page{margin:1cm;}}</style>
    </head><body>${icerik}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}



let _kpGiderler = [];
let _kpOdemeler = [];

async function _kpYukle() {
  const tbody = document.getElementById('kpKarBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="11" class="loading-row"><span class="spinner"></span> Yükleniyor...</td></tr>';
  try {
    const [giderler, odemeler] = await Promise.all([
      API.giderleriGetir(),
      API.odemeleriGetir(),
    ]);
    _kpGiderler = giderler || [];
    _kpOdemeler = odemeler || [];
    _kpHesapla();
    _kpGiderListeRender();
    _kpOdemeListeRender();
  } catch(e) {
    toast('Kâr payı yüklenemedi: ' + e.message, 'error');
    if (tbody) tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:20px;color:var(--color-danger);font-size:12px;">Yükleme hatası</td></tr>';
  }
}

function _kpHesapla() {
  let toplamSatis = 0, toplamMaliyet = 0, satirlar = [];

  (_tumSiparisler || []).forEach(s => {
    let sipToplam = 0, maliyetToplam = 0, sipMiktar = 0, uretimMiktar = 0;
    (s.kalemler || []).forEach(k => {
      const sevk = Number(k.sevkMiktar)||0;
      const uretim = Number(k.uretimMiktar)||0;
      sipToplam += sevk * (Number(k.satisFiyat)||0) * (Number(k.satisKur)||0);
      maliyetToplam += uretim * (Number(k.alisFiyat)||0) * (Number(k.alisKur)||0);
      sipMiktar += Number(k.siparisMiktar)||0;
      uretimMiktar += uretim;
    });
    toplamSatis += sipToplam;
    toplamMaliyet += maliyetToplam;
    const brutKar = sipToplam - maliyetToplam;
    satirlar.push({ s, sipMiktar, uretimMiktar, fark: uretimMiktar-sipMiktar, sipToplam, maliyetToplam, brutKar, benimPayim: brutKar*0.5, sirketPayi: brutKar*0.5 });
  });

  const brutKar = toplamSatis - toplamMaliyet;
  const benimPayim = brutKar * 0.5;
  const toplamGider = _kpGiderler.reduce((t,g) => t+(Number(g.tutarTl)||Number(g.tutar)||0), 0);
  const giderPayim = toplamGider * 0.5;
  const netAlacak = benimPayim - giderPayim;
  const alinanToplam = _kpOdemeler.reduce((t,o) => t+(Number(o.tutar)||0), 0);
  const kalanAlacak = netAlacak - alinanToplam;

  document.getElementById('kpToplam').textContent = _fmtTl(toplamSatis);
  document.getElementById('kpMaliyet').textContent = _fmtTl(toplamMaliyet);
  document.getElementById('kpBrutKar').textContent = _fmtTl(brutKar);
  document.getElementById('kpBenimPayim').textContent = _fmtTl(benimPayim);
  document.getElementById('kpGiderPayim').textContent = _fmtTl(giderPayim);
  document.getElementById('kpNetAlacak').textContent = _fmtTl(netAlacak);
  document.getElementById('kpAlinan').textContent = _fmtTl(alinanToplam);
  document.getElementById('kpKalan').textContent = _fmtTl(kalanAlacak);

  const tbody = document.getElementById('kpKarBody');
  if (!tbody) return;
  if (satirlar.length === 0) { tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">Henüz sipariş yok</td></tr>'; return; }
  tbody.innerHTML = satirlar.map(({s, sipMiktar, uretimMiktar, fark, sipToplam, maliyetToplam, brutKar, benimPayim, sirketPayi}) => {
    const fc = fark===0?'kalem-fark-sifir':fark>0?'kalem-fark-pos':'kalem-fark-neg';
    const fs = fark===0?'+0':fark>0?'+'+_fmt(fark):_fmt(fark);
    return `<tr>
      <td style="font-size:11px;">${_fmtTarih(s.tarih)}</td>
      <td style="font-weight:600;font-size:12px;">${_esc(s.musteriAdi)}</td>
      <td><span class="sip-kod" style="font-size:10px;">${s.kod}</span></td>
      <td class="kalem-sayi">${_fmt(sipMiktar)}</td>
      <td class="kalem-sayi" style="font-weight:600;">${_fmt(uretimMiktar)}</td>
      <td class="kalem-sayi ${fc}">${fs}</td>
      <td class="kalem-sayi" style="color:var(--color-success);">${_fmtTl(sipToplam)}</td>
      <td class="kalem-sayi" style="color:var(--color-danger);">${_fmtTl(maliyetToplam)}</td>
      <td class="kalem-sayi" style="font-weight:600;">${_fmtTl(brutKar)}</td>
      <td class="kalem-sayi" style="color:var(--color-primary);font-weight:600;">${_fmtTl(benimPayim)}</td>
      <td class="kalem-sayi">${_fmtTl(sirketPayi)}</td>
    </tr>`;
  }).join('');
}

function _kpGiderListeRender() {
  const el = document.getElementById('kpGiderListesi');
  const toplamEl = document.getElementById('kpGiderToplam');
  if (!el) return;
  const toplam = _kpGiderler.reduce((t,g) => t+(Number(g.tutarTl)||Number(g.tutar)||0), 0);
  if (toplamEl) toplamEl.textContent = toplam > 0 ? 'Toplam: '+_fmtTl(toplam) : '';
  if (_kpGiderler.length === 0) {
    el.innerHTML = '<div class="empty-state" style="padding:24px 0;background:var(--bg-white);border:1px solid var(--border);border-radius:var(--radius-lg);"><span style="font-size:12px;">Henüz gider yok</span></div>';
    return;
  }
  el.innerHTML = _kpGiderler.map(g => {
    const tutar = Number(g.tutarTl)||Number(g.tutar)||0;
    return `<div class="kp-satir">
      <div class="kp-satir-header">
        <span class="kp-satir-tarih">${_fmtTarih(g.tarih)}</span>
        <span class="kp-satir-aciklama">${_esc(g.aciklama)}</span>
        <span style="font-size:10px;color:var(--text-muted);background:var(--bg-main);padding:2px 6px;border-radius:4px;flex-shrink:0;">${g.doviz||'TL'}</span>
        <span class="kp-satir-tutar" style="color:var(--color-danger);">${_fmtTl(tutar)}</span>
        <span class="kp-satir-chevron">▼</span>
      </div>
      <div class="kp-satir-body">
        <span>Payım (%50): <strong style="color:var(--color-danger);">${_fmtTl(tutar*0.5)}</strong></span>
        <button class="btn-sil-kucuk" data-id="${g.id}">✕ Sil</button>
      </div>
    </div>`;
  }).join('');
}

function _kpOdemeListeRender() {
  const el = document.getElementById('kpOdemeListesi');
  const toplamEl = document.getElementById('kpOdemeToplam');
  if (!el) return;
  const toplam = _kpOdemeler.reduce((t,o) => t+(Number(o.tutar)||0), 0);
  if (toplamEl) toplamEl.textContent = toplam > 0 ? 'Toplam: '+_fmtTl(toplam) : '';
  if (_kpOdemeler.length === 0) {
    el.innerHTML = '<div class="empty-state" style="padding:24px 0;background:var(--bg-white);border:1px solid var(--border);border-radius:var(--radius-lg);"><span style="font-size:12px;">Henüz ödeme kaydı yok</span></div>';
    return;
  }
  el.innerHTML = _kpOdemeler.map(o => `
    <div class="kp-satir">
      <div class="kp-satir-header">
        <span class="kp-satir-tarih">${_fmtTarih(o.tarih)}</span>
        <span class="kp-satir-aciklama">${_esc(o.not||'Ödeme alındı')}</span>
        <span class="kp-satir-tutar" style="color:var(--color-success);">+${_fmtTl(Number(o.tutar)||0)}</span>
        <span class="kp-satir-chevron">▼</span>
      </div>
      <div class="kp-satir-body">
        <span>Tutar: <strong style="color:var(--color-success);">${_fmtTl(Number(o.tutar)||0)}</strong></span>
        <button class="btn-sil-kucuk" data-id="${o.id}">✕ Sil</button>
      </div>
    </div>`).join('');
}

async function _giderKaydet() {
  const tarih = document.getElementById('giderTarih').value;
  const tutar = parseFloat(document.getElementById('giderTutar').value)||0;
  const aciklama = document.getElementById('giderAciklama').value.trim();
  const doviz = document.getElementById('giderDoviz').value;
  if (!tarih||tutar<=0||!aciklama) { toast('Tüm alanları doldurun','error'); return; }
  const btn = document.getElementById('btnGiderKaydet');
  btn.disabled=true; btn.textContent='Kaydediliyor...';
  try {
    await API.giderKaydet({ id:'GD_'+Date.now(), tarih, aciklama, tutar, doviz, kur:1, tutarTl:tutar });
    document.getElementById('modalGider').classList.add('hidden');
    toast('Gider kaydedildi','success');
    await _kpYukle();
  } catch(e) { toast('Hata: '+e.message,'error'); }
  finally { btn.disabled=false; btn.textContent='Kaydet'; }
}

async function _odemeKaydet() {
  const tarih = document.getElementById('odemeTarih').value;
  const tutar = parseFloat(document.getElementById('odemeTutar').value)||0;
  const not = document.getElementById('odemeNot').value.trim();
  if (!tarih||tutar<=0) { toast('Tarih ve tutar zorunlu','error'); return; }
  const btn = document.getElementById('btnOdemeKaydet');
  btn.disabled=true; btn.textContent='Kaydediliyor...';
  try {
    await API.odemeKaydet({ id:'OD_'+Date.now(), tarih, tutar, not, aciklama:'Ödeme alındı' });
    document.getElementById('modalOdeme').classList.add('hidden');
    toast('Ödeme kaydedildi','success');
    await _kpYukle();
  } catch(e) { toast('Hata: '+e.message,'error'); }
  finally { btn.disabled=false; btn.textContent='Kaydet'; }
}

async function _giderSil(id) {
  if (!confirm('Bu gideri silmek istediğinize emin misiniz?')) return;
  try {
    await API.giderSil(id);
    toast('Gider silindi','info');
    await _kpYukle();
  } catch(e) { toast('Hata: '+e.message,'error'); }
}

async function _odemeSil(id) {
  if (!confirm('Bu ödemeyi silmek istediğinize emin misiniz?')) return;
  try {
    await API.odemeSil(id);
    toast('Ödeme silindi','info');
    await _kpYukle();
  } catch(e) { toast('Hata: '+e.message,'error'); }
}

function _kpRaporYazdir() {
  const bugun = new Date().toLocaleDateString('tr-TR');
  const satirlar = Array.from(document.querySelectorAll('#kpKarBody tr')).map(tr => {
    const td = tr.querySelectorAll('td');
    if (td.length < 11) return '';
    return (td[0].textContent.trim()).padEnd(12) +
           (td[1].textContent.trim()).padEnd(16) +
           (td[2].textContent.trim()).padEnd(14) +
           (td[6].textContent.trim()).padEnd(14) +
           (td[7].textContent.trim()).padEnd(14) +
           (td[9].textContent.trim());
  }).filter(Boolean).join('\n');

  const rapor = `SAKA TAKiP - KAR PAYI RAPORU
${'='.repeat(60)}
Rapor Tarihi : ${bugun}
${'='.repeat(60)}

OZET
${'-'.repeat(40)}
Toplam Satis/Teslimat : ${document.getElementById('kpToplam').textContent}
Toplam Maliyet        : ${document.getElementById('kpMaliyet').textContent}
Brut Kar              : ${document.getElementById('kpBrutKar').textContent}
Benim Payim (%50)     : ${document.getElementById('kpBenimPayim').textContent}
Gider Payim (%50)     : ${document.getElementById('kpGiderPayim').textContent}
Net Alacagim          : ${document.getElementById('kpNetAlacak').textContent}
Alinan Toplam         : ${document.getElementById('kpAlinan').textContent}
KALAN ALACAGIM        : ${document.getElementById('kpKalan').textContent}

SIPARIS BAZINDA KAR
${'-'.repeat(60)}
${'TARiH'.padEnd(12)}${'MUSTERi'.padEnd(16)}${'KOD'.padEnd(14)}${'SATiS TL'.padEnd(14)}${'MALiYET'.padEnd(14)}${'BENiM PAYIM'}
${'-'.repeat(84)}
${satirlar || '(Siparis bulunamadi)'}

GiDERLER
${'-'.repeat(40)}
${_kpGiderler.map(g=>`${_fmtTarih(g.tarih).padEnd(12)}${g.aciklama.substring(0,20).padEnd(22)}${_fmtTl(Number(g.tutarTl)||Number(g.tutar)||0)}`).join('\n')||'(Gider bulunamadi)'}

ALINAN ODEMELER
${'-'.repeat(40)}
${_kpOdemeler.map(o=>`${_fmtTarih(o.tarih).padEnd(12)}${(o.not||'Odeme alindi').substring(0,20).padEnd(22)}${_fmtTl(Number(o.tutar)||0)}`).join('\n')||'(Odeme bulunamadi)'}

${'='.repeat(60)}
SAKA TAKiP - Sistem Ciktisi
${'='.repeat(60)}`;

  const w = window.open('','_blank','width=750,height=700');
  w.document.write(`<!DOCTYPE html><html><head><title>Kar Payi Raporu - ${bugun}</title>
    <style>
      body { font-family: 'Courier New', monospace; font-size: 12px; padding: 30px; background: #fff; color: #000; white-space: pre; line-height: 1.6; }
      @media print { body { padding: 10px; font-size: 11px; } @page { margin: 1cm; } }
    </style></head>
    <body>${rapor.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
}

// ============================================================
// MÜŞTERİ CARİSİ
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
    (tahsilatlar || []).forEach(t => {
      if (!_cariTahsilatlar[t.musteriAdi]) _cariTahsilatlar[t.musteriAdi] = [];
      _cariTahsilatlar[t.musteriAdi].push(t);
    });
    _cariRender();
  } catch(e) {
    toast('Cari yüklenemedi: ' + e.message, 'error');
    container.innerHTML = '<div class="empty-state"><span style="font-size:12px;color:var(--color-danger);">Yükleme hatası</span></div>';
  }
}

function _cariRender() {
  const container = document.getElementById('cariListesi');
  if (!container) return;

  // Müşterileri siparişlerden grupla
  const musteriMap = {};
  (_tumSiparisler || []).forEach(s => {
    const m = s.musteriAdi;
    if (!musteriMap[m]) musteriMap[m] = { siparisler: [], toplam: 0, tahsilatToplam: 0 };
    const sevkToplam = (s.kalemler||[]).reduce((t,k) =>
      t + (Number(k.sevkMiktar)||0)*(Number(k.satisFiyat)||0)*(Number(k.satisKur)||0), 0);
    musteriMap[m].siparisler.push({ ...s, sevkToplam });
    musteriMap[m].toplam += sevkToplam;
  });

  // Tahsilatları ekle
  Object.keys(_cariTahsilatlar).forEach(m => {
    if (!musteriMap[m]) musteriMap[m] = { siparisler: [], toplam: 0, tahsilatToplam: 0 };
    musteriMap[m].tahsilatToplam = (_cariTahsilatlar[m]||[]).reduce((t,x) => t+(Number(x.tutar)||0), 0);
  });
  Object.keys(musteriMap).forEach(m => {
    if (!musteriMap[m].tahsilatToplam) {
      musteriMap[m].tahsilatToplam = (_cariTahsilatlar[m]||[]).reduce((t,x) => t+(Number(x.tutar)||0), 0);
    }
  });

  const musteriler = Object.keys(musteriMap).sort();
  if (musteriler.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">◎</div><p>Henüz müşteri yok</p></div>';
    return;
  }

  container.innerHTML = '';
  musteriler.forEach(m => {
    const { siparisler, toplam, tahsilatToplam } = musteriMap[m];
    const bakiye = toplam - tahsilatToplam;
    const tahsilatListesi = (_cariTahsilatlar[m] || []);

    const kart = document.createElement('div');
    kart.className = 'siparis-card';
    kart.style.marginBottom = '10px';

    const sipSatirlari = siparisler.map(s => `
      <tr>
        <td style="font-size:11px;">${_fmtTarih(s.tarih)}</td>
        <td><span class="sip-kod" style="font-size:10px;">${s.kod}</span></td>
        <td style="font-size:11px;">${_esc(s.marka)}</td>
        <td style="font-size:11px;">${s.durum==='kapali'?'<span style="color:var(--text-muted)">Kapalı</span>':'<span style="color:var(--color-primary)">Aktif</span>'}</td>
        <td class="kalem-sayi" style="color:var(--color-success);font-weight:600;">${_fmtTl(s.sevkToplam)}</td>
      </tr>`).join('');

    const tahSatirlari = tahsilatListesi.map(t => `
      <div class="kp-satir">
        <div class="kp-satir-header">
          <span class="kp-satir-tarih">${_fmtTarih(t.tarih)}</span>
          <span class="kp-satir-aciklama">${_esc(t.not||'Tahsilat')}</span>
          <span class="kp-satir-tutar" style="color:var(--color-success);">+${_fmtTl(Number(t.tutar)||0)}</span>
          <span class="kp-satir-chevron">▼</span>
        </div>
        <div class="kp-satir-body">
          <span>Tutar: <strong>${_fmtTl(Number(t.tutar)||0)}</strong></span>
          <button class="btn-sil-kucuk" data-tahsilat-id="${t.id}" data-musteri="${_esc(m)}">✕ Sil</button>
        </div>
      </div>`).join('');

    kart.innerHTML = `
      <div class="siparis-card-header">
        <span class="sip-musteri">${_esc(m)}</span>
        <span style="font-size:11px;color:var(--text-muted);">${siparisler.length} sipariş</span>
        <span style="margin-left:auto;font-family:var(--font-mono);font-size:12px;color:var(--color-success);">Toplam: ${_fmtTl(toplam)}</span>
        <span style="font-family:var(--font-mono);font-size:12px;color:var(--color-success);">Tahsilat: ${_fmtTl(tahsilatToplam)}</span>
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

    // Tahsilat gir butonu
    kart.querySelector('[data-tahsilat-musteri]').addEventListener('click', () => {
      _cariAktifMusteri = m;
      document.getElementById('tahsilatTarih').value = new Date().toISOString().split('T')[0];
      document.getElementById('tahsilatTutar').value = '';
      document.getElementById('tahsilatNot').value = '';
      document.getElementById('tahsilatModalInfo').innerHTML = `Müşteri: <strong>${_esc(m)}</strong><br>Bakiye: <strong style="color:var(--color-danger);">${_fmtTl(bakiye)}</strong>`;
      document.getElementById('modalTahsilat').classList.remove('hidden');
      document.getElementById('tahsilatTutar').focus();
    });

    // Tahsilat sil butonu - event delegation
    kart.querySelectorAll('[data-tahsilat-id]').forEach(btn => {
      btn.addEventListener('click', () => _tahsilatSil(btn.dataset.tahsilatId, btn.dataset.musteri));
    });

    // Tahsilat akordion
    kart.querySelectorAll('.kp-satir-header').forEach(h => {
      h.addEventListener('click', () => h.closest('.kp-satir').classList.toggle('open'));
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
    return `${_fmtTarih(s.tarih).padEnd(12)}${s.kod.padEnd(16)}${s.marka.substring(0,10).padEnd(12)}${_fmtTl(sevkToplam)}`;
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