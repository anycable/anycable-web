import Popup from './components/Popup';

const LOGOS: Record<string, string> = {
  'Doximity': '/images/logos/doximity.svg',
  'Healthie': '/images/logos/healthie-text.png',
  'Headway': '/images/logos/headway.png',
  'Jane': '/images/logos/jane.png',
  'Fullscript': '/images/logos/fullscript.png',
  'Joint Academy': '/images/logos/joint-academy-text.png',
  'Wawa Fertility': '/images/logos/wawafertility.png',
  'Sessions Health': '/images/logos/sessionshealth.png',
  'Vinita': '/images/logos/vinita.png',
  'CoinGecko': '/images/logos/coingecko.svg',
  'Dext': '/images/logos/dext.png',
  'FreeAgent': '/images/logos/freeagent.png',
  'Wealthbox': '/images/logos/wealthbox.png',
  'Floatcard': '/images/logos/floatcard.png',
  'Jobber': '/images/logos/jobber.png',
  'CompanyCam': '/images/logos/companycam.png',
  'EV Connection': '/images/logos/ev-connection.png',
  'Via Transportation': '/images/logos/via.png',
  'Agero': '/images/logos/agero.svg',
  'rang.ee': '/images/logos/rangee.png',
  'Tasktag': '/images/logos/tasktag.png',
  'Circle': '/images/logos/circle.png',
  'Mighty Networks': '/images/logos/mighty-networks.png',
  'LiveVoice': '/images/logos/live-voice.png',
  'Welcome': '/images/logos/welcome.png',
  'Uula': '/images/logos/uula.png',
  'Yay!': '/images/logos/yay.png',
  'ClickFunnels': '/images/logos/clickfunnels.png',
  'Poll Everywhere': '/images/logos/poll-everywhere.png',
  'Callbell': '/images/logos/callbell-text.png',
  'Qualified': '/images/logos/qualified.png',
  'Uscreen': '/images/logos/uscreen.png',
  'CallTrackingMetrics': '/images/logos/calltrackingmetrics.png',
  'Zyda': '/images/logos/zyda.png',
  'Sera': '/images/logos/sera-text.png',
  'Vito': '/images/logos/vito.png',
};

const modal = document.getElementById('company-modal');
if (modal) {
  const popup = new Popup('#company-modal');
  popup.init();

  const logoEl = document.getElementById('company-modal-logo') as HTMLImageElement;
  const nameEl = document.getElementById('company-modal-name');
  const descEl = document.getElementById('company-modal-desc');
  const detailEl = document.getElementById('company-modal-detail');
  const linkEl = document.getElementById('company-modal-link') as HTMLAnchorElement;
  const caseStudyEl = document.getElementById('company-modal-case-study') as HTMLAnchorElement;

  // Inject a "Read case study →" element into every tile that has one.
  // We use a <span> (not <a>) because the tile is a <button>, and <a> inside
  // <button> is invalid HTML that Chrome/Safari block from navigating.
  // Clicking this span opens the case study in a new tab via window.open;
  // clicking anywhere else on the tile opens the company popup.
  document.querySelectorAll<HTMLElement>('.cases-slide__company-card[data-case-study]').forEach(card => {
    const caseStudyUrl = card.getAttribute('data-case-study');
    if (!caseStudyUrl) return;
    const ctaText = card.getAttribute('data-case-study-cta') || 'Read case study →';
    const link = document.createElement('span');
    link.className = 'cases-slide__company-case-study';
    link.setAttribute('role', 'link');
    link.setAttribute('tabindex', '0');
    link.textContent = ctaText;
    link.addEventListener('click', (e) => {
      e.stopPropagation();
      window.open(caseStudyUrl, '_blank', 'noopener');
    });
    link.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        window.open(caseStudyUrl, '_blank', 'noopener');
      }
    });
    card.appendChild(link);
  });

  document.querySelectorAll<HTMLElement>('.cases-slide__company-card').forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const name = card.querySelector('.cases-slide__company-name')?.textContent || '';
      const desc = card.querySelector('.cases-slide__company-desc')?.textContent || '';
      const detail = card.getAttribute('data-detail') || '';
      const url = card.getAttribute('data-url') || '#';
      const caseStudyUrl = card.getAttribute('data-case-study');
      const caseStudyTitle = card.getAttribute('data-case-study-title');
      const logo = LOGOS[name];

      if (logoEl) {
        if (logo) {
          logoEl.src = logo;
          logoEl.alt = name;
          logoEl.style.display = '';
        } else {
          logoEl.style.display = 'none';
        }
      }

      if (nameEl) nameEl.textContent = name;
      if (descEl) descEl.textContent = desc;
      if (detailEl) detailEl.textContent = detail;
      if (linkEl) {
        linkEl.href = url;
        linkEl.textContent = `Visit ${name}`;
      }

      if (caseStudyEl) {
        if (caseStudyUrl) {
          caseStudyEl.href = caseStudyUrl;
          caseStudyEl.textContent = caseStudyTitle || 'Read case study';
          caseStudyEl.style.display = '';
        } else {
          caseStudyEl.style.display = 'none';
        }
      }

      popup.open();
    });
  });
}
