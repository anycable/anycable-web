// Pricing toggle (Monthly/Annual)
const billingRadios = document.querySelectorAll<HTMLInputElement>(
  'input[name="billing"]'
);
const priceAmounts = document.querySelectorAll<HTMLElement>(
  '.pricing-card__amount'
);

billingRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    const isAnnual = radio.value === 'annual';

    priceAmounts.forEach(amount => {
      const monthly = amount.getAttribute('data-monthly');
      const annual = amount.getAttribute('data-annual');

      if (monthly && annual) {
        amount.textContent = isAnnual ? `$${annual}` : `$${monthly}`;
      }
    });
  });
});

// Pricing Calculator
const connectionsSlider = document.getElementById(
  'connections-slider'
) as HTMLInputElement;
const connectionsValue = document.getElementById('connections-value');
const anycablePrice = document.getElementById('anycable-price');
const pusherPrice = document.getElementById('pusher-price');
const selfHostedPrice = document.getElementById('self-hosted-price');
const pusherSavings = document.getElementById('pusher-savings');

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'K';
  }
  return num.toString();
}

function calculatePricing(connections: number) {
  // AnyCable Managed pricing
  let anycableCost = 0;
  let anycableTier = 'Free';

  if (connections <= 100) {
    anycableCost = 0;
    anycableTier = 'Managed Free';
  } else if (connections <= 1000) {
    anycableCost = 29;
    anycableTier = 'Managed Starter';
  } else if (connections <= 10000) {
    anycableCost = 99;
    anycableTier = 'Managed Pro';
  } else if (connections <= 50000) {
    anycableCost = 299;
    anycableTier = 'Managed Scale';
  } else {
    anycableCost = 999;
    anycableTier = 'Enterprise';
  }

  // Pusher pricing (approximate)
  let pusherCost = 0;
  if (connections <= 100) {
    pusherCost = 0;
  } else if (connections <= 500) {
    pusherCost = 49;
  } else if (connections <= 1000) {
    pusherCost = 49;
  } else if (connections <= 2000) {
    pusherCost = 99;
  } else if (connections <= 5000) {
    pusherCost = 199;
  } else if (connections <= 10000) {
    pusherCost = 299;
  } else if (connections <= 20000) {
    pusherCost = 499;
  } else {
    pusherCost = Math.ceil(connections / 20000) * 499;
  }

  // Self-hosted (rough estimate)
  let selfHostedCost = 0;
  if (connections <= 1000) {
    selfHostedCost = 85; // t3.medium + redis
  } else if (connections <= 5000) {
    selfHostedCost = 150; // t3.large + redis
  } else if (connections <= 10000) {
    selfHostedCost = 250; // t3.xlarge + redis
  } else {
    selfHostedCost = 350 + Math.floor((connections - 10000) / 10000) * 100;
  }

  return {
    anycable: { cost: anycableCost, tier: anycableTier },
    pusher: pusherCost,
    selfHosted: selfHostedCost,
  };
}

function updateCalculator() {
  if (
    !connectionsSlider ||
    !connectionsValue ||
    !anycablePrice ||
    !pusherPrice ||
    !selfHostedPrice ||
    !pusherSavings
  ) {
    return;
  }

  const connections = parseInt(connectionsSlider.value);
  connectionsValue.textContent = formatNumber(connections);

  const pricing = calculatePricing(connections);

  // Update AnyCable
  if (pricing.anycable.cost === 0) {
    anycablePrice.innerHTML = '$0<span>/month</span>';
    const recommendedCard = anycablePrice.closest('.pricing-result-card');
    if (recommendedCard) {
      const title = recommendedCard.querySelector(
        '.pricing-result-card__title'
      );
      if (title) title.textContent = 'AnyCable ' + pricing.anycable.tier;
      const features = recommendedCard.querySelector(
        '.pricing-result-card__features'
      );
      if (features)
        features.textContent = `• Up to ${formatNumber(
          connections
        )} connections\n• Free forever\n• Community support`;
    }
  } else if (pricing.anycable.tier === 'Enterprise') {
    anycablePrice.innerHTML = 'Custom<span></span>';
  } else {
    anycablePrice.innerHTML = `$${pricing.anycable.cost}<span>/month</span>`;
    const recommendedCard = anycablePrice.closest('.pricing-result-card');
    if (recommendedCard) {
      const title = recommendedCard.querySelector(
        '.pricing-result-card__title'
      );
      if (title) title.textContent = 'AnyCable ' + pricing.anycable.tier;
    }
  }

  // Update Pusher
  if (pricing.pusher === 0) {
    pusherPrice.innerHTML = '$0<span>/month</span>';
  } else {
    pusherPrice.innerHTML = `$${pricing.pusher}<span>/month</span>`;
  }

  // Update Self-hosted
  selfHostedPrice.innerHTML = `~$${pricing.selfHosted}<span>/month</span>`;

  // Calculate savings
  if (pricing.anycable.cost === 0 || pricing.pusher === 0) {
    pusherSavings.textContent = '';
  } else {
    const savings = Math.round(
      ((pricing.pusher - pricing.anycable.cost) / pricing.pusher) * 100
    );
    if (savings > 0) {
      pusherSavings.textContent = `Save ${savings}%`;
      pusherSavings.style.color = '#4caf50';
    } else {
      const extraCost = Math.round(
        (Math.abs(savings) / 100) * pricing.anycable.cost
      );
      pusherSavings.textContent = `+${Math.abs(savings)}% cost`;
      pusherSavings.style.color = '#d32f2f';
    }
  }
}

if (connectionsSlider) {
  connectionsSlider.addEventListener('input', updateCalculator);
  // Initialize
  updateCalculator();
}

// Load GitHub stars
async function loadGitHubStars() {
  try {
    const response = await fetch(
      'https://api.github.com/repos/anycable/anycable'
    );
    const data = await response.json();
    const stars = data.stargazers_count;
    const counter = document.getElementById('gh-stars-counter');
    if (counter) {
      counter.textContent = (stars / 1000).toFixed(1) + 'K';
    }
  } catch (error) {
    console.error('Failed to load GitHub stars:', error);
  }
}

loadGitHubStars();
