import Link from "next/link";
import { format } from "date-fns";
import type { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/db";
import { dayStart } from "@/lib/dates";
import { SaleForm } from "@/components/forms/sale-form";
import { deleteSale } from "@/lib/actions/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { eur, fecha } from "@/lib/format";
import {
  PRODUCTS,
  PRODUCT_LABELS,
  ENTRY_CHANNELS,
  ENTRY_CHANNEL_LABELS,
  type Product,
  type EntryChannel,
} from "@/types/domain";
import { Trash2 } from "lucide-react";

interface SearchParams {
  from?: string;
  to?: string;
  product?: string;
  channel?: string;
  code?: string;
}

export default async function VentasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("ADMIN");

  const today = dayStart(new Date());
  const todayISO = format(today, "yyyy-MM-dd");

  // ── Construcción del filtro ──
  const where: Prisma.SaleWhereInput = {};
  if (searchParams.from || searchParams.to) {
    where.saleDate = {};
    if (searchParams.from)
      where.saleDate.gte = new Date(searchParams.from + "T00:00:00");
    if (searchParams.to)
      where.saleDate.lte = new Date(searchParams.to + "T23:59:59");
  }
  if (searchParams.product) where.product = searchParams.product;
  if (searchParams.channel) where.entryChannel = searchParams.channel;
  if (searchParams.code)
    where.discountCode = { contains: searchParams.code };

  const sales = await prisma.sale.findMany({
    where,
    orderBy: { saleDate: "desc" },
    take: 200,
  });

  const totalImporte = sales.reduce((a, s) => a + Number(s.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registro de ventas</h1>
        <p className="text-muted-foreground">
          La fuente de verdad. El total de compañía se cuenta solo desde aquí.
        </p>
      </div>

      <SaleForm todayISO={todayISO} />

      {/* Filtros (GET) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtrar</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-1.5">
              <Label htmlFor="from">Desde</Label>
              <Input id="from" name="from" type="date" defaultValue={searchParams.from} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to">Hasta</Label>
              <Input id="to" name="to" type="date" defaultValue={searchParams.to} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product">Producto</Label>
              <Select id="product" name="product" defaultValue={searchParams.product ?? ""}>
                <option value="">Todos</option>
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>
                    {PRODUCT_LABELS[p]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="channel">Canal</Label>
              <Select id="channel" name="channel" defaultValue={searchParams.channel ?? ""}>
                <option value="">Todos</option>
                {ENTRY_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {ENTRY_CHANNEL_LABELS[c]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code">Código</Label>
              <Input id="code" name="code" defaultValue={searchParams.code} placeholder="p. ej. VERANO" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Aplicar
              </Button>
              <Button asChild variant="outline">
                <Link href="/ventas">Limpiar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">
            {sales.length} ventas · {eur(totalImporte)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Importe</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-right">Días lead→venta</TableHead>
                <TableHead>Atribuciones</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    No hay ventas para este filtro.
                  </TableCell>
                </TableRow>
              )}
              {sales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="whitespace-nowrap">{fecha(s.saleDate)}</TableCell>
                  <TableCell className="font-medium">{s.customerName}</TableCell>
                  <TableCell>{PRODUCT_LABELS[s.product as Product] ?? s.product}</TableCell>
                  <TableCell className="text-right tabular-nums">{eur(Number(s.amount))}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {ENTRY_CHANNEL_LABELS[s.entryChannel as EntryChannel] ?? s.entryChannel}
                  </TableCell>
                  <TableCell className="text-sm">{s.discountCode ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.daysLeadToSale ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {s.attributedJosep && <Badge variant="secondary">Josep</Badge>}
                      {s.attributedPaid && <Badge variant="secondary">Pago</Badge>}
                      {s.attributedCode && <Badge variant="secondary">Código</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <form action={deleteSale}>
                      <input type="hidden" name="id" value={s.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        title="Eliminar venta"
                        className="text-muted-foreground hover:text-bad"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
