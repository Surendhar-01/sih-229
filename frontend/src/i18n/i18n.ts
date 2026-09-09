import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: 'India E-Waste DPI',
      roles: {
        USER: 'Citizen / Consumer',
        INFORMAL_AGGREGATOR: 'Informal Aggregator (Yard)',
        COLLECTION_COLLECTOR: 'Collection Agent (Field)',
        AUTHORIZED_RECYCLER: 'Authorized Recycler',
        GOVERNMENT_ADMIN: 'Government Admin',
      },
      nav: {
        dashboard: 'Dashboard',
        logout: 'Sign Out',
        status: 'Connection Status',
      },
      common: {
        online: 'System Online',
        offline: 'Offline Mode',
        loading: 'Connecting...',
      },
    },
  },
  hi: {
    translation: {
      appName: 'भारत ई-कचरा डिजिटल मंच',
      roles: {
        USER: 'नागरिक / उपभोक्ता',
        INFORMAL_AGGREGATOR: 'कचरा एग्रीगेटर (गोदाम)',
        COLLECTION_COLLECTOR: 'संग्रह एजेंट (कबाड़ीवाला)',
        AUTHORIZED_RECYCLER: 'अधिकृत पुनर्चक्रणकर्ता',
        GOVERNMENT_ADMIN: 'सरकारी प्रशासक',
      },
      nav: {
        dashboard: 'डैशबोर्ड',
        logout: 'लॉग आउट',
        status: 'सिस्टम स्थिति',
      },
      common: {
        online: 'सिस्टम ऑनलाइन',
        offline: 'ऑफलाइन मोड',
        loading: 'कनेक्ट हो रहा है...',
      },
    },
  },
  mr: {
    translation: {
      appName: 'भारत ई-कचरा व्यवस्थापन',
      roles: {
        USER: 'नागरिक / ग्राहक',
        INFORMAL_AGGREGATOR: 'कचरा एकत्रितकर्ता (गोदाम)',
        COLLECTION_COLLECTOR: 'संकलक एजंट (कबाडीवाला)',
        AUTHORIZED_RECYCLER: 'अधिकृत पुनर्वापरकर्ता',
        GOVERNMENT_ADMIN: 'सरकारी प्रशासक',
      },
      nav: {
        dashboard: 'डॅशबोर्ड',
        logout: 'लॉग आऊट',
        status: 'प्रणाली स्थिती',
      },
      common: {
        online: 'प्रणाली कार्यरत',
        offline: 'ऑफलाइन मोड',
        loading: 'जोडणी होत आहे...',
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('ewaste_lang') || 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
