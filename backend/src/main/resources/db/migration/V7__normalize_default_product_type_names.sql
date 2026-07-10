UPDATE product_types
SET name = CASE slug
  WHEN 'cercei' THEN 'CERCEI'
  WHEN 'coliere' THEN 'COLIERE'
  WHEN 'inele' THEN 'INELE'
  ELSE name
END
WHERE slug IN ('cercei', 'coliere', 'inele');
