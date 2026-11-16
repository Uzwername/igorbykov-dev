import type { CvPosition } from '@/types/cv';

interface MostUsedTechOptions {
  /** How many of the most recent roles (with a tech stack) to look at. */
  recentPositions: number;
  /** Fewest of those roles a technology must appear in to make the list. */
  minMentions: number;
}

/**
 * Technologies used across the most recent roles, most-mentioned first.
 * Positions are already ordered most recent first in cv.json; ties keep the
 * order in which they first appear there.
 */
export const getMostUsedTech = (
  positions: CvPosition[],
  { recentPositions, minMentions }: MostUsedTechOptions,
) => {
  const mentions = new Map<string, number>();

  positions
    .filter(({ techStack }) => techStack.length)
    .slice(0, recentPositions)
    .forEach(({ techStack }) => {
      techStack.forEach((tech) => {
        mentions.set(tech, (mentions.get(tech) ?? 0) + 1);
      });
    });

  return [...mentions]
    .filter(([, count]) => count >= minMentions)
    .sort(([, a], [, b]) => b - a)
    .map(([tech]) => tech);
};
