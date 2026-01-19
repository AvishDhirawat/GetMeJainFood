-- Enhanced features migration for GetMeJainFood
-- Adds support for: language, blocking, Aadhar verification, reviews, offers, FAQ, categories

-- ====================
-- USERS TABLE UPDATES
-- ====================
ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- ====================
-- PROVIDERS TABLE UPDATES
-- ====================
ALTER TABLE providers ADD COLUMN IF NOT EXISTS pin_code VARCHAR(10);
ALTER TABLE providers ADD COLUMN IF NOT EXISTS aadhar_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS aadhar_number_hash TEXT; -- Store hashed/encrypted
ALTER TABLE providers ADD COLUMN IF NOT EXISTS provider_category VARCHAR(32);
ALTER TABLE providers ADD COLUMN IF NOT EXISTS food_categories TEXT[];
ALTER TABLE providers ADD COLUMN IF NOT EXISTS total_ratings INT DEFAULT 0;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS total_orders INT DEFAULT 0;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS available_today BOOLEAN DEFAULT TRUE;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS external_platforms TEXT[];
ALTER TABLE providers ADD COLUMN IF NOT EXISTS external_app_link TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS min_order_quantity INT DEFAULT 1;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS bulk_order_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS free_delivery_min_price NUMERIC(10,2) DEFAULT 0;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS free_delivery_max_km NUMERIC(5,2) DEFAULT 0;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_promoted BOOLEAN DEFAULT FALSE;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_providers_category ON providers(provider_category);
CREATE INDEX IF NOT EXISTS idx_providers_food_categories ON providers USING GIN(food_categories);
CREATE INDEX IF NOT EXISTS idx_providers_promoted ON providers(is_promoted) WHERE is_promoted = TRUE;
CREATE INDEX IF NOT EXISTS idx_providers_blocked ON providers(blocked) WHERE blocked = FALSE;

-- ====================
-- MENU ITEMS TABLE UPDATES
-- ====================
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS quantity_desc VARCHAR(50);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS food_category VARCHAR(32);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS document_url TEXT;

CREATE INDEX IF NOT EXISTS idx_menu_items_food_category ON menu_items(food_category);

-- ====================
-- ORDERS TABLE UPDATES
-- ====================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(16) DEFAULT 'individual';

-- ====================
-- REVIEWS TABLE (NEW)
-- ====================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photo_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider_id, user_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- ====================
-- OFFERS TABLE (NEW)
-- ====================
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  discount_pct NUMERIC(5,2),
  discount_amt NUMERIC(10,2),
  min_order NUMERIC(10,2),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offers_provider ON offers(provider_id);
CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(is_active, valid_until) WHERE is_active = TRUE;

-- ====================
-- FAQ TABLE (NEW)
-- ====================
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_en TEXT NOT NULL,
  question_hi TEXT NOT NULL,
  answer_en TEXT NOT NULL,
  answer_hi TEXT NOT NULL,
  category VARCHAR(50),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================
-- TERMS AND CONDITIONS TABLE (NEW)
-- ====================
CREATE TABLE IF NOT EXISTS terms_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version VARCHAR(20) NOT NULL,
  content_en TEXT NOT NULL,
  content_hi TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================
-- INSERT DEFAULT TERMS & CONDITIONS
-- ====================
INSERT INTO terms_conditions (version, content_en, content_hi, is_active) VALUES (
  '1.0',
  E'परस्परोपग्रहो जीवानाम्\n\nJain Food in Bharat\n\n"BY JAINS FOR JAINS"\n\nHelping Jains find Jain food nationwide! 🤝 Share your city & get a list of Jain food providers nearby. Supporting jain travelers & local jain businesses alike. 💯\n\nThis app is solely for service purposes.\n\nIf you are any jain food providers (tiffin centres/caterers/bhojnalaya/restaurants) in India then this platform is made for you kindly read all the terms and conditions and then only register yourself here in this application.\n\nMANDATORY CONDITIONS TO BE MET:\n\nA) All the food providers, please post only jain food options here excluding any root vegetables and other items not aligning with the values of Jainism. Even if you provide them to others and if they are there in your menu then also don''t advertise those here atleast as this group promotes jain diet that adheres to the principle of ahinsa.\n\nB) When you use words like Pure Jain food/Jain food then don''t write without onion garlic in comments/ads here. It should be without any root vegetables. No onion garlic concept is in hinduism. In Jainism, it is a broader concept. It says no to root vegetables be it onion or garlic or potato or ginger or carrot or raddish or arbi or beetroot, etc. Don''t mix these two things. Also don''t use mushroom/cauliflower/brinjal/sabudana in preparation if you are using words such as Pure Jain/Jain food.\n\nC) For sweets/dessert providers, don''t use the words such as pure jain or jain food if you are using ingredients for preparation like Anjeer/Fig (dry fruit) or Dragon Fruit or silver work.\n\nD) If you are supplying non Jain veg food items also then please don''t mention in the app but please mention to the customers specifically that you prepare those items though you not mentioned in the app.\n\nJai Jinendra',
  E'परस्परोपग्रहो जीवानाम्\n\nभारत में जैन भोजन\n\n"जैनों द्वारा जैनों के लिए"\n\nजैनों को देशभर में जैन भोजन खोजने में मदद करना! 🤝 अपना शहर साझा करें और पास के जैन भोजन प्रदाताओं की सूची प्राप्त करें। जैन यात्रियों और स्थानीय जैन व्यवसायों दोनों का समर्थन। 💯\n\nयह ऐप केवल सेवा उद्देश्यों के लिए है।\n\nयदि आप भारत में कोई भी जैन भोजन प्रदाता (टिफिन सेंटर/कैटरर्स/भोजनालय/रेस्टोरेंट) हैं तो यह प्लेटफॉर्म आपके लिए बना है। कृपया सभी नियम और शर्तें पढ़ें और उसके बाद ही इस एप्लिकेशन में खुद को पंजीकृत करें।\n\nअनिवार्य शर्तें:\n\nक) सभी भोजन प्रदाताओं से अनुरोध है कि कृपया यहां केवल जैन भोजन विकल्प पोस्ट करें, किसी भी कंद-मूल और जैन धर्म के मूल्यों के अनुरूप न होने वाली अन्य वस्तुओं को छोड़कर।\n\nख) जब आप Pure Jain food/Jain food जैसे शब्दों का उपयोग करते हैं तो यहां टिप्पणियों/विज्ञापनों में बिना प्याज लहसुन न लिखें। यह बिना किसी कंद-मूल के होना चाहिए।\n\nग) मिठाई/डेजर्ट प्रदाताओं के लिए, यदि आप अंजीर या ड्रैगन फ्रूट या चांदी के वर्क जैसी सामग्री का उपयोग कर रहे हैं तो pure jain या jain food जैसे शब्दों का उपयोग न करें।\n\nघ) यदि आप गैर-जैन शाकाहारी भोजन आइटम भी आपूर्ति कर रहे हैं तो कृपया ऐप में उल्लेख न करें लेकिन ग्राहकों को विशेष रूप से बताएं।\n\nजय जिनेंद्र',
  TRUE
) ON CONFLICT DO NOTHING;

-- ====================
-- INSERT DEFAULT FAQs
-- ====================
INSERT INTO faqs (question_en, question_hi, answer_en, answer_hi, category, sort_order) VALUES
(
  'What is Jain food?',
  'जैन भोजन क्या है?',
  'Jain food follows the principle of Ahimsa (non-violence). It excludes all root vegetables (onion, garlic, potato, ginger, carrot, radish, etc.), mushrooms, cauliflower, brinjal, and sabudana.',
  'जैन भोजन अहिंसा के सिद्धांत का पालन करता है। इसमें सभी कंद-मूल (प्याज, लहसुन, आलू, अदरक, गाजर, मूली आदि), मशरूम, फूलगोभी, बैंगन और साबूदाना शामिल नहीं हैं।',
  'general',
  1
),
(
  'How do I register as a food provider?',
  'मैं भोजन प्रदाता के रूप में कैसे पंजीकरण करूं?',
  'Download the app, select "Food Provider" during registration, enter your phone number, verify with OTP, fill in your business details, and accept the terms & conditions.',
  'ऐप डाउनलोड करें, पंजीकरण के दौरान "भोजन प्रदाता" चुनें, अपना फोन नंबर दर्ज करें, OTP से सत्यापित करें, अपने व्यवसाय का विवरण भरें और नियम और शर्तें स्वीकार करें।',
  'provider',
  2
),
(
  'What categories of food providers can register?',
  'भोजन प्रदाताओं की कौन सी श्रेणियां पंजीकरण कर सकती हैं?',
  'Tiffin Centers, Caterers, Bhojnalaya, Restaurants, Bakers, Daily Use Raw Material Providers, Sodh Khana Providers, Home Chefs, and Chauka Bai.',
  'टिफिन सेंटर, कैटरर्स, भोजनालय, रेस्तरां, बेकर्स, दैनिक उपयोग कच्चे माल प्रदाता, सोध खाना प्रदाता, होम शेफ और चौका बाई।',
  'provider',
  3
),
(
  'Is Aadhar verification mandatory?',
  'क्या आधार सत्यापन अनिवार्य है?',
  'Aadhar verification is required for food providers to ensure authenticity and build trust with customers.',
  'ग्राहकों के साथ प्रामाणिकता और विश्वास बनाने के लिए भोजन प्रदाताओं के लिए आधार सत्यापन आवश्यक है।',
  'provider',
  4
),
(
  'How can I delete my account?',
  'मैं अपना खाता कैसे हटा सकता हूं?',
  'Go to Profile > Settings > Delete Account. Your data will be permanently removed in compliance with privacy regulations.',
  'प्रोफ़ाइल > सेटिंग्स > खाता हटाएं पर जाएं। गोपनीयता नियमों के अनुपालन में आपका डेटा स्थायी रूप से हटा दिया जाएगा।',
  'general',
  5
)
ON CONFLICT DO NOTHING;

-- ====================
-- FUNCTION TO UPDATE PROVIDER RATING
-- ====================
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE providers
  SET
    rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE provider_id = NEW.provider_id),
    total_ratings = (SELECT COUNT(*) FROM reviews WHERE provider_id = NEW.provider_id)
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_provider_rating ON reviews;
CREATE TRIGGER trigger_update_provider_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_provider_rating();

-- ====================
-- FUNCTION TO UPDATE PROVIDER ORDER COUNT
-- ====================
CREATE OR REPLACE FUNCTION update_provider_order_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COMPLETED' THEN
    UPDATE providers
    SET total_orders = total_orders + 1
    WHERE id = NEW.provider_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_count ON orders;
CREATE TRIGGER trigger_update_order_count
AFTER UPDATE OF status ON orders
FOR EACH ROW EXECUTE FUNCTION update_provider_order_count();
