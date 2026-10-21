import { customAlphabet, nanoid } from 'nanoid'
import { supabase } from './supabase.js'

// 6 numeric digits — easy to read aloud
const digitCode = customAlphabet('0123456789', 6)

// Long hex-ish token for shareable links
const tokenGen = nanoid

/**
 * Generate a 6-digit code that isn't currently used by an active session.
 * Retries up to 10 times to avoid rare collisions.
 */
export async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = digitCode()
    const { data, error } = await supabase
      .from('sessions')
      .select('id')
      .eq('code', code)
      .eq('status', 'active')
      .maybeSingle()

    if (error) throw error
    if (!data) return code
  }
  throw new Error('Failed to generate a unique code after 10 attempts')
}

/**
 * Generate a URL-safe join token.
 */
export function generateJoinToken(): string {
  return tokenGen(24) // 24 chars = plenty unique
}