"use client";

import { useState } from "react";
import { HeartHandshake } from "lucide-react";

export default function OnboardingWelcome({
  title,
  description,
  actionLabel,
}: {
  title: string;
  description: string;
  actionLabel: string;
}) {
  const [leaving, setLeaving] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  function start() {
    setLeaving(true);
    window.setTimeout(() => setVisible(false), 620);
  }

  return (
    <div className={`onboarding-welcome ${leaving ? "is-leaving" : ""}`} aria-hidden={leaving}>
      <HeartHandshake className="onboarding-welcome-icon" size={80} strokeWidth={1.35} />
      <h1 className="onboarding-welcome-title">{title}</h1>
      <p className="onboarding-welcome-description">{description}</p>
      <button type="button" onClick={start} className="onboarding-primary-button bg-white !text-[#12c2b9]">
        {actionLabel}
      </button>
    </div>
  );
}
