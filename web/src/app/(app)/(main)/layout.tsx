import { Suspense } from "react";
import { GlobalHeader } from "@/components/app/global-header";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="h-[var(--size-header)] border-b border-border bg-surface" />}>
        <GlobalHeader />
      </Suspense>
      {children}
    </>
  );
}
