// Aplica as fotos geradas (public/images) aos produtos e ao banner. Idempotente.
// Uso: DATABASE_URL="..." node scripts/apply-images.mjs
import pg from "pg";

const MAP = {
  "/images/produtos/risoto-lula.jpg": ["risoto-integral-lula-vegetais"],
  "/images/produtos/tradicional.png": ["frango-arroz-feijao", "carne-panela-pure", "escondidinho-carne-moida", "strogonoff-frango", "feijoada-light", "carne-assada", "galinhada"],
  "/images/produtos/fitness.png": ["frango-batata-doce", "patinho-moido-integral", "duplo-frango", "patinho-dobro", "frango-couve-flor", "frango-curry"],
  "/images/produtos/peixe-low-carb.png": ["tilapia-abobrinha", "peixe-maracuja", "moqueca-caicara"],
  "/images/produtos/vegano.png": ["bowl-tofu-quinoa", "strogonoff-cogumelos", "omelete-legumes"],
  "/images/produtos/executiva.png": ["frango-parmegiana", "bife-acebolado", "berinjela-parmegiana"],
  "/images/combos/semana.png": ["combo-familia-4", "combo-casal", "kit-semana-fit", "kit-semana-low-carb", "kit-10-marmitas"],
};

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
let total = 0;
for (const [image, slugs] of Object.entries(MAP)) {
  const r = await client.query('update "Product" set image = $1 where slug = any($2) and image is null', [image, slugs]);
  total += r.rowCount;
}
await client.query('update "StoreSettings" set "heroImage" = $1 where id = $2 and "heroImage" is null', ["/images/produtos/risoto-lula.jpg", "store"]);
const missing = await client.query('select slug from "Product" where image is null');
console.log(`Imagens aplicadas: ${total}. Sem imagem: ${missing.rows.map((r) => r.slug).join(", ") || "nenhum"}`);
await client.end();
