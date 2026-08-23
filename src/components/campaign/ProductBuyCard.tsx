"use client";
import { Heart } from "lucide-react";
import { formatNIS } from "@/lib/mock-data";
import EditableText from "@/components/admin/EditableText";

interface ProductBuyCardProps {
  emoji: string;
  name: string;
  description: string;
  price: number;
  chosenCount: number;
  onBuy: () => void;
}

export default function ProductBuyCard({ emoji, name, description, price, chosenCount, onBuy }: ProductBuyCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
      <span className="text-4xl mb-2">{emoji}</span>
      <p className="font-bold text-gray-800 text-sm mb-1 leading-snug">{name}</p>
      <p className="text-xs text-gray-500 mb-2 leading-snug">{description}</p>
      <p className="font-bold text-raz-teal text-xl font-numeric mb-3">{formatNIS(price)}</p>
      <button
        onClick={onBuy}
        className="w-full bg-raz-teal text-white rounded-xl py-2.5 text-sm font-bold mb-2 hover:bg-raz-teal-dark transition-colors"
      >
        <EditableText tKey="campaign.ctaBuy" />
      </button>
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <span className="font-numeric">{chosenCount}</span>
        <Heart size={13} className="text-pink-400 fill-pink-400" />
        <span><EditableText tKey="campaign.chosen" /></span>
      </div>
    </div>
  );
}
