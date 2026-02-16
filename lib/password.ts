/**
 * Password hashing and verification utilities using bcryptjs.
 * All passwords should be hashed before storage and compared using these functions.
 */

import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

/**
 * Check if a string looks like a bcrypt hash (starts with $2a$, $2b$, or $2y$).
 */
function isBcryptHash(str: string): boolean {
  return /^\$2[ayb]\$.{56}$/.test(str)
}

/**
 * Hash a plain text password.
 * @param plainPassword - The plain text password to hash
 * @returns The hashed password
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS)
}

/**
 * Compare a plain text password with a stored password (hashed or plain text for backward compatibility).
 * Supports both bcrypt hashes and plain text passwords during migration period.
 * @param plainPassword - The plain text password to verify
 * @param storedPassword - The stored password (may be hashed or plain text)
 * @returns True if passwords match, false otherwise
 */
export async function comparePassword(plainPassword: string, storedPassword: string): Promise<boolean> {
  // If stored password looks like a bcrypt hash, use bcrypt comparison
  if (isBcryptHash(storedPassword)) {
    return bcrypt.compare(plainPassword, storedPassword)
  }
  
  // Otherwise, compare directly (backward compatibility for existing plain text passwords)
  // This allows existing users to log in while new passwords are hashed
  return plainPassword === storedPassword
}
