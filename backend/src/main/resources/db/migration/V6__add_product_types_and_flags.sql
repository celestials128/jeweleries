CREATE TABLE IF NOT EXISTS product_types (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS type_id BIGINT REFERENCES product_types(id),
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS handmade BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_type_id ON products(type_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_popular ON products(popular);
CREATE INDEX IF NOT EXISTS idx_products_handmade ON products(handmade);
CREATE INDEX IF NOT EXISTS idx_products_discount_percent ON products(discount_percent);

INSERT INTO product_types (name, slug)
VALUES
  ('Cercei', 'cercei'),
  ('Coliere', 'coliere'),
  ('Inele', 'inele')
ON CONFLICT (slug) DO NOTHING;

UPDATE products p
SET type_id = CASE
  WHEN lower(p.name) LIKE '%ring%' THEN (SELECT id FROM product_types WHERE slug = 'inele')
  WHEN lower(p.name) LIKE '%earring%' THEN (SELECT id FROM product_types WHERE slug = 'cercei')
  ELSE (SELECT id FROM product_types WHERE slug = 'coliere')
END
WHERE p.type_id IS NULL;
