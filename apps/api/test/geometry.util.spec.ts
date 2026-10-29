import { GeometryUtil } from '../src/modules/parcels/geometry.util';

describe('GeometryUtil (Spatial Boundary & Area Engine)', () => {
  // Sample 4-point closed polygon in Goromonzi, Mashonaland East (approx 1km x 1km ~ 100 hectares)
  const validSquarePolygon: number[][][] = [
    [
      [31.350, -17.750],
      [31.360, -17.750],
      [31.360, -17.740],
      [31.350, -17.740],
      [31.350, -17.750], // Closed
    ],
  ];

  // Overlapping polygon (partially covers validSquarePolygon)
  const overlappingPolygon: number[][][] = [
    [
      [31.355, -17.745],
      [31.365, -17.745],
      [31.365, -17.735],
      [31.355, -17.735],
      [31.355, -17.745], // Closed
    ],
  ];

  // Disjoint polygon (completely outside, further east)
  const disjointPolygon: number[][][] = [
    [
      [31.450, -17.750],
      [31.460, -17.750],
      [31.460, -17.740],
      [31.450, -17.740],
      [31.450, -17.750],
    ],
  ];

  // Self-intersecting "bowtie" polygon
  const selfIntersectingPolygon: number[][][] = [
    [
      [31.350, -17.750],
      [31.360, -17.740],
      [31.360, -17.750],
      [31.350, -17.740],
      [31.350, -17.750],
    ],
  ];

  // Unclosed polygon (first != last)
  const unclosedPolygon: number[][][] = [
    [
      [31.350, -17.750],
      [31.360, -17.750],
      [31.360, -17.740],
      [31.350, -17.740],
    ],
  ];

  describe('validatePolygon', () => {
    it('should validate a properly formatted and closed polygon', () => {
      const result = GeometryUtil.validatePolygon(validSquarePolygon);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject unclosed polygon rings', () => {
      const result = GeometryUtil.validatePolygon(unclosedPolygon);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('not closed');
    });

    it('should reject polygons with fewer than 4 coordinates', () => {
      const tooFew: number[][][] = [
        [
          [31.35, -17.75],
          [31.36, -17.75],
          [31.35, -17.75],
        ],
      ];
      const result = GeometryUtil.validatePolygon(tooFew);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 4 coordinates');
    });

    it('should reject self-intersecting bowtie polygons', () => {
      const result = GeometryUtil.validatePolygon(selfIntersectingPolygon);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('self-intersecting');
    });

    it('should reject out-of-bounds coordinates', () => {
      const invalidCoords: number[][][] = [
        [
          [195.0, -17.75],
          [31.36, -17.75],
          [31.36, -17.74],
          [195.0, -17.74],
          [195.0, -17.75],
        ],
      ];
      const result = GeometryUtil.validatePolygon(invalidCoords);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('out of bounds');
    });
  });

  describe('computeHectares', () => {
    it('should accurately calculate surface area in hectares (> 100 ha for ~1km x 1km)', () => {
      const hectares = GeometryUtil.computeHectares(validSquarePolygon);
      expect(hectares).toBeGreaterThan(100);
      expect(hectares).toBeLessThan(140);
    });

    it('should return 0 for empty or invalid coordinates', () => {
      expect(GeometryUtil.computeHectares([])).toBe(0);
    });
  });

  describe('computeCentroid', () => {
    it('should compute the geometric center point [lat, lng]', () => {
      const centroid = GeometryUtil.computeCentroid(validSquarePolygon);
      expect(centroid.lat).toBeCloseTo(-17.745, 2);
      expect(centroid.lng).toBeCloseTo(31.355, 2);
    });

    it('should return zeroes for malformed polygon data', () => {
      expect(GeometryUtil.computeCentroid([])).toEqual({ lat: 0, lng: 0 });
      expect(GeometryUtil.computeCentroid([[[31.35, -17.75]]])).toEqual({ lat: 0, lng: 0 });
    });
  });

  describe('doPolygonsOverlap', () => {
    it('should detect overlap when two parcel boundaries intersect', () => {
      const overlap = GeometryUtil.doPolygonsOverlap(validSquarePolygon, overlappingPolygon);
      expect(overlap).toBe(true);
    });

    it('should return false for completely disjoint parcels', () => {
      const overlap = GeometryUtil.doPolygonsOverlap(validSquarePolygon, disjointPolygon);
      expect(overlap).toBe(false);
    });

    it('should detect when one parcel is fully contained inside another', () => {
      const smallerInside: number[][][] = [
        [
          [31.352, -17.748],
          [31.358, -17.748],
          [31.358, -17.742],
          [31.352, -17.742],
          [31.352, -17.748],
        ],
      ];
      const overlap = GeometryUtil.doPolygonsOverlap(validSquarePolygon, smallerInside);
      expect(overlap).toBe(true);
    });
  });
});
