export const PRICE_TIERS = [
  { id: 'up-to-150', maxDistanceMeters: 150_000, essential: 3_200, exclusive: 4_200 },
  { id: 'up-to-250', maxDistanceMeters: 250_000, essential: 3_500, exclusive: 4_500 },
  { id: 'up-to-350', maxDistanceMeters: 350_000, essential: 3_800, exclusive: 4_800 },
];

const toPricing = (tier) => tier && ({
  tier: tier.id,
  prices: { essential: tier.essential, exclusive: tier.exclusive },
});

export const getPricingForDistance = (distanceMeters) =>
  toPricing(PRICE_TIERS.find((tier) => distanceMeters <= tier.maxDistanceMeters));

export const getPricingForTier = (tierId) =>
  toPricing(PRICE_TIERS.find((tier) => tier.id === tierId));
