const LOGOS: Record<string, string> = {
  'Doximity': '/images/logos/doximity.svg',
  'Healthie': '/images/logos/healthie-text.png',
  'Headway': '/images/logos/headway.png',
  'Jane': '/images/logos/jane.png',
  'Fullscript': '/images/logos/fullscript.png',
  'Joint Academy': '/images/logos/joint-academy-text.png',
  'Wawa Fertility': '/images/logos/wawa.svg',
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
  'Tasktag': '/images/logos/tasktag.svg',
  'Circle': '/images/logos/circle.png',
  'Mighty Networks': '/images/logos/mighty-networks.png',
  'LiveVoice': '/images/logos/live-voice.png',
  'Welcome': '/images/logos/welcome.png',
  'Uula': '/images/logos/uula.png',
  'Yay!': '/images/logos/yay.svg',
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
