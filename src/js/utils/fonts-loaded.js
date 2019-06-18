import FontFaceObserver from 'fontfaceobserver';

var stemTextNormal = new FontFaceObserver('Stem Text');
var stemTextBold = new FontFaceObserver('Stem Text', {
  weight: 700
});
var stemNormal = new FontFaceObserver('Stem');
var stemBold = new FontFaceObserver('Stem', {
  weight: 700
});


Promise.all([stemTextNormal.load(), stemTextBold.load(), stemNormal.load(), stemBold.load()]).then(function () {
  document.documentElement.classList.add('fonts-loaded');

  // Optimization for Repeat Views
  sessionStorage.fontsLoaded = true;
});
