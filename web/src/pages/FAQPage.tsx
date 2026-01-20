import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { useLanguageStore } from '../store/languageStore'

interface FAQItem {
  id: string
  question_en: string
  question_hi: string
  answer_en: string
  answer_hi: string
  category: string
}

// Static FAQ data (in production, fetch from API)
const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question_en: 'What is Jain food?',
    question_hi: 'जैन भोजन क्या है?',
    answer_en: 'Jain food follows the principle of Ahimsa (non-violence). It excludes all root vegetables (onion, garlic, potato, ginger, carrot, radish, etc.), mushrooms, cauliflower, brinjal, and sabudana. The diet adheres to strict vegetarian principles that go beyond typical vegetarian diets.',
    answer_hi: 'जैन भोजन अहिंसा के सिद्धांत का पालन करता है। इसमें सभी कंद-मूल (प्याज, लहसुन, आलू, अदरक, गाजर, मूली आदि), मशरूम, फूलगोभी, बैंगन और साबूदाना शामिल नहीं हैं। यह आहार सख्त शाकाहारी सिद्धांतों का पालन करता है जो सामान्य शाकाहारी आहार से परे हैं।',
    category: 'general',
  },
  {
    id: '2',
    question_en: 'How do I register as a food provider?',
    question_hi: 'मैं भोजन प्रदाता के रूप में कैसे पंजीकरण करूं?',
    answer_en: 'Download the app, select "Food Provider" during registration, enter your phone number, verify with OTP, fill in your business details including address with PIN code, select your provider category (Tiffin Center, Caterer, Bhojnalaya, etc.), and accept the terms & conditions.',
    answer_hi: 'ऐप डाउनलोड करें, पंजीकरण के दौरान "भोजन प्रदाता" चुनें, अपना फोन नंबर दर्ज करें, OTP से सत्यापित करें, पिन कोड सहित पता भरें, अपनी प्रदाता श्रेणी (टिफिन सेंटर, कैटरर, भोजनालय आदि) चुनें और नियम व शर्तें स्वीकार करें।',
    category: 'provider',
  },
  {
    id: '3',
    question_en: 'What categories of food providers can register?',
    question_hi: 'भोजन प्रदाताओं की कौन सी श्रेणियां पंजीकरण कर सकती हैं?',
    answer_en: 'We welcome: Tiffin Centers, Caterers, Bhojnalaya, Restaurants, Bakers, Daily Use Raw Material Providers (homemade spices, besan, atta, aachar), Sodh Khana Providers (for Tyagi Vrittiyo), Home Chefs, and Chauka Bai. You can select multiple categories if applicable.',
    answer_hi: 'हम स्वागत करते हैं: टिफिन सेंटर, कैटरर्स, भोजनालय, रेस्तरां, बेकर्स, दैनिक उपयोग कच्चे माल प्रदाता (घर का बना मसाला, बेसन, आटा, अचार), सोध खाना प्रदाता (त्यागी वृत्तियों के लिए), होम शेफ और चौका बाई। आप एक से अधिक श्रेणी चुन सकते हैं।',
    category: 'provider',
  },
  {
    id: '4',
    question_en: 'Is Aadhar verification mandatory?',
    question_hi: 'क्या आधार सत्यापन अनिवार्य है?',
    answer_en: 'Aadhar verification is required for food providers to ensure authenticity and build trust with customers. Your Aadhar information is securely stored and used only for verification purposes.',
    answer_hi: 'ग्राहकों के साथ प्रामाणिकता और विश्वास बनाने के लिए भोजन प्रदाताओं के लिए आधार सत्यापन आवश्यक है। आपकी आधार जानकारी सुरक्षित रूप से संग्रहीत की जाती है और केवल सत्यापन उद्देश्यों के लिए उपयोग की जाती है।',
    category: 'provider',
  },
  {
    id: '5',
    question_en: 'What food categories can I list?',
    question_hi: 'मैं कौन सी भोजन श्रेणियां सूचीबद्ध कर सकता हूं?',
    answer_en: 'You can list: Daily Use Raw Materials (homemade spices, besan, atta), Bakery Items & Desserts, Icecreams, Sweets, Namkeen & Snacks, Dry Fruits, Jain Tiffin/Thali, Sodh Ka Khana (for Tyagi Vrittiyo ke liye), Sodh Ki Samgri, and Nirvaan Laddu.',
    answer_hi: 'आप सूचीबद्ध कर सकते हैं: दैनिक उपयोग कच्चा माल (घर का बना मसाला, बेसन, आटा), बेकरी आइटम और मिठाइयाँ, आइसक्रीम, मिठाइयाँ, नमकीन और स्नैक्स, सूखे मेवे, जैन टिफिन/थाली, सोध का खाना (त्यागी वृत्तियों के लिए), सोध की सामग्री और निर्वाण लड्डू।',
    category: 'provider',
  },
  {
    id: '6',
    question_en: 'Can I set minimum order quantity for bulk orders?',
    question_hi: 'क्या मैं थोक ऑर्डर के लिए न्यूनतम ऑर्डर मात्रा सेट कर सकता हूं?',
    answer_en: 'Yes! You can enable bulk orders and set minimum quantity requirements. You can also set free delivery thresholds based on order price or delivery distance.',
    answer_hi: 'हाँ! आप थोक ऑर्डर सक्षम कर सकते हैं और न्यूनतम मात्रा आवश्यकताएं सेट कर सकते हैं। आप ऑर्डर मूल्य या डिलीवरी दूरी के आधार पर मुफ्त डिलीवरी थ्रेशोल्ड भी सेट कर सकते हैं।',
    category: 'provider',
  },
  {
    id: '7',
    question_en: 'How can I indicate my availability?',
    question_hi: 'मैं अपनी उपलब्धता कैसे इंगित कर सकता हूं?',
    answer_en: 'You can toggle your availability status daily from your provider dashboard. This helps customers know if you are available to take orders on a particular day.',
    answer_hi: 'आप अपने प्रदाता डैशबोर्ड से रोजाना अपनी उपलब्धता स्थिति टॉगल कर सकते हैं। इससे ग्राहकों को पता चलता है कि आप किसी विशेष दिन ऑर्डर लेने के लिए उपलब्ध हैं या नहीं।',
    category: 'provider',
  },
  {
    id: '8',
    question_en: 'Can I mention if I am on Swiggy or Zomato?',
    question_hi: 'क्या मैं उल्लेख कर सकता हूं कि मैं स्विगी या ज़ोमैटो पर हूं?',
    answer_en: 'Yes, you can indicate if you are available on Swiggy, Zomato, or have your own app. You can also provide a link to your external ordering platform.',
    answer_hi: 'हाँ, आप इंगित कर सकते हैं कि आप स्विगी, ज़ोमैटो पर उपलब्ध हैं या आपका अपना ऐप है। आप अपने बाहरी ऑर्डरिंग प्लेटफॉर्म का लिंक भी प्रदान कर सकते हैं।',
    category: 'provider',
  },
  {
    id: '9',
    question_en: 'How can I search for Jain food providers?',
    question_hi: 'मैं जैन भोजन प्रदाताओं की खोज कैसे कर सकता हूं?',
    answer_en: 'Use the search feature to find providers near you. You can filter by ratings, distance, offers, provider category, and food type. Sort results by highest rated, most ordered, or those with current offers.',
    answer_hi: 'अपने पास प्रदाताओं को खोजने के लिए खोज सुविधा का उपयोग करें। आप रेटिंग, दूरी, ऑफर, प्रदाता श्रेणी और भोजन प्रकार द्वारा फ़िल्टर कर सकते हैं। परिणामों को उच्चतम रेटेड, सबसे अधिक ऑर्डर, या वर्तमान ऑफर वाले द्वारा क्रमबद्ध करें।',
    category: 'customer',
  },
  {
    id: '10',
    question_en: 'How can I leave a review?',
    question_hi: 'मैं समीक्षा कैसे दे सकता हूं?',
    answer_en: 'After your order is completed, you can rate the provider (1-5 stars), write a comment, and even upload photos of the food. Your honest feedback helps other customers and providers improve.',
    answer_hi: 'आपका ऑर्डर पूरा होने के बाद, आप प्रदाता को रेट कर सकते हैं (1-5 स्टार), टिप्पणी लिख सकते हैं और भोजन की फ़ोटो भी अपलोड कर सकते हैं। आपकी ईमानदार प्रतिक्रिया अन्य ग्राहकों और प्रदाताओं को सुधारने में मदद करती है।',
    category: 'customer',
  },
  {
    id: '11',
    question_en: 'How can I delete my account?',
    question_hi: 'मैं अपना खाता कैसे हटा सकता हूं?',
    answer_en: 'Go to Profile > Settings > Delete Account. Your data will be permanently removed in compliance with privacy regulations. This action cannot be undone.',
    answer_hi: 'प्रोफ़ाइल > सेटिंग्स > खाता हटाएं पर जाएं। गोपनीयता नियमों के अनुपालन में आपका डेटा स्थायी रूप से हटा दिया जाएगा। यह क्रिया पूर्ववत नहीं की जा सकती।',
    category: 'general',
  },
  {
    id: '12',
    question_en: 'How can I change the app language?',
    question_hi: 'मैं ऐप भाषा कैसे बदल सकता हूं?',
    answer_en: 'Go to Profile > Settings > Language and select Hindi or English. The entire app interface will switch to your preferred language.',
    answer_hi: 'प्रोफ़ाइल > सेटिंग्स > भाषा पर जाएं और हिंदी या अंग्रेजी चुनें। पूरा ऐप इंटरफ़ेस आपकी पसंदीदा भाषा में बदल जाएगा।',
    category: 'general',
  },
]

function FAQAccordion({ faq, isOpen, onToggle }: { faq: FAQItem; isOpen: boolean; onToggle: () => void }) {
  const { language } = useLanguageStore()

  const question = language === 'hi' ? faq.question_hi : faq.question_en
  const answer = language === 'hi' ? faq.answer_hi : faq.answer_en

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full py-4 flex items-center justify-between text-left"
      >
        <span className="font-medium text-gray-900 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-gray-600 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQPage() {
  const { language, t } = useLanguageStore()
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [openFAQ, setOpenFAQ] = useState<string | null>(null)

  const categories = [
    { id: 'all', label: language === 'hi' ? 'सभी' : 'All' },
    { id: 'general', label: language === 'hi' ? 'सामान्य' : 'General' },
    { id: 'provider', label: language === 'hi' ? 'प्रदाताओं के लिए' : 'For Providers' },
    { id: 'customer', label: language === 'hi' ? 'ग्राहकों के लिए' : 'For Customers' },
  ]

  const filteredFAQs = activeCategory === 'all'
    ? FAQ_DATA
    : FAQ_DATA.filter(faq => faq.category === activeCategory)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{t('faq.title')}</h1>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ List */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm">
          {filteredFAQs.map((faq) => (
            <FAQAccordion
              key={faq.id}
              faq={faq}
              isOpen={openFAQ === faq.id}
              onToggle={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}
            />
          ))}
        </div>

        {/* Help Contact */}
        <div className="mt-8 bg-white rounded-xl p-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">
            {language === 'hi' ? 'क्या आपको अभी भी मदद चाहिए?' : 'Still need help?'}
          </h3>
          <p className="text-gray-600 mb-4">
            {language === 'hi'
              ? 'हमारी सहायता टीम से संपर्क करें'
              : 'Contact our support team'}
          </p>
          <a
            href="mailto:support@getmejainfood.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
          >
            📧 {language === 'hi' ? 'ईमेल करें' : 'Email Us'}
          </a>
        </div>
      </div>
    </div>
  )
}
