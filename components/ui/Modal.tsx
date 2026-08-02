'use client';

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-2xl bg-paper p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[18px] font-extrabold text-ink">{title}</h3>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
