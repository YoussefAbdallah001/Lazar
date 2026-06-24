-- Enable RLS on all tables that don't have it

-- Categories: readable by all, writable by service role only
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_public" ON categories FOR SELECT
  TO public USING (true);

-- Products: readable by all, writable by service role only
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_public" ON products FOR SELECT
  TO public USING (true);

-- Product images: readable by all, writable by service role only
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_images_select_public" ON product_images FOR SELECT
  TO public USING (true);

-- Coupons: readable by all for validation, writable by service role only
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons_select_public" ON coupons FOR SELECT
  TO public USING (true);

-- Order items: accessible by order owner only
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_select_own" ON order_items FOR SELECT
  TO authenticated USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()::uuid)
  );

CREATE POLICY "order_items_insert_own" ON order_items FOR INSERT
  TO authenticated WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()::uuid)
  );

-- Admins: fully protected, no public access
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- No policies - only accessible via service role or edge functions

-- Activity logs: fully protected, no public access
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- No policies - only accessible via service role or edge functions

-- Fix function search paths and security

-- Update the update_product_rating function with fixed search path
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER 
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE products p
  SET rating = (
    SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id
  ),
  review_count = (
    SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id
  )
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the decrement_stock function to be SECURITY INVOKER with proper checks
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, quantity INTEGER)
RETURNS VOID 
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Only allow decrementing stock when placing an order
  -- The function should only be callable from authenticated contexts
  UPDATE products
  SET stock_quantity = stock_quantity - quantity
  WHERE id = product_id 
    AND stock_quantity >= quantity
    AND active = true;
END;
$$ LANGUAGE plpgsql;

-- Revoke execute permissions from anon for decrement_stock
-- Only authenticated users (customers placing orders) should be able to call this
REVOKE EXECUTE ON FUNCTION decrement_stock(UUID, INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INTEGER) TO authenticated;