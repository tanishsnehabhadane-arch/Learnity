/**
 * DAG-aware knowledge gap detection.
 * Key rule: when concept X is gap_detected, walk the prerequisite DAG backward —
 * if a prerequisite is also below threshold, the *prerequisite* is the actionable
 * gap to surface, not X. Prevents recommending remedial content for the wrong node.
 */
import { config } from "../config.ts";

export interface ConceptGraphNode {
  id: string;
  prerequisiteIds: string[];
  masteryProbability: number;
  attemptsCount: number;
  status: "not_started" | "in_progress" | "gap_detected" | "mastered";
}

export interface DetectedGap {
  /** The concept whose gap should be surfaced/remediated. */
  conceptId: string;
  /** The downstream concept that originally failed (may equal conceptId). */
  observedOn: string;
  /** Unexpected gap: student failed X despite having mastered a concept requiring X. */
  unexpected: boolean;
  depth: number;
}

/** True if the state itself is a raw gap signal. */
export function isRawGap(node: ConceptGraphNode): boolean {
  const enoughAttempts = node.attemptsCount >= config.bkt.minAttemptsForGapFlag;
  const probabilityGap =
    node.masteryProbability < config.bkt.gapThreshold && enoughAttempts;
  const statusGap = node.status === "gap_detected";
  return statusGap || probabilityGap;
}

/**
 * Resolve the actionable gap for a raw-gap node by walking prerequisites backward.
 * Returns the deepest under-mastered prerequisite chain root (the actionable gap).
 */
export function resolveActionableGap(
  rawGapNodeId: string,
  graph: Map<string, ConceptGraphNode>,
): DetectedGap {
  const node = graph.get(rawGapNodeId);
  if (!node) {
    return { conceptId: rawGapNodeId, observedOn: rawGapNodeId, unexpected: false, depth: 0 };
  }

  let current = node;
  let depth = 0;
  const visited = new Set<string>([rawGapNodeId]);

  while (true) {
    const weakerPrereq = current.prerequisiteIds
      .map((id) => graph.get(id))
      .filter((p): p is ConceptGraphNode => p !== undefined)
      .filter((p) => p.masteryProbability < config.bkt.gapThreshold)
      .sort((a, b) => a.masteryProbability - b.masteryProbability)[0];

    if (!weakerPrereq || visited.has(weakerPrereq.id)) break;
    visited.add(weakerPrereq.id);
    current = weakerPrereq;
    depth += 1;
  }

  const unexpected = depth === 0 && hasMasteredDependent(node.id, graph);
  return { conceptId: current.id, observedOn: node.id, unexpected, depth };
}

/** True if any concept that lists `conceptId` as a prerequisite is mastered. */
export function hasMasteredDependent(
  conceptId: string,
  graph: Map<string, ConceptGraphNode>,
): boolean {
  for (const node of graph.values()) {
    if (node.prerequisiteIds.includes(conceptId) && node.status === "mastered") {
      return true;
    }
  }
  return false;
}

/**
 * Full gap scan for a student's concept graph.
 * Returns one actionable gap per raw-gap root (deduplicated by concept).
 */
export function detectGaps(graph: Map<string, ConceptGraphNode>): DetectedGap[] {
  const gaps: DetectedGap[] = [];
  const seen = new Set<string>();

  for (const node of graph.values()) {
    if (!isRawGap(node)) continue;
    const gap = resolveActionableGap(node.id, graph);
    if (seen.has(gap.conceptId)) continue;
    seen.add(gap.conceptId);
    gaps.push(gap);
  }

  // Deepest root causes first
  return gaps.sort((a, b) => b.depth - a.depth);
}
