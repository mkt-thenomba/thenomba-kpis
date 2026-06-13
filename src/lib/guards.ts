// Guardias de servidor para Server Components y Server Actions.
// El middleware es la primera barrera; estas funciones revalidan el rol en el
// servidor (no se confía nunca en el cliente).

import { redirect } from "next/navigation";
import { auth, homeForRole } from "@/lib/auth";
import type { Role } from "@/types/domain";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/** Exige sesión iniciada; si no, va a /login. */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user as SessionUser;
}

/** Exige uno de los roles permitidos; si no, va a su pantalla de inicio. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(homeForRole(user.role));
  return user;
}
