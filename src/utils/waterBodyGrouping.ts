import type { WaterBodySearchResult } from '../services/waterBodyService';

export interface GroupedWaterBody {
  waterBodyId: string;
  name: string;
  type?: string;
  distance?: number;
  sections: Array<{
    sectionIndex: number;
    sectionId: string;
    sectionName: string;
    candidate: WaterBodySearchResult;
  }>;
}

export interface GroupedCandidatesResult {
  groups: GroupedWaterBody[];
  osmCandidates: WaterBodySearchResult[];
}

/**
 * Groups water body candidates by waterBodyId and separates OSM candidates
 * 
 * @param candidates - Array of water body search results
 * @param showOSM - Whether to include OSM candidates in the result
 * @returns Object containing grouped community water bodies and OSM candidates
 */
export function getGroupedCandidates(
  candidates: WaterBodySearchResult[],
  showOSM: boolean
): GroupedCandidatesResult {
  const groups = new Map<string, GroupedWaterBody>();
  const osmCandidates: WaterBodySearchResult[] = [];

  for (const candidate of candidates) {
    const isOSM = candidate.source === 'osm';

    // Filter OSM based on toggle
    if (isOSM && !showOSM) {
      continue;
    }

    // OSM water bodies go to flat list
    if (isOSM) {
      osmCandidates.push(candidate);
      continue;
    }

    // Community water bodies get grouped
    const waterBodyId = candidate.sharedWaterBodyId;
    if (!waterBodyId) continue;

    if (!groups.has(waterBodyId)) {
      groups.set(waterBodyId, {
        waterBodyId,
        name: candidate.name,
        type: candidate.type,
        distance: candidate.distance,
        sections: [],
      });
    }

    const group = groups.get(waterBodyId)!;

    // Add section to group if it exists
    // Note: Some candidates may have sectionName but no sectionId (legacy data)
    if (candidate.sectionName) {
      group.sections.push({
        sectionIndex: candidate.sectionIndex || 0,
        sectionId: candidate.sectionId || '', // Use empty string if no ID
        sectionName: candidate.sectionName,
        candidate,
      });
    }
  }

  return {
    groups: Array.from(groups.values()),
    osmCandidates,
  };
}
