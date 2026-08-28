"use client";
import Link from "next/link";
import { ChevronLeft, Bell, Share2 } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

interface HeaderProps {
  title?: string;
  backHref?: string;
  showNotification?: boolean;
  showShare?: boolean;
}

export default function Header({ title, backHref, showNotification, showShare }: HeaderProps) {
  const { t } = useLang();
  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="w-9">
        {backHref && (
          <Link href={backHref} className="micro-hint text-gray-500 hover:text-gray-700" aria-label={t("hint.back")}>
            <ChevronLeft size={26} />
          </Link>
        )}
      </div>

      {title && (
        <h1 className="text-base font-bold text-gray-800 text-center flex-1">{title}</h1>
      )}

      <div className="flex items-center gap-2 w-9 justify-end">
        {showShare && (
          <button className="micro-hint text-gray-500" aria-label={t("hint.share")}>
            <Share2 size={20} />
          </button>
        )}
        {showNotification && (
          <button className="micro-hint relative text-gray-500" aria-label={t("hint.notifications")}>
            <Bell size={22} />
            <span className="absolute -top-0.5 -start-0.5 w-2 h-2 bg-raz-danger rounded-full" />
          </button>
        )}
      </div>
    </header>
  );
}
