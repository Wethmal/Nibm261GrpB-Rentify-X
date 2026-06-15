-- seed.sql
-- Initial static data seed for Rentify platform with realistic Sri Lankan data.

-- Note: All passwords are set to 'password123' (bcrypt hash: $2a$10$T8Z.nL1U9Kq2e1r3rPjLZeX5tHqQ.2hFjY5B4qB8c2H3nQoJ3R6j6)

-- Service Categories
INSERT INTO categories (name, type) VALUES
('Photography & Videography', 'service'),
('Event Management', 'service'),
('Tutoring & Education', 'service'),
('Home Maintenance & Cleaning', 'service'),
('Beauty & Salons', 'service'),
('Fitness Trainers', 'service'),
('Plumbing & Electrical', 'service'),
('Catering Services', 'service');

-- Equipment Categories
INSERT INTO categories (name, type) VALUES
('Camera & Lenses', 'equipment'),
('Drones & Accessories', 'equipment'),
('Audio & Lighting', 'equipment'),
('Power Tools', 'equipment'),
('Event Furniture & Tents', 'equipment'),
('Camping & Outdoor', 'equipment'),
('Gaming Consoles', 'equipment'),
('Musical Instruments', 'equipment');

-- Users (Providers & Consumers)
-- 1. Provider (Photographer)
INSERT INTO users (id, email, mobile, password_hash, role, status, full_name, district, bio) VALUES
('c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d', 'saman@example.com', '0771112222', '$2a$10$T8Z.nL1U9Kq2e1r3rPjLZeX5tHqQ.2hFjY5B4qB8c2H3nQoJ3R6j6', 'provider', 'verified', 'Saman Perera', 'Colombo', 'Professional wedding and event photographer with 10 years of experience.');

-- 2. Provider (Caterer/Equipment Renter)
INSERT INTO users (id, email, mobile, password_hash, role, status, full_name, district, bio) VALUES
('d8c4e9f1-6f1c-5c1d-9c4b-4c0a5c4e4c4e', 'nimali@example.com', '0712223333', '$2a$10$T8Z.nL1U9Kq2e1r3rPjLZeX5tHqQ.2hFjY5B4qB8c2H3nQoJ3R6j6', 'provider', 'verified', 'Nimali Catering & Events', 'Gampaha', 'Providing authentic Sri Lankan catering and event furniture rentals.');

-- 3. Consumer
INSERT INTO users (id, email, mobile, password_hash, role, status, full_name, district) VALUES
('e9d5f0a2-7a2d-6d2a-0d5c-5d1a6d5f5d5f', 'kasun@example.com', '0763334444', '$2a$10$T8Z.nL1U9Kq2e1r3rPjLZeX5tHqQ.2hFjY5B4qB8c2H3nQoJ3R6j6', 'consumer', 'verified', 'Kasun Silva', 'Colombo');

-- 4. Provider (Electrician/Plumber)
INSERT INTO users (id, email, mobile, password_hash, role, status, full_name, district, bio) VALUES
('f1e2d3c4-b5a6-7f8e-9d0c-1b2a3f4e5d6c', 'priyantha@example.com', '0774445555', '$2a$10$T8Z.nL1U9Kq2e1r3rPjLZeX5tHqQ.2hFjY5B4qB8c2H3nQoJ3R6j6', 'provider', 'verified', 'Priyantha Services', 'Colombo', 'Expert home maintenance, plumbing, electrical installations, and tool rental.');

-- 5. Provider (Beautician)
INSERT INTO users (id, email, mobile, password_hash, role, status, full_name, district, bio) VALUES
('a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'dilini@example.com', '0785556666', '$2a$10$T8Z.nL1U9Kq2e1r3rPjLZeX5tHqQ.2hFjY5B4qB8c2H3nQoJ3R6j6', 'provider', 'verified', 'Salon Dilini', 'Kandy', 'Leading salon offering professional bridal dressings, haircuts, treatments, and styling in Kandy.');

-- 6. Provider (Tech & Gear Renter)
INSERT INTO users (id, email, mobile, password_hash, role, status, full_name, district, bio) VALUES
('b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e', 'aruna@example.com', '0726667777', '$2a$10$T8Z.nL1U9Kq2e1r3rPjLZeX5tHqQ.2hFjY5B4qB8c2H3nQoJ3R6j6', 'provider', 'verified', 'Aruna Tech Rentals', 'Colombo', 'High-end camera, drone, audio system, and gaming console rentals in Colombo.');

-- 7. Provider (Tutor)
INSERT INTO users (id, email, mobile, password_hash, role, status, full_name, district, bio) VALUES
('c4d5e6f7-a8b9-0c1d-2e3f-4a5b6c7d8e9f', 'kapila@example.com', '0757778888', '$2a$10$T8Z.nL1U9Kq2e1r3rPjLZeX5tHqQ.2hFjY5B4qB8c2H3nQoJ3R6j6', 'provider', 'verified', 'Kapila Tuition', 'Gampaha', 'Experienced A/L and O/L science & maths tutor offering individual and group classes.');

-- Listings
-- 1. Service: Photography
INSERT INTO listings (id, provider_id, category_id, type, title, description, price_per_unit, unit_label, geo_lat, geo_lng, district, status) VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d', (SELECT id FROM categories WHERE name = 'Photography & Videography'), 'service', 'Professional Wedding Photography', 'Full day wedding coverage including pre-shoot and 2 printed albums. High-quality candid shots.', 150000.00, 'event', 6.9271, 79.8612, 'Colombo', 'active'),
('s_pv_001', 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d', (SELECT id FROM categories WHERE name = 'Photography & Videography'), 'service', 'Pre-shoot & Portrait Photography', '3-hour outdoor pre-shoot session, includes 20 edited soft copies. Locations in Colombo.', 15000.00, 'session', 6.9271, 79.8612, 'Colombo', 'active');

-- 2. Service: Event Management
INSERT INTO listings (id, provider_id, category_id, type, title, description, price_per_unit, unit_label, geo_lat, geo_lng, district, status) VALUES
('s_em_001', 'd8c4e9f1-6f1c-5c1d-9c4b-4c0a5c4e4c4e', (SELECT id FROM categories WHERE name = 'Event Management'), 'service', 'Traditional Almsgiving Setup', 'Complete organization of traditional Sri Lankan almsgiving (Daane). Includes arranging priests, setup and coordination.', 25000.00, 'event', 7.0873, 79.9995, 'Gampaha', 'active'),
('s_em_002', 'd8c4e9f1-6f1c-5c1d-9c4b-4c0a5c4e4c4e', (SELECT id FROM categories WHERE name = 'Event Management'), 'service', 'Corporate Event Management', 'Professional planning and coordination for corporate seminars, launches, and team-building events.', 75000.00, 'event', 6.9271, 79.8612, 'Colombo', 'active');

-- 3. Service: Tutoring & Education
INSERT INTO listings (id, provider_id, category_id, type, title, description, price_per_unit, unit_label, geo_lat, geo_lng, district, status) VALUES
('s_te_001', 'c4d5e6f7-a8b9-0c1d-2e3f-4a5b6c7d8e9f', (SELECT id FROM categories WHERE name = 'Tutoring & Education'), 'service', 'A/L Physics Theory & Revision', 'Advanced Level Physics individual classes by experienced government teacher. Theory + past papers.', 2500.00, 'hour', 7.0873, 79.9995, 'Gampaha', 'active'),
('s_te_002', 'c4d5e6f7-a8b9-0c1d-2e3f-4a5b6c7d8e9f', (SELECT id FROM categories WHERE name = 'Tutoring & Education'), 'service', 'Grade 5 Scholarship Maths & IQ Class', 'Group tuition targeting Grade 5 Scholarship examination. Focuses on papers and problem solving.', 1500.00, 'session', 7.0873, 79.9995, 'Gampaha', 'active');

-- 4. Service: Home Maintenance & Cleaning
INSERT INTO listings (id, provider_id, category_id, type, title, description, price_per_unit, unit_label, geo_lat, geo_lng, district, status) VALUES
('s_hm_001', 'f1e2d3c4-b5a6-7f8e-9d0c-1b2a3f4e5d6c', (SELECT id FROM categories WHERE name = 'Home Maintenance & Cleaning'), 'service', 'Full House Deep Cleaning', 'Complete sanitization and deep cleaning of floors, windows, kitchens, bathrooms, and outdoor areas.', 12000.00, 'day', 6.9271, 79.8612, 'Colombo', 'active'),
('s_hm_002', 'f1e2d3c4-b5a6-7f8e-9d0c-1b2a3f4e5d6c', (SELECT id FROM categories WHERE name = 'Home Maintenance & Cleaning'), 'service', 'Garden Mowing & Landscaping', 'Professional grass cutting, weeding, pruning, and garden cleanup services.', 4000.00, 'session', 6.9271, 79.8612, 'Colombo', 'active');

-- 5. Service: Beauty & Salons
INSERT INTO listings (id, provider_id, category_id, type, title, description, price_per_unit, unit_label, geo_lat, geo_lng, district, status) VALUES
('s_bs_001', 'a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', (SELECT id FROM categories WHERE name = 'Beauty & Salons'), 'service', 'Kandyan Bridal Dressing Package', 'Full bridal makeup, hair styling, saree draping, and jewelry setting for the wedding day.', 45000.00, 'event', 7.2906, 80.6337, 'Kandy', 'active'),
('s_bs_002', 'a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', (SELECT id FROM categories WHERE name = 'Beauty & Salons'), 'service', 'Hair Keratin Treatment & Styling', 'Deep conditioning keratin treatment for silky hair. Includes free haircut and blow dry.', 8500.00, 'session', 7.2906, 80.6337, 'Kandy', 'active');

-- 6. Service: Fitness Trainers
INSERT INTO listings (id, provider_id, category_id, type, title, description, price_per_unit, unit_label, geo_lat, geo_lng, district, status) VALUES
('s_ft_001', 'a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', (SELECT id FROM categories WHERE name = 'Fitness Trainers'), 'service', 'Personal Fitness & Weight Loss Coach', 'One-on-one personal gym coaching with customized diet plan and weekly progress tracking.', 8000.00, 'month', 7.2906, 80.6337, 'Kandy', 'active'),
('s_ft_002', 'a2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', (SELECT id FROM categories WHERE name = 'Fitness Trainers'), 'service', 'Hatha Yoga & Meditation Classes', 'Relaxing yoga and breathing exercises. Weekly group or private classes for stress relief.', 1500.00, 'session', 6.9271, 79.8612, 'Colombo', 'active');

-- 7. Service: Plumbing & Electrical
INSERT INTO listings (id, provider_id, category_id, type, title, description, price_per_unit, unit_label, geo_lat, geo_lng, district, status) VALUES
('s_pe_001', 'f1e2d3c4-b5a6-7f8e-9d0c-1b2a3f4e5d6c', (SELECT id FROM categories WHERE name = 'Plumbing & Electrical'), 'service', 'House Electrical Wiring & Repairs', 'Domestic electrical works, ceiling fan installations, DB board diagnostics, and emergency repair.', 2000.00, 'hour', 6.9271, 79.8612, 'Colombo', 'active'),
('s_pe_002', 'f1e2d3c4-b5a6-7f8e-9d0c-1b2a3f4e5d6c', (SELECT id FROM categories WHERE name = 'Plumbing & Electrical'), 'service', 'Leak Diagnostics & Plumbing Repairs', 'Leaky pipes, tap installations, commode repairs, and water tank troubleshooting.', 1800.00, 'hour', 6.9271, 79.8612, 'Colombo', 'active');

-- 8. Service: Catering Services
INSERT INTO listings (id, provider_id, category_id, type, title, description, price_per_unit, unit_label, geo_lat, geo_lng, district, status) VALUES
('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'd8c4e9f1-6f1c-5c1d-9c4b-4c0a5c4e4c4e', (SELECT id FROM categories WHERE name = 'Catering Services'), 'service', 'Authentic Sri Lankan Buffet Catering', 'Includes 5 curries, rice, papadam, fried chili, and watalappam dessert. Minimum 50 pax.', 1500.00, 'person', 7.0873, 79.9995, 'Gampaha', 'active'),
('s_cs_001', 'd8c4e9f1-6f1c-5c1d-9c4b-4c0a5c4e4c4e', (SELECT id FROM categories WHERE name = 'Catering Services'), 'service', 'Premium Short-Eats Platter', 'Platter of 50 cocktail-sized items including rolls, patties, cutlets, and sandwiches. Ideal for meetings.', 6500.00, 'event', 7.0873, 79.9995, 'Gampaha', 'active'),
('s_cs_002', 'd8c4e9f1-6f1c-5c1d-9c4b-4c0a5c4e4c4e', (SELECT id FROM categories WHERE name = 'Catering Services'), 'service', 'Traditional Kavum & Kokis Platter', 'Freshly made Kevum, Kokis, Athirasa, Aluwa, and Mung Kevum for Sinhala New Year or functions.', 4500.00, 'event', 7.0873, 79.9995, 'Gampaha', 'active');

-- 9. Equipment: Camera & Lenses
INSERT INTO listings (id, provider_id, category_id, type, title, description, price_per_unit, unit_label, quantity, condition, geo_lat, geo_lng, district, status) VALUES
('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d', (SELECT id FROM categories WHERE name = 'Camera & Lenses'), 'equipment', 'Sony G-Master 70-200mm f/2.8 Lens', 'Top tier portrait and event lens. Clean glass, includes ND filter.', 4500.00, 'day', 1, 'good', 6.9271, 79.8612, 'Colombo', 'active'),
('e_cl_001', 'b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e', (SELECT id FROM categories WHERE name = 'Camera & Lenses'), 'equipment', 'Canon EOS R5 Mirrorless Camera Body', 'Professional mirrorless body, 45MP, 8K video. Excellent condition. Includes 2 batteries.', 8000.00, 'day', 1, 'good', 6.9271, 79.8612, 'Colombo', 'active'),
('e_cl_002', 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d', (SELECT id FROM categories WHERE name = 'Camera & Lenses'), 'equipment', 'Godox AD600 Pro Studio Flash Light', '600Ws powerful outdoor flash strobe. Includes trigger (Canon/Sony compatible).', 2500.00, 'day', 2, 'good', 6.9271, 79.8612, 'Colombo', 'active');

-- 10. Equipment: Drones & Accessories
INSERT INTO listings (id, provider_id, category_id, type, title, description, price_per_unit, unit_label, quantity, condition, geo_lat, geo_lng, district, status) VALUES
('e_da_001', 'b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e', (SELECT id FROM categories WHERE name = 'Drones & Accessories'), 'equipment', 'DJI Mavic 3 Pro Cine Drone', 'Triple camera system, Apple ProRes encoding. Rental includes smart controller and 3 batteries.', 12000.00, 'day', 1, 'good', 6.9271, 79.8612, 'Colombo', 'active'),
('e_da_002', 'b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e', (SELECT id FROM categories WHERE name = 'Drones & Accessories'), 'equipment', 'DJI Ronin RS3 Pro Gimbal Stabilizer', 'Professional camera stabilizer, supports up to 4.5kg payload. Focus motor and LiDAR module included.', 3500.00, 'day', 2, 'good', 6.9271, 79.8612, 'Colombo', 'active');

-- 11. Equipment: Audio & Lighting
INSERT INTO listings (id, provider_id, category_id, type, title, description, price_per_unit, unit_label, quantity, condition, geo_lat, geo_lng, district, status) VALUES
('e_al_001', 'b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e', (SELECT id FROM categories WHERE name = 'Audio & Lighting'), 'equipment', 'JBL PartyBox 310 Bluetooth Speaker', '240W powerful sound, dynamic lights, dual mic/guitar inputs. Built-in battery for 18 hrs.', 4000.00, 'day', 2, 'good', 6.9271, 79.8612, 'Colombo', 'active'),
('e_al_002', 'b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e', (SELECT id FROM categories WHERE name = 'Audio & Lighting'), 'equipment', 'Shure SM58 Dual Wireless Microphone', 'Premium vocal wireless system, interference-free, clear reception range up to 100m.', 3000.00, 'day', 1, 'new', 6.9271, 79.8612, 'Colombo', 'active');

-- 12. Equipment: Power Tools
INSERT INTO listings (id, provider_id, category_id, type, title, description, price_per_unit, unit_label, quantity, condition, geo_lat, geo_lng, district, status) VALUES
('e_pt_001', 'f1e2d3c4-b5a6-7f8e-9d0c-1b2a3f4e5d6c', (SELECT id FROM categories WHERE name = 'Power Tools'), 'equipment', 'Bosch Professional Rotary Hammer Drill', 'High impact drilling power, ideal for concrete and masonry. Includes drill bit set.', 1500.00, 'day', 3, 'good', 6.9271, 79.8612, 'Colombo', 'active'),
('e_pt_002', 'f1e2d3c4-b5a6-7f8e-9d0c-1b2a3f4e5d6c', (SELECT id FROM categories WHERE name = 'Power Tools'), 'equipment', 'Makita 7-inch Portable Circular Saw', '1050W powerful motor, cuts up to 66mm depth. Lightweight, handles hardwood with ease.', 2000.00, 'day', 1, 'good', 6.9271, 79.8612, 'Colombo', 'active');

-- 13. Equipment: Event Furniture & Tents
INSERT INTO listings (id, provider_id, category_id, type, title, description, price_per_unit, unit_label, quantity, condition, geo_lat, geo_lng, district, status) VALUES
('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'd8c4e9f1-6f1c-5c1d-9c4b-4c0a5c4e4c4e', (SELECT id FROM categories WHERE name = 'Event Furniture & Tents'), 'equipment', '20x20ft White Canopy Tent', 'Waterproof marquee tent perfect for outdoor events or almsgivings.', 3000.00, 'day', 3, 'fair', 7.0873, 79.9995, 'Gampaha', 'active'),
('e_ef_001', 'd8c4e9f1-6f1c-5c1d-9c4b-4c0a5c4e4c4e', (SELECT id FROM categories WHERE name = 'Event Furniture & Tents'), 'equipment', 'Red Plastic Armless Chairs (Set of 50)', 'Sturdy, comfortable plastic chairs. Perfect for outdoor parties, religious gatherings, or seminars.', 1500.00, 'day', 5, 'fair', 7.0873, 79.9995, 'Gampaha', 'active'),
('e_ef_002', 'd8c4e9f1-6f1c-5c1d-9c4b-4c0a5c4e4c4e', (SELECT id FROM categories WHERE name = 'Event Furniture & Tents'), 'equipment', 'Foldable Banquet Tables (Set of 10)', '6ft long wooden banquet tables with iron folding stands. Perfect for buffet lines or dining.', 2500.00, 'day', 2, 'good', 7.0873, 79.9995, 'Gampaha', 'active');

-- 14. Equipment: Camping & Outdoor
INSERT INTO listings (id, provider_id, category_id, type, title, description, price_per_unit, unit_label, quantity, condition, geo_lat, geo_lng, district, status) VALUES
('e_co_001', 'b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e', (SELECT id FROM categories WHERE name = 'Camping & Outdoor'), 'equipment', 'Quechua 4-Person Waterproof Camping Tent', 'Arpenaz 4.1 family tent with a large living area and bedroom. 100% waterproof.', 2000.00, 'day', 2, 'good', 6.9271, 79.8612, 'Colombo', 'active'),
('e_co_002', 'b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e', (SELECT id FROM categories WHERE name = 'Camping & Outdoor'), 'equipment', 'Camping Sleeping Bag & Foam Mat Kit', 'Includes double-layered insulated sleeping bag and thick foam yoga/camping mat.', 800.00, 'day', 5, 'good', 6.9271, 79.8612, 'Colombo', 'active');

-- 15. Equipment: Gaming Consoles
INSERT INTO listings (id, provider_id, category_id, type, title, description, price_per_unit, unit_label, quantity, condition, geo_lat, geo_lng, district, status) VALUES
('e_gc_001', 'b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e', (SELECT id FROM categories WHERE name = 'Gaming Consoles'), 'equipment', 'Sony PlayStation 5 Console (Disc Edition)', 'Comes with 2 DualSense controllers, pre-loaded with FIFA 24 and Spiderman 2. UHD HDR support.', 3500.00, 'day', 2, 'good', 6.9271, 79.8612, 'Colombo', 'active'),
('e_gc_002', 'b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e', (SELECT id FROM categories WHERE name = 'Gaming Consoles'), 'equipment', 'Meta Quest 2 VR Headset (128GB)', 'All-in-one standalone VR gaming headset. Complete with controllers and charging cables.', 2500.00, 'day', 1, 'good', 6.9271, 79.8612, 'Colombo', 'active');

-- 16. Equipment: Musical Instruments
INSERT INTO listings (id, provider_id, category_id, type, title, description, price_per_unit, unit_label, quantity, condition, geo_lat, geo_lng, district, status) VALUES
('e_mi_001', 'b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e', (SELECT id FROM categories WHERE name = 'Musical Instruments'), 'equipment', 'Yamaha F310 Acoustic Guitar', 'Clean, rich acoustic tone. Perfect for musical gatherings or recording sessions. Includes bag.', 1000.00, 'day', 2, 'good', 6.9271, 79.8612, 'Colombo', 'active'),
('e_mi_002', 'b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e', (SELECT id FROM categories WHERE name = 'Musical Instruments'), 'equipment', 'Roland XPS-10 Synthesizer Keyboard', '61-key professional keyboard with Sri Lankan synth loops and voice patches.', 3000.00, 'day', 1, 'good', 6.9271, 79.8612, 'Colombo', 'active');

-- Bookings
-- 1. Completed Booking (Photography)
INSERT INTO bookings (id, consumer_id, provider_id, service_listing_id, booking_type, status, scheduled_date, scheduled_time, duration_hours, total_price, notes) VALUES
('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0a', 'e9d5f0a2-7a2d-6d2a-0d5c-5d1a6d5f5d5f', 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'service', 'completed', CURRENT_DATE - INTERVAL '5 days', '08:00', 12, 150000.00, 'Wedding at Galle Face Hotel');

-- 2. Pending Bundle Booking (Catering + Tents)
INSERT INTO bookings (id, consumer_id, provider_id, service_listing_id, equipment_listing_id, booking_type, status, scheduled_date, scheduled_time, duration_hours, total_price, notes) VALUES
('f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0a1a', 'e9d5f0a2-7a2d-6d2a-0d5c-5d1a6d5f5d5f', 'd8c4e9f1-6f1c-5c1d-9c4b-4c0a5c4e4c4e', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'bundle', 'pending', CURRENT_DATE + INTERVAL '10 days', '10:00', 8, 174000.00, 'Almsgiving event for 100 people. Need 2 tents.');

-- Reviews
INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, listing_id, rating, comment) VALUES
('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0a', 'e9d5f0a2-7a2d-6d2a-0d5c-5d1a6d5f5d5f', 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 5, 'Saman was amazing! Captured our wedding perfectly. Highly recommend.');

-- Update Provider Ratings
UPDATE users SET trust_score = 5.0 WHERE id = 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d';
UPDATE listings SET average_rating = 5.0, review_count = 1 WHERE id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
