import { motion } from 'framer-motion'
import { Coins, Hourglass, ScrollText, Trophy, Users } from 'lucide-react'
import { useMemo } from 'react'
import { Empty, Panel, Stat, StatusStamp } from '@/components/ui'
import { useStore } from '@/lib/store'
import { fmtDate, isToday, money, orderNo } from '@/lib/utils'

export default function Dashboard() {
  const { orders, clients } = useStore()

  const d = useMemo(() => {
    const valid = orders.filter((o) => o.status === 'payee' || o.status === 'livree')
    const today = valid.filter((o) => isToday(o.createdAt))
    const pending = orders.filter((o) => o.status === 'en_attente')
    const sold = new Map<string, { name: string; qty: number; revenue: number }>()
    for (const o of valid)
      for (const i of o.items) {
        const s = sold.get(i.productId) ?? { name: i.name, qty: 0, revenue: 0 }
        sold.set(i.productId, { name: i.name, qty: s.qty + i.qty, revenue: s.revenue + i.price * i.qty })
      }
    return {
      todayTotal: today.reduce((s, o) => s + o.total, 0),
      todayCount: today.length,
      allTotal: valid.reduce((s, o) => s + o.total, 0),
      pendingTotal: pending.reduce((s, o) => s + o.total, 0),
      pendingCount: pending.length,
      top: [...sold.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    }
  }, [orders])

  const maxRev = d.top[0]?.revenue ?? 1

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          <Stat key="a" label="Recette du jour" value={money(d.todayTotal)} sub={`${d.todayCount} vente(s) aujourd'hui`} icon={<Coins size={26} />} />,
          <Stat key="b" label="En attente" value={money(d.pendingTotal)} sub={`${d.pendingCount} commande(s) à encaisser`} icon={<Hourglass size={26} />} />,
          <Stat key="c" label="Recette totale" value={money(d.allTotal)} sub={`${orders.length} commande(s) au livre`} icon={<ScrollText size={26} />} />,
          <Stat key="d" label="Clients inscrits" value={clients.length} sub="au registre" icon={<Users size={26} />} />,
        ].map((el, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            {el}
          </motion.div>
        ))}
      </div>

      <div>
        <Panel title="Meilleures ventes" icon={<Trophy />}>
          {d.top.length === 0 ? (
            <Empty icon={<Trophy size={30} />}>Pas encore de vente.</Empty>
          ) : (
            <ul className="space-y-3">
              {d.top.map((t, i) => (
                <li key={t.name}>
                  <div className="flex justify-between text-ink">
                    <span>
                      <span className="mr-2 font-western text-blood">{i + 1}.</span>
                      {t.name} <span className="text-sm text-sepia">× {t.qty}</span>
                    </span>
                    <span className="font-type">{money(t.revenue)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sepia/15">
                    <motion.div className="h-full bg-blood" initial={{ width: 0 }} animate={{ width: `${(t.revenue / maxRev) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.08 }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

      </div>

      <Panel title="Dernières transactions" icon={<ScrollText />}>
        {orders.length === 0 ? (
          <Empty icon={<ScrollText size={30} />}>Le livre est vierge. Rendez-vous à la caisse.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="ledger w-full min-w-[560px]">
              <tbody>
                {orders.slice(0, 8).map((o) => (
                  <tr key={o.id}>
                    <td className="font-type">{orderNo(o.number)}</td>
                    <td className="font-type text-[17px] tracking-[.04em]">{fmtDate(o.createdAt)}</td>
                    <td className="text-lg">{o.clientName}</td>
                    <td>
                      <StatusStamp status={o.status} />
                    </td>
                    <td className="text-right font-type text-2xl">{money(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
