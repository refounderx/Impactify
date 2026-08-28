const SOCIAL_NAMES: Record<string, string> = {
  W: "WhatsApp",
  IG: "Instagram",
  f: "Facebook",
  in: "LinkedIn",
};

export function getSocialLinkLabel(label: string) {
  return SOCIAL_NAMES[label] ?? label;
}
