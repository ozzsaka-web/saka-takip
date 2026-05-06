function _listeRender() {
  if (typeof _aktifListeRender === 'function') {
    _aktifListeRender();
  }

  if (typeof _tamamlananListeRender === 'function') {
    _tamamlananListeRender();
  }
}
