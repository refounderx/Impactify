type CampaignTarget = {
  goalType?: "deadline" | "monthly" | "annual";
  periodEnd?: string | null;
  daysLeft?: number;
};

export function campaignTargetLabel(campaign: CampaignTarget, lang: "he" | "en") {
  if (campaign.goalType === "monthly") return lang === "en" ? "Monthly target" : "יעד חודשי";
  if (campaign.goalType === "annual") return lang === "en" ? "Annual target" : "יעד שנתי";
  if (!campaign.periodEnd) return lang === "en" ? "Campaign target" : "יעד הקמפיין";
  const date = new Intl.DateTimeFormat(lang === "en" ? "en-IL" : "he-IL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${campaign.periodEnd}T00:00:00`));
  return lang === "en" ? `Target until ${date}` : `יעד עד ${date}`;
}

export function campaignTimeRemaining(campaign: CampaignTarget, lang: "he" | "en") {
  if (campaign.goalType === "monthly") return lang === "en" ? "Resets at the start of every month" : "מתאפס בתחילת כל חודש";
  if (campaign.goalType === "annual") return lang === "en" ? "Resets at the start of every year" : "מתאפס בתחילת כל שנה";
  if (typeof campaign.daysLeft !== "number") return "";
  return lang === "en" ? `${campaign.daysLeft} days remaining` : `${campaign.daysLeft} ימים נותרו`;
}
