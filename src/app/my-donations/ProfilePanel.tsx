"use client";

import UnifiedProfileContent from "@/components/profile/UnifiedProfileContent";

interface Props { t: (key: string) => string }

export default function ProfilePanel({ t: _t }: Props) {
  void _t;
  return <div className="mb-24"><UnifiedProfileContent /></div>;
}
