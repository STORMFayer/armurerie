import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { Minus, Plus, Search, X } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { FxBoundary } from '@/components/fx/FxBoundary'
import { LiquidGlass } from '@/components/fx/LiquidGlass'
import { hasDb, subscribe } from '@/lib/db'
import { hasWebGL } from '@/lib/motion'
import { useStore } from '@/lib/store'
import { CATEGORIES, type Category } from '@/lib/types'
import { cn, computeTotals, isToday, money, orderNo } from '@/lib/utils'
import { ProductCard } from './ProductCard'

const CleanBackground = lazy(() => import('./CleanBackground'))
const LiquidEmblem = lazy(() => import('@/components/fx/LiquidEmblem'))
const RevolverCylinder3D = lazy(() => import('@/components/fx/RevolverCylinder3D'))
const webgl = hasWebGL()

const NAV = ['Caisse', 'Commandes', 'Clients', 'Catalogue', 'Guide', 'Bilan'] as const
const short = (c: string) => (c === 'Armes de jet & blanches' ? 'Lames' : c)

export default function CleanApp() {
  const { products, clients, orders, cart, settings, nextOrderNumber, ready, addToCart, setQty, removeFromCart, setCart, checkout } = useStore()
  const [cat, setCat] = useState<Category | 'Tout'>('Tout')
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!hasDb) return
    const { load } = useStore.getState()
    load()
    return subscribe(load)
  }, [])

  const cats = CATEGORIES.filter((c) => products.some((p) => p.category === c))
  const list = useMemo(() => products.filter((p) => (cat === 'Tout' ? p.category !== 'Personnalisation' : p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase())), [products, cat, q])
  const totals = computeTotals(cart.items, cart.discountPct, settings.taxPct)
  const today = orders.filter((o) => (o.status === 'payee' || o.status === 'livree') && isToday(o.createdAt)).reduce((t, o) => t + o.total, 0)
  const inCart = (id: string) => cart.items.find((i) => i.productId === id)?.qty ?? 0
  const add = (id: string) => addToCart(products.find((p) => p.id === id)!, 1)
  const hour = new Date().getHours()

  async function pay() {
    if (!cart.items.length || busy) return
    setBusy(true)
    const o = await checkout('payee', totals.total)
    setBusy(false)
    if (o) toast.success(`Vente ${orderNo(o.number)} — ${money(o.total)}`)
  }

  return (
    <div className="mx-auto min-h-screen max-w-[1500px] px-5 pb-16 sm:px-8">
      {webgl && (
        <FxBoundary>
          <Suspense fallback={null}>
            <CleanBackground />
          </Suspense>
        </FxBoundary>
      )}

      {/* ——— Dock flottant en verre liquide ——— */}
      <div className="sticky top-4 z-30 mx-auto mt-4 max-w-fit">
        <LiquidGlass className="flex items-center gap-1 rounded-full bg-white/[.04] px-2 py-1.5 backdrop-blur-xl" fallbackClassName="glass rounded-full" borderRadius={30} tintOpacity={0.12} refreshKey={`${ready}-${cat}`}>
          <div className="flex items-center gap-2.5 pr-3 pl-1.5">
            <div className="size-8">
              {webgl && (
                <FxBoundary>
                  <Suspense fallback={null}>
                    <LiquidEmblem size={32} tint="#e8eefc" />
                  </Suspense>
                </FxBoundary>
              )}
            </div>
            <span className="max-w-[46vw] truncate font-display text-[15px] font-semibold tracking-tight whitespace-nowrap">{settings.shopName}</span>
          </div>
          <nav className="hidden items-center md:flex">
            {NAV.map((n) => (
              <a key={n} href={n === 'Caisse' ? undefined : `./#${n.toLowerCase()}`} className={cn('pill', n === 'Caisse' && 'bg-white/90 text-[#0b0e14] hover:text-[#0b0e14]')}>
                {n}
              </a>
            ))}
          </nav>
        </LiquidGlass>
      </div>

      {/* ——— En-tête ——— */}
      <header className="mt-14 flex flex-wrap items-end justify-between gap-6">
        <div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted">
            {hour < 18 ? 'Bonjour' : 'Bonsoir'} · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-1 bg-gradient-to-b from-white to-white/55 bg-clip-text font-display text-6xl font-semibold tracking-[-0.04em] text-transparent sm:text-7xl"
          >
            Caisse
          </motion.h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Kpi label="Aujourd'hui" value={money(today)} />
          <Kpi label="Clients" value={String(clients.length)} />
          <Kpi label="Articles" value={String(products.length)} />
        </div>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_420px]">
        <main className="min-w-0">
          {/* catégories en segmented control */}
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <LayoutGroup>
              <div className="glass flex gap-1 overflow-x-auto rounded-full p-1.5 scroll-thin">
                {(['Tout', ...cats] as const).map((c) => (
                  <button key={c} onClick={() => setCat(c)} className={cn('pill relative shrink-0 cursor-pointer whitespace-nowrap', cat === c && 'text-[#0b0e14] hover:text-[#0b0e14]')}>
                    {cat === c && <motion.span layoutId="seg" className="absolute inset-0 rounded-full bg-white shadow-[0_8px_24px_-8px_rgba(255,255,255,.6)]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                    <span className="relative">{c === 'Personnalisation' ? 'Atelier' : short(c)}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
            <div className="relative xl:ml-auto xl:w-72">
              <Search size={17} className="absolute top-1/2 left-4 -translate-y-1/2 text-faint" />
              <input className="input pl-11" placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {list.map((p, i) => (
              <ProductCard key={`${cat}-${p.id}`} product={p} index={i} inCart={inCart(p.id)} onAdd={() => add(p.id)} />
            ))}
          </div>
        </main>

        {/* ——— Panier ——— */}
        <aside className="glass flex flex-col self-start p-6 lg:sticky lg:top-24">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Panier</h2>
            <span className="text-sm text-muted">{orderNo(nextOrderNumber)}</span>
          </div>
          <select className="input mt-4 appearance-none" value={cart.clientId ?? ''} onChange={(e) => setCart({ clientId: e.target.value || null })} aria-label="Client">
            <option value="" className="bg-[#0b0e14]">Client de passage</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#0b0e14]">
                {c.name}
              </option>
            ))}
          </select>

          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              {webgl && (
                <FxBoundary>
                  <Suspense fallback={null}>
                    <RevolverCylinder3D size={110} finish="chrome" />
                  </Suspense>
                </FxBoundary>
              )}
              <p className="mt-3 text-sm text-muted">Votre panier est vide.</p>
            </div>
          ) : (
            <ul className="mt-4 max-h-[42vh] space-y-2 overflow-y-auto pr-1 scroll-thin">
              <AnimatePresence initial={false}>
                {cart.items.map((i) => (
                  <motion.li
                    key={i.productId}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96, height: 0 }}
                    className="flex items-center gap-3 rounded-2xl bg-white/[.04] px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[15px] leading-tight font-medium">{i.name}</p>
                      <p className="text-xs text-muted">{money(i.price)}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-white/[.06] p-0.5">
                      <button className="grid size-6 cursor-pointer place-items-center rounded-full hover:bg-white/10" onClick={() => setQty(i.productId, i.qty - 1)} aria-label="Moins">
                        <Minus size={12} />
                      </button>
                      <span className="w-5 text-center text-sm tabular-nums">{i.qty}</span>
                      <button className="grid size-6 cursor-pointer place-items-center rounded-full hover:bg-white/10" onClick={() => add(i.productId)} aria-label="Plus">
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="w-20 text-right text-[15px] font-medium tabular-nums">{money(i.price * i.qty)}</span>
                    <button className="cursor-pointer text-faint hover:text-fg" onClick={() => removeFromCart(i.productId)} aria-label="Retirer">
                      <X size={14} />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}

          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-sm text-muted">Total</p>
            <motion.p key={totals.total} initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} className="font-display text-6xl font-light tracking-[-0.04em] tabular-nums">
              {money(totals.total)}
            </motion.p>
          </div>
          <button disabled={!cart.items.length || busy} onClick={pay} className="btn-primary mt-6 cursor-pointer py-4 text-[16px] disabled:cursor-not-allowed">
            Encaisser {cart.items.length > 0 && `· ${money(totals.total)}`}
          </button>
        </aside>
      </div>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass min-w-[110px] flex-1 rounded-3xl px-5 py-3.5 sm:flex-none sm:min-w-[130px]">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 font-display text-2xl font-medium tracking-tight tabular-nums">{value}</p>
    </div>
  )
}
