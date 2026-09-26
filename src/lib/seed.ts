import type { Category, Product } from './types'

const p = (id: string, name: string, category: Category, price: number, stock: number | null): Product => ({
  id,
  name,
  category,
  price,
  stock,
  image: `img/items/${id}.png`, // icônes du jeu (public/img/items)
})

// Catalogue de la boutique en jeu (prix & stocks relevés sur les captures) — modifiable dans l'onglet Catalogue.
export const SEED_PRODUCTS: Product[] = [
  // Revolvers
  p('rev-navy', 'Revolver Navy', 'Revolvers', 16.5, 3),
  p('rev-cattleman', 'Revolver Cattleman', 'Revolvers', 71.5, 0),
  p('rev-lemat', 'Revolver Lemat', 'Revolvers', 60.5, 0),
  p('rev-double', 'Revolver Double-Action', 'Revolvers', 49.5, 0),
  // Pistolets
  p('pis-m1899', 'Pistolet M1899', 'Pistolets', 77, 0),
  p('pis-mauser', 'Pistolet Mauser', 'Pistolets', 33, 0),
  // Carabines
  p('car-winchester', 'Winchester Repeater', 'Carabines', 115.5, 0),
  // Fusils
  p('fus-bolt', 'BoltAction Rifle', 'Fusils', 181.5, 0),
  p('fus-carcano', 'Carcano Rifle', 'Fusils', 535.5, 0),
  // Fusils à pompe
  p('pom-sawed', 'Fusil à canon scié', 'Fusils à pompe', 286, 0),
  p('pom-pump', 'Fusil à pompe', 'Fusils à pompe', 309.75, 0),
  p('pom-semi', 'Shotgun Semi-auto', 'Fusils à pompe', 291.5, 0),
  // Armes de jet & blanches
  p('bl-knife', 'Couteau', 'Armes de jet & blanches', 2.5, 7),
  p('bl-merchant', 'Marchand de couteaux', 'Armes de jet & blanches', 3, 0),
  p('bl-throwing', 'Couteaux de lancer', 'Armes de jet & blanches', 12.5, 0),
  p('bl-hatchet', 'Hachette de chasse', 'Armes de jet & blanches', 15, 0),
  // Munitions
  p('mun-rev', 'Munitions normales — revolver', 'Munitions', 0.2, 0),
  p('mun-pis', 'Munitions normales — pistolet', 'Munitions', 0.2, 0),
  p('mun-fus', 'Munitions normales — fusil', 'Munitions', 0.2, 27),
  p('mun-car', 'Munitions normales — carabine', 'Munitions', 0.2, 12),
  p('mun-pom', 'Munitions normales — fusil à pompe', 'Munitions', 0.2, 12),
  p('mun-hatchet', 'Hatchet Ammo', 'Munitions', 0.4, 0),
  p('mun-knife', 'Munitions de couteaux', 'Munitions', 0.4, 0),
  // Accessoires
  p('acc-oil', 'Huile pour arme', 'Accessoires', 0.2, 29),
  p('acc-lasso', 'Lasso renforcé', 'Accessoires', 5.5, 8),
  p('acc-binoculars', 'Jumelles améliorées', 'Accessoires', 2, 3),
]
