import { Calculator, Coins, Landmark, Percent, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ChartCard, HBars } from '@/components/compta/Charts'
import { Journal } from '@/components/compta/Journal'
import { Panel, Stat } from '@/components/ui'
import { hasCostSheet, unitCost, useStock } from '@/lib/stock'
import { useStore } from '@/lib/store'
import { cn, money } from '@/lib/utils'

const PERIODS = [
  { id: 'jour', label: "Aujourd'hui", days: 1 },
  { id: '7', label: '7 jours', days: 7 },
  { id: '30', label: '30 jours', days: 30 },
  { id: 'tout', label: 'Tout', days: 0 },
] as const

export default function Compta() {
  const { orders, products } = useStore()
  const materials = useStock((s) => s.materials)
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['id']>('7')

  const d = useMemo(() => {
    const days = PERIODS.find((p) => p.id === period)!.days
    const start = days ? new Date(new Date().setHours(0, 0, 0, 0) - (days - 1) * 86400000).getTime() : 0
    const sales = orders.filter((o) => (o.status === 'payee' || o.status === 'livree') && o.createdAt >= start)

    let revenue = 0
    let discounts = 0
    let cost = 0
    let estimated = false
    const byProduct = new Map<string, { name: string; qty: number; gross: number; cost: number; unknown: boolean }>()
    for (const o of sales) {
      revenue += o.total - o.tax
      discounts += o.discount
      for (const i of o.items) {
        const p = products.find((x) => x.id === i.productId)
        const c = i.cost ?? unitCost(p, materials) // anciennes ventes : coût estimé avec la fiche actuelle
        if (i.cost === undefined && hasCostSheet(p)) estimated = true
        cost += c * i.qty
        const row = byProduct.get(i.productId) ?? { name: i.name, qty: 0, gross: 0, cost: 0, unknown: !hasCostSheet(p) && !i.cost }
        row.qty += i.qty
        row.gross += i.price * i.qty
        row.cost += c * i.qty
        byProduct.set(i.productId, row)
      }
    }
    // ventes par vendeur (montant encaissé)
    const bySeller = new Map<string, number>()
    for (const o of sales) bySeller.set(o.seller ?? 'Non renseigné', (bySeller.get(o.seller ?? 'Non renseigné') ?? 0) + o.total)
    const sellers = [...bySeller].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
    const profit = revenue - cost
    const rows = [...byProduct.values()].sort((a, b) => b.gross - b.cost - (a.gross - a.cost))
    return { sellers, count: sales.length, revenue, discounts, cost, profit, margin: revenue ? (profit / revenue) * 100 : 0, rows, estimated }
  }, [orders, products, materials, period])

  // marge unitaire de chaque article ayant une fiche de fabrication
  const sheets = products
    .filter(hasCostSheet)
    .map((p) => {
      const c = unitCost(p, materials)
      return { p, c, m: p.price - c }
    })
    .sort((a, b) => b.m - a.m)
  const unknownSheets = products.filter((p) => !hasCostSheet(p) && p.category !== 'Personnalisation')

  return (
    <div className="space-y-5">
      <Journal />

      <h2 className="pt-3 font-western text-[30px] tracking-[.08em]">RENTABILITÉ</h2>
      <div className="flex flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={cn(
              'label cursor-pointer rounded-full border px-4 py-1.5 text-[16px] transition',
              period === p.id ? 'border-blood bg-blood text-white shadow-[0_0_18px_-4px_rgba(208,27,37,.7)]' : 'border-white/10 text-sepia hover:bg-white/[.06] hover:text-ink',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Chiffre d'affaires" value={money(d.revenue)} sub={`${d.count} vente(s) · remises ${money(d.discounts)}`} icon={<Coins size={24} />} />
        <Stat label="Coûts de fabrication" value={money(d.cost)} sub="Taxes admin + matières" icon={<Landmark size={24} />} />
        <Stat label="Bénéfice net" value={money(d.profit)} sub={d.estimated ? 'Certaines anciennes ventes estimées' : 'Ventes payées / livrées'} icon={<TrendingUp size={24} />} />
        <Stat label="Marge" value={`${d.margin.toFixed(1)} %`} sub="Bénéfice / chiffre d'affaires" icon={<Percent size={24} />} />
      </div>

      <ChartCard title="Ventes par vendeur" subtitle="Montant encaissé sur la période">
        <HBars rows={d.sellers} />
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Articles les plus rentables" subtitle="Bénéfice sur la période">
          <HBars rows={d.rows.map((r) => ({ label: r.name, value: r.gross - r.cost }))} />
        </ChartCard>
        <ChartCard title="Meilleures marges unitaires" subtitle="Prix de vente − coût de fabrication">
          <HBars rows={sheets.map(({ p, m }) => ({ label: p.name, value: m }))} />
        </ChartCard>
      </div>

      <Panel title="Détail par article" icon={<Calculator />}>
        {d.rows.length === 0 ? (
          <p className="py-6 text-center text-sepia italic">Aucune vente sur la période.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="ledger w-full min-w-[640px]">
              <thead>
                <tr>
                  <th>Article</th>
                  <th className="text-right!">Qté</th>
                  <th className="text-right!">Ventes</th>
                  <th className="text-right!">Coût</th>
                  <th className="text-right!">Bénéfice</th>
                </tr>
              </thead>
              <tbody>
                {d.rows.map((r) => (
                  <tr key={r.name}>
                    <td className="text-lg">
                      {r.name} {r.unknown && <span className="text-[13px] text-brass">· coût inconnu</span>}
                    </td>
                    <td className="text-right font-type text-[18px]">{r.qty}</td>
                    <td className="text-right font-type text-[18px]">{money(r.gross)}</td>
                    <td className="text-right font-type text-[18px] text-sepia">{money(r.cost)}</td>
                    <td className={cn('text-right font-type text-xl', r.gross - r.cost < 0 ? 'text-blood' : 'text-sage')}>{money(r.gross - r.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {d.discounts > 0 && <p className="mt-2 text-right text-[14.5px] text-sepia">Les remises ({money(d.discounts)}) sont déduites du chiffre d'affaires global, pas des lignes.</p>}
          </div>
        )}
      </Panel>

      <Panel title="Marge par article (fiches de fabrication)" icon={<TrendingUp />}>
        <div className="overflow-x-auto">
          <table className="ledger w-full min-w-[640px]">
            <thead>
              <tr>
                <th>Article</th>
                <th className="text-right!">Prix de vente</th>
                <th className="text-right!">Coût fabrication</th>
                <th className="text-right!">Marge unitaire</th>
                <th className="text-right!">%</th>
              </tr>
            </thead>
            <tbody>
              {sheets.map(({ p, c, m }) => (
                <tr key={p.id}>
                  <td className="text-lg">{p.name}</td>
                  <td className="text-right font-type text-[18px]">{money(p.price)}</td>
                  <td className="text-right font-type text-[18px] text-sepia">{money(c)}</td>
                  <td className={cn('text-right font-type text-xl', m < 0 ? 'text-blood' : 'text-sage')}>{money(m)}</td>
                  <td className="text-right font-type text-[17px] text-sepia">{p.price ? ((m / p.price) * 100).toFixed(0) : 0} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {unknownSheets.length > 0 && (
          <p className="mt-3 text-[15px] text-brass">
            Sans fiche de fabrication (coût compté 0 $) : {unknownSheets.map((p) => p.name).join(', ')}. Ajoutez la taxe et la recette dans l'onglet Catalogue (crayon).
          </p>
        )}
        <p className="mt-2 text-[14.5px] text-sepia italic">Le coût des matières utilise le prix d'achat unitaire saisi dans l'onglet Stock (0 $ si non renseigné).</p>
      </Panel>
    </div>
  )
}
