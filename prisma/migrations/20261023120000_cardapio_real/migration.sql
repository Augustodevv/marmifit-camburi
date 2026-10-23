-- Dados: cardápio real (16 pratos, 2 categorias) e foto do risoto no banner. Idempotente.
update "Category" set "sortOrder" = "sortOrder" + 2
  where slug <> 'tradicionais' and not exists (select 1 from "Category" where slug = 'risotos-massas');
insert into "Category" (id, slug, name, description, "sortOrder", active, "isCombo") values
 (gen_random_uuid()::text, 'risotos-massas', 'Risotos & massas', 'Risotos com arroz integral e massas caprichadas.', 1, true, false),
 (gen_random_uuid()::text, 'caldos-cremes', 'Caldos e cremes', 'Caldos e cremes leves e nutritivos.', 2, true, false)
on conflict (slug) do nothing;
insert into "Product" (id, slug, name, description, image, "categoryId", "basePrice", featured, tags, "ingredientsText", allergens, "sortOrder", "updatedAt")
select gen_random_uuid()::text, v.slug, v.name, v.description, v.image, c.id, v.price, v.featured, v.tags, v.ing, v.allergens, v.ord, now()
from (values
 ('carne-panela-pure-arroz-feijao','Carne de panela suculenta com purê de batata, arroz e feijão','Carne de panela suculenta com purê de batata, arroz e feijão.',null,'tradicionais',3500,false,'{}'::text[],'Carne de panela, purê de batata, arroz e feijão.','{}'::text[],0),
 ('sobrecoxa-molho-laranja','Sobrecoxa assada ao molho de laranja com batatas, arroz e legumes','Sobrecoxa assada ao molho de laranja com batatas, arroz e legumes.',null,'tradicionais',3500,false,'{}','Sobrecoxa de frango, molho de laranja, batatas, arroz e legumes.','{}',1),
 ('strogonoff-carne-pure','Strogonoff de carne com purê de batata e arroz','Strogonoff de carne com purê de batata e arroz (integral ou branco — informe nas observações).',null,'tradicionais',3500,false,'{}','Carne, creme de leite, purê de batata e arroz integral ou branco.','{Leite}',2),
 ('parmegiana-carne-fit','Parmegiana de carne fit com arroz e feijão','Parmegiana de carne fit com arroz e feijão.',null,'tradicionais',3500,false,'{}','Carne, molho de tomate, queijo, arroz e feijão.','{Leite}',3),
 ('peixe-cogumelos-pure-mandioquinha','Filé de peixe grelhado com mix de cogumelos e purê de mandioquinha','Filé de peixe grelhado com mix de cogumelos e purê de mandioquinha.',null,'tradicionais',4000,false,'{}','Filé de peixe, mix de cogumelos e purê de mandioquinha.','{Peixe}',4),
 ('risoto-integral-frango-legumes','Risoto integral de frango com legumes','Risoto de arroz integral com frango e legumes.',null,'risotos-massas',3500,false,'{}','Arroz integral, frango e legumes.','{}',5),
 ('risoto-integral-lula-vegetais','Risoto integral de lula com vegetais','Risoto de arroz integral com lula, vegetais e raspas de limão.','/images/produtos/risoto-lula.jpg','risotos-massas',4500,true,'{}','Arroz integral, lula, vegetais e limão.','{Moluscos}',6),
 ('linguine-limone-camaroes','Linguine ao limone com camarões','Linguine ao molho de limão-siciliano com camarões.',null,'risotos-massas',5500,false,'{}','Linguine, camarões e limão.','{Glúten,Crustáceos}',7),
 ('lasanha-berinjela-ricota','Lasanha de berinjela com ricota','Lasanha de berinjela com ricota.',null,'vegetarianas',3500,false,'{vegetariano}','Berinjela e ricota.','{Leite}',8),
 ('risoto-integral-vegetais','Risoto integral com vegetais','Risoto de arroz integral com vegetais.',null,'vegetarianas',3500,false,'{vegetariano}','Arroz integral e vegetais.','{}',9),
 ('strogonoff-grao-de-bico','Strogonoff de grão-de-bico com vegetais e toque de mascarpone','Strogonoff de grão-de-bico com vegetais e um toque de mascarpone.',null,'vegetarianas',3500,false,'{vegetariano}','Grão-de-bico, vegetais e mascarpone.','{Leite}',10),
 ('cogumelos-arroz-integral-mandioquinha','Mix de cogumelos com arroz integral e purê de mandioquinha','Mix de cogumelos com arroz integral e purê de mandioquinha.',null,'vegetarianas',3500,false,'{vegetariano}','Mix de cogumelos, arroz integral e purê de mandioquinha.','{}',11),
 ('caldo-verde-fit','Caldo verde fit','Caldo verde em versão leve.',null,'caldos-cremes',3000,false,'{}','Batata, couve e temperos.','{}',12),
 ('creme-mandioquinha','Creme de mandioquinha','Creme de mandioquinha.',null,'caldos-cremes',3000,false,'{}','Mandioquinha e temperos.','{}',13),
 ('caldo-legumes','Caldo de legumes','Caldo de legumes.',null,'caldos-cremes',3000,false,'{}','Legumes e temperos.','{}',14),
 ('creme-batata-ricota','Creme de batata com ricota','Creme de batata com ricota.',null,'caldos-cremes',3000,false,'{}','Batata, ricota e temperos.','{Leite}',15)
) as v(slug,name,description,image,cat,price,featured,tags,ing,allergens,ord)
join "Category" c on c.slug = v.cat
on conflict (slug) do nothing;
update "StoreSettings" set "heroImage" = '/images/produtos/risoto-lula.jpg' where id = 'store';
