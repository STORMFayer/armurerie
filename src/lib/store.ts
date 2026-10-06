import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db, fetchAll, hasDb } from './db'
import { SEED_PRODUCTS } from './seed'
import type { Client, Order, OrderItem, OrderStatus, Product, Settings } from './types'
import { cartTotals, useExtras } from './extras'
import { currentSellerName } from './staff'
import { moveStockFor, unitCost, useStock } from './stock'
import { round2, uid } from './utils'

export interface Cart {
  clientId: string | null
  items: OrderItem[]
  discountPct: number
  note: string
  /** partenaire dont la remise s'applique (Saloon…) */
  partnerId?: string | null
}

const emptyCart = (): Cart => ({ clientId: null, items: [], discountPct: 0, note: '', partnerId: null })

interface State {
  products: Product[]
  clients: Client[]
  orders: Order[]
  settings: Settings
  cart: Cart
  nextOrderNumber: number
  /** false tant que les données Supabase ne sont pas chargées */
  ready: boolean
  load: () => Promise<void>

  // catalogue
  saveProduct: (p: Omit<Product, 'id'> & { id?: string }) => void
  deleteProduct: (id: string) => void

  // clients
  saveClient: (c: Omit<Client, 'id' | 'createdAt'> & { id?: string }) => Client
  deleteClient: (id: string) => void
  /** fusionne les fiches `fromIds` dans `toId` (ventes regroupées) */
  mergeClients: (toId: string, fromIds: string[]) => void

  // caisse
  addToCart: (p: Product, qty?: number) => void
  setQty: (productId: string, qty: number) => void
  removeFromCart: (productId: string) => void
  setCart: (patch: Partial<Cart>) => void
  clearCart: () => void
  checkout: (status: OrderStatus, received: number) => Promise<Order | null>

  // commandes
  setOrderStatus: (id: string, status: OrderStatus) => void
  deleteOrder: (id: string) => void

  // réglages & données
  saveSettings: (s: Partial<Settings>) => void
  importData: (data: unknown) => boolean
  resetAll: () => void
}

const DEFAULT_SETTINGS: Settings = { shopName: 'Armurerie de Valentine', town: 'Valentine, New Hanover', taxPct: 0 }

const initial = () => ({
  products: SEED_PRODUCTS,
  clients: [] as Client[],
  orders: [] as Order[],
  settings: DEFAULT_SETTINGS,
  cart: emptyCart(),
  nextOrderNumber: 1,
})

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial(),
      ready: !hasDb,

      load: async () => {
        const snap = await fetchAll()
        if (!snap) {
          set({ ready: true })
          return
        }
        set((s) => ({
          products: snap.products,
          clients: snap.clients,
          orders: snap.orders,
          settings: snap.settings ?? s.settings,
          nextOrderNumber: Math.max(0, ...snap.orders.map((o) => o.number)) + 1,
          // retire de la note les articles supprimés entre-temps
          cart: { ...s.cart, items: s.cart.items.filter((i) => snap.products.some((p) => p.id === i.productId)) },
          ready: true,
        }))
      },

      saveProduct: (p) => {
        const product: Product = { ...p, id: p.id ?? uid(), price: round2(p.price) }
        set((s) => {
          const exists = s.products.some((x) => x.id === product.id)
          return { products: exists ? s.products.map((x) => (x.id === product.id ? product : x)) : [...s.products, product] }
        })
        db.upsertProduct(product)
      },
      deleteProduct: (id) => {
        set((s) => ({ products: s.products.filter((p) => p.id !== id) }))
        db.deleteProduct(id)
      },

      saveClient: (c) => {
        const prev = c.id ? get().clients.find((x) => x.id === c.id) : undefined
        const client: Client = { ...c, id: c.id ?? uid(), createdAt: prev?.createdAt ?? Date.now() }
        set((s) => ({
          clients: prev ? s.clients.map((x) => (x.id === client.id ? client : x)) : [client, ...s.clients],
          // garde le nom à jour sur les commandes existantes
          orders: prev ? s.orders.map((o) => (o.clientId === client.id ? { ...o, clientName: client.name } : o)) : s.orders,
        }))
        db.upsertClient(client).then(() => {
          if (prev && prev.name !== client.name) db.renameClientOrders(client.id, client.name)
        })
        return client
      },
      mergeClients: (toId, fromIds) => {
        const target = get().clients.find((c) => c.id === toId)
        if (!target) return
        const from = get().clients.filter((c) => fromIds.includes(c.id))
        // on garde les infos manquantes des autres fiches (téléphone, notes)
        const merged: Client = {
          ...target,
          phone: target.phone || from.find((c) => c.phone)?.phone || '',
          notes: [target.notes, ...from.map((c) => c.notes)].filter(Boolean).join(' · ').slice(0, 500),
        }
        set((s) => ({
          clients: s.clients.filter((c) => !fromIds.includes(c.id)).map((c) => (c.id === toId ? merged : c)),
          orders: s.orders.map((o) => (o.clientId && fromIds.includes(o.clientId) ? { ...o, clientId: toId, clientName: merged.name } : o)),
          cart: s.cart.clientId && fromIds.includes(s.cart.clientId) ? { ...s.cart, clientId: toId } : s.cart,
        }))
        db.upsertClient(merged).then(async () => {
          for (const id of fromIds) await db.mergeClients(id, toId, merged.name)
        })
      },
      deleteClient: (id) => {
        set((s) => ({
          clients: s.clients.filter((c) => c.id !== id),
          cart: s.cart.clientId === id ? { ...s.cart, clientId: null } : s.cart,
        }))
        db.deleteClient(id)
      },

      addToCart: (p, qty = 1) =>
        set((s) => {
          const found = s.cart.items.find((i) => i.productId === p.id)
          const items = found
            ? s.cart.items.map((i) => (i.productId === p.id ? { ...i, qty: i.qty + qty } : i))
            : [...s.cart.items, { productId: p.id, name: p.name, price: p.price, qty }]
          return { cart: { ...s.cart, items } }
        }),
      setQty: (productId, qty) =>
        set((s) => ({
          cart: {
            ...s.cart,
            items:
              qty <= 0
                ? s.cart.items.filter((i) => i.productId !== productId)
                : s.cart.items.map((i) => (i.productId === productId ? { ...i, qty } : i)),
          },
        })),
      removeFromCart: (productId) => set((s) => ({ cart: { ...s.cart, items: s.cart.items.filter((i) => i.productId !== productId) } })),
      setCart: (patch) => set((s) => ({ cart: { ...s.cart, ...patch } })),
      clearCart: () => set({ cart: emptyCart() }),

      checkout: async (status, received) => {
        const { cart, clients, settings, nextOrderNumber, products } = get()
        if (!cart.items.length) return null
        const client = clients.find((c) => c.id === cart.clientId)
        const { partner, partnerDiscount, ...totals } = cartTotals(cart, products, settings, useExtras.getState().partners)
        const paid = status === 'payee' || status === 'livree'
        const draft: Order = {
          id: uid(),
          number: nextOrderNumber,
          clientId: client?.id ?? null,
          clientName: client?.name ?? 'Client de passage',
          // coût de fabrication figé au moment de la vente (compta)
          items: cart.items.map((i) => ({ ...i, cost: unitCost(products.find((p) => p.id === i.productId), useStock.getState().materials) })),
          discountPct: cart.discountPct,
          taxPct: settings.taxPct,
          ...totals,
          received: paid ? round2(received) : 0,
          change: paid ? round2(Math.max(0, received - totals.total)) : 0,
          status,
          note: cart.note,
          createdAt: Date.now(),
          partnerName: partner?.name ?? null,
          seller: currentSellerName(),
          partnerDiscount,
        }
        let order = draft
        if (hasDb) {
          // la base attribue le numéro définitif ; en cas d'échec la note est conservée
          const { number: _n, ...rest } = draft
          const saved = await db.insertOrder(rest)
          if (!saved) return null
          order = saved
        }
        moveStockFor(order.items, products, -1)
        set((s) => ({
          orders: [order, ...s.orders.filter((o) => o.id !== order.id)],
          nextOrderNumber: Math.max(s.nextOrderNumber, order.number + 1),
          cart: emptyCart(),
        }))
        return order
      },

      setOrderStatus: (id, status) => {
        const order = get().orders.find((o) => o.id === id)
        if (!order || order.status === status) return
        const becomesPaid = order.status === 'en_attente' && (status === 'payee' || status === 'livree')
        const updated: Order = { ...order, status, ...(becomesPaid && !order.received ? { received: order.total } : {}) }
        set((s) => ({ orders: s.orders.map((o) => (o.id === id ? updated : o)) }))
        db.updateOrder(id, { status, received: updated.received })
        // annulation = matières restituées ; dé-annulation = re-consommées
        if (status === 'annulee') moveStockFor(order.items, get().products, 1)
        else if (order.status === 'annulee') moveStockFor(order.items, get().products, -1)
      },
      deleteOrder: (id) => {
        const order = get().orders.find((o) => o.id === id)
        if (!order) return
        set((s) => ({ orders: s.orders.filter((o) => o.id !== id) }))
        db.deleteOrder(id)
        if (order.status !== 'annulee') moveStockFor(order.items, get().products, 1)
      },

      saveSettings: (patch) => {
        const settings = { ...get().settings, ...patch }
        set({ settings })
        db.saveSettings(settings)
      },

      importData: (data) => {
        const d = data as Partial<State>
        if (!d || !Array.isArray(d.products) || !Array.isArray(d.clients) || !Array.isArray(d.orders)) return false
        const next = {
          products: d.products,
          clients: d.clients,
          orders: d.orders,
          settings: { ...get().settings, ...(d.settings ?? {}) },
        }
        set({ ...next, nextOrderNumber: Math.max(0, ...d.orders.map((o) => o.number)) + 1, cart: emptyCart() })
        db.replaceAll(next)
        return true
      },
      resetAll: () => {
        const fresh = initial()
        set(fresh)
        db.replaceAll(fresh)
      },
    }),
    {
      name: 'armurerie-rdr2',
      version: 3,
      // Avec Supabase, seule la note en cours reste dans le navigateur ; le reste vient de la base.
      partialize: (s) =>
        hasDb
          ? { cart: s.cart }
          : { products: s.products, clients: s.clients, orders: s.orders, settings: s.settings, cart: s.cart, nextOrderNumber: s.nextOrderNumber },
      // v2 : catalogue remplacé par celui de la boutique en jeu (clients & commandes conservés)
      // v3 : ajout des icônes du jeu sur les articles d'origine
      migrate: (persisted, version) => {
        let s = persisted as State
        if (version < 2) s = { ...s, products: SEED_PRODUCTS, cart: emptyCart() }
        if (version < 3 && s.products)
          s = { ...s, products: s.products.map((p) => (p.image ? p : { ...p, image: SEED_PRODUCTS.find((x) => x.id === p.id)?.image })) }
        return s
      },
    },
  ),
)

export const exportData = () => {
  const { products, clients, orders, settings, nextOrderNumber } = useStore.getState()
  return { app: 'armurerie', exportedAt: new Date().toISOString(), products, clients, orders, settings, nextOrderNumber }
}
