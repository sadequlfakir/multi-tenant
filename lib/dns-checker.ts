import * as dns from 'dns/promises'

export interface DnsCheckResult {
  ok: boolean
  message: string
  records?: string[]
  error?: string
}

/**
 * Check if a TXT record for the given domain contains the expected value.
 * Used to verify custom domain ownership (user adds TXT record with verification code).
 */
export async function checkTxtRecord(
  domain: string,
  expectedValue: string
): Promise<DnsCheckResult> {
  if (!domain?.trim() || !expectedValue?.trim()) {
    return {
      ok: false,
      message: 'Domain and expected value are required',
      error: 'Missing parameters',
    }
  }

  const normalizedDomain = domain.trim().toLowerCase()
  const normalizedExpected = expectedValue.trim()

  try {
    const records = await dns.resolveTxt(normalizedDomain)
    // resolveTxt returns string[][] - each record can be multiple strings (chunks)
    const flattened = records.flatMap((r) => r.map((s) => s.trim()).filter(Boolean))
    const found = flattened.some((value) => value === normalizedExpected)

    return {
      ok: found,
      message: found
        ? 'TXT record found. Domain verification successful.'
        : 'TXT record not found or value does not match. Add the record at your DNS provider and wait for propagation (can take up to 48 hours).',
      records: flattened.length > 0 ? flattened : undefined,
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    const code = (error as NodeJS.ErrnoException).code
    let message = 'DNS lookup failed.'

    if (code === 'ENOTFOUND' || code === 'ENODATA') {
      message = 'Domain has no TXT records yet, or domain does not exist. Add the TXT record and try again.'
    } else if (code === 'ETIMEOUT' || code === 'ESERVFAIL') {
      message = 'DNS server did not respond in time. Try again later.'
    }

    return {
      ok: false,
      message,
      error: error.message,
    }
  }
}
