import { CandidateStatus, STATUS_CONFIG, RECRUITMENT_STEPS } from '@/types';
import { Check, Clock, AlertCircle, XCircle } from 'lucide-react';

interface TimelineStepperProps {
  status: CandidateStatus;
}

export function TimelineStepper({ status }: TimelineStepperProps) {
  const currentMeta = STATUS_CONFIG[status] || STATUS_CONFIG.APPLICATION_RECEIVED;
  const currentStep = currentMeta.stepIndex;

  const isTerminalNegative = status === 'NOT_SELECTED' || status === 'WITHDRAWN';
  const isWaitlisted = status === 'WAITLISTED';
  const isSelected = status === 'SELECTED';

  return (
    <div className="w-full">
      {/* Desktop Stepper (Horizontal) */}
      <div className="hidden md:block">
        <div className="relative flex items-center justify-between">
          {/* Continuous background track line */}
          <div className="absolute left-6 right-6 top-5 -translate-y-1/2 h-[2px] bg-slate-800" />

          {/* Active progress track line */}
          <div
            className={`absolute left-6 top-5 -translate-y-1/2 h-[2px] transition-all duration-700 ${
              isTerminalNegative
                ? 'bg-rose-500/60'
                : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400'
            }`}
            style={{
              width: `${(Math.min(currentStep, 5) / 5) * 88}%`,
            }}
          />

          {RECRUITMENT_STEPS.map((stepItem, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isUpcoming = index > currentStep;

            return (
              <div
                key={stepItem.step}
                className="relative z-10 flex flex-col items-center group"
                style={{ width: `${100 / RECRUITMENT_STEPS.length}%` }}
              >
                {/* Node circle */}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isCurrent
                      ? isTerminalNegative
                        ? 'border-rose-500 bg-rose-950/80 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                        : isSelected
                        ? 'border-emerald-400 bg-emerald-950/90 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.5)] ring-4 ring-emerald-500/20'
                        : 'border-cyan-400 bg-slate-900 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)] ring-4 ring-cyan-500/20'
                      : isCompleted
                      ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                      : 'border-slate-700 bg-slate-900/90 text-slate-500'
                  }`}
                >
                  {isCurrent ? (
                    isTerminalNegative ? (
                      <XCircle className="h-5 w-5" />
                    ) : isSelected ? (
                      <Check className="h-5 w-5 stroke-[2.5]" />
                    ) : (
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-300" />
                      </span>
                    )
                  ) : isCompleted ? (
                    <Check className="h-5 w-5 stroke-[2.5]" />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Step Title Label */}
                <div className="mt-3 text-center">
                  <p
                    className={`text-xs font-medium tracking-tight ${
                      isCurrent
                        ? isTerminalNegative
                          ? 'text-rose-400 font-semibold'
                          : 'text-white font-semibold'
                        : isCompleted
                        ? 'text-slate-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {stepItem.shortLabel}
                  </p>
                  <p className="text-[10px] text-slate-500 hidden lg:block">
                    {isCurrent ? 'Current Stage' : isCompleted ? 'Completed' : 'Upcoming'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Stepper (Vertical) */}
      <div className="md:hidden space-y-4">
        {RECRUITMENT_STEPS.map((stepItem, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={stepItem.step} className="flex items-start gap-3 relative">
              {/* Connecting line between steps */}
              {index < RECRUITMENT_STEPS.length - 1 && (
                <div
                  className={`absolute left-4 top-8 -bottom-3 w-[2px] ${
                    isCompleted ? 'bg-blue-500' : 'bg-slate-800'
                  }`}
                />
              )}

              {/* Node indicator */}
              <div
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                  isCurrent
                    ? isTerminalNegative
                      ? 'border-rose-500 bg-rose-950/80 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                      : isSelected
                      ? 'border-emerald-400 bg-emerald-950 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                      : 'border-cyan-400 bg-slate-900 text-cyan-300 ring-2 ring-cyan-500/20'
                    : isCompleted
                    ? 'border-blue-500 bg-blue-600 text-white'
                    : 'border-slate-700 bg-slate-900 text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 stroke-[2.5]" />
                ) : isCurrent ? (
                  isTerminalNegative ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  )
                ) : (
                  <span className="text-[11px] font-semibold">{index + 1}</span>
                )}
              </div>

              {/* Step info */}
              <div className="pt-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${
                      isCurrent
                        ? 'font-bold text-white'
                        : isCompleted
                        ? 'font-medium text-slate-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {stepItem.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-cyan-500/30">
                      Current
                    </span>
                  )}
                </div>
                {isCurrent && (
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    {currentMeta.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
