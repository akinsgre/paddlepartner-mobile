/**
 * Unit conversion utilities for distance measurements
 * 
 * Storage format: All distances stored in meters (canonical unit)
 * Display format: Convert to user's preferred unit (miles or kilometers)
 */

// Conversion constants
const METERS_PER_MILE = 1609.34
const METERS_PER_KILOMETER = 1000

/**
 * Convert meters to miles
 */
export function metersToMiles(meters: number): number {
  if (meters == null || isNaN(meters)) return 0
  return meters / METERS_PER_MILE
}

/**
 * Convert meters to kilometers
 */
export function metersToKilometers(meters: number): number {
  if (meters == null || isNaN(meters)) return 0
  return meters / METERS_PER_KILOMETER
}

/**
 * Convert miles to meters
 */
export function milesToMeters(miles: number): number {
  if (miles == null || isNaN(miles)) return 0
  return miles * METERS_PER_MILE
}

/**
 * Convert kilometers to meters
 */
export function kilometersToMeters(kilometers: number): number {
  if (kilometers == null || isNaN(kilometers)) return 0
  return kilometers * METERS_PER_KILOMETER
}

/**
 * Convert meters to user's preferred unit
 */
export function metersToUserUnit(meters: number, units: 'metric' | 'imperial'): number {
  if (units === 'imperial') {
    return metersToMiles(meters)
  }
  return metersToKilometers(meters)
}

/**
 * Convert from user's unit to meters
 */
export function userUnitToMeters(distance: number, units: 'metric' | 'imperial'): number {
  if (units === 'imperial') {
    return milesToMeters(distance)
  }
  return kilometersToMeters(distance)
}

/**
 * Get the unit label for display
 */
export function getUnitLabel(units: 'metric' | 'imperial'): string {
  return units === 'imperial' ? 'mi' : 'km'
}

/**
 * Format distance with appropriate precision and unit label
 */
export function formatDistance(meters: number, units: 'metric' | 'imperial', decimals: number = 2): string {
  const distance = metersToUserUnit(meters, units)
  const label = getUnitLabel(units)
  return `${distance.toFixed(decimals)} ${label}`
}
