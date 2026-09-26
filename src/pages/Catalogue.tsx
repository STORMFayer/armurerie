import { Crosshair, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Field, Modal, Panel, useConfirm } from '@/components/ui'
import { useStore } from '@/lib/store'
import { CATEGORIES, type Category, type Product } from '@/lib/types'
import { money, toNum } from '@/lib/utils'

function ProductForm({ product, onDone }: { product?: Product; onDone: () => void }) {
  const saveProduct = useStore((s) => s.saveProduct)
  const [name, setName] = useState(product?.name ?? '')
  const [category, setCategory] = useState<Category>(product?.category ?? 'Revolvers')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [image, setImage] = useState(product?.image ?? '')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Donnez un nom à l’article.')
    if (toNum(price) <= 0) return toast.error('Le prix doit être supérieur à zéro.')
    saveProduct({ id: product?.id, name: name.trim(), category, price: toNum(price), stock: null, image: /^(https?:\/\/|img\/)/.test(image.trim()) ? image.trim() : undefined })
    toast.success(product ? 'Article modifié.' : 'Article ajouté au catalogue.')
    onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Désignation *">
        <input className="field" autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Revolver Navy" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Catégorie">
          <select className="field" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Prix ($) *">
          <input className="field" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
        </Field>
      </div>
      <Field label="Image (URL, optionnel)" hint="Lien direct vers une image (ex. Discord / Imgur). Vide = illustration automatique.">
        <input className="field" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" maxLength={500} />
      </Field>
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

export default function Catalogue() {
  const { products, deleteProduct } = useStore()
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const { ask, dialog } = useConfirm()

  async function remove(p: Product) {
    if (await ask(`Retirer « ${p.name} » du catalogue ?`)) {
      deleteProduct(p.id)
      toast('Article retiré.')
    }
  }

  return (
    <Panel
      title="Catalogue"
      icon={<Crosshair />}
      actions={
        <Button variant="blood" onClick={() => setEditing('new')}>
          <Plus size={18} /> Nouvel article
        </Button>
      }
    >
      <div className="space-y-6">
        {CATEGORIES.map((cat) => {
          const items = products.filter((p) => p.category === cat)
          if (!items.length) return null
          return (
            <div key={cat}>
              <p className="ornament mb-1 font-western text-lg">{cat}</p>
              <div className="overflow-x-auto">
                <table className="ledger w-full min-w-[560px]">
                  <tbody>
                    {items.map((p) => (
                      <tr key={p.id}>
                        <td className="text-lg">{p.name}</td>
                        <td className="w-28 text-right font-type text-blood">{money(p.price)}</td>
                        <td className="w-20 text-right whitespace-nowrap">
                          <button className="cursor-pointer p-1.5 text-sepia hover:text-ink" onClick={() => setEditing(p)} aria-label="Modifier">
                            <Pencil size={16} />
                          </button>
                          <button className="cursor-pointer p-1.5 text-sepia hover:text-blood" onClick={() => remove(p)} aria-label="Supprimer">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing === 'new' ? 'Nouvel article' : 'Modifier l’article'}>
        {editing && <ProductForm product={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
      </Modal>
      {dialog}
    </Panel>
  )
}
