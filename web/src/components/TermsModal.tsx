import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useLanguageStore } from '../store/languageStore'

interface TermsModalProps {
  isOpen: boolean
  onAccept: () => void
  onClose: () => void
  userType?: 'buyer' | 'provider'
}

// Provider-specific terms
const PROVIDER_TERMS_CONTENT = {
  en: `परस्परोपग्रहो जीवानाम्

Jain Food in Bharat - PROVIDER TERMS & CONDITIONS

"BY JAINS FOR JAINS"

Helping Jains find Jain food nationwide! 🤝 Share your city & get a list of Jain food providers nearby. Supporting jain travelers & local jain businesses alike. 💯

This app is solely for service purposes.

If you are any jain food providers (tiffin centres/caterers/bhojnalaya/restaurants) in India then this platform is made for you kindly read all the terms and conditions and then only register yourself here in this application.

MANDATORY CONDITIONS TO BE MET:

A) All the food providers, please post only jain food options here excluding any root vegetables and other items not aligning with the values of Jainism. Even if you provide them to others and if they are there in your menu then also don't advertise those here atleast as this group promotes jain diet that adheres to the principle of ahinsa.

B) When you use words like Pure Jain food/Jain food then don't write without onion garlic in comments/ads here. It should be without any root vegetables. No onion garlic concept is in hinduism. In Jainism, it is a broader concept. It says no to root vegetables be it onion or garlic or potato or ginger or carrot or raddish or arbi or beetroot, etc. Don't mix these two things. Also don't use mushroom/cauliflower/brinjal/sabudana in preparation if you are using words such as Pure Jain/Jain food.

C) For sweets/dessert providers, don't use the words such as pure jain or jain food if you are using ingredients for preparation like Anjeer/Fig (dry fruit) or Dragon Fruit or silver work.

D) If you are supplying non Jain veg food items also then please don't mention in the app but please mention to the customers specifically that you prepare those items though you not mentioned in the app.

E) Providers are responsible for maintaining food quality and hygiene standards.

F) Providers must respond to customer inquiries and orders in a timely manner.

G) Any violation of these terms may result in account suspension or termination.

Jai Jinendra`,

  hi: `परस्परोपग्रहो जीवानाम्

भारत में जैन भोजन - प्रदाता नियम और शर्तें

"जैनों द्वारा जैनों के लिए"

जैनों को देशभर में जैन भोजन खोजने में मदद करना! 🤝 अपना शहर साझा करें और पास के जैन भोजन प्रदाताओं की सूची प्राप्त करें। जैन यात्रियों और स्थानीय जैन व्यवसायों दोनों का समर्थन। 💯

यह ऐप केवल सेवा उद्देश्यों के लिए है।

यदि आप भारत में कोई भी जैन भोजन प्रदाता (टिफिन सेंटर/कैटरर्स/भोजनालय/रेस्टोरेंट) हैं तो यह प्लेटफॉर्म आपके लिए बना है। कृपया सभी नियम और शर्तें पढ़ें और उसके बाद ही इस एप्लिकेशन में खुद को पंजीकृत करें।

अनिवार्य शर्तें:

क) सभी भोजन प्रदाताओं से अनुरोध है कि कृपया यहां केवल जैन भोजन विकल्प पोस्ट करें, किसी भी कंद-मूल और जैन धर्म के मूल्यों के अनुरूप न होने वाली अन्य वस्तुओं को छोड़कर। यहां तक कि अगर आप उन्हें दूसरों को प्रदान करते हैं और यदि वे आपके मेनू में हैं तो भी कृपया उनका यहां विज्ञापन न करें क्योंकि यह समूह अहिंसा के सिद्धांत का पालन करने वाले जैन आहार को बढ़ावा देता है।

ख) जब आप Pure Jain food/Jain food जैसे शब्दों का उपयोग करते हैं तो यहां टिप्पणियों/विज्ञापनों में बिना प्याज लहसुन न लिखें। यह बिना किसी कंद-मूल के होना चाहिए। बिना प्याज लहसुन की अवधारणा हिंदू धर्म में है। जैन धर्म में, यह एक व्यापक अवधारणा है। यह कंद-मूल को ना कहता है चाहे वह प्याज हो या लहसुन या आलू या अदरक या गाजर या मूली या अरबी या चुकंदर, आदि। इन दोनों बातों को मिलाएं नहीं। साथ ही यदि आप Pure Jain/Jain food जैसे शब्दों का उपयोग कर रहे हैं तो तैयारी में मशरूम/फूलगोभी/बैंगन/साबूदाना का उपयोग न करें।

ग) मिठाई/डेजर्ट प्रदाताओं के लिए, यदि आप तैयारी के लिए अंजीर (सूखा फल) या ड्रैगन फ्रूट या चांदी के वर्क जैसी सामग्री का उपयोग कर रहे हैं तो pure jain या jain food जैसे शब्दों का उपयोग न करें।

घ) यदि आप गैर-जैन शाकाहारी भोजन आइटम भी आपूर्ति कर रहे हैं तो कृपया ऐप में उल्लेख न करें लेकिन कृपया ग्राहकों को विशेष रूप से बताएं कि आप उन आइटम्स को तैयार करते हैं हालांकि आपने ऐप में उल्लेख नहीं किया है।

ङ) प्रदाता खाद्य गुणवत्ता और स्वच्छता मानकों को बनाए रखने के लिए जिम्मेदार हैं।

च) प्रदाताओं को ग्राहक पूछताछ और ऑर्डर का समय पर जवाब देना चाहिए।

छ) इन शर्तों का कोई भी उल्लंघन खाता निलंबन या समाप्ति में परिणामित हो सकता है।

जय जिनेंद्र`
}

// User/Buyer-specific terms
const USER_TERMS_CONTENT = {
  en: `परस्परोपग्रहो जीवानाम्

Jain Food in Bharat - USER TERMS & CONDITIONS

"BY JAINS FOR JAINS"

Welcome to our Jain Food community! 🙏

By registering as a user, you agree to the following terms:

1. COMMUNITY GUIDELINES
   - This platform is dedicated to connecting Jains with authentic Jain food providers
   - Please be respectful to providers and other community members
   - Report any non-Jain food items or inappropriate content

2. USER RESPONSIBILITIES
   - Provide accurate contact information for order delivery
   - Make timely payments for orders placed
   - Cancel orders only when necessary and with proper notice
   - Leave honest and fair reviews based on your experience

3. JAIN FOOD PRINCIPLES
   - Food listed on this platform should exclude all root vegetables (onion, garlic, potato, ginger, carrot, radish, etc.)
   - Pure Jain food adheres to the principles of Ahimsa (non-violence)
   - If you find any provider violating these principles, please report them

4. PRIVACY & DATA
   - Your phone number is used for account verification and order communication
   - We respect your privacy and do not share your data with third parties
   - You can request deletion of your account at any time

5. DISCLAIMER
   - We facilitate connections between users and providers
   - Quality of food and service is the responsibility of individual providers
   - We are not liable for any disputes between users and providers

By accepting these terms, you become part of a community that supports Jain food culture and local Jain businesses.

Jai Jinendra 🙏`,

  hi: `परस्परोपग्रहो जीवानाम्

भारत में जैन भोजन - उपयोगकर्ता नियम और शर्तें

"जैनों द्वारा जैनों के लिए"

हमारे जैन भोजन समुदाय में आपका स्वागत है! 🙏

उपयोगकर्ता के रूप में पंजीकरण करके, आप निम्नलिखित शर्तों से सहमत हैं:

1. समुदाय दिशानिर्देश
   - यह प्लेटफॉर्म जैनों को प्रामाणिक जैन भोजन प्रदाताओं से जोड़ने के लिए समर्पित है
   - कृपया प्रदाताओं और अन्य समुदाय के सदस्यों के प्रति सम्मान रखें
   - किसी भी गैर-जैन भोजन आइटम या अनुचित सामग्री की रिपोर्ट करें

2. उपयोगकर्ता की जिम्मेदारियां
   - ऑर्डर डिलीवरी के लिए सही संपर्क जानकारी प्रदान करें
   - दिए गए ऑर्डर के लिए समय पर भुगतान करें
   - केवल आवश्यक होने पर और उचित सूचना के साथ ऑर्डर रद्द करें
   - अपने अनुभव के आधार पर ईमानदार और निष्पक्ष समीक्षा दें

3. जैन भोजन सिद्धांत
   - इस प्लेटफॉर्म पर सूचीबद्ध भोजन में सभी कंद-मूल (प्याज, लहसुन, आलू, अदरक, गाजर, मूली, आदि) शामिल नहीं होने चाहिए
   - शुद्ध जैन भोजन अहिंसा के सिद्धांतों का पालन करता है
   - यदि आप किसी प्रदाता को इन सिद्धांतों का उल्लंघन करते पाते हैं, तो कृपया उनकी रिपोर्ट करें

4. गोपनीयता और डेटा
   - आपका फोन नंबर खाता सत्यापन और ऑर्डर संचार के लिए उपयोग किया जाता है
   - हम आपकी गोपनीयता का सम्मान करते हैं और आपका डेटा तीसरे पक्षों के साथ साझा नहीं करते
   - आप किसी भी समय अपने खाते को हटाने का अनुरोध कर सकते हैं

5. अस्वीकरण
   - हम उपयोगकर्ताओं और प्रदाताओं के बीच कनेक्शन की सुविधा प्रदान करते हैं
   - भोजन और सेवा की गुणवत्ता व्यक्तिगत प्रदाताओं की जिम्मेदारी है
   - उपयोगकर्ताओं और प्रदाताओं के बीच किसी भी विवाद के लिए हम उत्तरदायी नहीं हैं

इन शर्तों को स्वीकार करके, आप एक ऐसे समुदाय का हिस्सा बन जाते हैं जो जैन भोजन संस्कृति और स्थानीय जैन व्यवसायों का समर्थन करता है।

जय जिनेंद्र 🙏`
}

export default function TermsModal({ isOpen, onAccept, onClose, userType = 'buyer' }: TermsModalProps) {
  const { language, t } = useLanguageStore()
  const [accepted, setAccepted] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Select appropriate terms based on user type
  const termsContent = userType === 'provider' ? PROVIDER_TERMS_CONTENT : USER_TERMS_CONTENT
  const termsTitle = userType === 'provider'
    ? (language === 'hi' ? 'प्रदाता नियम और शर्तें' : 'Provider Terms & Conditions')
    : (language === 'hi' ? 'उपयोगकर्ता नियम और शर्तें' : 'User Terms & Conditions')

  useEffect(() => {
    if (!isOpen) {
      setAccepted(false)
      setScrolledToBottom(false)
    }
  }, [isOpen])

  // Check if content is scrollable and if already at bottom on mount
  useEffect(() => {
    if (isOpen && contentRef.current) {
      const el = contentRef.current
      // If content is not scrollable (fits in view), allow acceptance immediately
      if (el.scrollHeight <= el.clientHeight + 10) {
        setScrolledToBottom(true)
      }
    }
  }, [isOpen])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50
    if (isAtBottom) {
      setScrolledToBottom(true)
    }
  }

  const handleAccept = () => {
    if (accepted) {
      onAccept()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b bg-white">
              <h2 className="text-xl font-bold text-gray-900">{termsTitle}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6"
              onScroll={handleScroll}
              style={{ minHeight: '200px', maxHeight: 'calc(90vh - 250px)' }}
            >
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed text-sm sm:text-base">
                  {language === 'hi' ? termsContent.hi : termsContent.en}
                </div>
              </div>
            </div>

            {/* Footer - Always visible */}
            <div className="flex-shrink-0 p-4 border-t bg-gray-50">
              {!scrolledToBottom && (
                <p className="text-sm text-amber-600 mb-3 text-center animate-bounce">
                  ↓ {t('terms.readCarefully')} ↓
                </p>
              )}

              <label className="flex items-center gap-3 mb-4 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  disabled={!scrolledToBottom}
                  className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className={`text-sm ${scrolledToBottom ? 'text-gray-700' : 'text-gray-400'}`}>
                  {t('terms.accept')}
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleAccept}
                  disabled={!accepted}
                  className="flex-1 py-3 px-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>{t('common.continue')}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
