import type { Category, Product } from './types'

const p = (id: string, name: string, category: Category, price: number, image = true): Product => ({
  id,
  name,
  category,
  price,
  stock: null, // pas de gestion de stock
  image: image ? `img/items/${id}.png` : undefined, // icônes du jeu (public/img/items)
})

// Grille de prix de vente officielle (message à Arthur Kingston) + personnalisation (tableau).
export const SEED_PRODUCTS: Product[] = [
  // Revolvers
  p('rev-cattleman', 'Revolver Cattleman', 'Revolvers', 71.5),
  p('rev-cattleman-mex', 'Cattleman mexicain', 'Revolvers', 66),
  p('rev-double', 'Revolver Double-Action', 'Revolvers', 49.5),
  p('rev-lemat', 'Revolver LeMat', 'Revolvers', 60.5),
  p('rev-navy', 'Revolver Navy', 'Revolvers', 16.5),
  p('rev-schofield', 'Revolver Schofield', 'Revolvers', 55),
  // Pistolets
  p('pis-mauser', 'Pistolet Mauser', 'Pistolets', 33),
  p('pis-semi', 'Pistolet semi-automatique', 'Pistolets', 60.5),
  p('pis-volcanic', 'Pistolet Volcanic', 'Pistolets', 66),
  p('pis-m1899', 'Pistolet M1899', 'Pistolets', 77),
  // Carabines
  p('car-repeat', 'Répétition', 'Carabines', 66),
  p('car-evans', 'Evans', 'Carabines', 82.5),
  p('car-henry', 'Henry', 'Carabines', 132),
  p('car-winchester', 'Winchester', 'Carabines', 115.5),
  // Fusils
  p('fus-varmint', 'Varmint', 'Fusils', 60.5),
  p('fus-bolt', 'Bolt (fusil à verrou)', 'Fusils', 181.5),
  p('fus-springfield', 'Springfield', 'Fusils', 209),
  p('fus-carcano', 'Carcano', 'Fusils', 535.5),
  p('fus-rolling', 'Rolling Block', 'Fusils', 498.75),
  // Fusils à pompe
  p('pom-pump', 'Fusil à pompe', 'Fusils à pompe', 309.75),
  p('pom-double', 'Double canon', 'Fusils à pompe', 362.25),
  p('pom-semi', 'Pompe semi-auto', 'Fusils à pompe', 277.5),
  p('pom-sawed', 'Canon scié', 'Fusils à pompe', 272),
  p('pom-elephant', 'Fusil éléphant', 'Fusils à pompe', 330),
  p('pom-repeating', 'Pompe à répétition', 'Fusils à pompe', 258.5),
  // Armes de jet & blanches
  p('bl-knife', 'Couteau', 'Armes de jet & blanches', 2.5),
  p('bl-throwing', 'Couteaux de lancer', 'Armes de jet & blanches', 12.5),
  p('bl-rustic', 'Couteau rustique', 'Armes de jet & blanches', 3),
  p('bl-merchant', 'Couteau commerçant', 'Armes de jet & blanches', 3),
  p('bl-hatchet', 'Hachette de chasse', 'Armes de jet & blanches', 15),
  p('bl-machete', 'Machette', 'Armes de jet & blanches', 55),
  p('bl-machete-coll', 'Machette de collectionneur', 'Armes de jet & blanches', 110),
  // Munitions
  p('mun-rev', 'Munitions de revolver normales', 'Munitions', 0.2),
  p('mun-pis', 'Munitions de pistolet normales', 'Munitions', 0.2),
  p('mun-car', 'Munitions de répétition normales', 'Munitions', 0.2),
  p('mun-varmint', 'Munitions de Varmint normales', 'Munitions', 0.2),
  p('mun-varmint-tranq', 'Munitions tranquillisantes de Varmint', 'Munitions', 0.2),
  p('mun-fus', 'Munitions de fusil normales', 'Munitions', 0.2),
  p('mun-elephant', 'Munitions de fusil à éléphant', 'Munitions', 0.2),
  p('mun-pom', 'Munitions de fusil à pompe normales', 'Munitions', 0.2),
  p('mun-knife', 'Munitions de couteaux de lancer', 'Munitions', 0.35),
  p('mun-hatchet', 'Munitions de hachette', 'Munitions', 0.35),
  // Accessoires
  p('acc-oil', 'Huile pour arme', 'Accessoires', 0.2),
  p('acc-cuffs', 'Menottes', 'Accessoires', 1.25),
  p('acc-binoculars', 'Jumelles améliorées', 'Accessoires', 2),
  p('acc-lasso', 'Lasso renforcé', 'Accessoires', 5.5),
  // Personnalisation (prix de vente théorique en RP)
  p('cus-viseur', 'Viseur', 'Personnalisation', 4.5, false),
  p('cus-viseur-mat', 'Matériau du viseur', 'Personnalisation', 1.25, false),
  p('cus-lunette', 'Lunette', 'Personnalisation', 105, false),
  p('cus-rayure', 'Rayure du canon', 'Personnalisation', 4.5, false),
  p('cus-canon', 'Canon', 'Personnalisation', 4.5, false),
  p('cus-canon-mat', 'Matériau du canon', 'Personnalisation', 1.25, false),
  p('cus-canon-grav', 'Gravure du canon', 'Personnalisation', 1.25, false),
  p('cus-cadre-mat', 'Matériau du cadre', 'Personnalisation', 1.25, false),
  p('cus-cadre-grav', 'Gravure du cadre', 'Personnalisation', 1.25, false),
  p('cus-cadre-grav-mat', 'Matériau de la gravure du cadre', 'Personnalisation', 1.25, false),
  p('cus-cyl-mat', 'Matériau du cylindre', 'Personnalisation', 1.25, false),
  p('cus-cyl-grav', 'Gravure du cylindre', 'Personnalisation', 1.25, false),
  p('cus-cyl-grav-mat', 'Matériau de la gravure du cylindre', 'Personnalisation', 1.25, false),
  p('cus-poignee', 'Poignée', 'Personnalisation', 1.25, false),
  p('cus-poignee-grav', 'Gravure de la poignée', 'Personnalisation', 1.25, false),
  p('cus-crosse-teinte', 'Teinte de la crosse', 'Personnalisation', 1.25, false),
  p('cus-detente-mat', 'Matériau de la détente', 'Personnalisation', 1.25, false),
  p('cus-cadre', 'Cadre', 'Personnalisation', 1.25, false),
  p('cus-emballage', 'Emballage', 'Personnalisation', 1.25, false),
  p('cus-emballage-mat', "Matériau de l'emballage", 'Personnalisation', 1.25, false),
  p('cus-emballage-teinte', "Teinte de l'emballage", 'Personnalisation', 1.25, false),
  p('cus-chargeur', 'Chargeur', 'Personnalisation', 1.25, false),
]
