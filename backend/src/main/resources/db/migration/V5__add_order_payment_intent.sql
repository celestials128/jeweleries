ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_payment_intent_id
  ON orders(payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;
