import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useLanguageStore } from '../store/languageStore'

interface TermsModalProps {
  isOpen: boolean
  onAccept: () => void
  onClose: () => void
}

const TERMS_CONTENT = {
  en: `परस्परोपग्रहो जीवानाम्

Jain Food in Bharat

"BY JAINS FOR JAINS"

Helping Jains find Jain food nationwide! 🤝 Share your city & get a list of Jain food providers nearby. Supporting jain travelers & local jain businesses alike. 💯

This app is solely for service purposes.

If you are any jain food providers (tiffin centres/caterers/bhojnalaya/restaurants) in India then this platform is made for you kindly read all the terms and conditions and then only register yourself here in this application.

MANDATORY CONDITIONS TO BE MET:

A) All the food providers, please post only jain food options here excluding any root vegetables and other items not aligning with the values of Jainism. Even if you provide them to others and if they are there in your menu then also don't advertise those here atleast as this group promotes jain diet that adheres to the principle of ahinsa.

B) When you use words like Pure Jain food/Jain food then don't write without onion garlic in comments/ads here. It should be without any root vegetables. No onion garlic concept is in hinduism. In Jainism, it is a broader concept. It says no to root vegetables be it onion or garlic or potato or ginger or carrot or raddish or arbi or beetroot, etc. Don't mix these two things. Also don't use mushroom/cauliflower/brinjal/sabudana in preparation if you are using words such as Pure Jain/Jain food.

C) For sweets/dessert providers, don't use the words such as pure jain or jain food if you are using ingredients for preparation like Anjeer/Fig (dry fruit) or Dragon Fruit or silver work.

D) If you are supplying non Jain veg food items also then please don't mention in the app but please mention to the customers specifically that you prepare those items though you not mentioned in the app.

Jai Jinendra`,

  hi: `परस्परोपग्रहो जीवानाम्

भारत में जैन भोजन

"जैनों द्वारा जैनों के लिए"

जैनों को देशभर में जैन भोजन खोजने में मदद करना! 🤝 अपना शहर साझा करें और पास के जैन भोजन प्रदाताओं की सूची प्राप्त करें। जैन यात्रियों और स्थानीय जैन व्यवसायों दोनों का समर्थन। 💯

यह ऐप केवल सेवा उद्देश्यों के लिए है।

यदि आप भारत में कोई भी जैन भोजन प्रदाता (टिफिन सेंटर/कैटरर्स/भोजनालय/रेस्टोरेंट) हैं तो यह प्लेटफॉर्म आपके लिए बना है। कृपया सभी नियम और शर्तें पढ़ें और उसके बाद ही इस एप्लिकेशन में खुद को पंजीकृत करें।

अनिवार्य शर्तें:

क) सभी भोजन प्रदाताओं से अनुरोध है कि कृपया यहां केवल जैन भोजन विकल्प पोस्ट करें, किसी भी कंद-मूल और जैन धर्म के मूल्यों के अनुरूप न होने वाली अन्य वस्तुओं को छोड़कर। यहां तक कि अगर आप उन्हें दूसरों को प्रदान करते हैं और यदि वे आपके मेनू में हैं तो भी कृपया उनका यहां विज्ञापन न करें क्योंकि यह समूह अहिंसा के सिद्धांत का पालन करने वाले जैन आहार को बढ़ावा देता है।

ख) जब आप Pure Jain food/Jain food जैसे शब्दों का उपयोग करते हैं तो यहां टिप्पणियों/विज्ञापनों में बिना प्याज लहसुन न लिखें। यह बिना किसी कंद-मूल के होना चाहिए। बिना प्याज लहसुन की अवधारणा हिंदू धर्म में है। जैन धर्म में, यह एक व्यापक अवधारणा है। यह कंद-मूल को ना कहता है चाहे वह प्याज हो या लहसुन या आलू या अदरक या गाजर या मूली या अरबी या चुकंदर, आदि। इन दोनों बातों को मिलाएं नहीं। साथ ही यदि आप Pure Jain/Jain food जैसे शब्दों का उपयोग कर रहे हैं तो तैयारी में मशरूम/फूलगोभी/बैंगन/साबूदाना का उपयोग न करें।

ग) मिठाई/डेजर्ट प्रदाताओं के लिए, यदि आप तैयारी के लिए अंजीर (सूखा फल) या ड्रैगन फ्रूट या चांदी के वर्क जैसी सामग्री का उपयोग कर रहे हैं तो pure jain या jain food जैसे शब्दों का उपयोग न करें।

घ) यदि आप गैर-जैन शाकाहारी भोजन आइटम भी आपूर्ति कर रहे हैं तो कृपया ऐप में उल्लेख न करें लेकिन कृपया ग्राहकों को विशेष रूप से बताएं कि आप उन आइटम्स को तैयार करते हैं हालांकि आपने ऐप में उल्लेख नहीं किया है।

जय जिनेंद्र`
}

export default function TermsModal({ isOpen, onAccept, onClose }: TermsModalProps) {
  const { language, t } = useLanguageStore()
  const [accepted, setAccepted] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setAccepted(false)
      setScrolledToBottom(false)
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-2xl md:w-full md:max-h-[80vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">{t('terms.title')}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div
              className="flex-1 overflow-y-auto p-6"
              onScroll={handleScroll}
            >
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                  {language === 'hi' ? TERMS_CONTENT.hi : TERMS_CONTENT.en}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
              {!scrolledToBottom && (
                <p className="text-sm text-amber-600 mb-3 text-center">
                  ↓ {t('terms.readCarefully')}
                </p>
              )}

              <label className="flex items-center gap-3 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  disabled={!scrolledToBottom}
                  className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500 disabled:opacity-50"
                />
                <span className={`text-sm ${scrolledToBottom ? 'text-gray-700' : 'text-gray-400'}`}>
                  {t('terms.accept')}
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleAccept}
                  disabled={!accepted}
                  className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  {t('common.continue')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
