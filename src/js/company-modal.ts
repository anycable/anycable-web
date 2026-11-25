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

  // One listener for the whole logo wall: a tile with data-detail opens the
  // modal with that company's details. Each tile names its own modal logo in
  // data-logo, next to the tile image it shows.
  document.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.cases-slide__tile[data-detail]');
    if (!card) return;

    const name = card.querySelector('.cases-slide__company-name')?.textContent || '';
    const desc = card.querySelector('.cases-slide__company-desc')?.textContent || '';
    const detail = card.getAttribute('data-detail') || '';
    const url = card.getAttribute('data-url') || '#';
    const caseStudyUrl = card.getAttribute('data-case-study');
    const caseStudyTitle = card.getAttribute('data-case-study-title');
    const logo = card.dataset.logo;

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
