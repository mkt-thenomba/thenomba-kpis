"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const USUARIOS = [
  { email: "pablo@thenomba.es", nombre: "Pablo", rol: "Dirección" },
  { email: "josep@thenomba.es", nombre: "Josep Adolf", rol: "Captación entrante" },
  { email: "rodrigo@thenomba.es", nombre: "Rodrigo Sangrador", rol: "Agencia" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    // El middleware redirige a la pantalla propia de cada rol.
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {/* Logo placeholder */}
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground">
            TN
          </div>
          <h1 className="text-2xl font-bold tracking-tight">TheNomba</h1>
          <p className="text-sm text-muted-foreground">Panel de ventas</p>
        </div>

        <Card className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@thenomba.es"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm font-medium text-bad">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </Card>

        <div className="mt-6 rounded-lg border border-border bg-card p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Usuarios
          </p>
          <ul className="space-y-1.5 text-sm">
            {USUARIOS.map((u) => (
              <li key={u.email}>
                <button
                  type="button"
                  onClick={() => setEmail(u.email)}
                  className="text-left hover:underline"
                >
                  <span className="font-medium">{u.nombre}</span>{" "}
                  <span className="text-muted-foreground">· {u.rol}</span>
                  <br />
                  <span className="text-xs text-muted-foreground">{u.email}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Las contraseñas iniciales están en el README del proyecto.
          </p>
        </div>
      </div>
    </div>
  );
}
