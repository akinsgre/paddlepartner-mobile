import { getGroupedCandidates } from '../../utils/waterBodyGrouping';
import type { WaterBodySearchResult } from '../../services/waterBodyService';

/**
 * Tests for the grouping logic in WaterBodySelectionList
 * 
 * These tests verify the getGroupedCandidates function which:
 * - Groups water body candidates by waterBodyId
 * - Separates OSM candidates into a flat list
 * - Handles sections within water bodies
 * - Filters based on showOSM toggle
 */

describe('WaterBodySelectionList grouping logic', () => {
  describe('grouping multiple sections from same water body', () => {
    it('should group sections under the same waterBodyId', () => {
      const candidates: WaterBodySearchResult[] = [
        {
          source: 'shared_database',
          sharedWaterBodyId: 'water1',
          sectionId: 'section1',
          sectionIndex: 0,
          sectionName: 'Upper Section',
          name: 'Lake Mendota',
          type: 'lake',
          distance: 500,
        },
        {
          source: 'shared_database',
          sharedWaterBodyId: 'water1',
          sectionId: 'section2',
          sectionIndex: 1,
          sectionName: 'Lower Section',
          name: 'Lake Mendota',
          type: 'lake',
          distance: 500,
        },
      ];

      const result = getGroupedCandidates(candidates, true);

      // Should have 1 group
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].waterBodyId).toBe('water1');
      expect(result.groups[0].name).toBe('Lake Mendota');
      
      // Should have 2 sections
      expect(result.groups[0].sections).toHaveLength(2);
      expect(result.groups[0].sections[0].sectionName).toBe('Upper Section');
      expect(result.groups[0].sections[1].sectionName).toBe('Lower Section');
      
      // No OSM candidates
      expect(result.osmCandidates).toHaveLength(0);
    });

    it('should separate OSM candidates from community water bodies', () => {
      const candidates: WaterBodySearchResult[] = [
        {
          source: 'shared_database',
          sharedWaterBodyId: 'water1',
          sectionId: 'section1',
          sectionName: 'Main Section',
          name: 'Community Lake',
          type: 'lake',
        },
        {
          source: 'osm',
          osmId: 'way/123456',
          name: 'OSM River',
          type: 'river',
          osmData: { tags: { name: 'OSM River' } },
        },
      ];

      const result = getGroupedCandidates(candidates, true);

      // Should have 1 community group and 1 OSM candidate
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].name).toBe('Community Lake');
      expect(result.osmCandidates).toHaveLength(1);
      expect(result.osmCandidates[0].name).toBe('OSM River');
    });

    it('should handle water bodies without sections', () => {
      const candidates: WaterBodySearchResult[] = [
        {
          source: 'shared_database',
          sharedWaterBodyId: 'water1',
          name: 'Simple Lake',
          type: 'lake',
        },
      ];

      const result = getGroupedCandidates(candidates, true);

      // Should have 1 group with 0 sections
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].name).toBe('Simple Lake');
      expect(result.groups[0].sections).toHaveLength(0);
    });

    it('should handle sections with sectionName but no sectionId (legacy data)', () => {
      const candidates: WaterBodySearchResult[] = [
        {
          source: 'shared_database',
          sharedWaterBodyId: 'water1',
          sectionName: 'Legacy Section',
          sectionIndex: 0,
          name: 'Legacy Lake',
          type: 'lake',
        },
      ];

      const result = getGroupedCandidates(candidates, true);

      // Should still create the section with empty sectionId
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].sections).toHaveLength(1);
      expect(result.groups[0].sections[0].sectionName).toBe('Legacy Section');
      expect(result.groups[0].sections[0].sectionId).toBe('');
    });

    it('should filter OSM candidates when showOSM is false', () => {
      const candidates: WaterBodySearchResult[] = [
        {
          source: 'shared_database',
          sharedWaterBodyId: 'water1',
          name: 'Community Lake',
          type: 'lake',
        },
        {
          source: 'osm',
          osmId: 'way/123456',
          name: 'OSM River',
          type: 'river',
          osmData: { tags: { name: 'OSM River' } },
        },
      ];

      const result = getGroupedCandidates(candidates, false); // showOSM = false

      // Should have 1 community group, 0 OSM candidates
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].name).toBe('Community Lake');
      expect(result.osmCandidates).toHaveLength(0);
    });

    it('should handle multiple water bodies with multiple sections each', () => {
      const candidates: WaterBodySearchResult[] = [
        {
          source: 'shared_database',
          sharedWaterBodyId: 'water1',
          sectionId: 'section1-1',
          sectionIndex: 0,
          sectionName: 'Lake A - Upper',
          name: 'Lake A',
          type: 'lake',
        },
        {
          source: 'shared_database',
          sharedWaterBodyId: 'water1',
          sectionId: 'section1-2',
          sectionIndex: 1,
          sectionName: 'Lake A - Lower',
          name: 'Lake A',
          type: 'lake',
        },
        {
          source: 'shared_database',
          sharedWaterBodyId: 'water2',
          sectionId: 'section2-1',
          sectionIndex: 0,
          sectionName: 'River B - North',
          name: 'River B',
          type: 'river',
        },
        {
          source: 'shared_database',
          sharedWaterBodyId: 'water2',
          sectionId: 'section2-2',
          sectionIndex: 1,
          sectionName: 'River B - South',
          name: 'River B',
          type: 'river',
        },
      ];

      const result = getGroupedCandidates(candidates, true);

      // Should have 2 groups
      expect(result.groups).toHaveLength(2);
      
      // Find groups
      const lakeA = result.groups.find(g => g.name === 'Lake A');
      const riverB = result.groups.find(g => g.name === 'River B');
      
      expect(lakeA).toBeDefined();
      expect(lakeA!.sections).toHaveLength(2);
      expect(lakeA!.sections[0].sectionName).toBe('Lake A - Upper');
      expect(lakeA!.sections[1].sectionName).toBe('Lake A - Lower');
      
      expect(riverB).toBeDefined();
      expect(riverB!.sections).toHaveLength(2);
      expect(riverB!.sections[0].sectionName).toBe('River B - North');
      expect(riverB!.sections[1].sectionName).toBe('River B - South');
    });

    it('should preserve distance and type metadata', () => {
      const candidates: WaterBodySearchResult[] = [
        {
          source: 'shared_database',
          sharedWaterBodyId: 'water1',
          name: 'Test Lake',
          type: 'reservoir',
          distance: 1234,
        },
      ];

      const result = getGroupedCandidates(candidates, true);

      expect(result.groups[0].type).toBe('reservoir');
      expect(result.groups[0].distance).toBe(1234);
    });

    it('should handle empty candidates array', () => {
      const candidates: WaterBodySearchResult[] = [];

      const result = getGroupedCandidates(candidates, true);

      expect(result.groups).toHaveLength(0);
      expect(result.osmCandidates).toHaveLength(0);
    });

    it('should skip candidates without waterBodyId', () => {
      const candidates: WaterBodySearchResult[] = [
        {
          source: 'shared_database',
          // Missing sharedWaterBodyId
          name: 'Invalid Lake',
          type: 'lake',
        } as any,
      ];

      const result = getGroupedCandidates(candidates, true);

      // Should be skipped
      expect(result.groups).toHaveLength(0);
    });

    it('should handle mixed scenarios: multiple groups, OSM, and no sections', () => {
      const candidates: WaterBodySearchResult[] = [
        // Water body 1 with 2 sections
        {
          source: 'shared_database',
          sharedWaterBodyId: 'water1',
          sectionId: 'sec1',
          sectionName: 'Section 1',
          name: 'Lake A',
          type: 'lake',
        },
        {
          source: 'shared_database',
          sharedWaterBodyId: 'water1',
          sectionId: 'sec2',
          sectionName: 'Section 2',
          name: 'Lake A',
          type: 'lake',
        },
        // Water body 2 with no sections
        {
          source: 'shared_database',
          sharedWaterBodyId: 'water2',
          name: 'Lake B',
          type: 'lake',
        },
        // OSM water bodies
        {
          source: 'osm',
          osmId: 'way/111',
          name: 'OSM Lake 1',
          type: 'lake',
          osmData: {},
        },
        {
          source: 'osm',
          osmId: 'way/222',
          name: 'OSM Lake 2',
          type: 'lake',
          osmData: {},
        },
      ];

      const result = getGroupedCandidates(candidates, true);

      expect(result.groups).toHaveLength(2);
      expect(result.osmCandidates).toHaveLength(2);
      
      const lakeA = result.groups.find(g => g.name === 'Lake A');
      const lakeB = result.groups.find(g => g.name === 'Lake B');
      
      expect(lakeA!.sections).toHaveLength(2);
      expect(lakeB!.sections).toHaveLength(0);
    });
  });
});
