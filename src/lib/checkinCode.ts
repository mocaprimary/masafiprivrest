export type ParsedCheckInCode = {
  /** Random single-use token stored on the reservation row (reservations.qr_code) */
  qrCode?: string;
  /** Human-readable reservation number like RES-YYYYMMDD-1234 */
  reservationNumber?: string;
};

const RESERVATION_NUMBER_REGEX = /RES-\d{8}-\d{4}/i;
const QR_TOKEN_REGEX = /^[a-f0-9]{64}$/i;

/**
 * Accepts multiple QR payload formats:
 * - Reservation number (RES-YYYYMMDD-1234)
 * - Random token (64-char hex)
 * - A URL that contains either value in query params or path
 */
export function parseCheckInCode(input: string): ParsedCheckInCode {
  const raw = (input ?? '').trim();
  if (!raw) return {};

  // If the QR encodes a URL, try to extract something useful.
  try {
    const url = new URL(raw);
    const qp = url.searchParams;

    const candidate =
      qp.get('qr') ||
      qp.get('qrCode') ||
      qp.get('code') ||
      qp.get('reservation') ||
      qp.get('reservationNumber') ||
      qp.get('res') ||
      url.pathname.split('/').filter(Boolean).pop();

    if (candidate) return parseCheckInCode(candidate);
  } catch {
    // not a URL
  }

  // Reservation number
  if (RESERVATION_NUMBER_REGEX.test(raw)) {
    const match = raw.match(RESERVATION_NUMBER_REGEX);
    return { reservationNumber: (match?.[0] || raw).toUpperCase() };
  }

  // QR token
  if (QR_TOKEN_REGEX.test(raw)) {
    return { qrCode: raw.toLowerCase() };
  }

  // Fallback: treat unknown payloads as QR token-like codes.
  return { qrCode: raw };
}
