export type ReputationTier =
  | 'newcomer'
  | 'contributor'
  | 'curator'
  | 'tastemaker'
  | 'legend';

const TIERS: { tier: ReputationTier; min: number }[] = [
  { tier: 'legend', min: 100 },
  { tier: 'tastemaker', min: 50 },
  { tier: 'curator', min: 20 },
  { tier: 'contributor', min: 5 },
  { tier: 'newcomer', min: 0 },
];

/**
 * Maps a reputation score to a tier name.
 * Tiers: Newcomer (0-4), Contributor (5-19), Curator (20-49),
 * Tastemaker (50-99), Legend (100+).
 */
export function getReputationTier(reputation: number): ReputationTier {
  for (const { tier, min } of TIERS) {
    if (reputation >= min) return tier;
  }
  return 'newcomer';
}
