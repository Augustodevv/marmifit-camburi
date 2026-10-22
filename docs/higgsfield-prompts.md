# Prompts para o Higgsfield — Marmifit Camburi

Enquanto uma foto não existe, o site mostra uma ilustração vetorial de marmita (nunca uma foto falsa).
Hoje o site usa 6 fotos provisórias em PNG (`public/images/produtos/*.png` e `combos/semana.png`), repetidas entre os pratos.

## Como usar
1. Gere cada imagem no Higgsfield com o prompt abaixo (modelo de imagem fotorrealista).
2. Exporte em **WebP**, qualidade ~80, no tamanho indicado (a imagem de Open Graph é a exceção: **JPG**).
3. Salve no caminho indicado em `public/...` com o nome exato (o slug).
4. Faça o deploy. **Não precisa cadastrar nada no painel:** no build o site lê as pastas
   (`scripts/media-manifest.ts`) e usa automaticamente `public/images/<pasta>/<slug>.webp`
   para produtos, categorias e ingredientes que estiverem **sem imagem no painel**.
   Se o item já tiver uma imagem no painel (como os PNGs provisórios), apague o campo
   **Imagem** dele ou cole o caminho novo (ex.: `/images/produtos/frango-arroz-feijao.webp`).
5. O blur de carregamento de cada foto também é gerado no build.

| O quê | Pasta | Tamanho |
| --- | --- | --- |
| Vídeo do hero | `public/videos/` | ver seção 0 |
| Capa do hero (poster) | `public/images/hero/poster.webp` | 2400×1350 (16:9) |
| Open Graph | `public/images/og/og.jpg` | 1200×630 |
| Categorias | `public/images/categorias/<slug>.webp` | 1600×1200 (4:3) |
| Produtos | `public/images/produtos/<slug>.webp` | 1200×900 (4:3) |
| Combos (banner) | `public/images/combos/combos.webp` | 1600×900 |
| Promoções | `public/images/promocoes/promo.webp` | 1600×900 |
| Ingredientes | `public/images/ingredientes/<slug>.webp` | 600×600 |
| Cozinha (galeria) | `public/images/cozinha/cozinha-1.webp` … `cozinha-6.webp` | 1200×1500 (4:5) — **fotos reais**, ver seção 11 |

## Estilo base (inclua em todos os prompts)
> Professional food photography for a premium Brazilian healthy restaurant, natural soft daylight from a window on the left, shallow depth of field, 50mm lens, f/2.8, realistic textures and steam, fresh ingredients, styled on a light oak table with a cream linen napkin, subtle dark green (#163B2E) and natural green (#43865B) props, small orange accent (#F59E42), warm and appetizing, editorial magazine quality, no text, no logos, no hands, no watermark, photorealistic.

Prompt negativo sugerido: `cartoon, illustration, 3d render, plastic food, oversaturated, text, logo, watermark, blurry, deformed, extra utensils, messy table`.

---

## 0. Vídeo do hero — `public/videos/`
Fundo da primeira dobra da home, em loop e **sem som**. O texto fica por cima, do lado esquerdo no desktop e embaixo no celular: deixe o assunto principal no centro/direita e evite áreas muito claras na metade esquerda e no terço inferior.

| Arquivo | Formato | Resolução | Duração | Peso alvo |
| --- | --- | --- | --- | --- |
| `hero.mp4` | H.264, sem áudio, `faststart` | 1920×1080 (16:9) | 8–15 s | ≤ 6 MB |
| `hero.webm` | VP9, sem áudio | 1920×1080 | igual ao mp4 | ≤ 4 MB |
| `hero-mobile.mp4` | H.264, sem áudio | 720×1280 (9:16, vertical) | 8–12 s | ≤ 2,5 MB |

O primeiro e o último quadro devem ser parecidos (loop sem salto). Movimentos de câmera lentos (dolly, push-in), 24–30 fps, cor quente.
Com os arquivos na pasta, o vídeo entra sozinho no próximo deploy. Alternativa: cole a URL de um MP4 em **Entrega e horários → Vídeo do banner**.

Monte o vídeo com 4 cenas curtas de 2–4 s (gere cada uma e una no editor), todas com o **estilo base**:
1. **Panela fumegando** — Close-up of a dark clay pot (panela de barro) of Brazilian caiçara fish moqueca simmering on a rustic stove, golden coconut-milk broth bubbling gently, steam rising in soft morning light, coriander leaves falling in slow motion, slow push-in camera, cinematic food film.
2. **Montagem da marmita** — Overhead slow-motion shot of a black meal-prep container being filled on a light wooden counter: a scoop of white rice, carioca beans, sliced grilled chicken and fresh salad placed in sequence, only the food and utensils visible (no faces), clean and appetizing, smooth top-down camera.
3. **Marmita fechada pronta** — A neat row of closed kraft and black meal boxes with a small green leaf sticker, on a wooden table near an open window, gentle steam escaping from one lid, slow lateral dolly shot, warm light.
4. **Toque de litoral** — Open meal box with grilled fish, rice and salad on a wooden table on a beach-house veranda, blurred tropical beach of Camburi (São Sebastião, São Paulo north coast) in the background with green mountains and calm sea, palm leaves moving softly in the breeze, golden hour, shallow depth of field, slow push-in.

Versão vertical (`hero-mobile.mp4`): as mesmas cenas reenquadradas em 9:16, com o prato no centro.

## 1. Capa do hero (poster) — `public/images/hero/poster.webp` (2400×1350, 16:9)
Aparece antes do vídeo carregar, para quem prefere menos movimento e quando o vídeo não existe. Use um quadro da cena 3 ou 4 do vídeo, ou gere:
Wide shot of several open meal boxes (grilled chicken with rice and beans, grilled fish with pumpkin purée, colorful vegan bowl) on a rustic wooden table on a beach-house veranda, blurred Camburi beach and green mountains in the background, morning light, food on the right two thirds of the frame, calm darker area on the left for overlay text + **estilo base**.
Depois de salvar, cole `/images/hero/poster.webp` em **Entrega e horários → Imagem do banner principal**.

## 1b. Banner antigo — `public/images/hero/banner.webp` (opcional, 1600×2000, 4:5)
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

## 6b. Categorias sem prompt acima — `public/images/categorias/<slug>.webp` (1600×1200)
- `proteina-extra` — generous double portion of grilled chicken and beef cubes over brown rice with broccoli.
- `do-dia` — Brazilian home-style dish of the day (feijoada light) served in a black container next to a small clay bowl of farofa and orange slices.
- `personalizadas` — top-down view of separate small bowls with rice, beans, grilled chicken, vegetables and salad next to an empty meal box, "build your own" mood.
- `combos-familiares` — four open meal boxes shared on a family table, warm light.
- `combos-semanais` — five labeled meal-prep containers neatly arranged in rows, fridge-ready.

## 7. Pratos do dia — `public/images/produtos/<slug>.webp`
- `strogonoff-frango` — chicken stroganoff, white rice, potato sticks (segunda).
- `frango-curry` — mild chicken curry with coconut rice (terça).
- `feijoada-light` — light feijoada with lean cuts, rice, sautéed collard greens, farofa, orange slices (quarta).
- `carne-assada` — sliced roast beef with potatoes and carrots (quinta).
- `moqueca-caicara` — caiçara fish moqueca in a clay pot with coconut milk, coriander and plantain, served with rice and pirão; São Paulo north coast beach mood (sexta).
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

## 11. Nossa cozinha em Camburi — `public/images/cozinha/cozinha-1.webp` … `cozinha-6.webp` (1200×1500, 4:5)
**Use fotos reais** da cozinha, da equipe e das entregas (celular serve, com boa luz natural). A seção "Nossa cozinha" diz que é a cozinha da loja, então imagens geradas por IA ali enganariam o cliente. Até as fotos existirem, a seção mostra as fotos dos pratos.
Sugestões: bancada com a equipe montando marmitas (rostos opcionais, com autorização), panelas no fogão, ingredientes frescos chegando, marmitas fechadas e etiquetadas, saída para entrega, fachada ou vista de Camburi.

## 12. Imagem de Open Graph — `public/images/og/og.jpg` (1200×630, JPG, ≤ 300 KB)
É a foto que aparece ao compartilhar o link no WhatsApp, Instagram e Facebook. Enquanto ela não existe, o site gera uma automaticamente com a capa do hero, o logo e o slogan.
Prompt: Wide horizontal shot of three open meal boxes (grilled chicken with rice and beans, caiçara fish moqueca, colorful vegan bowl) on a rustic wooden table, blurred tropical beach of the São Paulo north coast in the background, food occupying the right 60% of the frame, clean darker left area for the logo, warm natural light + **estilo base**.
Deixe ~60 px de margem livre nas bordas (o WhatsApp recorta um pouco).
