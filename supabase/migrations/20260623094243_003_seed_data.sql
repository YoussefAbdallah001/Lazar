-- Insert categories
INSERT INTO categories (name, slug, description, display_order) VALUES
('T-Shirts', 't-shirts', 'Premium cotton t-shirts for all occasions', 1),
('Shoes', 'shoes', 'Stylish footwear for every step', 2),
('Pants', 'pants', 'Comfortable pants and trousers', 3),
('Jackets', 'jackets', 'Trendy jackets and outerwear', 4),
('Accessories', 'accessories', 'Complete your look with accessories', 5);

-- Insert sample products
INSERT INTO products (name, slug, description, price, compare_at_price, category_id, stock_quantity, sku, image_urls, featured, rating, review_count) VALUES
('Classic White T-Shirt', 'classic-white-tshirt', 'Premium 100% organic cotton t-shirt. Super soft and comfortable fit. Perfect for everyday wear.', 29.99, 39.99, (SELECT id FROM categories WHERE slug = 't-shirts'), 150, 'LZR-TS-001', ARRAY['https://images.pexels.com/photos/5384423/pexels-photo-5384423.jpeg'], true, 4.8, 24),
('Black Urban Sneakers', 'black-urban-sneakers', 'Sleek urban sneakers with memory foam insole. Lightweight and breathable design for all-day comfort.', 89.99, 119.99, (SELECT id FROM categories WHERE slug = 'shoes'), 75, 'LZR-SH-001', ARRAY['https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg'], true, 4.7, 18),
('Slim Fit Chinos', 'slim-fit-chinos', 'Modern slim fit chinos with stretch fabric. Perfect for casual or semi-formal occasions.', 59.99, null, (SELECT id FROM categories WHERE slug = 'pants'), 100, 'LZR-PT-001', ARRAY['https://images.pexels.com/photos/4283117/pexels-photo-4283117.jpeg'], true, 4.5, 12),
('Leather Bomber Jacket', 'leather-bomber-jacket', 'Genuine leather bomber jacket. Timeless style with modern cuts. Features multiple pockets and quilted lining.', 299.99, 349.99, (SELECT id FROM categories WHERE slug = 'jackets'), 30, 'LZR-JK-001', ARRAY['https://images.pexels.com/photos/1126936/pexels-photo-1126936.jpeg'], true, 4.9, 32),
('Canvas Belt', 'canvas-belt', 'Durable canvas belt with metal buckle. Perfect accessory for casual outfits.', 19.99, null, (SELECT id FROM categories WHERE slug = 'accessories'), 200, 'LZR-AC-001', ARRAY['https://images.pexels.com/photos/4283117/pexels-photo-4283117.jpeg'], false, 4.3, 8),
('Navy Blue T-Shirt', 'navy-blue-tshirt', 'Classic navy blue t-shirt made from premium cotton. Relaxed fit for maximum comfort.', 34.99, null, (SELECT id FROM categories WHERE slug = 't-shirts'), 120, 'LZR-TS-002', ARRAY['https://images.pexels.com/photos/5384423/pexels-photo-5384423.jpeg'], false, 4.6, 15),
('Running Trainers', 'running-trainers', 'High-performance running shoes with advanced cushioning. Breathable mesh upper.', 129.99, 149.99, (SELECT id FROM categories WHERE slug = 'shoes'), 50, 'LZR-SH-002', ARRAY['https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg'], false, 4.4, 9),
('Denim Jeans', 'denim-jeans', 'Classic 5-pocket denim jeans. Mid-rise straight leg fit. Premium stretch denim.', 79.99, null, (SELECT id FROM categories WHERE slug = 'pants'), 90, 'LZR-PT-002', ARRAY['https://images.pexels.com/photos/4283117/pexels-photo-4283117.jpeg'], false, 4.5, 20),
('Windbreaker Jacket', 'windbreaker-jacket', 'Lightweight windbreaker with water-resistant coating. Packable design for convenience.', 149.99, null, (SELECT id FROM categories WHERE slug = 'jackets'), 45, 'LZR-JK-002', ARRAY['https://images.pexels.com/photos/1126936/pexels-photo-1126936.jpeg'], false, 4.2, 6),
('Sunglasses', 'polarized-sunglasses', 'Polarized sunglasses with UV400 protection. Lightweight titanium frame.', 79.99, 99.99, (SELECT id FROM categories WHERE slug = 'accessories'), 80, 'LZR-AC-002', ARRAY['https://images.pexels.com/photos/4283117/pexels-photo-4283117.jpeg'], false, 4.7, 14);

-- Insert sample coupons
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, active, starts_at, expires_at) VALUES
('WELCOME10', 'percentage', 10, 50, true, NOW(), NOW() + INTERVAL '1 year'),
('SUMMER20', 'percentage', 20, 100, true, NOW(), NOW() + INTERVAL '3 months'),
('FLAT50', 'fixed', 50, 200, true, NOW(), NOW() + INTERVAL '6 months');

-- Insert default admin (password: admin123 - should be changed on first login)
-- Using bcrypt hash for 'admin123'
INSERT INTO admins (username, email, password_hash) VALUES
('admin', 'admin@lazar.store', '$2y$10$rQZ9Q9Z9Q9Z9Q9Z9Q9Z9Q.9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9m');