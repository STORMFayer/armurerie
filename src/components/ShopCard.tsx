import { motion } from 'framer-motion'
import { ShoppingBasket } from 'lucide-react'
import { useState } from 'react'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ItemArt } from './ItemArt'

/** Carte d'article façon boutique en jeu (cuir sombre, cadre ornementé, prix vert). */
export function ShopCard({ product: p, inCart, onAdd }: { product: Product; inCart: number; onAdd: (qty: number) => void }) {
  const [qty, setQty] = useState(1)
  const left = p.stock === null ? Infinity : p.stock - inCart
  const out = left <= 0
  const max = Math.max(1, Math.min(99, left))
  const q = Math.min(qty, max)

  return (
    <motion.div layout whileHover={{ y: -3 }} className={cn('shop-card group', out && 'is-out')}>
      <span className="shop-corner tl" />
      <span className="shop-corner tr" />
      <span className="shop-corner bl" />
      <span className="shop-corner br" />

      <p className="relative z-10 pt-2 text-center text-sm font-bold text-[#7ee05a] [text-shadow:0_1px_2px_#000]">{p.price.toFixed(2)}$</p>

      <div className="relative z-10 grid h-24 place-items-center px-3">
        <ItemArt product={p} className="h-full w-full drop-shadow-[0_6px_6px_rgba(0,0,0,.65)] transition-transform duration-300 group-hover:scale-105" />
      </div>

      <div className="shop-strip relative z-10 truncate px-2 text-center text-[15px] text-white" title={p.name}>
        {p.name}
      </div>
      <p className="relative z-10 border-b border-[#6b4526]/70 py-0.5 text-center text-sm font-bold text-white">
        En stock: <span className="text-[#7ee05a]">{p.stock === null ? '∞' : Math.max(0, left)}</span>
      </p>

      <div className="relative z-10 flex h-[62px] flex-col items-center justify-center gap-1.5 px-2 pb-2">
        {out ? (
          <p className="text-[15px] font-bold text-[#e5463a] [text-shadow:0_1px_2px_#000]">Rupture de stock</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button className="shop-step" onClick={() => setQty(Math.max(1, q - 1))} aria-label="Moins">
                -
              </button>
              <input
                className="h-5 w-10 rounded-[4px] bg-[#e8dcc0] text-center text-sm text-ink outline-none focus:ring-1 focus:ring-[#f0b640]"
                inputMode="numeric"
                value={q}
                onChange={(e) => setQty(Math.max(1, Math.min(max, parseInt(e.target.value) || 1)))}
                aria-label="Quantité"
              />
              <button className="shop-step" onClick={() => setQty(Math.min(max, q + 1))} aria-label="Plus">
                +
              </button>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="shop-basket"
              onClick={() => {
                onAdd(q)
                setQty(1)
              }}
              aria-label={`Ajouter ${p.name} à la note`}
            >
              <ShoppingBasket size={16} strokeWidth={2.4} />
            </motion.button>
          </>
        )}
      </div>

      {inCart > 0 && (
        <motion.span
          key={inCart}
          initial={{ scale: 1.5 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 z-20 grid h-6 min-w-6 place-items-center rounded-full border border-black/40 bg-blood px-1.5 font-type text-sm text-parch shadow-lg"
        >
          {inCart}
        </motion.span>
      )}
    </motion.div>
  )
}
