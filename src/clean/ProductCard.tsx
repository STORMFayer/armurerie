import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Plus } from 'lucide-react'
import type { MouseEvent } from 'react'
import { ItemArt } from '@/components/ItemArt'
import type { Product } from '@/lib/types'
import { money } from '@/lib/utils'

/** Carte produit en verre : inclinaison 3D + reflet qui suit la souris, objet qui flotte. */
export function ProductCard({ product: p, inCart, index, onAdd }: { product: Product; inCart: number; index: number; onAdd: () => void }) {
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const rotateX = useSpring(useTransform(rx, (v) => v * -7), { stiffness: 200, damping: 18 })
  const rotateY = useSpring(useTransform(ry, (v) => v * 9), { stiffness: 200, damping: 18 })

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    rx.set(y - 0.5)
    ry.set(x - 0.5)
    e.currentTarget.style.setProperty('--mx', `${x * 100}%`)
    e.currentTarget.style.setProperty('--my', `${y * 100}%`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.55, delay: Math.min(index, 12) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onMouseMove={onMove}
      onMouseLeave={() => {
        rx.set(0)
        ry.set(0)
      }}
      className="glass glass-sheen group flex flex-col p-4"
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium tracking-[.14em] text-muted uppercase">{p.category === 'Armes de jet & blanches' ? 'Lames' : p.category}</span>
        {inCart > 0 && (
          <motion.span key={inCart} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="rounded-full bg-white px-2 text-xs font-semibold text-[#0b0e14]">
            {inCart}
          </motion.span>
        )}
      </div>

      <div className="relative my-3 flex h-28 items-center justify-center">
        <div className="absolute h-20 w-32 rounded-full bg-accent/20 blur-2xl transition group-hover:bg-accent/35" />
        <ItemArt product={p} className="float relative h-24 max-w-full drop-shadow-[0_18px_22px_rgba(0,0,0,.6)]" />
      </div>

      <p className="font-display text-[17px] leading-tight font-medium">{p.name}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-display text-xl font-light tracking-tight">{money(p.price)}</span>
        <button
          onClick={onAdd}
          className="grid size-9 cursor-pointer place-items-center rounded-full border border-white/15 bg-white/10 transition hover:scale-110 hover:bg-white hover:text-[#0b0e14] hover:shadow-[0_0_24px_rgba(142,162,255,.7)]"
          aria-label={`Ajouter ${p.name}`}
        >
          <Plus size={17} />
        </button>
      </div>
    </motion.div>
  )
}
