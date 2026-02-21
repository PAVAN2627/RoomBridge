// Validation helper functions
// Used for client-side validation and Security Rules validation

/**
 * Validates email format
 * @param email - Email address to validate
 * @returns true if email matches valid format pattern
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number format (10 digits)
 * @param phone - Phone number to validate
 * @returns true if phone contains exactly 10 digits
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates age is within acceptable range
 * @param age - Age to validate
 * @returns true if age is between 18 and 100 inclusive
 */
export function validateAge(age: number): boolean {
  return age >= 18 && age <= 100;
}

/**
 * Validates geographic coordinates
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns true if coordinates are within valid ranges
 */
export function validateCoordinates(latitude: number, longitude: number): boolean {
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

/**
 * Validates amount is positive
 * @param amount - Amount to validate
 * @returns true if amount is greater than 0
 */
export function validateAmount(amount: number): boolean {
  return amount > 0;
}

/**
 * Validates listing type enum value
 * @param listingType - Listing type to validate
 * @returns true if listing type is a valid enum value
 */
export function validateListingType(listingType: string): boolean {
  const validTypes = ['long_term', 'pg', 'flatmate', 'short_stay', 'emergency'];
  return validTypes.includes(listingType);
}

/**
 * Validates request type enum value
 * @param requestType - Request type to validate
 * @returns true if request type is a valid enum value
 */
export function validateRequestType(requestType: string): boolean {
  const validTypes = ['normal', 'emergency'];
  return validTypes.includes(requestType);
}

/**
 * Validates status enum value for listings
 * @param status - Status to validate
 * @returns true if status is a valid enum value
 */
export function validateListingStatus(status: string): boolean {
  const validStatuses = ['active', 'inactive', 'rented', 'deleted'];
  return validStatuses.includes(status);
}

/**
 * Validates status enum value for room requests
 * @param status - Status to validate
 * @returns true if status is a valid enum value
 */
export function validateRequestStatus(status: string): boolean {
  const validStatuses = ['active', 'fulfilled', 'expired', 'deleted'];
  return validStatuses.includes(status);
}

/**
 * Validates verification type enum value
 * @param verificationType - Verification type to validate
 * @returns true if verification type is a valid enum value
 */
export function validateVerificationType(verificationType: string): boolean {
  const validTypes = ['student', 'professional', 'aadhaar', 'pan', 'selfie'];
  return validTypes.includes(verificationType);
}

/**
 * Validates report type enum value
 * @param reportType - Report type to validate
 * @returns true if report type is a valid enum value
 */
export function validateReportType(reportType: string): boolean {
  const validTypes = ['fake_identity', 'broker', 'scam', 'harassment'];
  return validTypes.includes(reportType);
}

/**
 * Validates rating stars value
 * @param stars - Stars rating to validate
 * @returns true if stars is between 1 and 5 inclusive
 */
export function validateStars(stars: number): boolean {
  return Number.isInteger(stars) && stars >= 1 && stars <= 5;
}

/**
 * Validates images array size
 * @param images - Array of image URLs
 * @returns true if array contains 10 or fewer items
 */
export function validateImagesArray(images: string[]): boolean {
  return Array.isArray(images) && images.length <= 10;
}

/**
 * Validates participant IDs array for chat sessions
 * @param participantIds - Array of user IDs
 * @returns true if array contains exactly 2 unique user IDs
 */
export function validateParticipantIds(participantIds: string[]): boolean {
  return (
    Array.isArray(participantIds) &&
    participantIds.length === 2 &&
    participantIds[0] !== participantIds[1]
  );
}
