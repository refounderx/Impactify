"use client";

import { useState } from "react";

const PALETTE = ["#00B5AD", "#2563EB", "#7C3AED", "#DB2777", "#E11D48", "#EA580C", "#65A30D", "#0F766E"];

export function normalizeBrandColor(value: string) {
  const trimmed = value.trim();
  const hex = trimmed.match(/^#?([0-9a-f]{6})$/i);
  if (hex) return `#${hex[1].toUpperCase()}`;
  const rgb = trimmed.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
  if (!rgb) return null;
  const channels = rgb.slice(1).map(Number);
  if (channels.some((channel) => channel > 255)) return null;
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

type Props = {
  color: string;
  onChange: (color: string, valid: boolean) => void;
  lang: "he" | "en";
};

export default function BrandColorPicker({ color, onChange, lang }: Props) {
  const [customValue, setCustomValue] = useState("");
  const [customError, setCustomError] = useState(false);

  function selectPalette(value: string) {
    setCustomValue("");
    setCustomError(false);
    onChange(value, true);
  }

  function updateCustom(value: string) {
    setCustomValue(value);
    const normalized = normalizeBrandColor(value);
    const invalid = value.trim().length > 0 && !normalized;
    setCustomError(invalid);
    onChange(normalized ?? color, !invalid);
  }

  const copy = lang === "en"
    ? {
        title: "What is your leading brand color?",
        detail: "Choose a color that represents your organization. You can refine it later.",
        custom: "Custom HEX or RGB",
        placeholder: "#C3D898 or rgb(195, 216, 152)",
        error: "Enter a 6-digit HEX color or RGB values from 0 to 255.",
        preview: "Your brand color",
      }
    : {
        title: "מהו צבע המותג המוביל שלכם?",
        detail: "בחרו צבע שמייצג את העמותה או הקהילה. תמיד תוכלו לעדכן אותו בהמשך.",
        custom: "צבע מותאם אישית — HEX או RGB",
        placeholder: "#C3D898 או rgb(195, 216, 152)",
        error: "הזינו צבע HEX בן 6 ספרות או ערכי RGB בין 0 ל-255.",
        preview: "צבע המותג שלכם",
      };

  return (
    <fieldset className="flow-reveal rounded-2xl border border-gray-100 bg-slate-50/70 p-4">
      <legend className="sr-only">{copy.title}</legend>
      <p className="text-sm font-bold text-gray-800">{copy.title}</p>
      <p className="mt-1 text-xs leading-5 text-gray-500">{copy.detail}</p>
      <div className="mt-3 grid grid-cols-4 gap-2" aria-label={copy.title}>
        {PALETTE.map((paletteColor) => (
          <button
            key={paletteColor}
            type="button"
            onClick={() => selectPalette(paletteColor)}
            aria-label={paletteColor}
            aria-pressed={color === paletteColor && !customValue}
            className={`interactive-control relative h-10 rounded-xl border-2 ${color === paletteColor && !customValue ? "border-gray-800 ring-2 ring-raz-teal/30" : "border-white"}`}
            style={{ backgroundColor: paletteColor }}
          >
            {color === paletteColor && !customValue && <span className="text-lg text-white drop-shadow" aria-hidden="true">✓</span>}
          </button>
        ))}
      </div>
      <label className="mt-3 block text-xs font-bold text-gray-600">
        {copy.custom}
        <input
          value={customValue}
          onChange={(event) => updateCustom(event.target.value)}
          placeholder={copy.placeholder}
          dir="ltr"
          maxLength={30}
          aria-invalid={customError}
          className={`interactive-field mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-gray-800 ${customError ? "border-red-400" : "border-gray-200"}`}
        />
      </label>
      {customError && <p className="mt-1.5 text-xs text-red-600" role="alert">{copy.error}</p>}
      <div className="mt-3 flex items-center gap-2 text-xs font-bold text-gray-600">
        <span className="h-5 w-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }} />
        <span>{copy.preview}: {color}</span>
      </div>
    </fieldset>
  );
}
