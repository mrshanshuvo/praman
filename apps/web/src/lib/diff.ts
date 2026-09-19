/**
 * Lightweight, zero-dependency visual diff utilities for comparing resume iterations.
 */

export interface WordDiffPart {
  type: 'added' | 'removed' | 'same';
  value: string;
}

/**
 * Computes word-level diff using Longest Common Subsequence (LCS).
 */
export function diffWords(oldText = '', newText = ''): WordDiffPart[] {
  if (oldText === newText) {
    return [{ type: 'same', value: newText }];
  }
  if (!oldText) {
    return [{ type: 'added', value: newText }];
  }
  if (!newText) {
    return [{ type: 'removed', value: oldText }];
  }

  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);

  const m = oldWords.length;
  const n = newWords.length;

  // Optimized 2D array
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  const result: WordDiffPart[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      result.unshift({ type: 'same', value: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', value: newWords[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({ type: 'removed', value: oldWords[i - 1] });
      i--;
    }
  }

  // Merge adjacent parts with same type
  const merged: WordDiffPart[] = [];
  for (const part of result) {
    if (merged.length > 0 && merged[merged.length - 1].type === part.type) {
      merged[merged.length - 1].value += part.value;
    } else {
      merged.push({ ...part });
    }
  }

  return merged;
}

export interface ArrayDiffResult<T = string> {
  added: T[];
  removed: T[];
  common: T[];
}

/**
 * Computes added, removed, and common items between two arrays of strings.
 */
export function diffSkills(
  oldSkills: string[] = [],
  newSkills: string[] = [],
): ArrayDiffResult<string> {
  const oldSet = new Set(oldSkills.map((s) => s.toLowerCase().trim()));
  const newSet = new Set(newSkills.map((s) => s.toLowerCase().trim()));

  const added = newSkills.filter((s) => !oldSet.has(s.toLowerCase().trim()));
  const removed = oldSkills.filter((s) => !newSet.has(s.toLowerCase().trim()));
  const common = newSkills.filter((s) => oldSet.has(s.toLowerCase().trim()));

  return { added, removed, common };
}

export interface BulletDiffItem {
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  currentText?: string;
  previousText?: string;
  parts?: WordDiffPart[];
}

function wordSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }
  const union = new Set([...words1, ...words2]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Compares two bullet lists and pairs them by content similarity.
 */
export function diffBullets(
  oldBullets: string[] = [],
  newBullets: string[] = [],
): BulletDiffItem[] {
  const results: BulletDiffItem[] = [];
  const usedOld = new Set<number>();

  for (const newB of newBullets) {
    let bestMatchIdx = -1;
    let bestScore = 0;

    for (let i = 0; i < oldBullets.length; i++) {
      if (usedOld.has(i)) continue;
      const score = wordSimilarity(oldBullets[i], newB);
      if (score > bestScore) {
        bestScore = score;
        bestMatchIdx = i;
      }
    }

    if (bestScore === 1.0) {
      usedOld.add(bestMatchIdx);
      results.push({
        status: 'unchanged',
        currentText: newB,
      });
    } else if (bestScore >= 0.35 && bestMatchIdx !== -1) {
      usedOld.add(bestMatchIdx);
      const oldB = oldBullets[bestMatchIdx];
      results.push({
        status: 'modified',
        currentText: newB,
        previousText: oldB,
        parts: diffWords(oldB, newB),
      });
    } else {
      results.push({
        status: 'added',
        currentText: newB,
      });
    }
  }

  // Any remaining un-paired old bullets are marked removed
  for (let i = 0; i < oldBullets.length; i++) {
    if (!usedOld.has(i)) {
      results.push({
        status: 'removed',
        previousText: oldBullets[i],
      });
    }
  }

  return results;
}
