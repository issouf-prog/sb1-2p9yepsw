import { FilmCard } from "@/components/ui/cards";
import { DEMO_FILMS } from "@/lib/seed/films";

export default function GalleryPage() {
  return (
    <main className="mx-auto max-w-[var(--size-content-max)] px-4 pb-24 pt-10 sm:px-6">
      <h1 className="text-2xl">Galerie</h1>
      <p className="mt-2 text-text-muted">Films publiés par la communauté. (Démonstration : la publication arrive en phase 4.)</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_FILMS.map((f) => <FilmCard key={f.id} {...f} />)}
      </div>
    </main>
  );
}
