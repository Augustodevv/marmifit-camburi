/**
 * Dados demonstrativos da Marmifit Camburi. Idempotente (upsert por slug).
 * Informações nutricionais NÃO são preenchidas: cadastre no painel apenas
 * dados verificados (laudo, fornecedor ou tabela oficial como a TACO).
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type IngredientGroup } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const categories = [
  { slug: "tradicionais", name: "Marmitas tradicionais", description: "O sabor de comida caseira, com arroz, feijão e aquele tempero de casa." },
  { slug: "risotos-massas", name: "Risotos & massas", description: "Risotos com arroz integral e massas caprichadas." },
  { slug: "caldos-cremes", name: "Caldos e cremes", description: "Caldos e cremes leves e nutritivos." },
  { slug: "low-carb", name: "Marmitas low carb", description: "Menos carboidrato, mais legumes e proteína." },
  { slug: "proteina-extra", name: "Proteína extra", description: "Porções reforçadas de proteína para quem treina pesado." },
  { slug: "vegetarianas", name: "Marmitas vegetarianas", description: "Sem carne, com ovos, queijos e muitos vegetais." },
  { slug: "veganas", name: "Marmitas veganas", description: "100% vegetais, sem ingredientes de origem animal." },
  { slug: "executivas", name: "Marmitas executivas", description: "Pratos completos e caprichados para o almoço de trabalho." },
  { slug: "fitness", name: "Marmitas fitness", description: "Combinações equilibradas e porções controladas." },
  { slug: "do-dia", name: "Marmitas do dia", description: "Um prato especial diferente a cada dia da semana." },
  { slug: "personalizadas", name: "Marmitas personalizadas", description: "Monte a sua do seu jeito: tamanho, proteína, base e acompanhamentos." },
  { slug: "combos-familiares", name: "Combos familiares", description: "Kits para dividir em casa.", isCombo: true },
  { slug: "combos-semanais", name: "Combos semanais", description: "Sua semana inteira resolvida, com desconto.", isCombo: true },
];

const sizes = [
  { slug: "pequena", name: "Pequena", grams: 350, customBasePrice: 1990, priceMultiplier: 8000, maxProteins: 1, maxBases: 1, maxSides: 2, maxAddons: 3, proteinGrams: 100, baseGrams: 150, sidesGrams: 100 },
  { slug: "media", name: "Média", grams: 500, customBasePrice: 2490, priceMultiplier: 10000, maxProteins: 1, maxBases: 2, maxSides: 3, maxAddons: 4, proteinGrams: 150, baseGrams: 200, sidesGrams: 150 },
  { slug: "grande", name: "Grande", grams: 650, customBasePrice: 2990, priceMultiplier: 12000, maxProteins: 2, maxBases: 2, maxSides: 3, maxAddons: 5, proteinGrams: 200, baseGrams: 250, sidesGrams: 200 },
  { slug: "familia", name: "Família", grams: 1000, customBasePrice: 5490, priceMultiplier: 22000, maxProteins: 3, maxBases: 3, maxSides: 4, maxAddons: 6, proteinGrams: 300, baseGrams: 400, sidesGrams: 300 },
];

const styles = [
  { slug: "tradicional", name: "Tradicional", description: "Sem restrições: escolha o que quiser." },
  { slug: "low-carb", name: "Low carb", description: "Bases e acompanhamentos com menos carboidrato.", requireLowCarb: true },
  { slug: "vegetariano", name: "Vegetariano", description: "Sem carnes e peixes.", requireVegetarian: true },
  { slug: "vegano", name: "Vegano", description: "Sem nenhum ingrediente de origem animal.", requireVegan: true },
  { slug: "personalizado", name: "Personalizado", description: "Liberdade total, inclusive misturar estilos." },
];

type Ing = {
  slug: string;
  name: string;
  group: IngredientGroup;
  price?: number;
  extraPrice?: number;
  extraGrams?: number;
  veg?: boolean;
  vegan?: boolean;
  lowCarb?: boolean;
  allergens?: string[];
  description?: string;
};

const ingredients: Ing[] = [
  { slug: "frango-grelhado", name: "Frango grelhado", group: "PROTEIN", extraPrice: 690, extraGrams: 100, description: "Peito de frango temperado com ervas" },
  { slug: "carne-bovina", name: "Patinho em cubos", group: "PROTEIN", price: 300, extraPrice: 890, extraGrams: 100, description: "Carne bovina magra ao molho" },
  { slug: "carne-moida", name: "Carne moída", group: "PROTEIN", extraPrice: 690, extraGrams: 100, description: "Patinho moído refogado" },
  { slug: "peixe", name: "Tilápia grelhada", group: "PROTEIN", price: 400, extraPrice: 990, extraGrams: 100, allergens: ["Peixe"], description: "Filé de tilápia com limão" },
  { slug: "omelete", name: "Omelete", group: "PROTEIN", extraPrice: 490, extraGrams: 80, veg: true, allergens: ["Ovo"], description: "Omelete de ovos caipiras" },
  { slug: "tofu", name: "Tofu grelhado", group: "PROTEIN", price: 200, extraPrice: 690, extraGrams: 100, veg: true, vegan: true, allergens: ["Soja"] },
  { slug: "proteina-vegetal", name: "Proteína vegetal ao sugo", group: "PROTEIN", extraPrice: 590, extraGrams: 100, veg: true, vegan: true, allergens: ["Soja"] },

  { slug: "arroz-branco", name: "Arroz branco", group: "BASE", veg: true, vegan: true },
  { slug: "arroz-integral", name: "Arroz integral", group: "BASE", veg: true, vegan: true },
  { slug: "macarrao", name: "Macarrão ao alho e óleo", group: "BASE", veg: true, allergens: ["Glúten", "Ovo"] },
  { slug: "pure-batata", name: "Purê de batata", group: "BASE", veg: true, allergens: ["Leite"] },
  { slug: "pure-abobora", name: "Purê de abóbora", group: "BASE", veg: true, vegan: true, lowCarb: true },
  { slug: "legumes-vapor", name: "Legumes no vapor", group: "BASE", veg: true, vegan: true, lowCarb: true },
  { slug: "arroz-couve-flor", name: "Arroz de couve-flor", group: "BASE", price: 200, veg: true, vegan: true, lowCarb: true },
  { slug: "quinoa", name: "Quinoa", group: "BASE", price: 300, veg: true, vegan: true },

  { slug: "feijao-carioca", name: "Feijão carioca", group: "SIDE", veg: true, vegan: true },
  { slug: "feijao-preto", name: "Feijão preto", group: "SIDE", veg: true, vegan: true },
  { slug: "salada-verde", name: "Salada verde", group: "SIDE", veg: true, vegan: true, lowCarb: true },
  { slug: "brocolis", name: "Brócolis", group: "SIDE", veg: true, vegan: true, lowCarb: true },
  { slug: "cenoura", name: "Cenoura", group: "SIDE", veg: true, vegan: true, lowCarb: true },
  { slug: "abobrinha", name: "Abobrinha grelhada", group: "SIDE", veg: true, vegan: true, lowCarb: true },
  { slug: "vagem", name: "Vagem refogada", group: "SIDE", veg: true, vegan: true, lowCarb: true },
  { slug: "farofa", name: "Farofa de mandioca", group: "SIDE", veg: true, allergens: ["Leite"] },
  { slug: "batata-doce", name: "Batata-doce assada", group: "SIDE", veg: true, vegan: true },

  { slug: "ovo-extra", name: "Ovo frito", group: "ADDON", price: 300, extraGrams: 50, veg: true, allergens: ["Ovo"] },
  { slug: "queijo", name: "Queijo muçarela gratinado", group: "ADDON", price: 350, extraGrams: 30, veg: true, lowCarb: true, allergens: ["Leite"] },
  { slug: "legumes-extra", name: "Porção extra de legumes", group: "ADDON", price: 300, extraGrams: 80, veg: true, vegan: true, lowCarb: true },
  { slug: "molho-tomate", name: "Molho de tomate caseiro", group: "ADDON", price: 200, extraGrams: 40, veg: true, vegan: true, lowCarb: true },
  { slug: "molho-mostarda-mel", name: "Molho mostarda e mel", group: "ADDON", price: 200, extraGrams: 30, veg: true },
  { slug: "molho-pesto", name: "Molho pesto", group: "ADDON", price: 250, extraGrams: 30, veg: true, lowCarb: true, allergens: ["Leite", "Castanhas"] },
  { slug: "banana-terra", name: "Banana-da-terra grelhada", group: "ADDON", price: 300, extraGrams: 60, veg: true, vegan: true },
];

type Prod = {
  slug: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  compareAtPrice?: number;
  hasSizes?: boolean;
  featured?: boolean;
  dailyDays?: number[];
  tags?: string[];
  ingredientsText: string;
  allergens?: string[];
  image?: string;
};

const products: Prod[] = [
  // Cardápio real (preço de referência = 500 g)
  { slug: "carne-panela-pure-arroz-feijao", name: "Carne de panela suculenta com purê de batata, arroz e feijão", category: "tradicionais", basePrice: 3500, description: "Carne de panela suculenta com purê de batata, arroz e feijão.", ingredientsText: "Carne de panela, purê de batata, arroz e feijão." },
  { slug: "sobrecoxa-molho-laranja", name: "Sobrecoxa assada ao molho de laranja com batatas, arroz e legumes", category: "tradicionais", basePrice: 3500, description: "Sobrecoxa assada ao molho de laranja com batatas, arroz e legumes.", ingredientsText: "Sobrecoxa de frango, molho de laranja, batatas, arroz e legumes." },
  { slug: "strogonoff-carne-pure", name: "Strogonoff de carne com purê de batata e arroz", category: "tradicionais", basePrice: 3500, description: "Strogonoff de carne com purê de batata e arroz (integral ou branco — informe nas observações).", ingredientsText: "Carne, creme de leite, purê de batata e arroz integral ou branco.", allergens: ["Leite"] },
  { slug: "parmegiana-carne-fit", name: "Parmegiana de carne fit com arroz e feijão", category: "tradicionais", basePrice: 3500, description: "Parmegiana de carne fit com arroz e feijão.", ingredientsText: "Carne, molho de tomate, queijo, arroz e feijão.", allergens: ["Leite"] },
  { slug: "peixe-cogumelos-pure-mandioquinha", name: "Filé de peixe grelhado com mix de cogumelos e purê de mandioquinha", category: "tradicionais", basePrice: 4000, description: "Filé de peixe grelhado com mix de cogumelos e purê de mandioquinha.", ingredientsText: "Filé de peixe, mix de cogumelos e purê de mandioquinha.", allergens: ["Peixe"] },
  { slug: "risoto-integral-frango-legumes", name: "Risoto integral de frango com legumes", category: "risotos-massas", basePrice: 3500, description: "Risoto de arroz integral com frango e legumes.", ingredientsText: "Arroz integral, frango e legumes." },
  { slug: "risoto-integral-lula-vegetais", name: "Risoto integral de lula com vegetais", category: "risotos-massas", basePrice: 4500, featured: true, description: "Risoto de arroz integral com lula, vegetais e raspas de limão.", ingredientsText: "Arroz integral, lula, vegetais e limão.", allergens: ["Moluscos"], image: "/images/produtos/risoto-lula.jpg" },
  { slug: "linguine-limone-camaroes", name: "Linguine ao limone com camarões", category: "risotos-massas", basePrice: 5500, description: "Linguine ao molho de limão-siciliano com camarões.", ingredientsText: "Linguine, camarões e limão.", allergens: ["Glúten", "Crustáceos"] },
  { slug: "lasanha-berinjela-ricota", name: "Lasanha de berinjela com ricota", category: "vegetarianas", basePrice: 3500, tags: ["vegetariano"], description: "Lasanha de berinjela com ricota.", ingredientsText: "Berinjela e ricota.", allergens: ["Leite"] },
  { slug: "risoto-integral-vegetais", name: "Risoto integral com vegetais", category: "vegetarianas", basePrice: 3500, tags: ["vegetariano"], description: "Risoto de arroz integral com vegetais.", ingredientsText: "Arroz integral e vegetais." },
  { slug: "strogonoff-grao-de-bico", name: "Strogonoff de grão-de-bico com vegetais e toque de mascarpone", category: "vegetarianas", basePrice: 3500, tags: ["vegetariano"], description: "Strogonoff de grão-de-bico com vegetais e um toque de mascarpone.", ingredientsText: "Grão-de-bico, vegetais e mascarpone.", allergens: ["Leite"] },
  { slug: "cogumelos-arroz-integral-mandioquinha", name: "Mix de cogumelos com arroz integral e purê de mandioquinha", category: "vegetarianas", basePrice: 3500, tags: ["vegetariano"], description: "Mix de cogumelos com arroz integral e purê de mandioquinha.", ingredientsText: "Mix de cogumelos, arroz integral e purê de mandioquinha." },
  { slug: "caldo-verde-fit", name: "Caldo verde fit", category: "caldos-cremes", basePrice: 3000, description: "Caldo verde em versão leve.", ingredientsText: "Batata, couve e temperos." },
  { slug: "creme-mandioquinha", name: "Creme de mandioquinha", category: "caldos-cremes", basePrice: 3000, description: "Creme de mandioquinha.", ingredientsText: "Mandioquinha e temperos." },
  { slug: "caldo-legumes", name: "Caldo de legumes", category: "caldos-cremes", basePrice: 3000, description: "Caldo de legumes.", ingredientsText: "Legumes e temperos." },
  { slug: "creme-batata-ricota", name: "Creme de batata com ricota", category: "caldos-cremes", basePrice: 3000, description: "Creme de batata com ricota.", ingredientsText: "Batata, ricota e temperos.", allergens: ["Leite"] },
  // Demonstração
  { slug: "frango-arroz-feijao", name: "Frango grelhado com arroz e feijão", category: "tradicionais", basePrice: 2690, featured: true, tags: ["mais pedido"], description: "O clássico do dia a dia: frango grelhado no ponto, arroz soltinho, feijão carioca e salada.", ingredientsText: "Peito de frango, arroz branco, feijão carioca, alface, tomate, cebola, alho, azeite, sal e ervas." },
  { slug: "carne-panela-pure", name: "Carne de panela com purê", category: "tradicionais", basePrice: 2990, description: "Patinho cozido lentamente no molho, com purê de batata cremoso e cenoura.", ingredientsText: "Patinho, batata, leite, manteiga, cenoura, cebola, alho, tomate, sal e louro.", allergens: ["Leite"] },
  { slug: "escondidinho-carne-moida", name: "Escondidinho de carne moída", category: "tradicionais", basePrice: 2790, description: "Carne moída temperada coberta por purê de mandioca gratinado.", ingredientsText: "Patinho moído, mandioca, leite, manteiga, queijo muçarela, cebola, alho e cheiro-verde.", allergens: ["Leite"] },

  { slug: "frango-couve-flor", name: "Frango com arroz de couve-flor", category: "low-carb", basePrice: 2890, tags: ["low carb"], description: "Frango grelhado com arroz de couve-flor, brócolis e abobrinha.", ingredientsText: "Peito de frango, couve-flor, brócolis, abobrinha, azeite, alho, sal e pimenta." },
  { slug: "tilapia-abobrinha", name: "Tilápia com abobrinha e purê de abóbora", category: "low-carb", basePrice: 3290, featured: true, tags: ["low carb"], description: "Filé de tilápia grelhado com limão, purê de abóbora e abobrinha.", ingredientsText: "Tilápia, abóbora cabotiá, abobrinha, limão, azeite, alho e sal.", allergens: ["Peixe"] },

  { slug: "duplo-frango", name: "Duplo frango high protein", category: "proteina-extra", basePrice: 3390, tags: ["proteína extra"], description: "Porção dupla de frango grelhado, arroz integral, feijão e brócolis.", ingredientsText: "Peito de frango (porção dupla), arroz integral, feijão preto, brócolis, azeite e temperos naturais." },
  { slug: "patinho-dobro", name: "Patinho em dobro com arroz integral", category: "proteina-extra", basePrice: 3690, description: "Patinho em cubos em porção reforçada, arroz integral e legumes.", ingredientsText: "Patinho (porção dupla), arroz integral, cenoura, vagem, cebola, alho e sal." },

  { slug: "omelete-legumes", name: "Omelete de legumes com arroz integral", category: "vegetarianas", basePrice: 2490, tags: ["vegetariano"], description: "Omelete recheada de legumes, arroz integral, feijão e salada.", ingredientsText: "Ovos, tomate, cebola, espinafre, arroz integral, feijão carioca, alface e azeite.", allergens: ["Ovo"] },
  { slug: "berinjela-parmegiana", name: "Berinjela à parmegiana", category: "vegetarianas", basePrice: 2690, description: "Berinjela empanada no forno com molho de tomate e queijo, arroz e salada.", ingredientsText: "Berinjela, farinha de trigo, ovos, farinha de rosca, molho de tomate, queijo muçarela, arroz branco.", allergens: ["Glúten", "Ovo", "Leite"] },

  { slug: "bowl-tofu-quinoa", name: "Bowl de tofu com quinoa", category: "veganas", basePrice: 2990, featured: true, tags: ["vegano"], description: "Tofu grelhado no shoyu, quinoa, legumes assados e folhas.", ingredientsText: "Tofu, quinoa, abobrinha, cenoura, brócolis, folhas verdes, shoyu, gergelim e azeite.", allergens: ["Soja", "Glúten", "Gergelim"] },
  { slug: "strogonoff-cogumelos", name: "Strogonoff de cogumelos e proteína vegetal", category: "veganas", basePrice: 2790, tags: ["vegano"], description: "Strogonoff cremoso com creme de castanhas, arroz branco e batata palha assada.", ingredientsText: "Cogumelos, proteína de soja, creme de castanha de caju, tomate, cebola, arroz branco, batata.", allergens: ["Soja", "Castanhas"] },

  { slug: "frango-parmegiana", name: "Filé de frango à parmegiana", category: "executivas", basePrice: 3190, featured: true, description: "Filé de frango empanado, molho de tomate, queijo gratinado, arroz e fritas assadas.", ingredientsText: "Peito de frango, farinha de trigo, ovos, farinha de rosca, molho de tomate, queijo muçarela, arroz, batata.", allergens: ["Glúten", "Ovo", "Leite"] },
  { slug: "bife-acebolado", name: "Bife acebolado executivo", category: "executivas", basePrice: 3490, description: "Bife de contrafilé acebolado, arroz, feijão, farofa e salada.", ingredientsText: "Contrafilé, cebola, arroz branco, feijão carioca, farinha de mandioca, manteiga, alface e tomate.", allergens: ["Leite"] },
  { slug: "peixe-maracuja", name: "Peixe ao molho de maracujá", category: "executivas", basePrice: 3390, description: "Tilápia grelhada com molho de maracujá, arroz com brócolis e legumes.", ingredientsText: "Tilápia, maracujá, arroz branco, brócolis, cenoura, abobrinha, azeite e sal.", allergens: ["Peixe"] },

  { slug: "frango-batata-doce", name: "Frango, batata-doce e brócolis", category: "fitness", basePrice: 2790, featured: true, tags: ["fitness"], description: "A combinação queridinha de quem treina: frango, batata-doce assada e brócolis.", ingredientsText: "Peito de frango, batata-doce, brócolis, azeite, alho, sal e páprica." },
  { slug: "patinho-moido-integral", name: "Patinho moído com arroz integral e legumes", category: "fitness", basePrice: 2890, tags: ["fitness"], description: "Patinho moído magro, arroz integral, feijão preto e mix de legumes.", ingredientsText: "Patinho moído, arroz integral, feijão preto, cenoura, vagem, abobrinha, cebola e alho." },

  { slug: "strogonoff-frango", name: "Strogonoff de frango", category: "do-dia", basePrice: 2790, dailyDays: [1], description: "Toda segunda: strogonoff de frango, arroz branco e batata palha.", ingredientsText: "Frango, creme de leite, molho de tomate, champignon, arroz branco, batata.", allergens: ["Leite"] },
  { slug: "frango-curry", name: "Frango ao curry com arroz de coco", category: "do-dia", basePrice: 2890, dailyDays: [2], description: "Toda terça: frango ao curry suave, arroz de coco e legumes.", ingredientsText: "Frango, curry, leite de coco, arroz branco, cenoura, vagem, cebola e alho." },
  { slug: "feijoada-light", name: "Feijoada light", category: "do-dia", basePrice: 3190, dailyDays: [3], description: "Toda quarta: feijoada com cortes magros, arroz, couve, farofa e laranja.", ingredientsText: "Feijão preto, lombo suíno, carne seca, linguiça de frango, arroz, couve, farinha de mandioca, laranja.", allergens: ["Leite"] },
  { slug: "carne-assada", name: "Carne assada com legumes", category: "do-dia", basePrice: 3290, dailyDays: [4], description: "Toda quinta: lagarto assado com batatas, cenoura e arroz.", ingredientsText: "Lagarto bovino, batata, cenoura, cebola, arroz branco, alho e ervas." },
  { slug: "moqueca-caicara", name: "Moqueca caiçara de peixe", category: "do-dia", basePrice: 3590, dailyDays: [5], featured: true, tags: ["caiçara"], description: "Toda sexta: moqueca de peixe com leite de coco, coentro e banana-da-terra, arroz e pirão.", ingredientsText: "Peixe branco, leite de coco, tomate, cebola, pimentão, coentro, banana-da-terra, azeite de dendê, limão, arroz branco, farinha de mandioca.", allergens: ["Peixe"] },
  { slug: "galinhada", name: "Galinhada caipira", category: "do-dia", basePrice: 2890, dailyDays: [6], description: "Todo sábado: galinhada com açafrão, milho, ervilha e salada.", ingredientsText: "Frango, arroz, açafrão-da-terra, milho, ervilha, pimentão, cebola, alho e cheiro-verde." },

  { slug: "combo-familia-4", name: "Combo Família — 4 marmitas", category: "combos-familiares", basePrice: 9990, compareAtPrice: 11960, hasSizes: false, featured: true, tags: ["promoção"], description: "4 marmitas médias tradicionais (sabores sortidos do cardápio do dia) para a família toda.", ingredientsText: "Composição varia conforme o cardápio do dia. Informe preferências nas observações." },
  { slug: "combo-casal", name: "Combo Casal — 2 marmitas + 2 sucos", category: "combos-familiares", basePrice: 6490, compareAtPrice: 7180, hasSizes: false, tags: ["promoção"], description: "2 marmitas médias à sua escolha nas observações e 2 sucos naturais de 300 ml.", ingredientsText: "Marmitas do cardápio tradicional e sucos naturais da fruta do dia." },
  { slug: "kit-semana-fit", name: "Kit Semana Fit — 5 marmitas", category: "combos-semanais", basePrice: 12490, compareAtPrice: 13950, hasSizes: false, featured: true, tags: ["combo semanal", "promoção"], description: "5 marmitas fitness médias para segunda a sexta, congeladas e etiquetadas.", ingredientsText: "Frango com batata-doce (2x), patinho moído com arroz integral (2x), tilápia com legumes (1x)." },
  { slug: "kit-semana-low-carb", name: "Kit Semana Low Carb — 5 marmitas", category: "combos-semanais", basePrice: 14490, compareAtPrice: 16450, hasSizes: false, tags: ["combo semanal", "low carb"], description: "5 marmitas low carb para a semana toda.", ingredientsText: "Frango com couve-flor (2x), tilápia com abobrinha (2x), patinho com legumes (1x).", allergens: ["Peixe"] },
  { slug: "kit-10-marmitas", name: "Kit 10 marmitas — duas semanas", category: "combos-semanais", basePrice: 23990, compareAtPrice: 27900, hasSizes: false, tags: ["combo semanal", "promoção"], description: "10 marmitas médias sortidas entre tradicionais e fitness. Ideal para congelar.", ingredientsText: "Sabores sortidos entre as linhas tradicional e fitness. Informe restrições nas observações." },
];

const zones = [
  ["Camburi", 500, 25],
  ["Camburizinho", 500, 25],
  ["Baleia", 700, 30],
  ["Barra do Sahy", 800, 35],
  ["Boiçucanga", 800, 35],
  ["Juquehy", 900, 40],
  ["Maresias", 1000, 40],
  ["Barra do Una", 1100, 45],
  ["Paúba", 1100, 45],
  ["Toque-Toque Pequeno", 1300, 50],
] as const;

async function main() {
  for (const [i, c] of categories.entries()) {
    await db.category.upsert({ where: { slug: c.slug }, update: { ...c, sortOrder: i }, create: { ...c, sortOrder: i } });
  }
  for (const [i, s] of sizes.entries()) {
    await db.size.upsert({ where: { slug: s.slug }, update: { ...s, sortOrder: i }, create: { ...s, sortOrder: i } });
  }
  for (const [i, s] of styles.entries()) {
    await db.style.upsert({ where: { slug: s.slug }, update: { ...s, sortOrder: i }, create: { ...s, sortOrder: i } });
  }
  for (const [i, ing] of ingredients.entries()) {
    const data = {
      slug: ing.slug,
      name: ing.name,
      description: ing.description ?? null,
      group: ing.group,
      price: ing.price ?? 0,
      extraPrice: ing.extraPrice ?? null,
      extraGrams: ing.extraGrams ?? null,
      isVegetarian: ing.veg ?? false,
      isVegan: ing.vegan ?? false,
      isLowCarb: ing.lowCarb ?? false,
      allergens: ing.allergens ?? [],
      sortOrder: i,
    };
    await db.ingredient.upsert({ where: { slug: ing.slug }, update: data, create: data });
  }

  const ingBySlug = Object.fromEntries((await db.ingredient.findMany()).map((i) => [i.slug, i.id]));
  const sizeBySlug = Object.fromEntries((await db.size.findMany()).map((s) => [s.slug, s.id]));
  await db.combinationRule.deleteMany();
  await db.combinationRule.createMany({
    data: [
      { description: "Tilápia não é servida no tamanho Família.", ingredientId: ingBySlug["peixe"], sizeId: sizeBySlug["familia"] },
      { description: "Macarrão e purê de batata juntos ficam pesados: escolha um dos dois.", ingredientId: ingBySlug["macarrao"], conflictIngredientId: ingBySlug["pure-batata"] },
      { description: "Molho pesto não combina com o molho de tomate na mesma marmita.", ingredientId: ingBySlug["molho-pesto"], conflictIngredientId: ingBySlug["molho-tomate"] },
    ],
  });

  const catBySlug = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c.id]));
  for (const [i, p] of products.entries()) {
    const data = {
      slug: p.slug,
      name: p.name,
      description: p.description,
      categoryId: catBySlug[p.category],
      basePrice: p.basePrice,
      compareAtPrice: p.compareAtPrice ?? null,
      hasSizes: p.hasSizes ?? true,
      featured: p.featured ?? false,
      dailyDays: p.dailyDays ?? [],
      tags: p.tags ?? [],
      ingredientsText: p.ingredientsText,
      allergens: p.allergens ?? [],
      ...(p.image && { image: p.image }),
      sortOrder: i,
    };
    await db.product.upsert({ where: { slug: p.slug }, update: data, create: data });
  }

  for (const [district, fee, eta] of zones) {
    await db.deliveryZone.upsert({ where: { district }, update: { fee, etaMinutes: eta }, create: { district, fee, etaMinutes: eta } });
  }

  await db.coupon.upsert({
    where: { code: "BEMVINDO10" },
    update: {},
    create: { code: "BEMVINDO10", description: "10% no primeiro pedido acima de R$ 30", type: "PERCENT", value: 10, minOrder: 3000 },
  });
  await db.coupon.upsert({
    where: { code: "CAMBURI5" },
    update: {},
    create: { code: "CAMBURI5", description: "R$ 5 de desconto acima de R$ 40", type: "FIXED", value: 500, minOrder: 4000 },
  });

  await db.storeSettings.upsert({
    where: { id: "store" },
    update: {},
    create: {
      id: "store",
      freeDeliveryMin: 12000,
      openingHours: [
        { day: 0, open: "11:00", close: "15:00", enabled: false },
        { day: 1, open: "10:30", close: "15:00", enabled: true },
        { day: 2, open: "10:30", close: "15:00", enabled: true },
        { day: 3, open: "10:30", close: "15:00", enabled: true },
        { day: 4, open: "10:30", close: "15:00", enabled: true },
        { day: 5, open: "10:30", close: "15:00", enabled: true },
        { day: 6, open: "11:00", close: "14:30", enabled: true },
      ],
    },
  });

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password && password.length >= 8) {
    const passwordHash = await bcrypt.hash(password, 12);
    await db.user.upsert({
      where: { email },
      update: { role: "ADMIN" },
      create: { email, name: "Administrador", passwordHash, role: "ADMIN" },
    });
    console.log(`Administrador pronto: ${email}`);
  } else {
    console.warn("ADMIN_EMAIL/ADMIN_PASSWORD não definidos (ou senha < 8): nenhum administrador criado.");
  }

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
