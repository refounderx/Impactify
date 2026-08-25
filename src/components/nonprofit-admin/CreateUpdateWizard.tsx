"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { useNgoAdminView } from "@/hooks/useNgoAdminView";
import WizardShell from "@/components/wizard/WizardShell";
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
  const { data } = useNgoAdminView();
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

  const targetOptions = audience === "products" ? (data?.adminProductRows ?? []) : (data?.adminCampaignRows ?? []);

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
  const stepTitles = [t("adm.uw.step1Title"), t("adm.uw.step2Title"), t("adm.uw.step3Title")];
  const stepDescriptions = [t("adm.uw.step1Body"), t("adm.uw.step2Body"), lang === "en" ? "Write the message and add the media recipients will see." : "כתבו את ההודעה והוסיפו את המדיה שהנמענים יראו."];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-raz-dark/80 p-0 backdrop-blur-[2px] md:p-7">
      <WizardShell
        step={step}
        stepCount={STEP_COUNT}
        title={stepTitles[step]}
        description={stepDescriptions[step]}
        className="h-full max-w-6xl md:h-[min(760px,calc(100dvh-3.5rem))] md:rounded-[2px]"
        topActions={(
          <>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={lang === "en" ? "Close" : "סגירה"}>
              <X size={18} />
            </button>
            <span className="rounded-full bg-raz-dark px-3 py-1 text-[11px] font-bold text-white">{t("adm.createUpdate")}</span>
          </>
        )}
        railContent={<PreviewPanel t={t} lang={lang} step={step} title={title} body={body} imageName={imageName} channels={channels} />}
        footer={(
          <>
            <button onClick={back} disabled={step === 0} className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 disabled:invisible">
              {t("adm.uw.back")}
            </button>
            {step < STEP_COUNT - 1 ? (
              <button onClick={next} disabled={step === 0 ? !canAdvanceStep0 : false} className="rounded-full border border-raz-teal px-6 py-2.5 text-sm font-bold text-raz-teal hover:bg-raz-teal hover:text-white disabled:opacity-40">
                {t("adm.uw.next")}
              </button>
            ) : (
              <button onClick={handleSend} disabled={!canAdvanceStep2} className="rounded-full bg-raz-teal px-7 py-2.5 text-sm font-bold text-white hover:bg-teal-500 disabled:opacity-40">
                {t("adm.uw.send")}
              </button>
            )}
          </>
        )}
      >
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
      </WizardShell>
    </div>
  );
}
