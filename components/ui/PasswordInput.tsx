'use client';

import { useState } from 'react';

export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? 'text' : 'password'} className="input pr-11" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-ink"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}
