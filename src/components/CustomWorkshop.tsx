import { Plus, Wrench } from 'lucide-react'
import type { Product } from '@/lib/types'
import { cn, money } from '@/lib/utils'
import { ItemArt } from './ItemArt'
import { Panel } from './ui'

/** Atelier de personnalisation : options vendues à part des armes, ajoutées à la note en un clic. */
export function CustomWorkshop({ options, inCart, onAdd }: { options: Product[]; inCart: (id: string) => number; onAdd: (id: string) => void }) {
  if (!options.length) return null
  const groups = [
    { title: 'Pièces', items: options.filter((o) => o.price > 1.25) },
    { title: 'Matériaux, gravures & finitions', items: options.filter((o) => o.price <= 1.25) },
  ].filter((g) => g.items.length)

  return (
    <Panel title="Atelier de personnalisation" icon={<Wrench />}>
      <div className="space-y-4">
        {groups.map((g) => (
          <section key={g.title}>
            <p className="ornament mb-2 font-sc">{g.title}</p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-1.5">
              {g.items.map((o) => {
                const n = inCart(o.id)
                return (
                  <button
                    key={o.id}
                    onClick={() => onAdd(o.id)}
                    className={cn(
                      'group flex cursor-pointer items-center gap-2 rounded-[2px] border px-2 py-1.5 text-left transition',
                      n ? 'border-blood/60 bg-blood/5' : 'border-sepia/30 bg-[rgba(255,250,235,.35)] hover:border-blood/60 hover:bg-[rgba(255,250,235,.7)]',
                    )}
                    aria-label={`Ajouter ${o.name} à la note`}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-[3px] bg-[#3a2010]">
                      <ItemArt product={o} className="size-8 [&_svg]:size-5" />
                    </span>
                    <span className="min-w-0 flex-1 leading-tight text-ink">
                      {o.name}
                    </span>
                    {n > 0 && <span className="rounded-full bg-blood px-1.5 font-type text-xs text-parch">×{n}</span>}
                    <span className="font-type text-sm whitespace-nowrap text-blood">{money(o.price)}</span>
                    <Plus size={15} className="shrink-0 text-sepia transition group-hover:text-blood" />
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </Panel>
  )
}
