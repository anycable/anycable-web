export default function triggerGTMEvent(event) {
  if (window.posthog) {
    const type = event.event;
    delete event.event;

    posthog.capture(type, event);
  } else {
    // for development
    console.info('Analytics event:', event);
  }
}
