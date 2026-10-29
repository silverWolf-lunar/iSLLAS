/**
 * Geospatial utilities for boundary validation, area computation, and overlap detection
 * Optimized for WGS84 (EPSG:4326) coordinates in Zimbabwe.
 */

export interface Point2D {
  lng: number;
  lat: number;
}

export class GeometryUtil {
  private static readonly EARTH_RADIUS_METERS = 6378137;

  /**
   * Validates GeoJSON polygon structure and topology
   */
  static validatePolygon(coordinates: any): { isValid: boolean; error?: string } {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      return { isValid: false, error: 'Polygon coordinates must have at least one linear ring' };
    }

    for (const ring of coordinates) {
      if (!Array.isArray(ring) || ring.length < 4) {
        return {
          isValid: false,
          error: 'Polygon ring must contain at least 4 coordinates (triangle + closure)',
        };
      }

      const first = ring[0];
      const last = ring[ring.length - 1];
      if (!Array.isArray(first) || !Array.isArray(last) ||
        Math.abs(first[0] - last[0]) > 1e-7 || Math.abs(first[1] - last[1]) > 1e-7) {
        return {
          isValid: false,
          error: 'Polygon ring is not closed: first and last coordinates must be identical',
        };
      }

      for (const point of ring) {
        if (!Array.isArray(point) || point.length < 2) {
          return { isValid: false, error: 'Coordinate point must have [longitude, latitude]' };
        }
        const [lng, lat] = point;
        if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          return {
            isValid: false,
            error: `Coordinate [${lng}, ${lat}] is out of bounds (lng: -180..180, lat: -90..90)`,
          };
        }
      }

      if (this.hasSelfIntersection(ring)) {
        return {
          isValid: false,
          error: 'Polygon boundary has self-intersecting segments (invalid simple polygon)',
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Computes geodesic area in hectares for a polygon on WGS84 sphere
   */
  static computeHectares(coordinates: any): number {
    if (!Array.isArray(coordinates) || coordinates.length === 0) return 0;
    const ring = coordinates[0];
    if (!Array.isArray(ring) || ring.length < 4) return 0;

    let total = 0;
    const n = ring.length - 1; // last point is same as first

    const toRad = (deg: number) => (deg * Math.PI) / 180;

    for (let i = 0; i < n; i++) {
      const prev = ring[(i - 1 + n) % n];
      const next = ring[(i + 1) % n];
      const curr = ring[i];

      if (!Array.isArray(prev) || !Array.isArray(next) || !Array.isArray(curr)) {
        return 0;
      }

      const lngDiff = toRad(next[0] - prev[0]);
      const latSin = Math.sin(toRad(curr[1]));

      total += lngDiff * latSin;
    }

    const areaSqMeters = Math.abs((total * Math.pow(this.EARTH_RADIUS_METERS, 2)) / 2);
    const hectares = areaSqMeters / 10000;
    return Math.round(hectares * 10000) / 10000; // 4 decimal places
  }

  /**
   * Computes the geometric centroid [lat, lng] of a polygon
   */
  static computeCentroid(coordinates: any): { lat: number; lng: number } {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      return { lat: 0, lng: 0 };
    }

    const ring = coordinates[0];
    if (!Array.isArray(ring) || ring.length === 0) {
      return { lat: 0, lng: 0 };
    }

    let sumLng = 0;
    let sumLat = 0;
    const count = Math.max(ring.length - 1, 0); // omit duplicate closure point

    for (let i = 0; i < count; i++) {
      const point = ring[i];
      if (!Array.isArray(point) || point.length < 2) {
        return { lat: 0, lng: 0 };
      }
      sumLng += point[0];
      sumLat += point[1];
    }

    if (count === 0) {
      return { lat: 0, lng: 0 };
    }

    return {
      lat: Math.round((sumLat / count) * 1000000) / 1000000,
      lng: Math.round((sumLng / count) * 1000000) / 1000000,
    };
  }

  /**
   * Bounding box [minLng, minLat, maxLng, maxLat]
   */
  static getBoundingBox(ring: number[][]): [number, number, number, number] {
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;

    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    return [minLng, minLat, maxLng, maxLat];
  }

  /**
   * Detects whether two polygons overlap (intersect in 2D space)
   */
  static doPolygonsOverlap(polyA: any, polyB: any): boolean {
    if (!Array.isArray(polyA) || !Array.isArray(polyB) || polyA.length === 0 || polyB.length === 0) {
      return false;
    }

    const ringA = Array.isArray(polyA[0]) ? polyA[0] : [];
    const ringB = Array.isArray(polyB[0]) ? polyB[0] : [];
    if (ringA.length === 0 || ringB.length === 0) {
      return false;
    }

    // Quick bounding-box rejection: only reject when the boxes are strictly disjoint.
    // Touching edges or a point-on-boundary case should still count as overlap.
    const bboxA = this.getBoundingBox(ringA);
    const bboxB = this.getBoundingBox(ringB);

    if (
      bboxA[2] < bboxB[0] ||
      bboxA[0] > bboxB[2] ||
      bboxA[3] < bboxB[1] ||
      bboxA[1] > bboxB[3]
    ) {
      return false;
    }

    // Check if any edge of ringA intersects any edge of ringB, including end-point touching.
    for (let i = 0; i < ringA.length - 1; i++) {
      const a1 = { lng: ringA[i][0], lat: ringA[i][1] };
      const a2 = { lng: ringA[i + 1][0], lat: ringA[i + 1][1] };

      for (let j = 0; j < ringB.length - 1; j++) {
        const b1 = { lng: ringB[j][0], lat: ringB[j][1] };
        const b2 = { lng: ringB[j + 1][0], lat: ringB[j + 1][1] };

        if (this.segmentsIntersect(a1, a2, b1, b2)) {
          return true;
        }
      }
    }

    // Check if one polygon is completely contained inside the other, including when the
    // first vertex lies on the boundary of the containing polygon.
    const aInsideB = ringA.some((point) => this.isPointInPolygon(point, ringB));
    const bInsideA = ringB.some((point) => this.isPointInPolygon(point, ringA));

    return aInsideB || bInsideA;
  }

  /**
   * Ray-casting algorithm to test point inside polygon, including points on the boundary.
   */
  static isPointInPolygon(point: number[], ring: number[][]): boolean {
    if (!Array.isArray(point) || point.length < 2 || !Array.isArray(ring) || ring.length === 0) {
      return false;
    }

    const x = point[0];
    const y = point[1];
    let inside = false;

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const current = ring[i];
      const previous = ring[j];
      if (!Array.isArray(current) || !Array.isArray(previous) || current.length < 2 || previous.length < 2) {
        return false;
      }

      const xi = current[0];
      const yi = current[1];
      const xj = previous[0];
      const yj = previous[1];

      if (this.isPointOnSegment({ lng: x, lat: y }, { lng: xj, lat: yj }, { lng: xi, lat: yi })) {
        return true;
      }

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * Helper: checks if line segment p1-p2 intersects segment q1-q2, including collinear touch/cross cases.
   */
  private static segmentsIntersect(
    p1: Point2D,
    p2: Point2D,
    q1: Point2D,
    q2: Point2D,
  ): boolean {
    const epsilon = 1e-9;
    const orientation = (a: Point2D, b: Point2D, c: Point2D) => {
      return (b.lng - a.lng) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lng - a.lng);
    };

    const onSegment = (point: Point2D, start: Point2D, end: Point2D) => {
      const minLng = Math.min(start.lng, end.lng) - epsilon;
      const maxLng = Math.max(start.lng, end.lng) + epsilon;
      const minLat = Math.min(start.lat, end.lat) - epsilon;
      const maxLat = Math.max(start.lat, end.lat) + epsilon;
      const cross = orientation(start, end, point);

      return (
        Math.abs(cross) <= epsilon &&
        point.lng >= minLng && point.lng <= maxLng &&
        point.lat >= minLat && point.lat <= maxLat
      );
    };

    const o1 = orientation(p1, p2, q1);
    const o2 = orientation(p1, p2, q2);
    const o3 = orientation(q1, q2, p1);
    const o4 = orientation(q1, q2, p2);

    if (Math.abs(o1) <= epsilon && onSegment(q1, p1, p2)) return true;
    if (Math.abs(o2) <= epsilon && onSegment(q2, p1, p2)) return true;
    if (Math.abs(o3) <= epsilon && onSegment(p1, q1, q2)) return true;
    if (Math.abs(o4) <= epsilon && onSegment(p2, q1, q2)) return true;

    return (o1 > 0) !== (o2 > 0) && (o3 > 0) !== (o4 > 0);
  }

  private static isPointOnSegment(point: Point2D, start: Point2D, end: Point2D): boolean {
    const epsilon = 1e-9;
    const minLng = Math.min(start.lng, end.lng) - epsilon;
    const maxLng = Math.max(start.lng, end.lng) + epsilon;
    const minLat = Math.min(start.lat, end.lat) - epsilon;
    const maxLat = Math.max(start.lat, end.lat) + epsilon;

    const cross = (end.lng - start.lng) * (point.lat - start.lat) - (end.lat - start.lat) * (point.lng - start.lng);
    return Math.abs(cross) <= epsilon &&
      point.lng >= minLng && point.lng <= maxLng &&
      point.lat >= minLat && point.lat <= maxLat;
  }

  /**
   * Check self-intersection within a single ring
   */
  private static hasSelfIntersection(ring: number[][]): boolean {
    const n = ring.length - 1;
    for (let i = 0; i < n; i++) {
      const a1 = { lng: ring[i][0], lat: ring[i][1] };
      const a2 = { lng: ring[i + 1][0], lat: ring[i + 1][1] };

      // Compare with non-adjacent edges
      for (let j = i + 2; j < n; j++) {
        // Skip last segment meeting first segment
        if (i === 0 && j === n - 1) continue;

        const b1 = { lng: ring[j][0], lat: ring[j][1] };
        const b2 = { lng: ring[j + 1][0], lat: ring[j + 1][1] };

        if (this.segmentsIntersect(a1, a2, b1, b2)) {
          return true;
        }
      }
    }
    return false;
  }
}
