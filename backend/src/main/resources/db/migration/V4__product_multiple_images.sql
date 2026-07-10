CREATE TABLE IF NOT EXISTS product_images (
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  image_url VARCHAR(1024) NOT NULL,
  PRIMARY KEY (product_id, sort_order)
);

DELETE FROM product_images WHERE product_id BETWEEN 1 AND 12;

UPDATE products
SET image_url = CASE id
  WHEN 1 THEN 'https://loremflickr.com/1200/1200/jewelry,necklace?lock=101'
  WHEN 2 THEN 'https://loremflickr.com/1200/1200/jewelry,ring?lock=102'
  WHEN 3 THEN 'https://loremflickr.com/1200/1200/jewelry,earrings?lock=103'
  WHEN 4 THEN 'https://loremflickr.com/1200/1200/jewelry,bracelet?lock=104'
  WHEN 5 THEN 'https://loremflickr.com/1200/1200/jewelry,pendant?lock=105'
  WHEN 6 THEN 'https://loremflickr.com/1200/1200/jewelry,ring?lock=106'
  WHEN 7 THEN 'https://loremflickr.com/1200/1200/jewelry,necklace?lock=107'
  WHEN 8 THEN 'https://loremflickr.com/1200/1200/jewelry,bracelet?lock=108'
  WHEN 9 THEN 'https://loremflickr.com/1200/1200/jewelry,earrings?lock=109'
  WHEN 10 THEN 'https://loremflickr.com/1200/1200/jewelry,pearl?lock=110'
  WHEN 11 THEN 'https://loremflickr.com/1200/1200/jewelry,gemstone?lock=111'
  WHEN 12 THEN 'https://loremflickr.com/1200/1200/jewelry,choker?lock=112'
  ELSE image_url
END
WHERE id BETWEEN 1 AND 12;

INSERT INTO product_images (product_id, sort_order, image_url) VALUES
  (1, 0, 'https://loremflickr.com/1200/1200/jewelry,necklace?lock=101'),
  (1, 1, 'https://loremflickr.com/1200/1200/jewelry,silver?lock=201'),
  (2, 0, 'https://loremflickr.com/1200/1200/jewelry,ring?lock=102'),
  (2, 1, 'https://loremflickr.com/1200/1200/jewelry,gold-ring?lock=202'),
  (3, 0, 'https://loremflickr.com/1200/1200/jewelry,earrings?lock=103'),
  (3, 1, 'https://loremflickr.com/1200/1200/jewelry,opal?lock=203'),
  (4, 0, 'https://loremflickr.com/1200/1200/jewelry,bracelet?lock=104'),
  (4, 1, 'https://loremflickr.com/1200/1200/jewelry,diamond?lock=204'),
  (5, 0, 'https://loremflickr.com/1200/1200/jewelry,pendant?lock=105'),
  (5, 1, 'https://loremflickr.com/1200/1200/jewelry,gold?lock=205'),
  (6, 0, 'https://loremflickr.com/1200/1200/jewelry,ring?lock=106'),
  (6, 1, 'https://loremflickr.com/1200/1200/jewelry,moonstone?lock=206'),
  (7, 0, 'https://loremflickr.com/1200/1200/jewelry,necklace?lock=107'),
  (7, 1, 'https://loremflickr.com/1200/1200/jewelry,celestial?lock=207'),
  (8, 0, 'https://loremflickr.com/1200/1200/jewelry,bracelet?lock=108'),
  (8, 1, 'https://loremflickr.com/1200/1200/jewelry,beads?lock=208'),
  (9, 0, 'https://loremflickr.com/1200/1200/jewelry,earrings?lock=109'),
  (9, 1, 'https://loremflickr.com/1200/1200/jewelry,gemstone?lock=209'),
  (10, 0, 'https://loremflickr.com/1200/1200/jewelry,pearl?lock=110'),
  (10, 1, 'https://loremflickr.com/1200/1200/jewelry,luxury?lock=210'),
  (11, 0, 'https://loremflickr.com/1200/1200/jewelry,gemstone?lock=111'),
  (11, 1, 'https://loremflickr.com/1200/1200/jewelry,amethyst?lock=211'),
  (12, 0, 'https://loremflickr.com/1200/1200/jewelry,choker?lock=112'),
  (12, 1, 'https://loremflickr.com/1200/1200/jewelry,fashion?lock=212');
