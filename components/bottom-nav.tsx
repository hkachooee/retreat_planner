"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: "/trips", label: "Trips" },
    { href: "/results", label: "Results" },
    ...(isAdmin ? [{ href: "/admin", label: "Organizer" }] : []),
  ];

  return (
    <nav className="sticky bottom-0 -mx-4 mt-auto border-t border-line bg-paper/95 px-4 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="flex">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1.5 py-3 text-xs font-medium ${
                  active ? "text-ink" : "text-muted"
                }`}
              >
                <span className={`h-1 w-6 rounded-full ${active ? "bg-ink" : "bg-line"}`} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
