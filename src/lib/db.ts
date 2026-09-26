import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'
import type { Client, Order, OrderItem, OrderStatus, Product, Settings } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** null = mode local (pas de Supabase configuré) : tout reste dans le navigateur. */
export const supabase = url && key ? createClient(url, key) : null
export const hasDb = !!supabase

// ——— Conversion lignes SQL (snake_case) <-> objets de l'app ———
/* eslint-disable @typescript-eslint/no-explicit-any */
const num = (v: any) => Number(v ?? 0)

const toProduct = (r: any): Product => ({
  id: r.id,
  name: r.name,
  category: r.category,
  price: num(r.price),
  stock: r.stock,
  image: r.image ?? undefined,
})
const fromProduct = (p: Product) => ({ id: p.id, name: p.name, category: p.category, price: p.price, stock: p.stock, image: p.image ?? null })

const toClient = (r: any): Client => ({
  id: r.id,
  name: r.name,
  phone: r.phone,
  license: r.license,
  licenseValid: r.license_valid,
  notes: r.notes,
  createdAt: Date.parse(r.created_at),
})
const fromClient = (c: Client) => ({
  id: c.id,
  name: c.name,
  phone: c.phone,
  license: c.license,
  license_valid: c.licenseValid,
  notes: c.notes,
  created_at: new Date(c.createdAt).toISOString(),
})

const toOrder = (r: any): Order => ({
  id: r.id,
  number: num(r.number),
  clientId: r.client_id,
  clientName: r.client_name,
  items: r.items as OrderItem[],
  discountPct: num(r.discount_pct),
  taxPct: num(r.tax_pct),
  subtotal: num(r.subtotal),
  discount: num(r.discount),
  tax: num(r.tax),
  total: num(r.total),
  received: num(r.received),
  change: num(r.change),
  status: r.status as OrderStatus,
  note: r.note,
  createdAt: Date.parse(r.created_at),
})
const fromOrder = (o: Omit<Order, 'number'> & { number?: number }) => ({
  id: o.id,
  ...(o.number ? { number: o.number } : {}),
  client_id: o.clientId,
  client_name: o.clientName,
  items: o.items,
  discount_pct: o.discountPct,
  tax_pct: o.taxPct,
  subtotal: o.subtotal,
  discount: o.discount,
  tax: o.tax,
  total: o.total,
  received: o.received,
  change: o.change,
  status: o.status,
  note: o.note,
  created_at: new Date(o.createdAt).toISOString(),
})

const toSettings = (r: any): Settings => ({ shopName: r.shop_name, town: r.town, taxPct: num(r.tax_pct) })

function fail(error: { message: string } | null) {
  if (!error) return false
  console.error(error)
  toast.error(`Base de données : ${error.message}`)
  return true
}

export interface Snapshot {
  products: Product[]
  clients: Client[]
  orders: Order[]
  settings: Settings | null
}

export async function fetchAll(): Promise<Snapshot | null> {
  if (!supabase) return null
  const [p, c, o, s] = await Promise.all([
    supabase.from('products').select('*').order('created_at'),
    supabase.from('clients').select('*').order('created_at', { ascending: false }),
    supabase.from('orders').select('*').order('number', { ascending: false }),
    supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
  ])
  if (fail(p.error) || fail(c.error) || fail(o.error) || fail(s.error)) return null
  return {
    products: (p.data ?? []).map(toProduct),
    clients: (c.data ?? []).map(toClient),
    orders: (o.data ?? []).map(toOrder),
    settings: s.data ? toSettings(s.data) : null,
  }
}

/** Écoute les changements (autres caisses) et appelle onChange. Renvoie la fonction de désabonnement. */
export function subscribe(onChange: () => void) {
  if (!supabase) return () => {}
  let t: ReturnType<typeof setTimeout> | undefined
  const debounced = () => {
    clearTimeout(t)
    t = setTimeout(onChange, 250)
  }
  const ch = supabase.channel('armurerie')
  for (const table of ['products', 'clients', 'orders', 'settings']) ch.on('postgres_changes', { event: '*', schema: 'public', table }, debounced)
  ch.subscribe()
  return () => {
    clearTimeout(t)
    supabase.removeChannel(ch)
  }
}

// Toutes les écritures : no-op en mode local.
export const db = {
  async upsertProduct(p: Product) {
    if (supabase) fail((await supabase.from('products').upsert(fromProduct(p))).error)
  },
  async deleteProduct(id: string) {
    if (supabase) fail((await supabase.from('products').delete().eq('id', id)).error)
  },
  async upsertClient(c: Client) {
    if (supabase) fail((await supabase.from('clients').upsert(fromClient(c))).error)
  },
  async renameClientOrders(clientId: string, name: string) {
    if (supabase) fail((await supabase.from('orders').update({ client_name: name }).eq('client_id', clientId)).error)
  },
  async deleteClient(id: string) {
    if (supabase) fail((await supabase.from('clients').delete().eq('id', id)).error)
  },
  /** Insère la commande ; la base attribue le numéro. */
  async insertOrder(o: Omit<Order, 'number'>): Promise<Order | null> {
    if (!supabase) return null
    const { data, error } = await supabase.from('orders').insert(fromOrder(o)).select().single()
    return fail(error) ? null : toOrder(data)
  },
  async updateOrder(id: string, patch: { status: OrderStatus; received: number }) {
    if (supabase) fail((await supabase.from('orders').update(patch).eq('id', id)).error)
  },
  async deleteOrder(id: string) {
    if (supabase) fail((await supabase.from('orders').delete().eq('id', id)).error)
  },
  async moveStock(items: OrderItem[], sign: 1 | -1) {
    if (!supabase) return
    for (const i of items) fail((await supabase.rpc('adjust_stock', { p_id: i.productId, p_delta: sign * i.qty })).error)
  },
  async saveSettings(s: Settings) {
    if (supabase) fail((await supabase.from('settings').upsert({ id: 1, shop_name: s.shopName, town: s.town, tax_pct: s.taxPct })).error)
  },
  /** Remplace tout le contenu de la base (import d'une sauvegarde / remise à zéro). */
  async replaceAll(d: { products: Product[]; clients: Client[]; orders: Order[]; settings: Settings }) {
    if (!supabase) return
    for (const t of ['orders', 'clients', 'products'] as const)
      if (fail((await supabase.from(t).delete().neq('id', '')).error)) return
    if (d.products.length && fail((await supabase.from('products').insert(d.products.map(fromProduct))).error)) return
    if (d.clients.length && fail((await supabase.from('clients').insert(d.clients.map(fromClient))).error)) return
    if (d.orders.length && fail((await supabase.from('orders').insert(d.orders.map(fromOrder))).error)) return
    await db.saveSettings(d.settings)
    fail((await supabase.rpc('reset_order_number')).error)
  },
}
