/**
 * Common utility functions for the Nouri app
 */

/**
 * Normalizes an email address by trimming whitespace and converting to lowercase
 */
export function normalizeEmail(email: string): string {
    return (email || '').trim().toLowerCase();
}
