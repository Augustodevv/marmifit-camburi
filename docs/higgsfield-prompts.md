# Prompts para o Higgsfield — Marmifit Camburi

Nenhuma integração com o Higgsfield estava disponível durante o desenvolvimento, então **nenhuma imagem foi gerada**.
Enquanto as fotos não existem, o site mostra uma ilustração vetorial de marmita (nunca uma foto falsa).

## Como usar
1. Gere cada imagem no Higgsfield com o prompt abaixo (modelo de imagem fotorrealista).
2. Exporte em **WebP**, qualidade ~80, no tamanho indicado.
3. Salve no diretório indicado em `public/images/...` com o nome sugerido.
4. No painel (`/admin`), cole o caminho no campo **Imagem** do produto/categoria (ex.: `/images/produtos/frango-arroz-feijao.webp`).
   O banner principal vai em **Entrega e horários → Imagem do banner principal**.

## Estilo base (inclua em todos os prompts)
> Professional food photography for a premium Brazilian healthy restaurant, natural soft daylight from a window on the left, shallow depth of field, 50mm lens, f/2.8, realistic textures and steam, fresh ingredients, styled on a light oak table with a cream linen napkin, subtle dark green (#163B2E) and natural green (#43865B) props, small orange accent (#F59E42), warm and appetizing, editorial magazine quality, no text, no logos, no hands, no watermark, photorealistic.

Prompt negativo sugerido: `cartoon, illustration, 3d render, plastic food, oversaturated, text, logo, watermark, blurry, deformed, extra utensils, messy table`.

---

## 1. Banner principal — `public/images/hero/banner.webp` (1600×2000, 4:5)
Overhead three-quarter shot of an open eco-friendly kraft meal box (marmita) with white rice, Brazilian carioca beans, grilled chicken breast with herbs, colorful salad and steamed broccoli, a second box partially visible behind with grilled tilapia and pumpkin purée, fresh herbs and a lime wedge around, morning light, premium delivery restaurant mood + **estilo base**.

## 2. Marmitas tradicionais — `public/images/categorias/tradicionais.webp` (1600×1200)
Classic Brazilian home-style lunch box: white rice, carioca beans, grilled chicken, farofa and tomato-lettuce salad in a black reusable container, top-down view + **estilo base**.

Produtos (1200×900, `public/images/produtos/<slug>.webp`):
- `frango-arroz-feijao` — grilled chicken breast, white rice, carioca beans, simple green salad.
- `carne-panela-pure` — slow-cooked beef in rich sauce with creamy mashed potatoes and carrots.
- `escondidinho-carne-moida` — Brazilian escondidinho: seasoned ground beef under golden gratinated cassava purée, individual portion.

## 3. Marmitas fitness — `public/images/categorias/fitness.webp`
Balanced fitness meal prep: grilled chicken, roasted sweet potato wedges and bright green broccoli, neatly portioned, clean minimalist styling + **estilo base**.
- `frango-batata-doce` — grilled chicken, roasted sweet potato, broccoli.
- `patinho-moido-integral` — lean ground beef, brown rice, black beans, mixed vegetables.

## 4. Marmitas executivas — `public/images/categorias/executivas.webp`
Generous executive lunch plate in a premium black container: chicken parmigiana with melted cheese and tomato sauce, white rice and oven fries + **estilo base**.
- `frango-parmegiana` — breaded chicken parmigiana, rice, oven fries.
- `bife-acebolado` — sirloin steak with caramelized onions, rice, beans, farofa, salad.
- `peixe-maracuja` — grilled tilapia with glossy passion fruit sauce, broccoli rice.

## 5. Marmitas vegetarianas e veganas — `public/images/categorias/vegetarianas.webp` e `veganas.webp`
Colorful plant-based bowl with grilled tofu glazed in soy, quinoa, roasted zucchini and carrots, leafy greens, sesame seeds + **estilo base**.
- `omelete-legumes` — fluffy vegetable omelette, brown rice, beans, salad.
- `berinjela-parmegiana` — eggplant parmigiana with tomato sauce and melted cheese, rice.
- `bowl-tofu-quinoa` — tofu and quinoa bowl, roasted vegetables.
- `strogonoff-cogumelos` — creamy mushroom and soy protein stroganoff with cashew cream, white rice.

## 6. Low carb e proteína extra — `public/images/categorias/low-carb.webp` e `proteina-extra.webp`
- `frango-couve-flor` — grilled chicken over cauliflower rice with broccoli and zucchini.
- `tilapia-abobrinha` — grilled tilapia with lemon, pumpkin purée, grilled zucchini.
- `duplo-frango` — double portion of grilled chicken, brown rice, black beans, broccoli.
- `patinho-dobro` — double portion of beef cubes, brown rice, carrots and green beans.

## 7. Pratos do dia — `public/images/produtos/<slug>.webp`
- `strogonoff-frango` — chicken stroganoff, white rice, potato sticks (segunda).
- `frango-curry` — mild chicken curry with coconut rice (terça).
- `feijoada-light` — light feijoada with lean cuts, rice, sautéed collard greens, farofa, orange slices (quarta).
- `carne-assada` — sliced roast beef with potatoes and carrots (quinta).
- `moqueca-capixaba` — traditional moqueca capixaba in a black clay pot (panela de barro), white fish, tomato, coriander, annatto, served with rice and pirão; Espírito Santo coastal mood (sexta).
- `galinhada` — Brazilian galinhada with saffron rice, chicken, corn and peas (sábado).

## 8. Combos — `public/images/combos/` e produtos
- Banner `combos.webp` (1600×900): four closed and two open meal boxes stacked on a table, family dinner mood, warm light.
- `combo-familia-4` — four assorted open meal boxes shared on a family table.
- `combo-casal` — two meal boxes with two glasses of fresh juice.
- `kit-semana-fit` / `kit-semana-low-carb` / `kit-10-marmitas` — weekly meal prep: 5 (or 10) labeled containers neatly arranged in rows, fridge-ready, clean organized look.

## 9. Promoções — `public/images/promocoes/promo.webp` (1600×900)
Flat lay of three colorful meal boxes with a small orange (#F59E42) ribbon/tag prop (no text), festive but clean, generous negative space on the right for overlay text + **estilo base**.

## 10. Ingredientes do configurador (opcional) — `public/images/ingredientes/<slug>.webp` (600×600)
Single-ingredient close-ups on cream background, top-down, soft shadow: grilled chicken cubes, beef cubes, ground beef, tilapia fillet, omelette, tofu, soy protein, white rice, brown rice, pasta, mashed potato, pumpkin purée, steamed vegetables, cauliflower rice, quinoa, carioca beans, black beans, green salad, broccoli, carrots, zucchini, green beans, farofa, sweet potato, fried egg, melted mozzarella, tomato sauce, honey mustard, pesto, grilled plantain.
