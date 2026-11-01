import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { tripPhoto } from "@/lib/trip-photos";

const buttonBase =
  "flex h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:opacity-50";

export const buttonStyles = {
  primary: `${buttonBase} bg-ink text-paper hover:bg-ink/90`,
  secondary: `${buttonBase} border border-ink bg-white text-ink hover:bg-paper`,
  accent: `${buttonBase} bg-accent text-white hover:bg-accent/90`,
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: keyof typeof buttonStyles }) {
  return <button className={`${buttonStyles[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: keyof typeof buttonStyles }) {
  return <Link className={`${buttonStyles[variant]} ${className}`} {...props} />;
}

export function Card({ className = "", highlight = false, ...props }: ComponentProps<"div"> & { highlight?: boolean }) {
  const tone = highlight ? "border-accent bg-accent-soft" : "border-line bg-white";
  return <div className={`rounded-2xl border ${tone} ${className}`} {...props} />;
}

export function Chip({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full border px-2.5 text-xs ${
        active ? "border-accent bg-accent-soft text-accent" : "border-line bg-paper text-muted"
      }`}
    >
      {children}
    </span>
  );
}

// The trip's photo, or a calm tile with the place's initial when there isn't one.
export function PlaceTile({ place, className = "" }: { place: string; className?: string }) {
  const photo = tripPhoto(place);
  if (photo) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-tile ${className}`}>
        <Image src={photo} alt={place} fill sizes="(max-width: 448px) 100vw, 448px" className="object-cover" />
      </div>
    );
  }
  return (
    <div
      aria-hidden
      className={`flex items-end rounded-xl bg-tile p-3 text-5xl font-semibold tracking-tight text-ink/15 ${className}`}
    >
      {place.trim().charAt(0).toUpperCase()}
    </div>
  );
}

export function PageHeader({ title, aside, sub }: { title: string; aside?: ReactNode; sub?: ReactNode }) {
  return (
    <header className="pt-6 pb-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {aside}
      </div>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </header>
  );
}

export function Notice({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-start gap-2 p-5">
      <p className="font-semibold">{title}</p>
      {children && <p className="text-sm text-muted">{children}</p>}
      {action && <div className="mt-2 w-full">{action}</div>}
    </Card>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-tile ${className}`} />;
}
