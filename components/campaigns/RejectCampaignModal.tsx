'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';

/**
 * Two-type campaign rejection (matches the Figma): "temporarily" lets the owner
 * correct and resubmit (→ REJECTED); "entirely" is terminal (→ CANCELLED).
 */
export function RejectCampaignModal({
  name,
  pending,
  onClose,
  onConfirm,
}: {
  name: string;
  pending?: boolean;
  onClose: () => void;
  onConfirm: (v: { reason: string; terminal: boolean }) => void;
}) {
  const [terminal, setTerminal] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <Modal title={`Reject ${name}?`} onClose={onClose}>
      <p className="text-[13.5px] text-muted">Choose how this campaign is rejected — a reason is required and shown to the business.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <TypeCard
          active={!terminal}
          onClick={() => setTerminal(false)}
          title="Reject temporarily"
          desc="Send a reason the owner can fix, then resubmit."
        />
        <TypeCard
          active={terminal}
          onClick={() => setTerminal(true)}
          title="Reject entirely"
          desc="The campaign breaks policy — cancelled, not resubmittable."
          danger
        />
      </div>

      <div className="mt-4">
        <Field label="Reason for rejection">
          <textarea
            className="input min-h-24"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={terminal ? 'e.g. The creative violates our content policy.' : 'e.g. The destination link is broken — fix it and resubmit.'}
          />
        </Field>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={pending}>Cancel</Button>
        <Button variant="danger" loading={pending} disabled={reason.trim().length < 5} onClick={() => onConfirm({ reason, terminal })}>
          Send rejection
        </Button>
      </div>
    </Modal>
  );
}

function TypeCard({ active, onClick, title, desc, danger }: { active: boolean; onClick: () => void; title: string; desc: string; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-3.5 text-left transition ${active ? (danger ? 'border-brand bg-brand/5' : 'border-brand bg-brand/5') : 'border-rule hover:bg-wash'}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-bold text-ink">{title}</span>
        <span className={`h-4 w-4 rounded-full border ${active ? 'border-brand bg-brand' : 'border-rule'}`} />
      </div>
      <p className="mt-1 text-[12px] leading-snug text-muted">{desc}</p>
    </button>
  );
}
