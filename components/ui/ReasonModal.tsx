'use client';

import { useState } from 'react';
import { Button } from './Button';
import { Field } from './Field';
import { Modal } from './Modal';

export function ReasonModal({
  title,
  placeholder,
  confirmLabel = 'Confirm',
  pending,
  onClose,
  onConfirm,
}: {
  title: string;
  placeholder?: string;
  confirmLabel?: string;
  pending?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-[13.5px] text-muted">A reason is required — it is recorded and shown to the affected party.</p>
      <Field>
        <textarea className="input mt-3 min-h-24" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={placeholder} />
      </Field>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={pending}>Cancel</Button>
        <Button variant="danger" onClick={() => onConfirm(reason)} loading={pending} disabled={reason.trim().length < 5}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
