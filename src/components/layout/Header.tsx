import Link from "next/link";
import { ChevronLeft, Bell, Share2 } from "lucide-react";

interface HeaderProps {
  title?: string;
  backHref?: string;
  showNotification?: boolean;
  showShare?: boolean;
}

export default function Header({ title, backHref, showNotification, showShare }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="w-9">
        {backHref && (
          <Link href={backHref} className="text-gray-500 hover:text-gray-700">
            <ChevronLeft size={26} />
          </Link>
        )}
      </div>

      {title && (
        <h1 className="text-base font-bold text-gray-800 text-center flex-1">{title}</h1>
      )}

      <div className="flex items-center gap-2 w-9 justify-end">
        {showShare && (
          <button className="text-gray-500">
            <Share2 size={20} />
          </button>
        )}
        {showNotification && (
          <button className="relative text-gray-500">
            <Bell size={22} />
            <span className="absolute -top-0.5 -start-0.5 w-2 h-2 bg-raz-danger rounded-full" />
          </button>
        )}
      </div>
    </header>
  );
}
