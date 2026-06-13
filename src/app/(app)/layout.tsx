import { Nav } from "@/components/nav";
import { requireUser } from "@/lib/guards";

// Layout del área autenticada: barra de navegación filtrada por rol + contenido.
// (La vista /informe vive fuera de este grupo para ir a pantalla completa.)
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="min-h-screen bg-background">
      <Nav user={{ name: user.name, role: user.role }} />
      <main className="container py-6">{children}</main>
    </div>
  );
}
