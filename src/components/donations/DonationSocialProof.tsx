"use client";

import type { CSSProperties } from "react";
import { Heart } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

export default function DonationSocialProof({
  count,
  className = "",
  iconSize = 12,
  style,
}: {
  count: number;
  className?: string;
  iconSize?: number;
  style?: CSSProperties;
}) {
  const { t } = useLang();

  return <span className={className} style={style}><Heart size={iconSize} className="me-1 inline-block align-[-0.125em] text-pink-500" fill="currentColor" /><bdi>{count.toLocaleString()}</bdi>{" "}{t("donation.socialProof")}</span>;
}
