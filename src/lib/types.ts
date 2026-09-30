export const CATEGORIES = [
  'Revolvers',
  'Pistolets',
  'Carabines',
  'Fusils',
  'Fusils à pompe',
  'Armes de jet & blanches',
  'Munitions',
  'Accessoires',
  'Personnalisation',
] as const

export type Category = (typeof CATEGORIES)[number]

export interface Product {
  id: string
  name: string
  category: Category
  price: number
  stock: number | null // null = illimité (services)
  image?: string // URL d'image optionnelle (sinon illustration auto)
}

export interface Client {
  id: string
  name: string
  phone: string
  license: string // plus utilisé (n° de permis retiré de l'interface)
  licenseValid: boolean
  notes: string
  createdAt: number
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  qty: number
  /** numéros de série (un par exemplaire) — obligatoires pour les armes */
  serials?: string[]
}

export type OrderStatus = 'en_attente' | 'payee' | 'livree' | 'annulee'

export interface Order {
  id: string
  number: number
  clientId: string | null
  clientName: string
  items: OrderItem[]
  discountPct: number
  taxPct: number
  subtotal: number
  discount: number
  tax: number
  total: number
  received: number
  change: number
  status: OrderStatus
  note: string
  createdAt: number
}

export interface Settings {
  shopName: string
  town: string
  taxPct: number
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  en_attente: 'En attente',
  payee: 'Payée',
  livree: 'Livrée',
  annulee: 'Annulée',
}
