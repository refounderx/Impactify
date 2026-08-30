export async function sharePage(title: string, url = window.location.href) {
  if (navigator.share) { await navigator.share({ title, url }); return "shared" as const; }
  await navigator.clipboard.writeText(url);
  return "copied" as const;
}
