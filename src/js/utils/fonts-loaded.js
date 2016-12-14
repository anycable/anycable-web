import FontFaceObserver from 'fontfaceobserver';

var fontNormal = new FontFaceObserver('Stem Text');
var fontBold = new FontFaceObserver('Stem Text', {
  weight: 700
});

Promise.all([fontNormal.load(), fontBold.load()]).then(function () {
  document.documentElement.classList.add('fonts-loaded');

  // Optimization for Repeat Views
  sessionStorage.fontsLoaded = true;
});
