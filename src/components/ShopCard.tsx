import { motion } from 'framer-motion'
import { Info, ShoppingBasket } from 'lucide-react'
import { useState } from 'react'
import type { Product } from '@/lib/types'
import { ItemArt } from './ItemArt'

/** Carte d'article façon boutique en jeu (cuir sombre, cadre ornementé, prix vert). */
export function ShopCard({ product: p, inCart, onAdd, onInfo }: { product: Product; inCart: number; onAdd: (qty: number) => void; onInfo?: () => void }) {
  const [qty, setQty] = useState(1)
  const max = 999
  const q = Math.min(qty, max)

  return (
    <motion.div layout whileHover={{ y: -3 }} className="shop-card group">
      <span className="shop-corner tl" />
      <span className="shop-corner tr" />
      <span className="shop-corner bl" />
      <span className="shop-corner br" />

      {onInfo && (
        <button
          onClick={onInfo}
          className="absolute top-2 left-2 z-20 grid size-6 cursor-pointer place-items-center rounded-full border border-[#b98a4f] bg-[#2a130a]/80 text-[#f0b640] transition hover:scale-110 hover:text-[#ffd97a]"
          aria-label={`Fiche de l'armurier : ${p.name}`}
          title="Fiche de l'armurier"
        >
          <Info size={14} strokeWidth={2.6} />
        </button>
      )}

      <p className="relative z-10 pt-2 text-center text-sm font-bold text-[#7ee05a] [text-shadow:0_1px_2px_#000]">{p.price.toFixed(2)}$</p>

      <div className="relative z-10 grid h-24 place-items-center px-3">
        <ItemArt product={p} className="h-full w-full drop-shadow-[0_6px_6px_rgba(0,0,0,.65)] transition-transform duration-300 group-hover:scale-105" />
      </div>

      <div className="shop-strip relative z-10 truncate px-2 text-center text-[15px] text-white" title={p.name}>
        {p.name}
      </div>
      <p className="relative z-10 border-b border-[#6b4526]/70 py-0.5 text-center text-sm font-bold text-white">
        <span className="text-[#e8d2a8]">{p.category}</span>
      </p>

      <div className="relative z-10 flex h-[62px] flex-col items-center justify-center gap-1.5 px-2 pb-2">
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
