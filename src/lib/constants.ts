/**
 * Business rule constants for LetLog.
 *
 * Centralises magic numbers that were previously scattered
 * across the codebase as raw expressions.
 */

/** Days before expiry to show compliance warning badges. */
export const COMPLIANCE_WARNING_DAYS = 30;

/** Days within which a review can be left after a job completes. */
export const REVIEW_WINDOW_DAYS = 60;

/** Default number of days an invitation link remains valid. */
export const INVITATION_EXPIRY_DAYS = 7;

/** Days ahead to scan for upcoming tenant events. */
export const UPCOMING_EVENTS_HORIZON_DAYS = 60;

/** Days until a tenancy end date triggers the "urgent" badge. */
export const TENANCY_END_URGENT_DAYS = 14;

/** Days until a tenancy end date triggers the "warning" badge. */
export const TENANCY_END_WARNING_DAYS = 30;

/** Maximum days into the future to show tenancy ending notices. */
export const TENANCY_END_NOTICE_DAYS = 90;

/** Default locale for date formatting. */
export const DEFAULT_LOCALE = "en-GB";
