// Protección de rutas por rol (se ejecuta antes de renderizar).
//   ADMIN   → acceso total (panel, ventas, informe, cargas).
//   INBOUND → solo /josep.
//   AGENCY  → solo /rodrigo.
// Las Server Actions revalidan el rol de nuevo en el servidor: el middleware
// es la primera barrera, no la única.

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { Role } from "@/types/domain";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role as Role | undefined;
    const { pathname } = req.nextUrl;

    const adminOnly =
      pathname === "/" ||
      pathname.startsWith("/ventas") ||
      pathname.startsWith("/variables") ||
      pathname.startsWith("/informe");

    // Destino propio de cada rol cuando intenta entrar donde no debe.
    const home = (r?: Role) =>
      r === "INBOUND" ? "/josep" : r === "AGENCY" ? "/rodrigo" : "/";

    if (adminOnly && role !== "ADMIN") {
      return NextResponse.redirect(new URL(home(role), req.url));
    }
    if (pathname.startsWith("/josep") && !(role === "ADMIN" || role === "INBOUND")) {
      return NextResponse.redirect(new URL(home(role), req.url));
    }
    if (
      pathname.startsWith("/rodrigo") &&
      !(role === "ADMIN" || role === "AGENCY")
    ) {
      return NextResponse.redirect(new URL(home(role), req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
    pages: { signIn: "/login" },
  }
);

// Protege todo salvo login, API de auth, estáticos y favicon.
export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
