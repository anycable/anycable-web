export default function triggerGTMEvent(event) {
  if (window.dataLayer) {
    dataLayer.push(event);
  } else {
    // for development
    console.info("GTM event:", event);
  }
}
