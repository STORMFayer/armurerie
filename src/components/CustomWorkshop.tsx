import { Plus } from 'lucide-react'
import type { Product } from '@/lib/types'
import { cn, money } from '@/lib/utils'
import { ItemArt } from './ItemArt'

/** Atelier de personnalisation : options vendues à part des armes, ajoutées à la note en un clic. */
export function CustomWorkshop({ options, inCart, onAdd }: { options: Product[]; inCart: (id: string) => number; onAdd: (id: string) => void }) {
  if (!options.length) return null
  const groups = [
    { title: 'Pièces', items: options.filter((o) => o.price > 1.25) },
    { title: 'Matériaux, gravures & finitions', items: options.filter((o) => o.price <= 1.25) },
  ].filter((g) => g.items.length)

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.title}>
          <p className="ornament mb-2.5 text-[17px]">{g.title}</p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2">
            {g.items.map((o) => {
              const n = inCart(o.id)
              return (
                <button
                  key={o.id}
                  onClick={() => onAdd(o.id)}
                  className={cn('tile group flex cursor-pointer items-center gap-3 px-3 py-2.5 text-left', n > 0 && 'border-blood/60')}
                  aria-label={`Ajouter ${o.name} à la note`}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[.05]">
                    <ItemArt product={o} className="size-10 [&_svg]:size-5" />
                  </span>
                  <span className="min-w-0 flex-1 text-[16.5px] leading-tight">{o.name}</span>
                  {n > 0 && <span className="rounded-md bg-blood px-1.5 font-type text-[14px] tracking-[.06em] text-white">×{n}</span>}
                  <span className="font-type text-[19px] whitespace-nowrap">{money(o.price)}</span>
                  <Plus size={16} className="shrink-0 text-sepia transition group-hover:text-blood" />
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
