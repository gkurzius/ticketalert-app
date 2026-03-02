import type { NextRequest } from 'next/server'

export function verifyBearerAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return authHeader === `Bearer ${cronSecret}`
}

export function verifyBasicAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') ?? ''
  if (!authHeader.startsWith('Basic ')) return false
  try {
    const b64 = authHeader.replace('Basic ', '')
    const decoded = atob(b64)
    const [, password] = decoded.split(':')
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) return false
    return password === adminPassword
  } catch {
    return false
  }
}

export function isAuthorized(req: NextRequest): boolean {
  return verifyBearerAuth(req) || verifyBasicAuth(req)
}
