INSERT INTO reward_categories (id, name, description, display_order, active) VALUES
(1, 'Gift Cards', 'Digital gift cards for popular shopping and food platforms', 1, b'1'),
(2, 'Travel & Holidays', 'Curated holiday packages across India', 2, b'1'),
(3, 'Shopping & Electronics', 'Gadgets and accessories redeemable against points', 3, b'1'),
(4, 'Dining & Lifestyle', 'Restaurant, cinema and wellness vouchers', 4, b'1'),
(5, 'Health & Fitness', 'Memberships and equipment to stay active', 5, b'1'),
(6, 'Learning & Subscriptions', 'Courses and digital subscriptions', 6, b'1');

INSERT INTO reward_items (category_id, name, description, points_cost, active) VALUES
(1, 'Google Play Gift Card', 'Credit for apps, games and subscriptions on Google Play', 5000, b'1'),
(1, 'Apple Gift Card', 'Credit for the App Store, iTunes and Apple services', 6000, b'1'),
(1, 'Amazon Gift Card', 'Spend on anything sold on Amazon India', 4500, b'1'),
(1, 'Flipkart Gift Card', 'Spend on anything sold on Flipkart', 4500, b'1'),
(1, 'Swiggy Gift Card', 'Food delivery credit usable across restaurants', 3500, b'1'),
(1, 'Zomato Gift Card', 'Dining and delivery credit on Zomato', 3500, b'1'),

(2, 'Trip to Manali', 'Three nights in the Himachal hills including stay', 40000, b'1'),
(2, 'Trip to Kanyakumari', 'Two nights at the southern tip of India', 30000, b'1'),
(2, 'Goa Beach Holiday', 'Four nights on the Goa coast including stay', 45000, b'1'),
(2, 'Jaipur Heritage Trip', 'Two nights touring the palaces of Jaipur', 28000, b'1'),
(2, 'Ooty Hill Station Trip', 'Three nights in the Nilgiris including stay', 38000, b'1'),

(3, 'Bluetooth Headphones', 'Over-ear wireless headphones with noise cancellation', 12000, b'1'),
(3, 'Smart Watch', 'Fitness and notification smartwatch', 18000, b'1'),
(3, 'Wireless Earbuds', 'True wireless earbuds with charging case', 15000, b'1'),
(3, 'Smartphone Voucher', 'Voucher redeemable against a new smartphone', 22000, b'1'),
(3, 'Laptop Bag', 'Padded laptop backpack for daily commuting', 6000, b'1'),

(4, 'Dinner for Two', 'Three course meal for two at a partner restaurant', 8000, b'1'),
(4, 'Cafe Voucher', 'Coffee and snacks at partner cafe outlets', 4000, b'1'),
(4, 'Movie Tickets', 'Two tickets at a partner cinema chain', 5000, b'1'),
(4, 'Spa Voucher', 'Full body spa session at a partner wellness centre', 10000, b'1'),

(5, 'Gym Membership (3 months)', 'Quarterly membership at partner fitness centres', 20000, b'1'),
(5, 'Yoga Classes', 'Ten guided yoga sessions with a certified instructor', 7000, b'1'),
(5, 'Fitness Band', 'Activity tracker with heart rate monitoring', 9000, b'1'),
(5, 'Nutrition Consultation', 'One on one session with a registered dietitian', 6000, b'1'),

(6, 'Online Course Voucher', 'Enrolment credit for a professional online course', 10000, b'1'),
(6, 'E-Book Subscription', 'Twelve months of unlimited e-book reading', 5000, b'1'),
(6, 'Coding Platform Access', 'Annual access to a coding practice platform', 12000, b'1'),
(6, 'Music Subscription', 'Twelve months of ad free music streaming', 4000, b'1');
