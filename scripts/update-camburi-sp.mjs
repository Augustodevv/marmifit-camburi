// Ajusta dados para Camburi (São Sebastião - SP): endereço, bairros e moqueca caiçara. Idempotente.
// Uso: DATABASE_URL="..." node scripts/update-camburi-sp.mjs
import pg from "pg";

const ZONES = [
  ["Camburi", 500, 25], ["Camburizinho", 500, 25], ["Baleia", 700, 30], ["Barra do Sahy", 800, 35], ["Boiçucanga", 800, 35],
  ["Juquehy", 900, 40], ["Maresias", 1000, 40], ["Barra do Una", 1100, 45], ["Paúba", 1100, 45], ["Toque-Toque Pequeno", 1300, 50],
];

const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
await c.query("begin");
await c.query(`update "StoreSettings" set "pickupAddress" = 'Camburi, São Sebastião - SP' where id = 'store' and "pickupAddress" like '%Vitória%'`);
const novo = await c.query(`select 1 from "Product" where slug = 'moqueca-caicara'`);
if (novo.rowCount === 0) {
  await c.query(`update "Product" set slug = 'moqueca-caicara', name = 'Moqueca caiçara de peixe', tags = '{caiçara}',
    description = 'Toda sexta: moqueca de peixe com leite de coco, coentro e banana-da-terra, arroz e pirão.',
    "ingredientsText" = 'Peixe branco, leite de coco, tomate, cebola, pimentão, coentro, banana-da-terra, azeite de dendê, limão, arroz branco, farinha de mandioca.'
    where slug = 'moqueca-capixaba'`);
} else {
  await c.query(`update "Product" set active = false where slug = 'moqueca-capixaba'`);
}
const names = ZONES.map((z) => z[0]);
await c.query(`delete from "DeliveryZone" where district <> all($1)`, [names]);
for (const [district, fee, eta] of ZONES) {
  await c.query(
    `insert into "DeliveryZone" (id, district, fee, "etaMinutes", active) values (gen_random_uuid()::text, $1, $2, $3, true)
     on conflict (district) do nothing`,
    [district, fee, eta],
  );
}
await c.query("commit");
const z = await c.query(`select string_agg(district, ', ' order by fee) d from "DeliveryZone"`);
const s = await c.query(`select "pickupAddress" from "StoreSettings"`);
console.log("Bairros:", z.rows[0].d);
console.log("Endereço:", s.rows[0]?.pickupAddress);
await c.end();
