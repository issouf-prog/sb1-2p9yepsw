import { Heart, Copy, HandCoins, Play } from "lucide-react";

/** Vignette de remplacement : dégradé déterministe, aucune image de l'original. */
export function Thumb({ seed, children, className = "" }: { seed: string; children?: React.ReactNode; className?: string }) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 360;
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, hsl(${h} 35% 28%), hsl(${(h + 50) % 360} 40% 14%))` }}
    >
      {children}
    </div>
  );
}

export function ProjectCard({ title, updatedAt, href = "#", thumbnailUrl, menu }: { title: string; updatedAt: string; href?: string; thumbnailUrl?: string | null; menu?: React.ReactNode }) {
  return (
    <div className="group relative w-full border border-text bg-surface transition-shadow duration-fast hover:shadow-pop sm:w-80">
      <a href={href} className="block">
        <Thumb seed={title} className="aspect-[16/9]">
          {thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt="" className="absolute inset-0 size-full object-cover" />
          )}
        </Thumb>
        <div className="px-5 py-4 pr-12">
          <p className="truncate text-xl" title={title}>{title}</p>
          <p className="mt-1 text-base text-text-muted">Modifié le {updatedAt}</p>
        </div>
      </a>
      {menu && <div className="absolute bottom-4 right-3">{menu}</div>}
    </div>
  );
}

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k` : String(n));

export function FilmCard({ title, creator, duration, remixes, likes, tips }: { title: string; creator: string; duration: string; remixes: number; likes: number; tips: number }) {
  return (
    <a href="#" className="group block">
      <Thumb seed={title + creator} className="aspect-[16/9]">
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-fast group-hover:opacity-100">
          <Play aria-hidden className="size-12 text-on-primary" />
        </span>
        <span className="absolute bottom-2 right-2 rounded-sm bg-primary/75 px-1.5 py-0.5 text-sm tabular-nums text-on-primary">{duration}</span>
      </Thumb>
      <p className="mt-3 truncate text-xl">{title}</p>
      <div className="mt-2 flex items-center gap-2 text-base">
        <span className="inline-flex size-6 items-center justify-center rounded-pill bg-surface-sunken text-xs">{creator[0]}</span>
        <span className="flex-1 truncate text-text">{creator}</span>
        <span className="inline-flex items-center gap-1 text-text-muted"><Copy aria-hidden className="size-4" />{fmt(remixes)}<span className="sr-only"> reprises</span></span>
        <span className="inline-flex items-center gap-1 text-text-muted"><Heart aria-hidden className="size-4" />{fmt(likes)}<span className="sr-only"> j&apos;aime</span></span>
        <span className="inline-flex items-center gap-1 text-text-muted"><HandCoins aria-hidden className="size-4" />{fmt(tips)}<span className="sr-only"> crédits reçus</span></span>
      </div>
    </a>
  );
}
