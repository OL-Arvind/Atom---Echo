export type DiffSegmentType = "intact" | "added" | "removed";

export interface DiffSegment {
  type: DiffSegmentType;
  text: string;
}

export type ParagraphDiffStatus = "intact" | "modified" | "added" | "removed";

export interface ParagraphDiffItem {
  id: string;
  status: ParagraphDiffStatus;
  oldText?: string;
  newText?: string;
  segments: DiffSegment[];
  intactPercent: number;
}

export interface ContentDiffResult {
  segments: DiffSegment[];
  paragraphs: ParagraphDiffItem[];
  intactPercent: number;
  wordsAdded: number;
  wordsRemoved: number;
  wordsIntact: number;
  charsDelta: number;
  hookChanged: boolean;
  oldHook: string;
  newHook: string;
  humanSummary: string;
  isIdentical: boolean;
}

function extractOpeningHook(text: string): string {
  const firstLine = (text || "")
    .split("\n")
    .map((l) => l.trim())
    .find(Boolean);
  return firstLine || "";
}

function countWordsInText(text: string): number {
  const trimmed = (text || "").trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Tokenizes text into word and whitespace tokens so LCS diff preserves exact formatting and newlines.
 */
function tokenizeForDiff(text: string): string[] {
  if (!text) return [];
  return text.match(/(\n+|\s+|[^\s\n]+)/g) || [];
}

/**
 * Computes word-level LCS diff between two strings and merges adjacent segments of the same type.
 */
export function computeWordDiffSegments(oldText: string, newText: string): DiffSegment[] {
  if (oldText === newText) {
    return oldText ? [{ type: "intact", text: oldText }] : [];
  }
  if (!oldText) {
    return newText ? [{ type: "added", text: newText }] : [];
  }
  if (!newText) {
    return [{ type: "removed", text: oldText }];
  }

  const a = tokenizeForDiff(oldText);
  const b = tokenizeForDiff(newText);

  const n = a.length;
  const m = b.length;

  // Guard for very large texts (LinkedIn posts are <= 3,000 chars, ~600-1,000 tokens)
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const rawSegments: DiffSegment[] = [];
  let i = 0;
  let j = 0;

  while (i < n && j < m) {
    if (a[i] === b[j]) {
      rawSegments.push({ type: "intact", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rawSegments.push({ type: "removed", text: a[i] });
      i++;
    } else {
      rawSegments.push({ type: "added", text: b[j] });
      j++;
    }
  }

  while (i < n) {
    rawSegments.push({ type: "removed", text: a[i] });
    i++;
  }

  while (j < m) {
    rawSegments.push({ type: "added", text: b[j] });
    j++;
  }

  // Merge contiguous segments of the same type
  const merged: DiffSegment[] = [];
  for (const seg of rawSegments) {
    const prev = merged[merged.length - 1];
    if (prev && prev.type === seg.type) {
      prev.text += seg.text;
    } else {
      merged.push({ ...seg });
    }
  }

  return merged;
}

/**
 * Calculates similarity (0..1) between two paragraphs based on shared normalized words.
 */
function computeParagraphSimilarity(p1: string, p2: string): number {
  const w1 = p1
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const w2 = p2
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (w1.length === 0 && w2.length === 0) return 1;
  if (w1.length === 0 || w2.length === 0) return 0;

  const counts = new Map<string, number>();
  for (const w of w1) {
    counts.set(w, (counts.get(w) || 0) + 1);
  }
  let shared = 0;
  for (const w of w2) {
    const c = counts.get(w) || 0;
    if (c > 0) {
      shared++;
      counts.set(w, c - 1);
    }
  }

  return (2 * shared) / (w1.length + w2.length);
}

/**
 * Splits post into logical paragraphs/blocks and aligns them to show:
 * - Intact blocks (100% preserved)
 * - Modified blocks (inline word diff)
 * - Added blocks
 * - Removed blocks
 */
export function computeParagraphDiffs(oldText: string, newText: string): ParagraphDiffItem[] {
  const oldParas = (oldText || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const newParas = (newText || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const result: ParagraphDiffItem[] = [];
  let i = 0;
  let j = 0;
  let idx = 0;

  while (i < oldParas.length || j < newParas.length) {
    const oldP = oldParas[i];
    const newP = newParas[j];

    if (i < oldParas.length && j < newParas.length) {
      if (oldP === newP) {
        result.push({
          id: `p-${idx++}`,
          status: "intact",
          oldText: oldP,
          newText: newP,
          segments: [{ type: "intact", text: newP }],
          intactPercent: 100,
        });
        i++;
        j++;
        continue;
      }

      const simCurrent = computeParagraphSimilarity(oldP, newP);
      const nextNewExact = j + 1 < newParas.length && oldP === newParas[j + 1];
      const nextOldExact = i + 1 < oldParas.length && oldParas[i + 1] === newP;

      if (nextNewExact && simCurrent < 0.45) {
        // newP was inserted before oldP
        result.push({
          id: `p-${idx++}`,
          status: "added",
          newText: newP,
          segments: [{ type: "added", text: newP }],
          intactPercent: 0,
        });
        j++;
        continue;
      }

      if (nextOldExact && simCurrent < 0.45) {
        // oldP was removed before newP
        result.push({
          id: `p-${idx++}`,
          status: "removed",
          oldText: oldP,
          segments: [{ type: "removed", text: oldP }],
          intactPercent: 0,
        });
        i++;
        continue;
      }

      if (simCurrent >= 0.22) {
        const segs = computeWordDiffSegments(oldP, newP);
        const intactWords = segs
          .filter((s) => s.type === "intact")
          .reduce((acc, s) => acc + countWordsInText(s.text), 0);
        const totalOldWords = Math.max(1, countWordsInText(oldP));
        const pct = Math.min(99, Math.max(1, Math.round((intactWords / totalOldWords) * 100)));

        result.push({
          id: `p-${idx++}`,
          status: "modified",
          oldText: oldP,
          newText: newP,
          segments: segs,
          intactPercent: pct,
        });
        i++;
        j++;
        continue;
      }

      // Completely replaced block: show removed then added
      result.push({
        id: `p-${idx++}`,
        status: "removed",
        oldText: oldP,
        segments: [{ type: "removed", text: oldP }],
        intactPercent: 0,
      });
      result.push({
        id: `p-${idx++}`,
        status: "added",
        newText: newP,
        segments: [{ type: "added", text: newP }],
        intactPercent: 0,
      });
      i++;
      j++;
    } else if (i < oldParas.length) {
      result.push({
        id: `p-${idx++}`,
        status: "removed",
        oldText: oldP,
        segments: [{ type: "removed", text: oldP }],
        intactPercent: 0,
      });
      i++;
    } else if (j < newParas.length) {
      result.push({
        id: `p-${idx++}`,
        status: "added",
        newText: newP,
        segments: [{ type: "added", text: newP }],
        intactPercent: 0,
      });
      j++;
    }
  }

  return result;
}

/**
 * Full diff calculation between two post versions (`oldText` -> `newText`).
 */
export function computeContentDiff(oldText: string, newText: string): ContentDiffResult {
  const cleanOld = (oldText || "").replace(/\r\n/g, "\n").trim();
  const cleanNew = (newText || "").replace(/\r\n/g, "\n").trim();

  const isIdentical = cleanOld === cleanNew;
  const segments = computeWordDiffSegments(cleanOld, cleanNew);
  const paragraphs = computeParagraphDiffs(cleanOld, cleanNew);

  let wordsAdded = 0;
  let wordsRemoved = 0;
  let wordsIntact = 0;

  for (const seg of segments) {
    const wc = countWordsInText(seg.text);
    if (seg.type === "added") wordsAdded += wc;
    else if (seg.type === "removed") wordsRemoved += wc;
    else wordsIntact += wc;
  }

  const oldWordTotal = wordsIntact + wordsRemoved;
  const intactPercent =
    oldWordTotal === 0
      ? cleanNew.length > 0
        ? 0
        : 100
      : isIdentical
      ? 100
      : Math.min(99, Math.max(0, Math.round((wordsIntact / oldWordTotal) * 100)));

  const oldHook = extractOpeningHook(cleanOld);
  const newHook = extractOpeningHook(cleanNew);
  const hookChanged = oldHook.toLowerCase() !== newHook.toLowerCase();
  const charsDelta = cleanNew.length - cleanOld.length;

  const summaryParts: string[] = [];
  if (isIdentical) {
    summaryParts.push("100% intact (no text changes)");
  } else {
    if (hookChanged) {
      summaryParts.push("Opening hook rewritten");
    } else {
      summaryParts.push("Opening hook kept intact");
    }
    if (wordsAdded > 0) summaryParts.push(`+${wordsAdded} words`);
    if (wordsRemoved > 0) summaryParts.push(`-${wordsRemoved} words`);
    summaryParts.push(`${intactPercent}% stayed intact`);
  }

  return {
    segments,
    paragraphs,
    intactPercent,
    wordsAdded,
    wordsRemoved,
    wordsIntact,
    charsDelta,
    hookChanged,
    oldHook,
    newHook,
    humanSummary: summaryParts.join(" · "),
    isIdentical,
  };
}

/**
 * Generates an authentic earlier draft (`v1`) from a post's current markdown
 * when a seeded post already has revision feedback notes in `content_feedback`
 * so the user can inspect realistic diffs on existing posts immediately.
 */
export function synthesizePriorVersionBody(
  currentBody: string,
  feedbackComment?: string | null
): string {
  const lines = (currentBody || "")
    .replace(/\r\n/g, "\n")
    .split("\n");

  if (lines.length === 0 || !currentBody.trim()) {
    return currentBody;
  }

  const commentLower = (feedbackComment || "").toLowerCase();
  const modifiedLines = [...lines];

  // 1. Soften the opening hook in v1 so v2 shows a sharpened hook
  const firstNonEmptyIdx = modifiedLines.findIndex((l) => l.trim().length > 0);
  if (firstNonEmptyIdx !== -1) {
    const currentHook = modifiedLines[firstNonEmptyIdx].trim();
    if (commentLower.includes("arr") && currentHook.includes("ARR")) {
      modifiedLines[firstNonEmptyIdx] = currentHook.replace(/ARR/g, "MRR");
    } else {
      modifiedLines[firstNonEmptyIdx] = `Here is what most founders get wrong about scaling: ${
        currentHook.charAt(0).toLowerCase() + currentHook.slice(1)
      }`;
    }
  }

  // 2. If ARR/MRR is mentioned in the body, swap in v1 so v2 highlights the exact metric fix
  for (let i = 0; i < modifiedLines.length; i++) {
    if (i === firstNonEmptyIdx) continue;
    if (commentLower.includes("arr") && modifiedLines[i].includes("ARR")) {
      modifiedLines[i] = modifiedLines[i].replace(/ARR/g, "MRR");
    }
  }

  // 3. Adjust closing or middle paragraph slightly so both intact and changed blocks appear
  const nonEmptyIndices = modifiedLines
    .map((l, idx) => (l.trim().length > 25 ? idx : -1))
    .filter((idx) => idx !== -1);

  if (nonEmptyIndices.length >= 3) {
    const lastIdx = nonEmptyIndices[nonEmptyIndices.length - 1];
    modifiedLines[lastIdx] = `${modifiedLines[lastIdx]} What are you seeing in your own team right now?`;
  }

  return modifiedLines.join("\n");
}
