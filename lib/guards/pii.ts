export interface PiiResult {
  text: string;
  /** Kinds of sensitive data that were masked, for display in the UI. */
  findings: string[];
}

export function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

const CARD_CANDIDATE = /\b\d(?:[ -]?\d){12,18}\b/g;
const OTP =
  /\b(otp|one[- ]time (?:password|code)|verification code|passcode|pin)\b([^\d\n]{0,20})(\d{4,8})\b/gi;
const CVV = /\b(cvv2?|cvc|security code)\b([^\d\n]{0,10})(\d{3,4})\b/gi;

/** Mask card numbers (Luhn-checked), OTPs and CVVs before logging or any provider call. */
export function maskPii(input: string): PiiResult {
  const findings = new Set<string>();

  let text = input.replace(CARD_CANDIDATE, (match) => {
    const digits = match.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19 || !luhnValid(digits)) return match;
    findings.add("card number");
    return `XXXX XXXX XXXX ${digits.slice(-4)}`;
  });

  text = text.replace(CVV, (_m, label, gap) => {
    findings.add("CVV");
    return `${label}${gap}***`;
  });

  text = text.replace(OTP, (_m, label, gap) => {
    findings.add("OTP");
    return `${label}${gap}******`;
  });

  return { text, findings: [...findings] };
}
