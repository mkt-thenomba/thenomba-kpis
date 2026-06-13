"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/domain";
import { ROLE_LABELS } from "@/types/domain";

interface NavLink {
  href: string;
  label: string;
  roles: Role[];
}

const LINKS: NavLink[] = [
  { href: "/", label: "Panel", roles: ["ADMIN"] },
  { href: "/ventas", label: "Registro de ventas", roles: ["ADMIN"] },
  { href: "/variables", label: "Variables", roles: ["ADMIN"] },
  { href: "/josep", label: "Carga de Josep", roles: ["ADMIN", "INBOUND"] },
  { href: "/rodrigo", label: "Carga de Rodrigo", roles: ["ADMIN", "AGENCY"] },
];

export function Nav({
  user,
}: {
  user: { name: string; role: Role };
}) {
  const pathname = usePathname();
  const links = LINKS.filter((l) => l.roles.includes(user.role));

  return (
    <header className="no-print sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href={links[0]?.href ?? "/"} className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              TN
            </span>
            <span className="hidden font-semibold sm:inline">TheNomba</span>
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((l) => {
              const active =
                l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight">{user.name}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
