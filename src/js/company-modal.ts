const LOGOS: Record<string, string> = {
  'Doximity': '/images/logos/doximity-mark.svg',
  'Healthie': '/images/logos/healthie-text.png',
  'Headway': '/images/logos/headway-mark.svg',
  'Jane': '/images/logos/jane-wordmark.svg',
  'Fullscript': '/images/logos/fullscript-mark.svg',
  'Joint Academy': '/images/logos/joint-academy-wordmark.svg',
  'Wawa Fertility': '/images/logos/wawa.svg',
  'Sessions Health': '/images/logos/sessionshealth-mark.svg',
  'Vinita': '/images/logos/vinita.png',
  'CoinGecko': '/images/logos/coingecko.svg',
  'Dext': '/images/logos/dext-wordmark.svg',
  'FreeAgent': '/images/logos/freeagent-wordmark.svg',
  'Wealthbox': '/images/logos/wealthbox-mark.svg',
  'Float': '/images/logos/floatcard-mark.svg',
  'Jobber': '/images/logos/jobber-mark.svg',
  'CompanyCam': '/images/logos/companycam-mark.svg',
  'EV Connection': '/images/logos/ev-connection-wordmark.png',
  'Via Transportation': '/images/logos/via-mark.svg',
  'Agero': '/images/logos/agero.svg',
  'Tasktag': '/images/logos/tasktag.svg',
  'Circle': '/images/logos/circle-wordmark.svg',
  'Mighty Networks': '/images/logos/mighty-networks-wordmark.svg',
  'LiveVoice': '/images/logos/live-voice-mark.svg',
  'Welcome': '/images/logos/welcome.png',
  'Uula': '/images/logos/uula-mark.svg',
  'Yay!': '/images/logos/yay.svg',
  'ClickFunnels': '/images/logos/clickfunnels-wordmark.svg',
  'Poll Everywhere': '/images/logos/poll-everywhere-wordmark.svg',
  'Callbell': '/images/logos/callbell-wordmark.svg',
  'Qualified': '/images/logos/qualified-mark.svg',
  'Uscreen': '/images/logos/uscreen-mark.svg',
  'CTM': '/images/logos/ctm-mark.svg',
  'Zyda': '/images/logos/zyda-wordmark.svg',
  'Sera': '/images/logos/sera-wordmark.svg',
};

const dialog = document.getElementById('company-modal') as HTMLDialogElement;

if (dialog) {
  const logoEl = document.getElementById('company-modal-logo') as HTMLImageElement;
  const nameEl = document.getElementById('company-modal-name');
  const descEl = document.getElementById('company-modal-desc');
  const detailEl = document.getElementById('company-modal-detail');
  const linkEl = document.getElementById('company-modal-link') as HTMLAnchorElement;
  const caseStudyEl = document.getElementById('company-modal-case-study') as HTMLAnchorElement;

  // Close on backdrop click (native <dialog> only closes on Escape by default)
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  dialog.querySelector('.company-modal__close')?.addEventListener('click', () => {
    dialog.close();
  });

  // Single event listener — opens modal when a customer card is clicked,
  // but ignores clicks on <a> tags inside the card (case study links navigate normally).
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // Don't intercept real links
    if (target.closest('a')) return;

    const card = target.closest('.cases-slide__company-card[data-detail]');
    if (!card) return;

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

    dialog.showModal();
  });
}
