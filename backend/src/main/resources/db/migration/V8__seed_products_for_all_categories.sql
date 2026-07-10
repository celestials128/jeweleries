UPDATE products
SET type_id = (SELECT id FROM product_types WHERE slug = 'cercei')
WHERE lower(name) LIKE '%earring%'
   OR lower(name) LIKE '%cercei%';

INSERT INTO products (
  name,
  description,
  price,
  image_url,
  stock,
  type_id,
  discount_percent,
  handmade,
  popular,
  created_at
)
SELECT
  'Eclipse Drop Cercei',
  'Cercei delicati cu design lunar, lucrati manual pentru tinute elegante.',
  92.00,
  'https://loremflickr.com/1200/1200/jewelry,earrings?lock=3201',
  14,
  (SELECT id FROM product_types WHERE slug = 'cercei'),
  10.00,
  true,
  false,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM products WHERE name = 'Eclipse Drop Cercei'
);

INSERT INTO products (
  name,
  description,
  price,
  image_url,
  stock,
  type_id,
  discount_percent,
  handmade,
  popular,
  created_at
)
SELECT
  'Nebula Heart Colier',
  'Colier cu pandantiv in forma de inima, inspirat din culorile nebuloaselor.',
  118.00,
  'https://loremflickr.com/1200/1200/jewelry,necklace?lock=3202',
  10,
  (SELECT id FROM product_types WHERE slug = 'coliere'),
  0.00,
  false,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM products WHERE name = 'Nebula Heart Colier'
);

INSERT INTO products (
  name,
  description,
  price,
  image_url,
  stock,
  type_id,
  discount_percent,
  handmade,
  popular,
  created_at
)
SELECT
  'Orbit Halo Inel',
  'Inel modern cu montura halo, potrivit pentru tinute de zi si evenimente.',
  136.00,
  'https://loremflickr.com/1200/1200/jewelry,ring?lock=3203',
  8,
  (SELECT id FROM product_types WHERE slug = 'inele'),
  5.00,
  false,
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM products WHERE name = 'Orbit Halo Inel'
);
