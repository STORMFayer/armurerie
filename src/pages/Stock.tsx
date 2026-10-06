import { AlertTriangle, Boxes, PackagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Empty, Field, Modal, Panel, useConfirm } from '@/components/ui'
import { isCritical, useStock, type Material } from '@/lib/stock'
import { useStore } from '@/lib/store'
import { cn, money, toNum, uid } from '@/lib/utils'

/** Quantité conseillée à commander : remonter à 3× le seuil. */
const suggestOrder = (m: Material) => Math.max(Math.ceil(m.threshold * 3 - m.stock), Math.ceil(m.threshold))

function MaterialForm({ material, onDone }: { material?: Material; onDone: () => void }) {
  const { save, materials } = useStock()
  const [name, setName] = useState(material?.name ?? '')
  const [stock, setStock] = useState(String(material?.stock ?? 0))
  const [threshold, setThreshold] = useState(String(material?.threshold ?? 10))
  const [cost, setCost] = useState(String(material?.unitCost ?? 0))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Donnez un nom à la matière.')
    try {
      await save({
        id: material?.id ?? uid(),
        name: name.trim(),
        stock: toNum(stock),
        threshold: toNum(threshold),
        unitCost: toNum(cost),
        position: material?.position ?? Math.max(0, ...materials.map((m) => m.position)) + 1,
      })
      toast.success('Matière enregistrée.')
      onDone()
    } catch (err) {
      toast.error(`Base de données : ${(err as Error).message}`)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Nom *">
        <input className="field" autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Fer" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Stock actuel">
          <input className="field" inputMode="decimal" value={stock} onChange={(e) => setStock(e.target.value)} />
        </Field>
        <Field label="Seuil critique" hint="Alerte en dessous.">
          <input className="field" inputMode="decimal" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
        </Field>
        <Field label="Prix d'achat unitaire ($)" hint="Sert au calcul du bénéfice.">
          <input className="field" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" variant="blood">
          Enregistrer
        </Button>
      </div>
    </form>
  )
}

export default function Stock() {
  const { available, materials, adjust, remove } = useStock()
  const products = useStore((s) => s.products)
  const [editing, setEditing] = useState<Material | 'new' | null>(null)
  const [receive, setReceive] = useState<Record<string, string>>({})
  const { ask, dialog } = useConfirm()

  const critical = materials.filter(isCritical)
  // combien d'exemplaires de chaque article on peut encore fabriquer avec le stock actuel
  const craftable = products
    .filter((p) => Object.keys(p.recipe ?? {}).length && p.category !== 'Munitions')
    .map((p) => ({
      p,
      n: Math.min(...Object.entries(p.recipe!).map(([id, q]) => Math.floor((materials.find((m) => m.id === id)?.stock ?? 0) / q))),
    }))

  async function doReceive(m: Material) {
    const q = toNum(receive[m.id] ?? '')
    if (!q) return toast.error('Indiquez la quantité reçue.')
    await adjust(m.id, q)
    setReceive((r) => ({ ...r, [m.id]: '' }))
    toast.success(`+${q} ${m.name} en stock.`)
  }

  if (available === false)
    return (
      <Panel title="Stock" icon={<Boxes />}>
        <Empty icon={<Boxes size={34} />}>La table du stock n'existe pas encore dans la base.</Empty>
      </Panel>
    )

  return (
    <div className="space-y-5">
      {critical.length > 0 && (
        <section className="glass-panel border-blood/50 p-5 shadow-[0_0_40px_-16px_rgba(208,27,37,.8)]">
          <h2 className="flex items-center gap-2.5 font-western text-[26px] tracking-[.08em] text-blood">
            <AlertTriangle /> À COMMANDER
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {critical.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-xl border border-blood/30 bg-blood/10 px-3 py-2">
                <span>
                  <b className="font-semibold">{m.name}</b> <span className="text-sepia">— reste {m.stock} (seuil {m.threshold})</span>
                </span>
                <span className="label text-[15px] text-brass">≈ {suggestOrder(m)} à commander</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Panel
        title="Stock de matières"
        icon={<Boxes />}
        actions={
          <Button variant="blood" onClick={() => setEditing('new')}>
            <Plus size={18} /> Nouvelle matière
          </Button>
        }
      >
        <p className="mb-4 text-[15px] text-sepia italic">Chaque vente retire automatiquement les matières de la recette (annuler une vente les remet en stock).</p>
        <div className="overflow-x-auto">
          <table className="ledger w-full min-w-[760px]">
            <thead>
              <tr>
                <th>Matière</th>
                <th>Stock</th>
                <th>Seuil</th>
                <th className="text-right!">Prix unitaire</th>
                <th>Réception</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => {
                const crit = isCritical(m)
                const ratio = m.threshold ? Math.min(1, m.stock / (m.threshold * 3)) : 1
                return (
                  <tr key={m.id}>
                    <td className="text-lg">{m.name}</td>
                    <td className="w-56">
                      <div className="flex items-center gap-3">
                        <span className={cn('w-16 font-type text-2xl', crit ? 'text-blood' : 'text-ink')}>{m.stock}</span>
                        <div className="statbar flex-1">
                          <i style={{ width: `${ratio * 100}%`, background: crit ? '#d01b25' : undefined, boxShadow: crit ? '0 0 10px rgba(208,27,37,.6)' : undefined }} />
                        </div>
                      </div>
                    </td>
                    <td className="font-type text-[17px] text-sepia">{m.threshold}</td>
                    <td className="text-right font-type text-[17px]">{m.unitCost ? money(m.unitCost) : <span className="text-sepia-2">—</span>}</td>
                    <td>
                      <div className="flex gap-1.5">
                        <input
                          className="field w-24 py-1"
                          inputMode="decimal"
                          placeholder="Qté"
                          value={receive[m.id] ?? ''}
                          onChange={(e) => setReceive((r) => ({ ...r, [m.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && doReceive(m)}
                          aria-label={`Quantité reçue de ${m.name}`}
                        />
                        <Button size="sm" variant="ink" onClick={() => doReceive(m)}>
                          <PackagePlus size={14} /> Ajouter
                        </Button>
                      </div>
                    </td>
                    <td className="w-20 text-right whitespace-nowrap">
                      <button className="cursor-pointer p-1.5 text-sepia hover:text-ink" onClick={() => setEditing(m)} aria-label="Modifier">
                        <Pencil size={16} />
                      </button>
                      <button
                        className="cursor-pointer p-1.5 text-sepia hover:text-blood"
                        onClick={async () => {
                          if (await ask(`Supprimer la matière « ${m.name} » ?`)) await remove(m.id).catch((e) => toast.error(e.message))
                        }}
                        aria-label="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {craftable.length > 0 && (
        <Panel title="Fabricable avec le stock actuel" icon={<PackagePlus />}>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {craftable.map(({ p, n }) => (
              <div key={p.id} className="tile flex items-center justify-between px-3 py-2 hover:translate-y-0">
                <span className="text-[16px]">{p.name}</span>
                <span className={cn('font-type text-2xl', n === 0 ? 'text-blood' : n < 3 ? 'text-brass' : 'text-ink')}>{n}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing === 'new' ? 'Nouvelle matière' : 'Modifier la matière'}>
        {editing && <MaterialForm material={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
      </Modal>
      {dialog}
    </div>
  )
}
