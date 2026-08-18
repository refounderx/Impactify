"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { adminProductRows, adminCampaignRows } from "@/lib/nonprofit-admin-data";
import {
  Step0, Step1, Step2, PreviewPanel,
  type Audience, type Timing, type Trigger, type Cta,
} from "./CreateUpdateWizardSteps";

export type NewUpdateDraft = {
  audience: Audience;
  targetIds: string[];
  channels: { push: boolean; email: boolean; sms: boolean };
  timing: Timing;
  scheduledAt: string;
  trigger: Trigger;
  title: string;
  body: string;
  cta: Cta;
  imageName: string | null;
};

interface Props {
  lang: string;
  t: (k: string) => string;
  onClose: () => void;
  onCreate: (draft: NewUpdateDraft) => void;
}

const STEP_COUNT = 3;

export default function CreateUpdateWizard({ lang, t, onClose, onCreate }: Props) {
  const [step, setStep] = useState(0);
  const [audience, setAudience] = useState<Audience>("campaigns");
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [channels, setChannels] = useState({ push: true, email: true, sms: false });
  const [timing, setTiming] = useState<Timing>("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [trigger, setTrigger] = useState<Trigger>("donation");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [cta, setCta] = useState<Cta>("none");
  const [imageName, setImageName] = useState<string | null>(null);

  const targetOptions = audience === "products" ? adminProductRows : adminCampaignRows;

  function toggleTarget(id: string) {
    setTargetIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  function next() { setStep((s) => Math.min(s + 1, STEP_COUNT - 1)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  function handleSend() {
    onCreate({ audience, targetIds, channels, timing, scheduledAt, trigger, title, body, cta, imageName });
  }

  const canAdvanceStep0 = audience === "all" || targetIds.length > 0;
  const canAdvanceStep2 = title.trim().length > 0 && body.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-raz-surface flex flex-col">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={22} />
        </button>
        <h1 className="font-bold text-gray-800 text-sm flex-1">{t("adm.createUpdate")}</h1>
        <span className="text-xs text-gray-400">
          {step + 1} {t("adm.uw.stepOf")} {STEP_COUNT}
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {step === 0 && (
            <Step0
              t={t} lang={lang}
              audience={audience} setAudience={setAudience}
              targetIds={targetIds} toggleTarget={toggleTarget}
              targetOptions={targetOptions}
            />
          )}
          {step === 1 && (
            <Step1
              t={t}
              channels={channels} setChannels={setChannels}
              timing={timing} setTiming={setTiming}
              scheduledAt={scheduledAt} setScheduledAt={setScheduledAt}
              trigger={trigger} setTrigger={setTrigger}
            />
          )}
          {step === 2 && (
            <Step2
              t={t}
              title={title} setTitle={setTitle}
              body={body} setBody={setBody}
              cta={cta} setCta={setCta}
              imageName={imageName} setImageName={setImageName}
            />
          )}

          <div className="flex gap-3 mt-8 max-w-xl">
            {step > 0 && (
              <button onClick={back} className="text-gray-500 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                {t("adm.uw.back")}
              </button>
            )}
            {step < STEP_COUNT - 1 ? (
              <button
                onClick={next}
                disabled={step === 0 ? !canAdvanceStep0 : false}
                className="bg-raz-teal text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-teal-500 transition-colors disabled:opacity-40"
              >
                {t("adm.uw.next")}
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!canAdvanceStep2}
                className="bg-raz-teal text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-teal-500 transition-colors disabled:opacity-40"
              >
                {t("adm.uw.send")}
              </button>
            )}
          </div>
        </div>

        <PreviewPanel t={t} lang={lang} step={step} title={title} body={body} imageName={imageName} channels={channels} />
      </div>
    </div>
  );
}
