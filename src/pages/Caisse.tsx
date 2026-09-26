import { AnimatePresence, motion } from 'framer-motion'
import { Coins, Lightbulb, Minus, OctagonAlert, Plus, Printer, Search, ShoppingBag, Trash2, UserPlus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ClientForm } from '@/pages/Clients'
import { ShopCard } from '@/components/ShopCard'
import { CustomWorkshop } from '@/components/CustomWorkshop'
import { Button, Empty, Field, Modal, Panel, useConfirm } from '@/components/ui'
import { Receipt } from '@/components/Receipt'
import { WeaponSheetCard } from '@/components/WeaponSheetCard'
import { sheetFor, type WeaponSheet } from '@/lib/guide'
import { useStore } from '@/lib/store'
import { CATEGORIES, type Category, type Order } from '@/lib/types'
import { clamp, cn, computeTotals, money, round2, toNum } from '@/lib/utils'

export default function Caisse() {
  const { products, clients, cart, settings, addToCart, setQty, removeFromCart, setCart, clearCart, checkout } = useStore()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<Category | 'Tout'>('Tout')
  const [received, setReceived] = useState('')
  const [newClient, setNewClient] = useState(false)
  const [receipt, setReceipt] = useState<Order | null>(null)
  const [sheet, setSheet] = useState<WeaponSheet | null>(null)
  const { ask, dialog } = useConfirm()

  const filtered = useMemo(
    () =>
      products.filter(
        (p) => p.category !== 'Personnalisation' && (cat === 'Tout' || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()),
      ),
    [products, cat, q],
  )
  const totals = computeTotals(cart.items, cart.discountPct, settings.taxPct)
  const receivedNum = toNum(received)
  const change = round2(receivedNum - totals.total)
  const client = clients.find((c) => c.id === cart.clientId)

  // Conseils de l'armurier pour les armes présentes sur la note
  const cartSheets = [
    ...new Map(
      cart.items
        .map((i) => products.find((p) => p.id === i.productId))
        .map((p) => (p ? sheetFor(p) : undefined))
        .filter((x): x is WeaponSheet => !!x)
        .map((x) => [x.id, x]),
    ).values(),
  ]
  const forbidden = cartSheets.filter((x) => x.tags.includes('jamais'))
  const suggestions = [...new Set(cartSheets.flatMap((x) => x.suggest ?? []))]
    .filter((id) => !cart.items.some((i) => i.productId === id))
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is (typeof products)[number] => !!p)

  const inCart = (id: string) => cart.items.find((i) => i.productId === id)?.qty ?? 0

  function add(id: string, qty = 1) {
    const p = products.find((x) => x.id === id)!
    addToCart(p, qty)
  }

  const [busy, setBusy] = useState(false)

  async function finish(status: 'payee' | 'en_attente') {
    if (status === 'payee' && received && receivedNum < totals.total) return toast.error('Le montant reçu ne couvre pas la note.')
    if (forbidden.length && !(await ask(`${forbidden.map((f) => f.name).join(', ')} : arme à ne jamais vendre (formation). Vendre quand même ?`))) return
    if (client && !client.licenseValid && cart.items.some((i) => !['Munitions', 'Accessoires', 'Personnalisation'].includes(products.find((p) => p.id === i.productId)?.category ?? '')))
      toast.warning(`Attention : ${client.name} n'a pas de permis valide.`)
    setBusy(true)
    const order = await checkout(status, received ? receivedNum : totals.total)
    setBusy(false)
    if (!order) return
    setReceived('')
    setReceipt(order)
    toast.success(status === 'payee' ? `Vente ${money(order.total)} encaissée.` : 'Commande enregistrée — en attente.')
  }

  const quickCash = [5, 10, 20, 50, 100, 500].filter((v) => v >= totals.total * 0.2)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <div className="space-y-6">
      {/* ——— Étalage ——— */}
      <Panel title="L'étalage" icon={<ShoppingBag />}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-sepia" size={16} />
            <input className="field pl-9" placeholder="Chercher une arme, des munitions…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {(['Tout', ...CATEGORIES.filter((c) => c !== 'Personnalisation' && products.some((p) => p.category === c))] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                'cursor-pointer rounded-[2px] border px-2.5 py-1 font-sc text-sm transition',
                cat === c ? 'border-blood-2 bg-blood text-parch' : 'border-sepia/35 text-sepia hover:bg-sepia/10',
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Empty icon={<Search size={32} />}>Rien de tel dans nos râteliers.</Empty>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
            {filtered.map((p) => (
              <ShopCard
                key={p.id}
                product={p}
                inCart={inCart(p.id)}
                onAdd={(qty) => add(p.id, qty)}
                onInfo={sheetFor(p) ? () => setSheet(sheetFor(p)!) : undefined}
              />
            ))}
          </div>
        )}
      </Panel>

      {/* ——— Personnalisation, à part des armes ——— */}
      <CustomWorkshop options={products.filter((p) => p.category === 'Personnalisation')} inCart={inCart} onAdd={(id) => add(id)} />
      </div>

      {/* ——— Comptoir / note ——— */}
      <Panel title="Le comptoir" icon={<Coins />} className="self-start lg:sticky lg:top-4">
        <Field label="Client">
          <div className="flex gap-2">
            <select className="field" value={cart.clientId ?? ''} onChange={(e) => setCart({ clientId: e.target.value || null })}>
              <option value="">— Client de passage —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.licenseValid ? '' : ' (sans permis)'}
                </option>
              ))}
            </select>
            <Button variant="ghost" onClick={() => setNewClient(true)} title="Nouveau client">
              <UserPlus size={18} />
            </Button>
          </div>
        </Field>
        {client && !client.licenseValid && <p className="mt-1 text-sm text-blood">⚠ Pas de permis de port d'arme valide.</p>}

        <div className="my-4 border-t-2 border-double border-sepia/50" />

        {cart.items.length === 0 ? (
          <Empty icon={<ShoppingBag size={30} />}>La note est vide. Cliquez sur un article.</Empty>
        ) : (
          <ul className="max-h-[38vh] space-y-1 overflow-y-auto pr-1 scroll-thin">
            <AnimatePresence initial={false}>
              {cart.items.map((i) => (
                <motion.li
                  key={i.productId}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  className="flex items-center gap-2 border-b border-dashed border-sepia/30 py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate leading-tight text-ink">{i.name}</p>
                    <p className="font-type text-xs text-sepia">{money(i.price)} pièce</p>
                  </div>
                  <div className="flex items-center">
                    <button className="cursor-pointer rounded p-1 text-sepia hover:text-blood" onClick={() => setQty(i.productId, i.qty - 1)} aria-label="Moins">
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-type">{i.qty}</span>
                    <button className="cursor-pointer rounded p-1 text-sepia hover:text-blood" onClick={() => add(i.productId)} aria-label="Plus">
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="w-20 text-right font-type text-ink">{money(i.price * i.qty)}</span>
                  <button className="cursor-pointer p-1 text-sepia hover:text-blood" onClick={() => removeFromCart(i.productId)} aria-label="Retirer">
                    <X size={14} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Remise (%)">
            <input
              className="field"
              inputMode="decimal"
              value={cart.discountPct || ''}
              placeholder="0"
              onChange={(e) => setCart({ discountPct: clamp(toNum(e.target.value), 0, 100) })}
            />
          </Field>
          <Field label="Note">
            <input className="field" value={cart.note} placeholder="Gravure, délai…" onChange={(e) => setCart({ note: e.target.value })} />
          </Field>
        </div>

        {/* Conseils de l'armurier */}
        {(cartSheets.some((x) => x.advice) || suggestions.length > 0 || forbidden.length > 0) && (
          <div className="mt-4 space-y-2 rounded-[2px] border border-brass/50 bg-brass/10 p-3 text-ink">
            <p className="flex items-center gap-2 font-sc text-[#6e4c0f]">
              <Lightbulb size={16} /> Conseil de l'armurier
            </p>
            {forbidden.map((f) => (
              <p key={f.id} className="flex items-center gap-2 font-sc text-blood">
                <OctagonAlert size={16} /> {f.name} : à ne jamais vendre
              </p>
            ))}
            {cartSheets
              .filter((x) => x.advice && !x.tags.includes('jamais'))
              .map((x) => (
                <button key={x.id} onClick={() => setSheet(x)} className="block cursor-pointer text-left text-[15px] leading-snug hover:underline">
                  <span className="font-sc">{x.name} : </span>
                  {x.advice}
                </button>
              ))}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-sm text-sepia">Proposer :</span>
                {suggestions.map((p) => (
                  <Button key={p.id} size="sm" variant="ghost" onClick={() => add(p.id)}>
                    <Plus size={13} /> {p.name} · {money(p.price)}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Totaux */}
        <div className="mt-4 space-y-1 rounded-[2px] bg-ink/5 p-3 font-type text-ink">
          <Row label="Sous-total" value={money(totals.subtotal)} />
          {totals.discount > 0 && <Row label={`Remise ${cart.discountPct}%`} value={`− ${money(totals.discount)}`} />}
          {totals.tax > 0 && <Row label={`Taxe ${settings.taxPct}%`} value={`+ ${money(totals.tax)}`} />}
          <div className="flex items-baseline justify-between border-t-2 border-double border-sepia/60 pt-2">
            <span className="font-western text-lg">À facturer</span>
            <motion.span key={totals.total} initial={{ scale: 1.15, color: '#a8171c' }} animate={{ scale: 1, color: '#1a130d' }} className="text-3xl">
              {money(totals.total)}
            </motion.span>
          </div>
        </div>

        {/* Encaissement */}
        <div className="mt-4">
          <Field label="Montant reçu du client">
            <input className="field text-lg" inputMode="decimal" placeholder={money(totals.total)} value={received} onChange={(e) => setReceived(e.target.value)} />
          </Field>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => setReceived(String(totals.total))}>
              Compte juste
            </Button>
            {quickCash.map((v) => (
              <Button key={v} size="sm" variant="ghost" onClick={() => setReceived(String(v))}>
                ${v}
              </Button>
            ))}
          </div>
          {received !== '' && (
            <p className={cn('mt-2 font-type text-lg', change < 0 ? 'text-blood' : 'text-sage')}>
              {change < 0 ? `Manque ${money(-change)}` : `Rendre la monnaie : ${money(change)}`}
            </p>
          )}
        </div>

        <div className="mt-5 grid gap-2">
          <Button variant="blood" size="lg" disabled={!cart.items.length || busy} onClick={() => finish('payee')}>
            <Coins size={20} /> Encaisser {cart.items.length > 0 && money(totals.total)}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ink" disabled={!cart.items.length || busy} onClick={() => finish('en_attente')}>
              Mettre en commande
            </Button>
            <Button variant="ghost" disabled={!cart.items.length && !cart.clientId} onClick={clearCart}>
              <Trash2 size={16} /> Vider
            </Button>
          </div>
        </div>
      </Panel>

      <Modal open={newClient} onOpenChange={setNewClient} title="Nouveau client">
        <ClientForm
          onDone={(c) => {
            setNewClient(false)
            if (c) setCart({ clientId: c.id })
          }}
        />
      </Modal>

      <Modal open={!!sheet} onOpenChange={(o) => !o && setSheet(null)} title={sheet?.name ?? ''}>
        {sheet && <WeaponSheetCard sheet={sheet} compact />}
      </Modal>
      {dialog}

      <Modal open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)} title="Reçu">
        {receipt && (
          <>
            <Receipt order={receipt} />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => window.print()}>
                <Printer size={16} /> Imprimer
              </Button>
              <Button variant="blood" onClick={() => setReceipt(null)}>
                Client suivant
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-sm">
    <span className="text-sepia">{label}</span>
    <span>{value}</span>
  </div>
)
