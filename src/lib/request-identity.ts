import { isIP } from "node:net";

function expandIpv6(address: string) {
  const ipv4Match = address.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  let normalized = address.toLowerCase();
  if (ipv4Match && isIP(ipv4Match[2]) === 4) {
    const octets = ipv4Match[2].split(".").map(Number);
    normalized = `${ipv4Match[1]}${((octets[0] << 8) | octets[1]).toString(16)}:${((octets[2] << 8) | octets[3]).toString(16)}`;
  }
  const [leftText, rightText] = normalized.split("::", 2);
  const left = leftText ? leftText.split(":") : [];
  const right = rightText ? rightText.split(":") : [];
  const missing = 8 - left.length - right.length;
  if (missing < 0 || (!normalized.includes("::") && missing !== 0)) return null;
  return [...left, ...Array.from({ length: missing }, () => "0"), ...right]
    .map((part) => part.padStart(4, "0"));
}
export function normalizeRateLimitAddress(value: string | null) {
  const raw = value?.split(",", 1)[0].trim().replace(/%.+$/, "") ?? "";
  if (!raw || raw.length > 64) return null;
  if (isIP(raw) === 4) return raw;
  if (raw.toLowerCase().startsWith("::ffff:")) {
    const mapped = raw.slice(7);
    return isIP(mapped) === 4 ? mapped : null;
  }
  if (isIP(raw) !== 6) return null;
  const expanded = expandIpv6(raw);
  return expanded ? `${expanded.slice(0, 4).join(":")}::/64` : null;
}
