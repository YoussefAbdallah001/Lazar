-- RLS Policies for users table
CREATE POLICY "users_select_own" ON users FOR SELECT
  TO authenticated USING (auth.uid()::uuid = id);

CREATE POLICY "users_update_own" ON users FOR UPDATE
  TO authenticated USING (auth.uid()::uuid = id) WITH CHECK (auth.uid()::uuid = id);

-- RLS Policies for wishlist table
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wishlist_select_own" ON wishlist FOR SELECT
  TO authenticated USING (auth.uid()::uuid = user_id);

CREATE POLICY "wishlist_insert_own" ON wishlist FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "wishlist_delete_own" ON wishlist FOR DELETE
  TO authenticated USING (auth.uid()::uuid = user_id);

-- RLS Policies for cart table
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "carts_select_own" ON carts FOR SELECT
  TO authenticated USING (auth.uid()::uuid = user_id);

CREATE POLICY "carts_insert_own" ON carts FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "carts_update_own" ON carts FOR UPDATE
  TO authenticated USING (auth.uid()::uuid = user_id) WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "carts_delete_own" ON carts FOR DELETE
  TO authenticated USING (auth.uid()::uuid = user_id);

-- RLS Policies for cart_items table
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_items_select_own" ON cart_items FOR SELECT
  TO authenticated USING (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid()::uuid)
  );

CREATE POLICY "cart_items_insert_own" ON cart_items FOR INSERT
  TO authenticated WITH CHECK (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid()::uuid)
  );

CREATE POLICY "cart_items_update_own" ON cart_items FOR UPDATE
  TO authenticated USING (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid()::uuid)
  );

CREATE POLICY "cart_items_delete_own" ON cart_items FOR DELETE
  TO authenticated USING (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid()::uuid)
  );

-- RLS Policies for orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_own" ON orders FOR SELECT
  TO authenticated USING (auth.uid()::uuid = user_id);

CREATE POLICY "orders_insert_own" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::uuid = user_id);

-- RLS Policies for reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_all" ON reviews FOR SELECT
  TO public USING (true);

CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE
  TO authenticated USING (auth.uid()::uuid = user_id);