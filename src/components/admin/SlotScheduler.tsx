'use client';

import { useState } from 'react';
import { Candidate, Interview } from '@/types';
import { Calendar, Clock, Video, UserCheck, Plus, Check, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SlotSchedulerProps {
  candidates: Candidate[];
}

interface GeneratedSlot {
  id: string;
  timeString: string;
  assignedCandidateId: string | null;
  scheduled: boolean;
}

export function SlotScheduler({ candidates }: SlotSchedulerProps) {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [date, setDate] = useState(tomorrow);
  const [startHour, setStartHour] = useState('21'); // 9 PM
  const [startMinute, setStartMinute] = useState('00');
  const [duration, setDuration] = useState(20);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [slotCount, setSlotCount] = useState(6);
  const [platform, setPlatform] = useState('Google Meet');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/lcb-lead-evaluation');
  const [interviewer, setInterviewer] = useState('LCB Leadership Interview Panel');

  const [slots, setSlots] = useState<GeneratedSlot[]>([]);
  const [loadingSlotId, setLoadingSlotId] = useState<string | null>(null);

  // Filter candidates without interviews
  const availableCandidates = candidates.filter((c) => !c.interview);

  const formatAMPM = (hours: number, minutes: number) => {
    const h = hours % 24;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedH = h % 12 || 12;
    const formattedM = String(minutes).padStart(2, '0');
    return `${String(formattedH).padStart(2, '0')}:${formattedM} ${ampm}`;
  };

  const handleGenerateSlots = () => {
    let currentH = parseInt(startHour, 10);
    let currentM = parseInt(startMinute, 10);

    const generated: GeneratedSlot[] = [];

    for (let i = 0; i < slotCount; i++) {
      const timeStr = formatAMPM(currentH, currentM);
      generated.push({
        id: `slot-${i}-${Date.now()}`,
        timeString: timeStr,
        assignedCandidateId: null,
        scheduled: false,
      });

      // Increment by duration + break
      const totalMinutes = currentM + duration + breakMinutes;
      currentH += Math.floor(totalMinutes / 60);
      currentM = totalMinutes % 60;
    }

    setSlots(generated);
  };

  const handleAssignCandidate = (slotId: string, candidateId: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, assignedCandidateId: candidateId || null } : s))
    );
  };

  const handleConfirmSlot = async (slot: GeneratedSlot) => {
    if (!slot.assignedCandidateId) return;

    setLoadingSlotId(slot.id);
    try {
      const res = await fetch(`/api/admin/candidates/${slot.assignedCandidateId}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          time: slot.timeString,
          timezone: 'Asia/Dhaka (BST, GMT+6)',
          duration,
          meeting_platform: platform,
          meeting_link: meetingLink,
          interviewer,
          instructions: 'Please join 5 minutes early with your camera enabled.',
        }),
      });

      if (res.ok) {
        setSlots((prev) =>
          prev.map((s) => (s.id === slot.id ? { ...s, scheduled: true } : s))
        );
      }
    } catch (err) {
      console.error('Failed to schedule slot', err);
    } finally {
      setLoadingSlotId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Parameter Configuration Form */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
        <h2 className="text-lg font-bold text-white tracking-tight mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-400" />
          Batch Slot Generation Configuration
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Interview Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Start Time (24h)</label>
            <div className="flex gap-2">
              <select
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                className="w-1/2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={String(i)}>
                    {String(i).padStart(2, '0')} :00 ({i >= 12 ? (i % 12 || 12) + ' PM' : (i || 12) + ' AM'})
                  </option>
                ))}
              </select>
              <select
                value={startMinute}
                onChange={(e) => setStartMinute(e.target.value)}
                className="w-1/2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white"
              >
                <option value="00">00 min</option>
                <option value="15">15 min</option>
                <option value="20">20 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Slot Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white"
            >
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Buffer / Break</label>
            <select
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white"
            >
              <option value={0}>0 minutes (Back to back)</option>
              <option value={5}>5 minutes buffer</option>
              <option value={10}>10 minutes buffer</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Number of Slots</label>
            <input
              type="number"
              min={1}
              max={24}
              value={slotCount}
              onChange={(e) => setSlotCount(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white"
            >
              <option value="Google Meet">Google Meet</option>
              <option value="Zoom">Zoom</option>
              <option value="Microsoft Teams">Microsoft Teams</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Meeting Link</label>
            <input
              type="text"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleGenerateSlots}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate Interview Slots</span>
          </button>
        </div>
      </div>

      {/* Generated Slots Table */}
      {slots.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Generated Slot Allocations ({date})
              </h3>
              <p className="text-xs text-slate-400">
                Assign available shortlisted applicants to specific timeslots and confirm
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-semibold">
              {slots.filter((s) => s.scheduled).length} / {slots.length} Scheduled
            </span>
          </div>

          <div className="space-y-3">
            {slots.map((slot, index) => {
              const assignedCandidate = candidates.find((c) => c.id === slot.assignedCandidateId);

              return (
                <div
                  key={slot.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                    slot.scheduled
                      ? 'border-emerald-500/30 bg-emerald-950/20'
                      : 'border-white/5 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold font-mono">
                      #{index + 1}
                    </span>
                    <div>
                      <span className="text-sm font-bold text-white block">
                        {slot.timeString}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {duration} mins · {platform}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-1 max-w-md">
                    {slot.scheduled ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                        <Check className="h-4 w-4" />
                        <span>Confirmed for {assignedCandidate?.full_name}</span>
                      </div>
                    ) : (
                      <select
                        value={slot.assignedCandidateId || ''}
                        onChange={(e) => handleAssignCandidate(slot.id, e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="">Select candidate for slot...</option>
                        {availableCandidates.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.full_name} — {c.position} ({c.status})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    {slot.scheduled ? (
                      <Link
                        href={`/admin/candidates/${slot.assignedCandidateId}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        <span>View Portal</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={!slot.assignedCandidateId || loadingSlotId === slot.id}
                        onClick={() => handleConfirmSlot(slot)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition-all disabled:opacity-40"
                      >
                        {loadingSlotId === slot.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        <span>Assign & Confirm</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
