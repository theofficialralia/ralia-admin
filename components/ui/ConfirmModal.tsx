'use client';

import { Button } from './Button';
import { Modal } from './Modal';

/**
 * A simple confirm dialog for reversible-but-consequential actions
 * (deactivate / reactivate a user), matching the design's confirm modals.
 */
export function ConfirmModal({
  title,
  body,
  confirmLabel = 'Confirm',
  danger = false,
  pending,
  onClose,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-[13.5px] text-muted">{body}</p>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={pending}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={pending}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
