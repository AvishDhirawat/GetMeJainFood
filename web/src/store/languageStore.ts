import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Language = 'en' | 'hi'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, replacements?: Record<string, string>) => string
}

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation & Common
    'nav.home': 'Home',
    'nav.search': 'Search',
    'nav.orders': 'Orders',
    'nav.profile': 'Profile',
    'nav.cart': 'Cart',
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.retry': 'Retry',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.continue': 'Continue',
    'common.back': 'Back',
    'common.submit': 'Submit',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.all': 'All',
    'common.yes': 'Yes',
    'common.no': 'No',

    // Auth & Login
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.logout': 'Logout',
    'auth.phone': 'Phone Number',
    'auth.enterPhone': 'Enter 10-digit number',
    'auth.sendOtp': 'Send OTP',
    'auth.verifyOtp': 'Verify OTP',
    'auth.enterOtp': 'Enter 6-digit OTP',
    'auth.otpSent': 'OTP sent successfully!',
    'auth.invalidOtp': 'Invalid OTP. Please try again.',
    'auth.selectRole': 'I am a',
    'auth.foodLover': 'Food Lover',
    'auth.foodProvider': 'Food Provider',

    // Terms & Conditions
    'terms.title': 'Terms & Conditions',
    'terms.accept': 'I accept the Terms & Conditions',
    'terms.mustAccept': 'You must accept the terms to continue',
    'terms.readCarefully': 'Please read the terms carefully before accepting',

    // Home Page
    'home.hero.title': 'Pure Jain Food,',
    'home.hero.subtitle': 'Delivered Fresh',
    'home.hero.description': 'Discover authentic Jain-compliant restaurants, cloud kitchens, and home cooks near you. 100% vegetarian, no root vegetables, no onion, no garlic.',
    'home.search.placeholder': 'Search for restaurants or dishes...',
    'home.findFood': 'Find Food',
    'home.categories': 'What are you looking for?',
    'home.nearby': 'Nearby Restaurants',
    'home.promoted': 'Featured Providers',

    // Provider Categories
    'category.tiffin-center': 'Tiffin Center',
    'category.caterer': 'Caterer',
    'category.bhojnalaya': 'Bhojnalaya',
    'category.restaurant': 'Restaurant',
    'category.baker': 'Baker',
    'category.raw-material': 'Raw Material Provider',
    'category.sodh-khana': 'Sodh Khana Provider',
    'category.home-chef': 'Home Chef',
    'category.chauka-bai': 'Chauka Bai',

    // Food Categories
    'food.raw-materials': 'Daily Use Raw Materials',
    'food.bakery': 'Bakery Items & Desserts',
    'food.sweets': 'Sweets',
    'food.icecream': 'Icecream',
    'food.namkeen': 'Namkeen & Snacks',
    'food.dry-fruits': 'Dry Fruits',
    'food.tiffin-thali': 'Jain Tiffin / Thali',
    'food.sodh-ka-khana': 'Sodh Ka Khana',
    'food.sodh-ki-samgri': 'Sodh Ki Samgri',
    'food.nirvaan-laddu': 'Nirvaan Laddu',

    // Jain Tags
    'tag.sattvic': 'Sattvic',
    'tag.no-root-veggies': 'No Root Vegetables',
    'tag.no-onion-garlic': 'No Onion/Garlic',
    'tag.home-cook': 'Home Cook',
    'tag.cloud-kitchen': 'Cloud Kitchen',
    'tag.hotel': 'Hotel',
    'tag.pure-jain': 'Pure Jain',

    // Search & Filters
    'search.title': 'Search',
    'search.providers': 'Restaurants',
    'search.items': 'Dishes',
    'search.noResults': 'No results found',
    'search.tryDifferent': 'Try a different search or filter',
    'filter.dietary': 'Dietary Preferences',
    'filter.minRating': 'Minimum Rating',
    'filter.maxPrice': 'Maximum Price',
    'filter.jainOnly': 'Jain Food Only',
    'filter.availableNow': 'Available Now',
    'filter.hasOffers': 'Has Offers',
    'filter.reset': 'Reset',
    'filter.apply': 'Apply Filters',
    'sort.distance': 'Distance',
    'sort.rating': 'Highest Rated',
    'sort.orders': 'Most Ordered',
    'sort.offers': 'Offers',

    // Provider
    'provider.verified': 'Verified',
    'provider.aadharVerified': 'Aadhar Verified',
    'provider.promoted': 'Featured',
    'provider.new': 'New',
    'provider.availableOn': 'Also available on',
    'provider.minOrder': 'Min Order: {{qty}} items',
    'provider.bulkOrders': 'Bulk Orders Available',
    'provider.freeDelivery': 'Free delivery above ₹{{price}}',
    'provider.freeDeliveryKm': 'Free delivery within {{km}} km',
    'provider.availableToday': 'Available Today',
    'provider.notAvailableToday': 'Not Available Today',
    'provider.ratings': '{{count}} ratings',
    'provider.orders': '{{count}} orders',

    // Reviews
    'review.title': 'Reviews',
    'review.writeReview': 'Write a Review',
    'review.yourRating': 'Your Rating',
    'review.yourComment': 'Your Comment',
    'review.addPhotos': 'Add Photos',
    'review.submit': 'Submit Review',
    'review.noReviews': 'No reviews yet',
    'review.beFirst': 'Be the first to review!',
    reviews: 'Reviews',
    writeReview: 'Write a Review',
    reviewSubmitted: 'Review submitted successfully!',
    reviewFailed: 'Failed to submit review',
    reviewPlaceholder: 'Share your experience...',
    submitReview: 'Submit Review',
    submitting: 'Submitting...',
    noReviews: 'No reviews yet',
    beFirstToReview: 'Be the first to review this provider!',
    loginToReview: 'Login to leave a review',
    reviewsCount: 'reviews',
    cancel: 'Cancel',

    // Orders
    'order.title': 'Orders',
    'order.noOrders': 'No orders yet',
    'order.individual': 'Individual Order',
    'order.bulk': 'Bulk Order',
    'order.status.CREATED': 'Order Placed',
    'order.status.PENDING_PROVIDER_ACK': 'Awaiting Confirmation',
    'order.status.CONFIRMED': 'Confirmed',
    'order.status.COMPLETED': 'Delivered',
    'order.status.CANCELLED': 'Cancelled',

    // Profile
    'profile.title': 'Profile',
    'profile.personalInfo': 'Personal Information',
    'profile.dietaryPrefs': 'Jain Dietary Preferences',
    'profile.strictJain': 'Strict Jain',
    'profile.noRootVeggies': 'No Root Vegetables',
    'profile.sattvicOnly': 'Sattvic Only',
    'profile.notifications': 'Push Notifications',
    'profile.language': 'Language',
    'profile.deleteAccount': 'Delete Account',

    // Provider Onboarding
    'onboarding.title': 'Become a Provider',
    'onboarding.subtitle': 'Join our Jain food community',
    'onboarding.businessDetails': 'Business Details',
    'onboarding.businessName': 'Business Name',
    'onboarding.address': 'Address',
    'onboarding.pinCode': 'PIN Code',
    'onboarding.location': 'Location',
    'onboarding.useCurrentLocation': 'Use Current Location',
    'onboarding.providerCategory': 'Provider Category',
    'onboarding.foodCategories': 'Food Categories',
    'onboarding.foodType': 'Food Type',
    'onboarding.selectAll': 'Select all that apply',
    'onboarding.aadharVerification': 'Aadhar Verification',
    'onboarding.aadharNumber': 'Aadhar Number',
    'onboarding.deliverySettings': 'Delivery Settings',
    'onboarding.minOrderQty': 'Minimum Order Quantity',
    'onboarding.bulkOrders': 'Accept Bulk Orders',
    'onboarding.freeDeliveryPrice': 'Free Delivery (Min Price)',
    'onboarding.freeDeliveryKm': 'Free Delivery (Max Distance in KM)',
    'onboarding.externalPlatforms': 'External Platforms',
    'onboarding.externalAppLink': 'Your App Link',

    // FAQ
    'faq.title': 'Frequently Asked Questions',
    'faq.general': 'General',
    'faq.provider': 'For Providers',
    'faq.customer': 'For Customers',

    // Help
    'help.title': 'Help & Support',
    'help.email': 'Email Support',
    'help.contactUs': 'Contact Us',
  },
  hi: {
    // Navigation & Common
    'nav.home': 'होम',
    'nav.search': 'खोजें',
    'nav.orders': 'ऑर्डर',
    'nav.profile': 'प्रोफ़ाइल',
    'nav.cart': 'कार्ट',
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'कुछ गलत हो गया',
    'common.retry': 'पुनः प्रयास करें',
    'common.save': 'सहेजें',
    'common.cancel': 'रद्द करें',
    'common.continue': 'जारी रखें',
    'common.back': 'वापस',
    'common.submit': 'जमा करें',
    'common.close': 'बंद करें',
    'common.search': 'खोजें',
    'common.filter': 'फ़िल्टर',
    'common.sort': 'क्रमबद्ध करें',
    'common.all': 'सभी',
    'common.yes': 'हाँ',
    'common.no': 'नहीं',

    // Auth & Login
    'auth.login': 'लॉगिन',
    'auth.signup': 'साइन अप',
    'auth.logout': 'लॉगआउट',
    'auth.phone': 'फ़ोन नंबर',
    'auth.enterPhone': '10 अंकों का नंबर दर्ज करें',
    'auth.sendOtp': 'OTP भेजें',
    'auth.verifyOtp': 'OTP सत्यापित करें',
    'auth.enterOtp': '6 अंकों का OTP दर्ज करें',
    'auth.otpSent': 'OTP सफलतापूर्वक भेजा गया!',
    'auth.invalidOtp': 'अमान्य OTP। कृपया पुनः प्रयास करें।',
    'auth.selectRole': 'मैं हूं',
    'auth.foodLover': 'भोजन प्रेमी',
    'auth.foodProvider': 'भोजन प्रदाता',

    // Terms & Conditions
    'terms.title': 'नियम और शर्तें',
    'terms.accept': 'मैं नियम और शर्तें स्वीकार करता/करती हूं',
    'terms.mustAccept': 'जारी रखने के लिए आपको शर्तें स्वीकार करनी होंगी',
    'terms.readCarefully': 'कृपया स्वीकार करने से पहले शर्तों को ध्यान से पढ़ें',

    // Home Page
    'home.hero.title': 'शुद्ध जैन भोजन,',
    'home.hero.subtitle': 'ताज़ा डिलीवरी',
    'home.hero.description': 'अपने पास प्रामाणिक जैन-अनुपालक रेस्तरां, क्लाउड किचन और होम कुक खोजें। 100% शाकाहारी, कोई कंद-मूल नहीं, कोई प्याज नहीं, कोई लहसुन नहीं।',
    'home.search.placeholder': 'रेस्तरां या व्यंजन खोजें...',
    'home.findFood': 'भोजन खोजें',
    'home.categories': 'आप क्या खोज रहे हैं?',
    'home.nearby': 'पास के रेस्तरां',
    'home.promoted': 'विशेष प्रदाता',

    // Provider Categories
    'category.tiffin-center': 'टिफिन सेंटर',
    'category.caterer': 'कैटरर',
    'category.bhojnalaya': 'भोजनालय',
    'category.restaurant': 'रेस्टोरेंट',
    'category.baker': 'बेकर',
    'category.raw-material': 'कच्चा माल प्रदाता',
    'category.sodh-khana': 'सोध खाना प्रदाता',
    'category.home-chef': 'होम शेफ',
    'category.chauka-bai': 'चौका बाई',

    // Food Categories
    'food.raw-materials': 'दैनिक उपयोग कच्चा माल',
    'food.bakery': 'बेकरी आइटम और मिठाइयाँ',
    'food.sweets': 'मिठाइयाँ',
    'food.icecream': 'आइसक्रीम',
    'food.namkeen': 'नमकीन और स्नैक्स',
    'food.dry-fruits': 'सूखे मेवे',
    'food.tiffin-thali': 'जैन टिफिन / थाली',
    'food.sodh-ka-khana': 'सोध का खाना',
    'food.sodh-ki-samgri': 'सोध की सामग्री',
    'food.nirvaan-laddu': 'निर्वाण लड्डू',

    // Jain Tags
    'tag.sattvic': 'सात्विक',
    'tag.no-root-veggies': 'कोई कंद-मूल नहीं',
    'tag.no-onion-garlic': 'कोई प्याज/लहसुन नहीं',
    'tag.home-cook': 'होम कुक',
    'tag.cloud-kitchen': 'क्लाउड किचन',
    'tag.hotel': 'होटल',
    'tag.pure-jain': 'शुद्ध जैन',

    // Search & Filters
    'search.title': 'खोज',
    'search.providers': 'रेस्तरां',
    'search.items': 'व्यंजन',
    'search.noResults': 'कोई परिणाम नहीं मिला',
    'search.tryDifferent': 'कोई अलग खोज या फ़िल्टर आज़माएं',
    'filter.dietary': 'आहार प्राथमिकताएं',
    'filter.minRating': 'न्यूनतम रेटिंग',
    'filter.maxPrice': 'अधिकतम मूल्य',
    'filter.jainOnly': 'केवल जैन भोजन',
    'filter.availableNow': 'अभी उपलब्ध',
    'filter.hasOffers': 'ऑफ़र उपलब्ध',
    'filter.reset': 'रीसेट',
    'filter.apply': 'फ़िल्टर लागू करें',
    'sort.distance': 'दूरी',
    'sort.rating': 'उच्चतम रेटिंग',
    'sort.orders': 'सबसे ज्यादा ऑर्डर',
    'sort.offers': 'ऑफ़र',

    // Provider
    'provider.verified': 'सत्यापित',
    'provider.aadharVerified': 'आधार सत्यापित',
    'provider.promoted': 'विशेष',
    'provider.new': 'नया',
    'provider.availableOn': 'यहाँ भी उपलब्ध',
    'provider.minOrder': 'न्यूनतम ऑर्डर: {{qty}} आइटम',
    'provider.bulkOrders': 'थोक ऑर्डर उपलब्ध',
    'provider.freeDelivery': '₹{{price}} से ऊपर मुफ्त डिलीवरी',
    'provider.freeDeliveryKm': '{{km}} किमी के भीतर मुफ्त डिलीवरी',
    'provider.availableToday': 'आज उपलब्ध',
    'provider.notAvailableToday': 'आज उपलब्ध नहीं',
    'provider.ratings': '{{count}} रेटिंग',
    'provider.orders': '{{count}} ऑर्डर',

    // Reviews
    'review.title': 'समीक्षाएं',
    'review.writeReview': 'समीक्षा लिखें',
    'review.yourRating': 'आपकी रेटिंग',
    'review.yourComment': 'आपकी टिप्पणी',
    'review.addPhotos': 'फ़ोटो जोड़ें',
    'review.submit': 'समीक्षा जमा करें',
    'review.noReviews': 'अभी तक कोई समीक्षा नहीं',
    'review.beFirst': 'पहले समीक्षा करने वाले बनें!',
    reviews: 'समीक्षाएं',
    writeReview: 'समीक्षा लिखें',
    reviewSubmitted: 'समीक्षा सफलतापूर्वक जमा की गई!',
    reviewFailed: 'समीक्षा जमा करने में विफल',
    reviewPlaceholder: 'अपना अनुभव साझा करें...',
    submitReview: 'समीक्षा जमा करें',
    submitting: 'जमा हो रहा है...',
    noReviews: 'अभी तक कोई समीक्षा नहीं',
    beFirstToReview: 'इस प्रदाता की पहली समीक्षा करें!',
    loginToReview: 'समीक्षा देने के लिए लॉगिन करें',
    reviewsCount: 'समीक्षाएं',
    cancel: 'रद्द करें',

    // Orders
    'order.title': 'ऑर्डर',
    'order.noOrders': 'अभी तक कोई ऑर्डर नहीं',
    'order.individual': 'व्यक्तिगत ऑर्डर',
    'order.bulk': 'थोक ऑर्डर',
    'order.status.CREATED': 'ऑर्डर प्लेस किया गया',
    'order.status.PENDING_PROVIDER_ACK': 'पुष्टि की प्रतीक्षा',
    'order.status.CONFIRMED': 'पुष्टि हो गई',
    'order.status.COMPLETED': 'डिलीवर हो गया',
    'order.status.CANCELLED': 'रद्द कर दिया गया',

    // Profile
    'profile.title': 'प्रोफ़ाइल',
    'profile.personalInfo': 'व्यक्तिगत जानकारी',
    'profile.dietaryPrefs': 'जैन आहार प्राथमिकताएं',
    'profile.strictJain': 'कड़ा जैन',
    'profile.noRootVeggies': 'कोई कंद-मूल नहीं',
    'profile.sattvicOnly': 'केवल सात्विक',
    'profile.notifications': 'पुश नोटिफिकेशन',
    'profile.language': 'भाषा',
    'profile.deleteAccount': 'खाता हटाएं',

    // Provider Onboarding
    'onboarding.title': 'प्रदाता बनें',
    'onboarding.subtitle': 'हमारे जैन भोजन समुदाय में शामिल हों',
    'onboarding.businessDetails': 'व्यवसाय विवरण',
    'onboarding.businessName': 'व्यवसाय का नाम',
    'onboarding.address': 'पता',
    'onboarding.pinCode': 'पिन कोड',
    'onboarding.location': 'स्थान',
    'onboarding.useCurrentLocation': 'वर्तमान स्थान का उपयोग करें',
    'onboarding.providerCategory': 'प्रदाता श्रेणी',
    'onboarding.foodCategories': 'भोजन श्रेणियां',
    'onboarding.foodType': 'भोजन का प्रकार',
    'onboarding.selectAll': 'सभी लागू विकल्प चुनें',
    'onboarding.aadharVerification': 'आधार सत्यापन',
    'onboarding.aadharNumber': 'आधार नंबर',
    'onboarding.deliverySettings': 'डिलीवरी सेटिंग्स',
    'onboarding.minOrderQty': 'न्यूनतम ऑर्डर मात्रा',
    'onboarding.bulkOrders': 'थोक ऑर्डर स्वीकार करें',
    'onboarding.freeDeliveryPrice': 'मुफ्त डिलीवरी (न्यूनतम मूल्य)',
    'onboarding.freeDeliveryKm': 'मुफ्त डिलीवरी (अधिकतम दूरी किमी में)',
    'onboarding.externalPlatforms': 'बाहरी प्लेटफॉर्म',
    'onboarding.externalAppLink': 'आपका ऐप लिंक',

    // FAQ
    'faq.title': 'अक्सर पूछे जाने वाले प्रश्न',
    'faq.general': 'सामान्य',
    'faq.provider': 'प्रदाताओं के लिए',
    'faq.customer': 'ग्राहकों के लिए',

    // Help
    'help.title': 'सहायता और समर्थन',
    'help.email': 'ईमेल समर्थन',
    'help.contactUs': 'संपर्क करें',
  },
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',

      setLanguage: (lang: Language) => set({ language: lang }),

      t: (key: string, replacements?: Record<string, string>) => {
        const { language } = get()
        let text = translations[language][key] || translations['en'][key] || key

        // Handle replacements like {{count}}
        if (replacements) {
          Object.entries(replacements).forEach(([k, v]) => {
            text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v)
          })
        }

        return text
      },
    }),
    {
      name: 'language-storage',
    }
  )
)
