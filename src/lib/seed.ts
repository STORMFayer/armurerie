import type { Category, Product } from './types'

const p = (id: string, name: string, category: Category, price: number, image = true): Product => ({
  id,
  name,
  category,
  price,
  stock: null, // pas de gestion de stock
  image: image ? `img/items/${id}.png` : undefined, // icônes du jeu (public/img/items)
})

// Grille de prix officielle des armureries (réunion, applicable le 3 octobre 1899 au soir).
export const SEED_PRODUCTS: Product[] = [
  // Revolvers
  p('rev-cattleman', 'Revolver Cattleman', 'Revolvers', 74.5),
  p('rev-cattleman-mex', 'Cattleman mexicain', 'Revolvers', 69),
  p('rev-double', 'Revolver Double-Action', 'Revolvers', 51.5),
  p('rev-lemat', 'Revolver LeMat', 'Revolvers', 63),
  p('rev-navy', 'Revolver Navy', 'Revolvers', 16.5),
  p('rev-schofield', 'Revolver Schofield', 'Revolvers', 57.5),
  // Pistolets
  p('pis-mauser', 'Pistolet Mauser', 'Pistolets', 34.5),
  p('pis-semi', 'Pistolet semi-automatique', 'Pistolets', 63),
  p('pis-volcanic', 'Pistolet Volcanic', 'Pistolets', 69),
  p('pis-m1899', 'Pistolet M1899', 'Pistolets', 80.5),
  // Carabines
  p('car-repeat', 'Carabine à répétition', 'Carabines', 68.5),
  p('car-evans', 'Evans', 'Carabines', 86),
  p('car-henry', 'Henry', 'Carabines', 137.5),
  p('car-winchester', 'Winchester', 'Carabines', 120.5),
  // Fusils
  p('fus-varmint', 'Varmint', 'Fusils', 63),
  p('fus-bolt', 'Bolt (fusil à verrou)', 'Fusils', 189),
  p('fus-springfield', 'Springfield', 'Fusils', 218),
  p('fus-carcano', 'Carcano', 'Fusils', 558.5),
  p('fus-rolling', 'Rolling Block', 'Fusils', 520),
  p('pom-elephant', 'Fusil éléphant', 'Fusils', 269.5),
  // Fusils à pompe
  p('pom-pump', 'Fusil à pompe', 'Fusils à pompe', 323.5),
  p('pom-double', 'Double canon', 'Fusils à pompe', 378.5),
  p('pom-semi', 'Pompe semi-auto', 'Fusils à pompe', 290.5),
  p('pom-sawed', 'Canon scié', 'Fusils à pompe', 285),
  p('pom-repeating', 'Pompe à répétition', 'Fusils à pompe', 269.5),
  // Armes de jet & blanches
  p('bl-knife', 'Couteau', 'Armes de jet & blanches', 2.5),
  p('bl-rustic', 'Couteau de skinner', 'Armes de jet & blanches', 3),
  p('bl-cultist', 'Couteau cultiste', 'Armes de jet & blanches', 4),
  p('bl-throwing', 'Couteaux de lancer', 'Armes de jet & blanches', 12.5),
  p('bl-hatchet', 'Hachette', 'Armes de jet & blanches', 17.5),
  p('bl-machete', 'Machette', 'Armes de jet & blanches', 57),
  p('bl-machete-coll', 'Machette de collection', 'Armes de jet & blanches', 114.5),
  // Munitions (à l'unité) : armes à feu 0,25 · armes blanches 0,40
  p('mun-rev', 'Munitions de revolver normales', 'Munitions', 0.25),
  p('mun-pis', 'Munitions de pistolet normales', 'Munitions', 0.25),
  p('mun-car', 'Munitions de répétition normales', 'Munitions', 0.25),
  p('mun-varmint', 'Munitions de Varmint normales', 'Munitions', 0.25),
  p('mun-varmint-tranq', 'Munitions tranquillisantes de Varmint', 'Munitions', 0.25),
  p('mun-fus', 'Munitions de fusil normales', 'Munitions', 0.25),
  p('mun-elephant', 'Munitions de fusil à éléphant', 'Munitions', 0.25),
  p('mun-pom', 'Munitions de fusil à pompe normales', 'Munitions', 0.25),
  p('mun-knife', 'Munitions de couteaux de lancer', 'Munitions', 0.4),
  p('mun-hatchet', 'Munitions de hachette', 'Munitions', 0.4),
  // Accessoires (hors grille, prix inchangés)
  p('acc-oil', 'Huile pour arme', 'Accessoires', 0.2),
  p('acc-cuffs', 'Menottes', 'Accessoires', 1.25),
  p('acc-binoculars', 'Jumelles améliorées', 'Accessoires', 2),
  p('acc-lasso', 'Lasso renforcé', 'Accessoires', 5.5),
  // Personnalisation — esthétique (par modification : matériaux, gravures, teintes, poignée, emballage…)
  p('cus-esth-poing', 'Esthétique — arme de poing', 'Personnalisation', 1.5, false),
  p('cus-esth-epaule', "Esthétique — arme d'épaule", 'Personnalisation', 2, false),
  // Personnalisation — lunettes
  p('cus-lunette-petite', 'Lunette petite', 'Personnalisation', 110, false),
  p('cus-lunette-moyenne', 'Lunette moyenne', 'Personnalisation', 120, false),
  p('cus-lunette-grande', 'Lunette grande', 'Personnalisation', 140, false),
  // Personnalisation — améliorations mécaniques (canon, rayure, viseur…) selon le prix de l'arme
  p('cus-meca-1', 'Amélioration mécanique — arme 0 à 50 $', 'Personnalisation', 4.5, false),
  p('cus-meca-2', 'Amélioration mécanique — arme 50 à 100 $', 'Personnalisation', 7, false),
  p('cus-meca-3', 'Amélioration mécanique — arme 100 à 200 $', 'Personnalisation', 10, false),
  p('cus-meca-4', 'Amélioration mécanique — arme 200 à 300 $', 'Personnalisation', 15, false),
  p('cus-meca-5', 'Amélioration mécanique — arme 300 $ et plus', 'Personnalisation', 20, false),
]

/** Tranche d'amélioration mécanique correspondant au prix d'une arme. */
export function mecaTrancheFor(price: number) {
  if (price < 50) return 'cus-meca-1'
  if (price < 100) return 'cus-meca-2'
  if (price < 200) return 'cus-meca-3'
  if (price < 300) return 'cus-meca-4'
  return 'cus-meca-5'
}
