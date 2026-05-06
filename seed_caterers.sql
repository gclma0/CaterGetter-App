-- ============================================================
-- SEED: 20 Dummy Caterers for CaterApp
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

DO $$
DECLARE
  ids uuid[] := ARRAY[
    '11111111-0000-0000-0000-000000000001'::uuid,
    '11111111-0000-0000-0000-000000000002'::uuid,
    '11111111-0000-0000-0000-000000000003'::uuid,
    '11111111-0000-0000-0000-000000000004'::uuid,
    '11111111-0000-0000-0000-000000000005'::uuid,
    '11111111-0000-0000-0000-000000000006'::uuid,
    '11111111-0000-0000-0000-000000000007'::uuid,
    '11111111-0000-0000-0000-000000000008'::uuid,
    '11111111-0000-0000-0000-000000000009'::uuid,
    '11111111-0000-0000-0000-000000000010'::uuid,
    '11111111-0000-0000-0000-000000000011'::uuid,
    '11111111-0000-0000-0000-000000000012'::uuid,
    '11111111-0000-0000-0000-000000000013'::uuid,
    '11111111-0000-0000-0000-000000000014'::uuid,
    '11111111-0000-0000-0000-000000000015'::uuid,
    '11111111-0000-0000-0000-000000000016'::uuid,
    '11111111-0000-0000-0000-000000000017'::uuid,
    '11111111-0000-0000-0000-000000000018'::uuid,
    '11111111-0000-0000-0000-000000000019'::uuid,
    '11111111-0000-0000-0000-000000000020'::uuid
  ];
BEGIN

  -- Step 1: Insert dummy users into auth.users
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin
  )
  SELECT
    u.id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'caterer' || ROW_NUMBER() OVER () || '@demo.caterapp.com',
    '$2a$10$PgjZMaBuPJaJP8Y.q0dMsOZM9R9yK5jgBHCe7RNpGGk1u5lY6XZQG', -- dummy hash
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false
  FROM UNNEST(ids) AS u(id)
  ON CONFLICT (id) DO NOTHING;

  -- Step 2: Insert profiles
  INSERT INTO public.profiles (id, full_name, phone, role, created_at)
  VALUES
    (ids[1],  'Rahim Uddin',        '+8801711000001', 'vendor', now()),
    (ids[2],  'Sultana Begum',      '+8801711000002', 'vendor', now()),
    (ids[3],  'Karim Hossain',      '+8801711000003', 'vendor', now()),
    (ids[4],  'Nasrin Akter',       '+8801711000004', 'vendor', now()),
    (ids[5],  'Mizanur Rahman',     '+8801711000005', 'vendor', now()),
    (ids[6],  'Tahmina Khanam',     '+8801711000006', 'vendor', now()),
    (ids[7],  'Jalal Ahmed',        '+8801711000007', 'vendor', now()),
    (ids[8],  'Roksana Islam',      '+8801711000008', 'vendor', now()),
    (ids[9],  'Faruk Chowdhury',    '+8801711000009', 'vendor', now()),
    (ids[10], 'Mitu Rani Das',      '+8801711000010', 'vendor', now()),
    (ids[11], 'Sohel Mahmud',       '+8801711000011', 'vendor', now()),
    (ids[12], 'Parveen Sultana',    '+8801711000012', 'vendor', now()),
    (ids[13], 'Anwar Kabir',        '+8801711000013', 'vendor', now()),
    (ids[14], 'Dilruba Yeasmin',    '+8801711000014', 'vendor', now()),
    (ids[15], 'Shafiqul Islam',     '+8801711000015', 'vendor', now()),
    (ids[16], 'Maksuda Khatun',     '+8801711000016', 'vendor', now()),
    (ids[17], 'Babul Akter',        '+8801711000017', 'vendor', now()),
    (ids[18], 'Rashida Parvin',     '+8801711000018', 'vendor', now()),
    (ids[19], 'Nurul Huda',         '+8801711000019', 'vendor', now()),
    (ids[20], 'Morjina Begum',      '+8801711000020', 'vendor', now())
  ON CONFLICT (id) DO NOTHING;

  -- Step 3: Insert vendors
  INSERT INTO public.vendors (
    id, business_name, description, cuisine_types, categories,
    location, latitude, longitude, rating, total_reviews, is_approved, created_at,
    banner_url
  )
  VALUES
    (ids[1],  'Spice Garden Catering',
      'Authentic Bengali cuisine for all occasions. We specialize in large weddings and corporate events with fresh local ingredients.',
      ARRAY['Bengali','Indian'], ARRAY['Wedding','Corporate'],
      'Gulshan, Dhaka', 23.793700, 90.413500, 4.8, 124,  true, now() - interval '60 days',
      'https://images.unsplash.com/photo-1555244162-803834f70033?w=600'),

    (ids[2],  'Royal Feast BD',
      'Premium catering service offering a fusion of Bengali and Continental dishes. Perfect for high-end events.',
      ARRAY['Bengali','Continental'], ARRAY['Wedding','Birthday'],
      'Banani, Dhaka', 23.793920, 90.403850, 4.7, 98, true, now() - interval '55 days',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600'),

    (ids[3],  'Dhaka Darbar Kitchen',
      'Traditional Mughal-inspired cooking. Our biryani and kebabs are crowd favorites at every event.',
      ARRAY['Indian','Arabic'], ARRAY['Wedding','Outdoor Event'],
      'Mirpur, Dhaka', 23.806200, 90.368900, 4.6, 87, true, now() - interval '50 days',
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600'),

    (ids[4],  'Green Bowl Catering',
      'Healthy, organic catering with vegetarian and vegan options. Ideal for health-conscious corporate clients.',
      ARRAY['Continental','Indian'], ARRAY['Corporate','Home Party'],
      'Dhanmondi, Dhaka', 23.746500, 90.376200, 4.5, 62, true, now() - interval '45 days',
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600'),

    (ids[5],  'Chinese Express BD',
      'Authentic Chinese flavors brought to your doorstep. From dim sum to Peking duck, we do it all.',
      ARRAY['Chinese'], ARRAY['Birthday','Corporate','Home Party'],
      'Uttara, Dhaka', 23.874200, 90.398500, 4.4, 73, true, now() - interval '42 days',
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600'),

    (ids[6],  'Bella Italia Catering',
      'Authentic Italian cuisine crafted by trained chefs. Pasta, pizza, and risotto stations available.',
      ARRAY['Italian'], ARRAY['Wedding','Birthday','Corporate'],
      'Gulshan 1, Dhaka', 23.780800, 90.415600, 4.9, 156, true, now() - interval '40 days',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600'),

    (ids[7],  'Thai Orchid Caterers',
      'Bringing the exotic flavors of Thailand to Bangladesh. Known for our pad thai and green curry.',
      ARRAY['Thai'], ARRAY['Home Party','Corporate','Birthday'],
      'Mohakhali, Dhaka', 23.780200, 90.400500, 4.6, 45, true, now() - interval '38 days',
      'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600'),

    (ids[8],  'Mexi-Bangla Fusion',
      'A bold fusion of Mexican and Bengali tastes. Tacos, burritos with a desi twist — unique and unforgettable.',
      ARRAY['Mexican','Bengali'], ARRAY['Birthday','Outdoor Event','Home Party'],
      'Mohammadpur, Dhaka', 23.761800, 90.357400, 4.3, 38, true, now() - interval '35 days',
      'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=600'),

    (ids[9],  'Grand Banquet Services',
      'Full-service catering for large weddings. We handle everything from setup to cleanup for 200–2000 guests.',
      ARRAY['Bengali','Continental','Indian'], ARRAY['Wedding'],
      'Bashundhara R/A, Dhaka', 23.814000, 90.426500, 4.7, 211, true, now() - interval '30 days',
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600'),

    (ids[10], 'Midnight Munchies',
      'Late-night event specialist. Sliders, mini burgers, dessert stations — perfect for parties that go all night.',
      ARRAY['Continental'], ARRAY['Birthday','Outdoor Event','Home Party'],
      'Rampura, Dhaka', 23.756400, 90.430100, 4.2, 29, true, now() - interval '28 days',
      'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600'),

    (ids[11], 'Nawabi Dawat',
      'Bringing back the grandeur of Nawabi cuisine. Rich kormas, aromatic biryanis and royal desserts.',
      ARRAY['Bengali','Indian','Arabic'], ARRAY['Wedding','Corporate'],
      'Malibagh, Dhaka', 23.745600, 90.420800, 4.8, 89, true, now() - interval '25 days',
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600'),

    (ids[12], 'Fresh & Fast Catering',
      'Quick turnaround catering for corporate meetings and seminars. Sandwiches, wraps, and healthy bowls.',
      ARRAY['Continental'], ARRAY['Corporate'],
      'Motijheel, Dhaka', 23.729100, 90.417800, 4.1, 54, true, now() - interval '22 days',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600'),

    (ids[13], 'Seaside Caterers',
      'Seafood specialists. Hilsa, prawn and crab dishes cooked to perfection for coastal-themed events.',
      ARRAY['Bengali'], ARRAY['Wedding','Outdoor Event'],
      'Shyamoli, Dhaka', 23.768900, 90.362700, 4.6, 67, true, now() - interval '20 days',
      'https://images.unsplash.com/photo-1606851091851-e8c8c0fca5ba?w=600'),

    (ids[14], 'Happy Bites Kids Catering',
      'Specialist catering for children''s parties. Fun food, colorful setups and kid-friendly menus.',
      ARRAY['Continental','Bengali'], ARRAY['Birthday'],
      'Mirpur 10, Dhaka', 23.820500, 90.366200, 4.5, 41, true, now() - interval '18 days',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'),

    (ids[15], 'Corporate Chef BD',
      'Premium office catering. Daily lunch boxes, team lunches and boardroom setups — reliable and punctual.',
      ARRAY['Bengali','Continental'], ARRAY['Corporate'],
      'Tejgaon, Dhaka', 23.762300, 90.392800, 4.4, 103, true, now() - interval '16 days',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600'),

    (ids[16], 'Outdoor Feast BD',
      'Expert in outdoor and picnic catering. BBQ stations, live grills and open-air buffets our specialty.',
      ARRAY['Bengali','Continental','Arabic'], ARRAY['Outdoor Event','Corporate'],
      'Panthapath, Dhaka', 23.751600, 90.388900, 4.3, 36, true, now() - interval '14 days',
      'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600'),

    (ids[17], 'Mithai & More',
      'Dessert-focused catering. Elaborate dessert tables, mithai platters and custom cake setups for every occasion.',
      ARRAY['Bengali','Indian'], ARRAY['Wedding','Birthday'],
      'Old Dhaka, Dhaka', 23.709400, 90.406700, 4.7, 78, true, now() - interval '12 days',
      'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600'),

    (ids[18], 'Homestyle Kitchen BD',
      'Comfort food catering with a homemade touch. Guests always say it tastes just like mom''s cooking.',
      ARRAY['Bengali'], ARRAY['Home Party','Birthday'],
      'Lalbagh, Dhaka', 23.720100, 90.392300, 4.5, 55, true, now() - interval '10 days',
      'https://images.unsplash.com/photo-1547592180-85f173990554?w=600'),

    (ids[19], 'Elite Events Catering',
      'Five-star catering experience for VIP events. Live cooking stations, international cuisine and dedicated service.',
      ARRAY['Continental','Italian','French'], ARRAY['Corporate','Wedding'],
      'Gulshan 2, Dhaka', 23.797100, 90.419200, 4.9, 182, true, now() - interval '8 days',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600'),

    (ids[20], 'Village Feast Caterers',
      'Traditional rural Bengali cooking using clay pots and wood fire. Authentic flavors from the heart of Bangladesh.',
      ARRAY['Bengali'], ARRAY['Wedding','Outdoor Event','Home Party'],
      'Keraniganj, Dhaka', 23.708500, 90.368200, 4.6, 44, true, now() - interval '5 days',
      'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600')
  ON CONFLICT (id) DO NOTHING;

  -- Step 4: Insert packages for each vendor (2-3 packages each)
  INSERT INTO public.packages (
    id, vendor_id, name, description, price, min_guests, max_guests, is_available, created_at
  )
  VALUES
  -- Spice Garden Catering (ids[1])
  (gen_random_uuid(), ids[1], 'Classic Bengali Buffet',
   '10-item full buffet: rice, dal, fish curry, beef, chicken roast, vegetables and dessert.',
   15000, 50, 300, true, now()),
  (gen_random_uuid(), ids[1], 'Royal Wedding Package',
   '20-item grand buffet with live counters, decoration and serving staff included.',
   55000, 200, 1000, true, now()),
  (gen_random_uuid(), ids[1], 'Corporate Lunch Box',
   'Individually packed 5-item lunch boxes delivered to your office.',
   8000, 20, 200, true, now()),

  -- Royal Feast BD (ids[2])
  (gen_random_uuid(), ids[2], 'Premium Dinner Package',
   'Continental + Bengali fusion 12-course dinner for special occasions.',
   25000, 80, 400, true, now()),
  (gen_random_uuid(), ids[2], 'Birthday Bash Bundle',
   'Custom birthday catering with cake, finger foods and a main course for 30–80 guests.',
   12000, 30, 80, true, now()),
  (gen_random_uuid(), ids[2], 'Wedding Grand Feast',
   'Full wedding package with starter, main, dessert stations and professional service team.',
   75000, 300, 2000, true, now()),

  -- Dhaka Darbar Kitchen (ids[3])
  (gen_random_uuid(), ids[3], 'Mughal Biryani Package',
   'Kacchi biryani, borhani, salad and zarda for 50–200 guests.',
   18000, 50, 200, true, now()),
  (gen_random_uuid(), ids[3], 'BBQ & Kebab Night',
   'Mixed grill platter: seekh kebab, boti, chicken tikka with naan and raita.',
   22000, 60, 250, true, now()),

  -- Green Bowl Catering (ids[4])
  (gen_random_uuid(), ids[4], 'Healthy Corporate Buffet',
   'Salad bar, grilled proteins, whole grain options and fresh juices.',
   14000, 40, 200, true, now()),
  (gen_random_uuid(), ids[4], 'Vegan Feast Package',
   'Fully plant-based 8-item buffet — perfect for health-conscious clients.',
   11000, 30, 150, true, now()),

  -- Chinese Express BD (ids[5])
  (gen_random_uuid(), ids[5], 'Chinese Banquet Set',
   'Dim sum, fried rice, noodles, Manchurian, sweet & sour dishes for 40–150 guests.',
   16000, 40, 150, true, now()),
  (gen_random_uuid(), ids[5], 'Party Noodle Package',
   'Noodle and fried rice station with 5 sides. Great for casual parties.',
   9000, 25, 100, true, now()),

  -- Bella Italia (ids[6])
  (gen_random_uuid(), ids[6], 'Italian Pasta Station',
   'Live pasta station: 3 types of pasta, 4 sauces, garlic bread and caesar salad.',
   20000, 50, 200, true, now()),
  (gen_random_uuid(), ids[6], 'Full Italian Wedding',
   'Antipasti, pasta, risotto, wood-fired pizza, tiramisu — a complete Italian experience.',
   65000, 150, 600, true, now()),
  (gen_random_uuid(), ids[6], 'Pizza Party Package',
   '8 varieties of wood-fired pizzas with soft drinks. Perfect for casual gatherings.',
   12000, 30, 120, true, now()),

  -- Thai Orchid (ids[7])
  (gen_random_uuid(), ids[7], 'Thai Dinner Experience',
   'Tom yum soup, pad thai, green curry, mango sticky rice for 30–100 guests.',
   17000, 30, 100, true, now()),
  (gen_random_uuid(), ids[7], 'Corporate Thai Lunch',
   'Set Thai lunch boxes with soup, main and dessert. Minimum 20 persons.',
   7500, 20, 80, true, now()),

  -- Mexi-Bangla Fusion (ids[8])
  (gen_random_uuid(), ids[8], 'Taco Bar Setup',
   'Live taco station: 3 proteins, fresh salsas, guacamole and tortilla chips.',
   13000, 35, 120, true, now()),
  (gen_random_uuid(), ids[8], 'Fusion Birthday Party',
   'Desi-Mexican fusion: biryani burritos, curry tacos and fusion desserts.',
   10000, 25, 80, true, now()),

  -- Grand Banquet Services (ids[9])
  (gen_random_uuid(), ids[9], 'Mega Wedding Package',
   'Complete wedding catering for 500–2000 guests. 25 dishes, live counters, staff included.',
   150000, 500, 2000, true, now()),
  (gen_random_uuid(), ids[9], 'Standard Wedding Feast',
   '15-item buffet with serving staff for 200–500 guests.',
   60000, 200, 500, true, now()),
  (gen_random_uuid(), ids[9], 'Engagement Ceremony Package',
   'Elegant catering for engagement parties. 10 dishes, decoration and service.',
   30000, 100, 300, true, now()),

  -- Midnight Munchies (ids[10])
  (gen_random_uuid(), ids[10], 'Midnight Snack Station',
   'Mini burgers, sliders, fries, nachos and mocktails for late-night parties.',
   11000, 30, 150, true, now()),
  (gen_random_uuid(), ids[10], 'Dessert & Drinks Table',
   'Premium dessert spread with 10 varieties and custom mocktail bar.',
   8500, 20, 100, true, now()),

  -- Nawabi Dawat (ids[11])
  (gen_random_uuid(), ids[11], 'Nawabi Full Dawat',
   'Authentic Nawabi feast: mutton korma, shahi biryani, kebabs and royal desserts.',
   28000, 80, 400, true, now()),
  (gen_random_uuid(), ids[11], 'Corporate Nawabi Lunch',
   'Biryani, korma and dessert packed as set meals for corporate teams.',
   9500, 30, 150, true, now()),

  -- Fresh & Fast (ids[12])
  (gen_random_uuid(), ids[12], 'Office Meeting Platter',
   'Sandwiches, wraps, fresh juice and pastries for meetings up to 40 people.',
   6000, 10, 40, true, now()),
  (gen_random_uuid(), ids[12], 'Seminar Lunch Package',
   'Quick buffet lunch: rice, dal, chicken and salad. Ideal for seminars.',
   8000, 30, 150, true, now()),

  -- Seaside Caterers (ids[13])
  (gen_random_uuid(), ids[13], 'Seafood Extravaganza',
   'Hilsa fry, prawn curry, crab masala, fish biryani and coastal sides.',
   24000, 60, 200, true, now()),
  (gen_random_uuid(), ids[13], 'Coastal Wedding Package',
   'Full seafood wedding feast with live fish counter and traditional coastal desserts.',
   55000, 200, 700, true, now()),

  -- Happy Bites Kids (ids[14])
  (gen_random_uuid(), ids[14], 'Kids Birthday Deluxe',
   'Nuggets, mini pizzas, fruit skewers, juice boxes and a custom birthday cake setup.',
   9000, 15, 60, true, now()),
  (gen_random_uuid(), ids[14], 'School Party Package',
   'Fun food for school events: sandwiches, mini burgers, chips and lemonade.',
   6500, 20, 80, true, now()),

  -- Corporate Chef BD (ids[15])
  (gen_random_uuid(), ids[15], 'Daily Office Lunch Box',
   'Freshly cooked 4-item lunch boxes delivered to your office. Minimum 20 boxes.',
   5500, 20, 200, true, now()),
  (gen_random_uuid(), ids[15], 'Boardroom Breakfast',
   'Continental breakfast platter: pastries, fruit, yogurt, juice and coffee.',
   7000, 10, 40, true, now()),
  (gen_random_uuid(), ids[15], 'Team Lunch Buffet',
   'Hot buffet for office teams: rice, curry, salad, dessert. Up to 100 guests.',
   12000, 30, 100, true, now()),

  -- Outdoor Feast BD (ids[16])
  (gen_random_uuid(), ids[16], 'BBQ Outdoor Package',
   'Live BBQ grill station: chicken, beef, seekh kebabs with bread and salads.',
   18000, 40, 200, true, now()),
  (gen_random_uuid(), ids[16], 'Picnic Feast Package',
   'Open-air picnic catering with a variety of snacks, mains and desserts.',
   14000, 30, 150, true, now()),

  -- Mithai & More (ids[17])
  (gen_random_uuid(), ids[17], 'Royal Dessert Table',
   '15 varieties of sweets and desserts: rasmalai, gulab jamun, kheer, cake and more.',
   16000, 50, 300, true, now()),
  (gen_random_uuid(), ids[17], 'Mithai Wedding Station',
   'Dedicated dessert counter for weddings with 20+ Bengali and Indian sweets.',
   25000, 100, 500, true, now()),

  -- Homestyle Kitchen BD (ids[18])
  (gen_random_uuid(), ids[18], 'Home Party Package',
   'Just like mama''s cooking: 8-item Bengali home-style meal for small gatherings.',
   10000, 25, 80, true, now()),
  (gen_random_uuid(), ids[18], 'Family Reunion Feast',
   'Traditional Bengali food for family get-togethers. Includes pitha and dessert.',
   13000, 40, 120, true, now()),

  -- Elite Events (ids[19])
  (gen_random_uuid(), ids[19], 'Five-Star Corporate Gala',
   'Black-tie catering with live cooking stations, international dishes and sommelier service.',
   80000, 100, 500, true, now()),
  (gen_random_uuid(), ids[19], 'Premium Wedding Package',
   'World-class wedding catering with French, Italian and Bengali fusion cuisine.',
   120000, 300, 1500, true, now()),
  (gen_random_uuid(), ids[19], 'VIP Cocktail Reception',
   'Canapés, finger foods, mocktail bar and live dessert station for VIP events.',
   40000, 50, 200, true, now()),

  -- Village Feast (ids[20])
  (gen_random_uuid(), ids[20], 'Clay Pot Feast',
   'Traditional wood-fire cooking in clay pots. Rice, fish, dal and country chicken.',
   12000, 40, 150, true, now()),
  (gen_random_uuid(), ids[20], 'Village Wedding Dawat',
   'Authentic rural Bengali wedding feast with pithas, korma and traditional desserts.',
   35000, 150, 500, true, now()),
  (gen_random_uuid(), ids[20], 'Outdoor Picnic Village Style',
   'Countryside BBQ and open-fire cooking experience for outdoor events.',
   10000, 30, 100, true, now());

END $$;
