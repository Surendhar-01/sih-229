import { VernacularLanguage, ScrapCategoryItem, CommodityPrice, MatchedRecycler, SafetyAdviceItem } from './VernacularTypes';

export interface VernacularStrings {
  // Common
  appName: string;
  offlineMode: string;
  onlineMode: string;
  selectLanguage: string;

  // Screen 1: Home
  voicePrompt: string;
  voiceListening: string;
  voiceIdentified: string;
  categoryTitle: string;
  categories: {
    battery: string;
    pcb: string;
    cable: string;
    crt: string;
    motor: string;
    mix_plastic: string;
  };

  // Screen 2: Lot Creation
  createLotTitle: string;
  cameraScanHint: string;
  detectedPcb: string;
  detectedCable: string;
  detectedUnknown: string;
  weightSelectTitle: string;
  weightBucket: string;
  weightBasket: string;
  weightSack: string;
  submitLotBtn: string;
  lotCreatedToast: string;

  // Screen 3: Price Board
  priceBoardTitle: string;
  pricePerKgUnit: string;
  priceHistoryLink: string;

  // Screen 4: Recycler Match
  recyclerMatchTitle: string;
  acceptBtn: string;
  distanceUnit: string;
  goodRateBadge: string;
  lowRateBadge: string;

  // Screen 5: Handover Receipt
  handoverReceiptTitle: string;
  lotIdLabel: string;
  materialLabel: string;
  weightLabel: string;
  priceLabel: string;
  timeLabel: string;
  locationLabel: string;
  certifiedStamp: string;

  // Screen 6: Earnings
  earningsTitle: string;
  todayEarnings: string;
  thisWeekEarnings: string;
  pendingPayout: string;
  smsPreviewTitle: string;

  // Screen 7: IVR Helpline
  helplineTitle: string;
  helplinePhoneInstruction: string;
  helplineNumber: string;
  dialpadPrompt: string;
  ivrBtnRate: string;
  ivrBtnRecycler: string;
  ivrBtnSafety: string;

  // Screen 8: Safety
  safetyTitle: string;
  listenSafetyBtn: string;
  safetySpeechText: string;
}

export const VERNACULAR_TRANSLATIONS: Record<VernacularLanguage, VernacularStrings> = {
  hi: {
    appName: 'ई-कचरा साथी',
    offlineMode: 'ऑफलाइन मोड',
    onlineMode: 'ऑनलाइन मोड',
    selectLanguage: 'भाषा चुनें',

    // Screen 1: Home
    voicePrompt: 'बोलकर बताएं - क्या इकट्ठा किया?',
    voiceListening: 'सुन रहे हैं... बोलिए',
    voiceIdentified: 'सामग्री पहचानी गई: ',
    categoryTitle: 'कबाड़ प्रकार चुनें',
    categories: {
      battery: 'बैटरी',
      pcb: 'PCB',
      cable: 'केबल',
      crt: 'CRT',
      motor: 'मोटर',
      mix_plastic: 'मिश्र प्लास्टिक',
    },

    // Screen 2: Lot Creation
    createLotTitle: 'लॉट बनाएं',
    cameraScanHint: 'कैमरे के सामने सामग्री रखें',
    detectedPcb: 'PCB ✓',
    detectedCable: 'केबल ✓',
    detectedUnknown: 'अज्ञात ✗',
    weightSelectTitle: 'वज़न चुनें',
    weightBucket: 'बाल्टी (हल्का)',
    weightBasket: 'थैला (मध्यम)',
    weightSack: 'बोरी (भारी)',
    submitLotBtn: 'लॉट बनाएं',
    lotCreatedToast: 'लॉट सफलतापूर्वक बनाया गया!',

    // Screen 3: Price Board
    priceBoardTitle: 'आज के भाव',
    pricePerKgUnit: '₹/किग्रा',
    priceHistoryLink: 'भावांचा इतिहास पाहण्यासाठी येथे क्लिक करा !',

    // Screen 4: Recycler Match
    recyclerMatchTitle: 'नज़दीकी रीसाइक्लर',
    acceptBtn: 'स्वीकार करें',
    distanceUnit: 'किमी',
    goodRateBadge: 'अच्छा भाव',
    lowRateBadge: 'औसत से कम',

    // Screen 5: Handover Receipt
    handoverReceiptTitle: 'हस्तांतरण रसीद',
    lotIdLabel: 'Lot ID',
    materialLabel: 'Material',
    weightLabel: 'Weight',
    priceLabel: 'Price',
    timeLabel: 'Time',
    locationLabel: 'Location',
    certifiedStamp: '✓ हस्तांतरण पूर्ण - प्रमाणित',

    // Screen 6: Earnings
    earningsTitle: 'मेरी कमाई',
    todayEarnings: 'आज की कमाई',
    thisWeekEarnings: 'इस हफ्ते',
    pendingPayout: 'बाकी भुगतान',
    smsPreviewTitle: 'SMS - 1800-XXX-XXXX',

    // Screen 7: IVR Helpline
    helplineTitle: 'हेल्पलाइन',
    helplinePhoneInstruction: 'किसी भी फोन से भाव जानें:',
    helplineNumber: '1800-XXX-XXXX',
    dialpadPrompt: 'कॉल कनेक्टेड... नंबर दबाएं',
    ivrBtnRate: 'भाव',
    ivrBtnRecycler: 'रीसाइक्लर',
    ivrBtnSafety: 'सुरक्षा',

    // Screen 8: Safety
    safetyTitle: 'सुरक्षा सलाह',
    listenSafetyBtn: 'सुरक्षा सलाह सुनें',
    safetySpeechText:
      'सुरक्षा सलाह ध्यान से सुनें। पहली सलाह: बैटरी को कभी भी आग में न जलाएं, इससे जहरीली गैसें निकलती हैं और विस्फोट का खतरा होता है। दूसरी सलाह: पुराने CRT मॉनिटर को तोड़ने से बचें, इसके कांच और फास्फोरस से फेफड़ों को भारी नुकसान पहुंचता है। दस्ताने और मास्क का प्रयोग करें।',
  },

  mr: {
    appName: 'ई-कचरा साथी',
    offlineMode: 'ऑफलाइन मोड',
    onlineMode: 'ऑनलाइन मोड',
    selectLanguage: 'भाषा निवडा',

    // Screen 1: Home
    voicePrompt: 'बोलून सांगा - काय गोळा केले?',
    voiceListening: 'ऐकत आहे... बोला',
    voiceIdentified: 'साहित्य ओळखले: ',
    categoryTitle: 'भंगार प्रकार निवडा',
    categories: {
      battery: 'बॅटरी',
      pcb: 'PCB',
      cable: 'केबल',
      crt: 'CRT',
      motor: 'मोटर',
      mix_plastic: 'मिश्र प्लास्टिक',
    },

    // Screen 2: Lot Creation
    createLotTitle: 'लॉट तयार करा',
    cameraScanHint: 'कॅमेऱ्यासमोर भंगार धरा',
    detectedPcb: 'PCB ✓',
    detectedCable: 'केबल ✓',
    detectedUnknown: 'अज्ञात ✗',
    weightSelectTitle: 'वजन निवडा',
    weightBucket: 'बादली (हलके)',
    weightBasket: 'पिशवी (मध्यम)',
    weightSack: 'गोणी (जड)',
    submitLotBtn: 'लॉट तयार करा',
    lotCreatedToast: 'लॉट यशस्वीरीत्या तयार झाला!',

    // Screen 3: Price Board
    priceBoardTitle: 'आजचे भाव',
    pricePerKgUnit: '₹/किग्रॅ',
    priceHistoryLink: 'भावांचा इतिहास पाहण्यासाठी येथे क्लिक करा !',

    // Screen 4: Recycler Match
    recyclerMatchTitle: 'जवळचे रीसायकलर',
    acceptBtn: 'स्वीकार करा',
    distanceUnit: 'किमी',
    goodRateBadge: 'चांगला भाव',
    lowRateBadge: 'सरासरीपेक्षा कमी',

    // Screen 5: Handover Receipt
    handoverReceiptTitle: 'हस्तांतरण पावती',
    lotIdLabel: 'Lot ID',
    materialLabel: 'Material',
    weightLabel: 'Weight',
    priceLabel: 'Price',
    timeLabel: 'Time',
    locationLabel: 'Location',
    certifiedStamp: '✓ हस्तांतरण पूर्ण - प्रमाणित',

    // Screen 6: Earnings
    earningsTitle: 'माझी कमाई',
    todayEarnings: 'आजची कमाई',
    thisWeekEarnings: 'या आठवड्यात',
    pendingPayout: 'शिल्लक रक्कम',
    smsPreviewTitle: 'SMS - 1800-XXX-XXXX',

    // Screen 7: IVR Helpline
    helplineTitle: 'हेल्पलाइन',
    helplinePhoneInstruction: 'कोणत्याही फोनवरून भाव जाणून घ्या:',
    helplineNumber: '1800-XXX-XXXX',
    dialpadPrompt: 'कॉल सुरू आहे... क्रमांक दाबा',
    ivrBtnRate: 'भाव',
    ivrBtnRecycler: 'रीसायकलर',
    ivrBtnSafety: 'सुरक्षा',

    // Screen 8: Safety
    safetyTitle: 'सुरक्षा सल्ला',
    listenSafetyBtn: 'सुरक्षा सल्ला ऐका',
    safetySpeechText:
      'सुरक्षा सल्ला काळजीपूर्वक ऐका. पहिला सल्ला: बॅटरी कधीही आगीत जाळू नका, यामुळे विषारी धूर आणि स्फोट होऊ शकतो. दुसरा सल्ला: जुने CRT टीव्ही किंवा मॉनिटर फोडू नका, त्यातील काच आणि विषारी पावडरमुळे आरोग्याला गंभीर धोका होतो. नेहमी हातमोजे वापरा.',
  },

  en: {
    appName: 'E-Waste Sathi',
    offlineMode: 'Offline Mode',
    onlineMode: 'Online Mode',
    selectLanguage: 'Language',

    // Screen 1: Home
    voicePrompt: 'Tell by speaking - What did you collect?',
    voiceListening: 'Listening... speak clearly',
    voiceIdentified: 'Material recognized: ',
    categoryTitle: 'Select Scrap Category',
    categories: {
      battery: 'Battery',
      pcb: 'PCB',
      cable: 'Cable',
      crt: 'CRT',
      motor: 'Motor',
      mix_plastic: 'Mix Plastic',
    },

    // Screen 2: Lot Creation
    createLotTitle: 'Create Lot',
    cameraScanHint: 'Hold item in front of camera',
    detectedPcb: 'PCB ✓',
    detectedCable: 'Cable ✓',
    detectedUnknown: 'Unknown ✗',
    weightSelectTitle: 'Select Weight',
    weightBucket: 'Bucket (Light)',
    weightBasket: 'Basket (Medium)',
    weightSack: 'Sack (Heavy)',
    submitLotBtn: 'Create Lot',
    lotCreatedToast: 'Lot created successfully!',

    // Screen 3: Price Board
    priceBoardTitle: "Today's Rates",
    pricePerKgUnit: '₹/kg',
    priceHistoryLink: 'Click here to view price history trends !',

    // Screen 4: Recycler Match
    recyclerMatchTitle: 'Nearest Recycler',
    acceptBtn: 'Accept & Book',
    distanceUnit: 'km',
    goodRateBadge: 'Best Rate',
    lowRateBadge: 'Below Avg',

    // Screen 5: Handover Receipt
    handoverReceiptTitle: 'Handover Receipt',
    lotIdLabel: 'Lot ID',
    materialLabel: 'Material',
    weightLabel: 'Weight',
    priceLabel: 'Price',
    timeLabel: 'Time',
    locationLabel: 'Location',
    certifiedStamp: '✓ Handover Complete - Certified',

    // Screen 6: Earnings
    earningsTitle: 'My Earnings',
    todayEarnings: "Today's Earning",
    thisWeekEarnings: 'This Week',
    pendingPayout: 'Pending Payout',
    smsPreviewTitle: 'SMS - 1800-XXX-XXXX',

    // Screen 7: IVR Helpline
    helplineTitle: 'IVR Helpline',
    helplinePhoneInstruction: 'Check rates from any basic phone:',
    helplineNumber: '1800-XXX-XXXX',
    dialpadPrompt: 'Call connected... press digit',
    ivrBtnRate: 'Rates',
    ivrBtnRecycler: 'Recycler',
    ivrBtnSafety: 'Safety',

    // Screen 8: Safety
    safetyTitle: 'Safety Advice',
    listenSafetyBtn: 'Listen to Safety Advice',
    safetySpeechText:
      'Listen carefully to safety guidelines. First: Never burn batteries in open fire; this emits lethal toxic fumes and risks explosion. Second: Avoid smashing CRT monitors or TVs; glass implosion and toxic phosphor dust cause severe lung damage. Always wear protective gear.',
  },
};

export const SCRAP_CATEGORIES: ScrapCategoryItem[] = [
  {
    key: 'battery',
    label: { hi: 'बैटरी', mr: 'बॅटरी', en: 'Battery' },
    icon: 'battery',
    defaultRate: 50,
    color: '#16a34a',
    bgLight: '#f0fdf4',
  },
  {
    key: 'pcb',
    label: { hi: 'PCB', mr: 'PCB', en: 'PCB' },
    icon: 'pcb',
    defaultRate: 100,
    color: '#0284c7',
    bgLight: '#f0f9ff',
  },
  {
    key: 'cable',
    label: { hi: 'केबल', mr: 'केबल', en: 'Cable' },
    icon: 'cable',
    defaultRate: 180,
    color: '#059669',
    bgLight: '#ecfdf5',
  },
  {
    key: 'crt',
    label: { hi: 'CRT', mr: 'CRT', en: 'CRT' },
    icon: 'crt',
    defaultRate: 25,
    color: '#4f46e5',
    bgLight: '#eef2ff',
  },
  {
    key: 'motor',
    label: { hi: 'मोटर', mr: 'मोटर', en: 'Motor' },
    icon: 'motor',
    defaultRate: 75,
    color: '#7c3aed',
    bgLight: '#f5f3ff',
  },
  {
    key: 'mix_plastic',
    label: { hi: 'मिश्र प्लास्टिक', mr: 'मिश्र प्लास्टिक', en: 'Mix Plastic' },
    icon: 'mix_plastic',
    defaultRate: 20,
    color: '#0d9488',
    bgLight: '#f0fdfa',
  },
];

export const COMMODITY_PRICES: CommodityPrice[] = [
  {
    key: 'pcb',
    name: { hi: 'PCB', mr: 'PCB', en: 'PCB' },
    priceRange: '₹80–120/kg',
    minPrice: 80,
    maxPrice: 120,
    trendPercent: 6,
    trendDirection: 'up',
    audioText: {
      hi: 'पीसीबी का आज का भाव अस्सी से एक सौ बीस रुपये प्रति किलो है, जो कल से छह प्रतिशत अधिक है।',
      mr: 'पीसीबीचा आजचा भाव ऐंशी ते एकशे वीस रुपये प्रति किलो आहे, जो सहा टक्क्यांनी वाढला आहे.',
      en: 'PCB rate today is eighty to one hundred twenty rupees per kilogram, up six percent.',
    },
  },
  {
    key: 'battery',
    name: { hi: 'Battery', mr: 'बॅटरी', en: 'Battery' },
    priceRange: '₹40–60/kg',
    minPrice: 40,
    maxPrice: 60,
    trendPercent: 3,
    trendDirection: 'down',
    audioText: {
      hi: 'बैटरी का आज का भाव चालीस से साठ रुपये प्रति किलो है, जो तीन प्रतिशत कम हुआ है।',
      mr: 'बॅटरीचा आजचा भाव चाळीस ते साठ रुपये प्रति किलो आहे, तीन टक्क्यांनी घसरला आहे.',
      en: 'Battery rate today is forty to sixty rupees per kilogram, down three percent.',
    },
  },
  {
    key: 'cable',
    name: { hi: 'Cable', mr: 'केबल', en: 'Cable' },
    priceRange: '₹150–210/kg',
    minPrice: 150,
    maxPrice: 210,
    trendPercent: 2,
    trendDirection: 'up',
    audioText: {
      hi: 'केबल का आज का भाव एक सौ पचास से दो सौ दस रुपये प्रति किलो है, जो दो प्रतिशत बढ़ा है।',
      mr: 'केबलचा आजचा भाव दीडशे ते दोनशे दहा रुपये प्रति किलो आहे, दोन टक्के वाढला आहे.',
      en: 'Cable rate today is one hundred fifty to two hundred ten rupees per kilogram, up two percent.',
    },
  },
  {
    key: 'mix_plastic',
    name: { hi: 'Mix Plastic', mr: 'मिश्र प्लास्टिक', en: 'Mix Plastic' },
    priceRange: '₹15–25/kg',
    minPrice: 15,
    maxPrice: 25,
    trendPercent: 1,
    trendDirection: 'down',
    audioText: {
      hi: 'मिश्र प्लास्टिक का आज का भाव पंद्रह से पच्चीस रुपये प्रति किलो है, जो एक प्रतिशत गिरा है।',
      mr: 'मिश्र प्लास्टिकचा आजचा भाव पंधरा ते पंचवीस रुपये प्रति किलो आहे, एक टक्क्याने घसरला आहे.',
      en: 'Mix plastic rate today is fifteen to twenty-five rupees per kilogram, down one percent.',
    },
  },
];

export const MATCHED_RECYCLERS: MatchedRecycler[] = [
  {
    id: 'rec-01',
    name: {
      hi: 'ग्रीन रीसायकल',
      mr: 'ग्रीन रीसायकल',
      en: 'Green Recycle Pvt Ltd',
    },
    distanceKm: 1.2,
    offeredRatePerKg: 112,
    badge: {
      hi: 'अच्छा भाव',
      mr: 'चांगला भाव',
      en: 'Best Rate',
    },
    badgeType: 'good',
    address: 'Sector 4, Industrial Area',
    lat: 19.076,
    lng: 72.8777,
  },
  {
    id: 'rec-02',
    name: {
      hi: 'भारत ई-स्क्रेप',
      mr: 'भारत ई-स्क्रॅप',
      en: 'Bharat E-Scrap Solutions',
    },
    distanceKm: 2.8,
    offeredRatePerKg: 95,
    badge: {
      hi: 'औसत से कम',
      mr: 'सरासरीपेक्षा कमी',
      en: 'Below Avg',
    },
    badgeType: 'low',
    address: 'Gate 2, MIDC Logistics Hub',
    lat: 19.088,
    lng: 72.895,
  },
];

export const SAFETY_ADVICE_ITEMS: SafetyAdviceItem[] = [
  {
    id: 'safe-01',
    type: 'danger',
    title: {
      hi: 'बैटरी को आग में न जलाएं',
      mr: 'बॅटरी आगीत जाळू नका',
      en: 'Do not burn batteries in fire',
    },
    description: {
      hi: 'लिथियम और लेड बैटरी से जहरीली गैसें और विस्फोट का खतरा होता है। इन्हें अलग सुरक्षित बॉक्स में रखें।',
      mr: 'लिथियम आणि लेड बॅटरीमधून विषारी वायू आणि स्फोटाचा धोका असतो. त्या वेगळ्या सुरक्षित पेटीत ठेवा.',
      en: 'Lithium and lead batteries emit toxic fumes and risk explosions. Store them separately in cool dry crates.',
    },
    icon: 'ban',
  },
  {
    id: 'safe-02',
    type: 'warning',
    title: {
      hi: 'CRT तोड़ने से बचें',
      mr: 'CRT फोडणे टाळा',
      en: 'Avoid breaking CRT screens',
    },
    description: {
      hi: 'सीआरटी ग्लास में उच्च वैक्यूम और जहरीला फॉस्फोरस पाउडर होता है। कांच टूटने पर फेफड़ों को भारी नुकसान हो सकता है।',
      mr: 'सीआरटी काचेमध्ये उच्च व्हॅक्यूम आणि विषारी फॉस्फरस पावडर असते. काच फुटल्यास फुप्फुसांना गंभीर इजा होऊ शकते.',
      en: 'CRT tubes have high vacuum and toxic phosphor powder. Smashing releases hazardous dust damaging the lungs.',
    },
    icon: 'alert',
  },
];
