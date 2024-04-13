const fetchStars = async () => {
  const response = await fetch(
    'https://api.github.com/repos/anycable/anycable'
  );
  const data = await response.json();
  return data.stargazers_count;
};

const el = document.getElementById('gh-stars-counter');

if (el) {
  fetchStars().then(stars => {
    if (!stars) return;

    let starsK = Math.round(stars / 100);

    starsK = starsK / 10;

    if (starsK >= 10) {
      starsK = starsK | 0;
    } else if (starsK == starsK - Math.floor(starsK)) {
      starsK = starsK | 0;
    }

    el.textContent = `${starsK}K`;
  });
}
