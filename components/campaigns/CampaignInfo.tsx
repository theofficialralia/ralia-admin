'use client';

import { useEffect, useState } from 'react';
import type { CampaignAsset, CampaignDetail, CampaignTargeting } from '@/lib/api';
import { IconChevronLeft, IconChevronRight, IconClose, IconExternal } from '@/components/brand/icons';
import { compactNumber, titleCase } from '@/lib/format';

/** ₦ per promoter, derived from the frozen price ÷ slots. */
export function perPromoterDisplay(c: Pick<CampaignDetail, 'price' | 'budget' | 'slots_total'>): string | null {
  const total = (c.price ?? c.budget)?.amount_minor;
  if (total == null || !c.slots_total) return null;
  return `₦${Math.round(total / 100 / c.slots_total).toLocaleString()}`;
}

/** "3 posters · 1 caption · logo" from the asset kinds. */
export function creativeSummary(assets: CampaignAsset[]): string {
  if (!assets.length) return 'No creative supplied';
  const counts = new Map<string, number>();
  for (const a of assets) counts.set(a.kind, (counts.get(a.kind) ?? 0) + 1);
  return [...counts.entries()]
    .map(([kind, n]) => {
      const label = titleCase(kind).toLowerCase();
      return n > 1 ? `${n} ${label}s` : label;
    })
    .join(' · ');
}

export function TargetingPills({ targeting }: { targeting: CampaignTargeting }) {
  const pills: string[] = [];
  if (targeting.states.length) pills.push(...targeting.states);
  else pills.push('Nationwide');
  if (targeting.age_min || targeting.age_max) pills.push(`${targeting.age_min ?? 18}-${targeting.age_max ?? '60+'}`);
  else pills.push('All ages');
  targeting.genders.forEach((g) => pills.push(titleCase(g)));
  targeting.platforms.forEach((p) => pills.push(titleCase(p)));
  targeting.languages.forEach((l) => pills.push(titleCase(l)));
  targeting.categories.forEach((c) => pills.push(titleCase(c)));
  if (targeting.min_effective_reach) pills.push(`${compactNumber(targeting.min_effective_reach)} potential reach`);

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((p, i) => (
        <span key={`${p}-${i}`} className="rounded-full bg-brand/8 px-3 py-1 text-[12.5px] font-semibold text-brand-700">{p}</span>
      ))}
    </div>
  );
}

/** Asset tiles. Uploaded files are served at /v1/files/:id. Image assets show a
 *  clickable thumbnail that opens full size in an on-page lightbox (no new tab);
 *  other files show a "View file" link. */
export function AssetsGrid({ assets }: { assets: CampaignAsset[] }) {
  const isImage = (kind: string) => ['POSTER', 'IMAGE', 'LOGO'].includes(kind.toUpperCase());
  const images = assets.filter((a) => a.file_id && isImage(a.kind));
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Esc closes; arrow keys page through the images while the lightbox is open.
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === 'ArrowLeft') setLightbox((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, images.length]);

  if (!assets.length) return <p className="text-[13px] text-muted">No assets uploaded - the client asked Ralia to design the creative.</p>;

  return (
    <>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {assets.map((a) => {
          const url = a.file_id ? `/v1/files/${a.file_id}` : null;
          if (url && isImage(a.kind)) {
            const idx = images.findIndex((x) => x.id === a.id);
            return (
              <button key={a.id} type="button" onClick={() => setLightbox(idx)} className="group relative block aspect-square overflow-hidden rounded-2xl border border-rule focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50" aria-label={`View ${titleCase(a.kind)} full size`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={titleCase(a.kind)} className="h-full w-full object-cover transition group-hover:scale-105" />
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">{titleCase(a.kind)}</span>
              </button>
            );
          }
          return (
            <div key={a.id} className="flex aspect-square flex-col justify-between overflow-hidden rounded-2xl border border-rule bg-gradient-to-br from-wash to-brand/5 p-3">
              <span className="text-[11px] font-bold uppercase tracking-wide text-brand-700">{titleCase(a.kind)}</span>
              {a.caption_text ? (
                <span className="line-clamp-3 text-[11.5px] text-body">“{a.caption_text}”</span>
              ) : url ? (
                <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand-700 underline">View file <IconExternal className="h-3 w-3" /></a>
              ) : (
                <span className="text-[11px] text-muted">-</span>
              )}
            </div>
          );
        })}
      </div>

      {lightbox !== null && images[lightbox] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${titleCase(images[lightbox].kind)} preview`}
        >
          <button type="button" onClick={() => setLightbox(null)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" aria-label="Close">
            <IconClose className="h-5 w-5" />
          </button>
          {images.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i === null ? i : (i - 1 + images.length) % images.length)); }} className="absolute left-3 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6" aria-label="Previous">
                <IconChevronLeft className="h-6 w-6" />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i === null ? i : (i + 1) % images.length)); }} className="absolute right-3 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6" aria-label="Next">
                <IconChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <figure className="max-h-[88vh] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/v1/files/${images[lightbox].file_id}`} alt={titleCase(images[lightbox].kind)} className="max-h-[82vh] max-w-[92vw] rounded-xl object-contain shadow-2xl" />
            <figcaption className="mt-3 text-center text-[12.5px] font-semibold text-white/80">
              {titleCase(images[lightbox].kind)}{images.length > 1 ? ` · ${lightbox + 1} of ${images.length}` : ''}
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}

/** Full brief + targeting + creative, for the workspace "Campaign details" tab. */
export function CampaignDetailsView({ c }: { c: CampaignDetail }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="card p-5">
        <h2 className="text-[15px] font-extrabold text-ink">Brief</h2>
        {c.description && <p className="mt-2 text-[13.5px] text-body">{c.description}</p>}

        <div className="mt-4 text-[12px] font-semibold text-muted">Promoter task</div>
        <p className="text-[13.5px] font-semibold text-body">{c.task}</p>
        {c.role_config && (c.role_config.task_types?.length || c.role_config.budget_bucket || c.role_config.following_size || c.role_config.audience_reach) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {c.role_config.task_types?.map((t) => <span key={t} className="rounded-full bg-wash px-2.5 py-1 text-[11.5px] font-semibold text-ink">{t}</span>)}
            {c.role_config.budget_bucket && <span className="rounded-full bg-wash px-2.5 py-1 text-[11.5px] font-semibold text-ink">Budget: {c.role_config.budget_bucket}</span>}
            {c.role_config.following_size && <span className="rounded-full bg-wash px-2.5 py-1 text-[11.5px] font-semibold text-ink">Following: {c.role_config.following_size}</span>}
            {c.role_config.audience_reach && <span className="rounded-full bg-wash px-2.5 py-1 text-[11.5px] font-semibold text-ink">Reach: {c.role_config.audience_reach}</span>}
          </div>
        )}

        {c.promoter_instructions && (
          <>
            <div className="mt-4 text-[12px] font-semibold text-muted">What promoters do</div>
            <p className="text-[13.5px] text-body">{c.promoter_instructions}</p>
          </>
        )}
        {c.destination_url && (
          <>
            <div className="mt-4 text-[12px] font-semibold text-muted">Destination</div>
            <a href={c.destination_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all text-[13.5px] font-semibold text-brand-700 underline hover:opacity-80">
              {c.destination_url} <IconExternal className="h-3.5 w-3.5 shrink-0" />
            </a>
          </>
        )}
      </section>

      <div className="space-y-5">
        <section className="card p-5">
          <h2 className="text-[15px] font-extrabold text-ink">Targeting</h2>
          <div className="mt-3">{c.targeting ? <TargetingPills targeting={c.targeting} /> : <p className="text-[13.5px] text-muted">No targeting set.</p>}</div>
        </section>
        <section className="card p-5">
          <h2 className="text-[15px] font-extrabold text-ink">Creative · {creativeSummary(c.assets)}</h2>
          <div className="mt-3"><AssetsGrid assets={c.assets} /></div>
        </section>
      </div>
    </div>
  );
}
