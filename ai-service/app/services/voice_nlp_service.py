import re
from typing import Dict, Any, Optional, Tuple
from app.schemas.voice_schemas import VoiceCommandRequest, VoiceCommandResponse, SpokenResponse

class VoiceNLPService:
    """
    Multilingual Natural Language Understanding engine for SIH 229 E-Waste Management.
    Processes native Hindi, Marathi, Hinglish, and English voice commands with semantic
    intent mapping, entity extraction, role-awareness, and natural spoken feedback.
    """

    # Devanagari detection
    DEV_REGEX = re.compile(r'[\u0900-\u097F]')

    # Marathi markers
    MR_MARKERS = ["आहे", "करा", "दाखवा", "उघडा", "पाहिजे", "दर", "नाही", "होय", "माझे", "लॉट्स", "संकलक", "बघा", "सांगा", "कसे", "नवीन"]
    # Hindi markers
    HI_MARKERS = ["है", "करो", "दिखाओ", "खोलो", "चाहिए", "भाव", "नहीं", "हाँ", "मेरे", "कलेक्टर", "बताओ", "कैसे", "नया", "जाओ"]

    # Devanagari digit translation table
    DEV_DIGITS = str.maketrans('०१२३४५६७८९', '0123456789')

    # Material keywords mapping
    MATERIAL_KEYWORDS = {
        "CRT_DISPLAY": ["crt", "monitor", "screen", "tv", "सीआरटी", "मॉनिटर", "स्क्रीन", "टीव्ही", "टीवी", "डिस्प्ले"],
        "PCB_ASSEMBLY": ["pcb", "circuit", "board", "motherboard", "सर्किट", "बोर्ड", "मदरबोर्ड", "इलेक्ट्रॉनिक", "पीसीबी"],
        "LI_BATTERY": ["battery", "lithium", "cell", "बैटरी", "बॅटरी", "लिथियम", "सेल", "पावरबैंक"],
        "CABLES_WIRES": ["cable", "wire", "copper wire", "केबल", "तार", "वायर", "कॉपर वायर"],
        "METALS_COPPER": ["copper", "metal", "तांबा", "तांबे", "तांब्या", "तांब्याचा", "धातु"],
        "PLASTIC_CASING": ["plastic", "casing", "body", "प्लास्टिक", "बॉडी"],
    }

    # Number mapping for Hindi/Marathi words to numbers
    NUMBER_WORDS = {
        "एक": 1, "दोन": 2, "दो": 2, "तीन": 3, "चार": 4, "पाँच": 5, "पाच": 5,
        "सहा": 6, "छह": 6, "सात": 7, "आठ": 8, "नऊ": 9, "नौ": 9, "दहा": 10,
        "दस": 10, "पंधरा": 15, "पंद्रह": 15, "वीस": 20, "बीस": 20, "पंचवीस": 25,
        "पच्चीस": 25, "तीस": 30, "चाळीस": 40, "चालीस": 40, "पन्नास": 50, "पचास": 50,
        "शंभर": 100, "सौ": 100, "हजार": 1000
    }

    @classmethod
    def detect_language(cls, text: str, hinted_lang: str = "en") -> str:
        """Detect whether text is Hindi, Marathi, Hinglish, or English."""
        if cls.DEV_REGEX.search(text):
            mr_count = sum(1 for w in cls.MR_MARKERS if w in text)
            hi_count = sum(1 for w in cls.HI_MARKERS if w in text)
            if mr_count > hi_count:
                return "mr"
            if hi_count > mr_count:
                return "hi"
            return hinted_lang if hinted_lang in ["hi", "mr"] else "hi"
        
        # Latin text: check for Hinglish / Marathi in English letters
        lower = text.lower()
        hinglish_words = ["karo", "dikhao", "kholo", "bhav", "kya", "mera", "batao", "karna", "hai", "jao", "banao", "dakhva", "ughda", "sang"]
        if any(w in lower.split() for w in hinglish_words):
            return hinted_lang if hinted_lang in ["hi", "mr"] else "hi"
        return "en"

    @classmethod
    def extract_weight_entity(cls, text: str) -> Optional[float]:
        """Extract weight in kg from voice command."""
        # Convert Devanagari numerals to standard digits first
        normalized = text.translate(cls.DEV_DIGITS)
        lower = normalized.lower()
        # Direct regex: 25 kg, 25.5 kg, 25 किलो, 25kg
        match = re.search(r'(\d+(?:\.\d+)?)\s*(?:kg|kilo|किलो|किग्रा|केजी)', lower)
        if match:
            return float(match.group(1))
        
        # Numeric words
        for word, val in cls.NUMBER_WORDS.items():
            if word in lower and any(unit in lower for unit in ["kg", "kilo", "किलो", "किग्रा"]):
                return float(val)
        
        # Generic number in context of weight
        if any(w in lower for w in ["वजन", "weight", "वज़न", "माप"]):
            num_match = re.search(r'(\d+(?:\.\d+)?)', lower)
            if num_match:
                return float(num_match.group(1))
        return None

    @classmethod
    def extract_material_entity(cls, text: str) -> Optional[str]:
        """Extract recognized e-waste material type."""
        lower = text.lower()
        for mat_code, keywords in cls.MATERIAL_KEYWORDS.items():
            if any(kw in lower for kw in keywords):
                return mat_code
        return None

    @classmethod
    def parse_command(cls, req: VoiceCommandRequest) -> VoiceCommandResponse:
        """Main NLP semantic command parsing engine."""
        raw_text = req.transcript.strip()
        lang = cls.detect_language(raw_text, req.language)
        lower = raw_text.lower()
        current_route = req.current_route or "/"
        user_role = req.user_role or "GUEST"

        entities: Dict[str, Any] = {}
        weight = cls.extract_weight_entity(raw_text)
        if weight is not None:
            entities["weight_kg"] = weight

        material = cls.extract_material_entity(raw_text)
        if material is not None:
            entities["material_category"] = material

        # -------------------------------------------------------------
        # 1. AUTHENTICATION & LOGIN COMMANDS
        # -------------------------------------------------------------
        if any(w in lower for w in ["login", "sign in", "लॉगिन", "साइन इन", "खाता"]):
            if any(w in lower for w in ["phone", "mobile", "फोन", "मोबाइल", "ओटीपी", "otp"]):
                return VoiceCommandResponse(
                    transcript=raw_text,
                    language_detected=lang,
                    intent="AUTH_NAVIGATION",
                    action="SWITCH_AUTH_PHONE",
                    target_route="/login",
                    entities={"auth_method": "phone"},
                    spoken_response=SpokenResponse(
                        en="Switching to mobile OTP login. Please enter your 10-digit mobile number.",
                        hi="मोबाइल ओटीपी लॉगिन पर स्विच किया जा रहा है। कृपया अपना 10 अंकों का मोबाइल नंबर दर्ज करें।",
                        mr="मोबाइल ओटीपी लॉगिनवर जात आहोत. कृपया आपला 10 अंकी मोबाइल नंबर टाका."
                    )
                )
            if any(w in lower for w in ["google", "गूगल"]):
                return VoiceCommandResponse(
                    transcript=raw_text,
                    language_detected=lang,
                    intent="AUTH_NAVIGATION",
                    action="TRIGGER_GOOGLE_AUTH",
                    target_route="/login",
                    entities={"auth_method": "google"},
                    spoken_response=SpokenResponse(
                        en="Initiating secure login with your Google account.",
                        hi="आपके गूगल खाते के साथ सुरक्षित लॉगिन शुरू किया जा रहा है।",
                        mr="आपल्या Google खात्यासह सुरक्षित लॉगिन सुरू करत आहोत."
                    )
                )
            if any(w in lower for w in ["collector", "कलेक्टर", "कबाड़ी", "संकलक"]):
                return VoiceCommandResponse(
                    transcript=raw_text,
                    language_detected=lang,
                    intent="AUTH_NAVIGATION",
                    action="SELECT_ROLE_LOGIN",
                    target_route="/login",
                    entities={"target_role": "COLLECTION_COLLECTOR"},
                    spoken_response=SpokenResponse(
                        en="Opening Informal Collector login portal.",
                        hi="अनौपचारिक कलेक्टर लॉगिन पोर्टल खोला जा रहा है।",
                        mr="अनौपचारिक संकलक लॉगिन पोर्टल उघडत आहोत."
                    )
                )
            if any(w in lower for w in ["recycler", "रीसायकलर", "रिसायकलर"]):
                return VoiceCommandResponse(
                    transcript=raw_text,
                    language_detected=lang,
                    intent="AUTH_NAVIGATION",
                    action="SELECT_ROLE_LOGIN",
                    target_route="/login",
                    entities={"target_role": "AUTHORIZED_RECYCLER"},
                    spoken_response=SpokenResponse(
                        en="Opening Authorized Recycler login portal.",
                        hi="अधिकृत रीसायकलर लॉगिन पोर्टल खोला जा रहा है।",
                        mr="अधिकृत रीसायकलर लॉगिन पोर्टल उघडत आहोत."
                    )
                )
            if any(w in lower for w in ["admin", "government", "सरकार", "प्रशासन"]):
                return VoiceCommandResponse(
                    transcript=raw_text,
                    language_detected=lang,
                    intent="AUTH_NAVIGATION",
                    action="SELECT_ROLE_LOGIN",
                    target_route="/login",
                    entities={"target_role": "GOVERNMENT_ADMIN"},
                    spoken_response=SpokenResponse(
                        en="Opening CPCB Government Administration sign in.",
                        hi="सीपीसीबी सरकारी प्रशासन लॉगिन खोला जा रहा है।",
                        mr="शासकीय प्रशासकीय लॉगिन पोर्टल उघडत आहोत."
                    )
                )
            return VoiceCommandResponse(
                transcript=raw_text,
                language_detected=lang,
                intent="NAVIGATE",
                action="NAVIGATE_LOGIN",
                target_route="/login",
                spoken_response=SpokenResponse(
                    en="Opening login page. Choose mobile OTP, email, or Google sign in.",
                    hi="लॉगिन पेज खोला जा रहा है। मोबाइल ओटीपी, ईमेल या गूगल चुनें।",
                    mr="लॉगिन पृष्ठ उघडत आहोत. मोबाइल ओटीपी, ईमेल किंवा गुगल निवडा."
                )
            )

        # -------------------------------------------------------------
        # 2. LOGOUT COMMANDS
        # -------------------------------------------------------------
        if any(w in lower for w in ["logout", "sign out", "लॉगआउट", "बाहर निकलो", "बाहेर पडा", "exit"]):
            return VoiceCommandResponse(
                transcript=raw_text,
                language_detected=lang,
                intent="AUTH_NAVIGATION",
                action="LOGOUT_USER",
                target_route="/login",
                spoken_response=SpokenResponse(
                    en="Logging you out safely. Have a productive day!",
                    hi="आपको सुरक्षित रूप से लॉगआउट किया जा रहा है। आपका दिन शुभ हो!",
                    mr="आपणास सुरक्षितपणे लॉगआउट करत आहोत. आपला दिवस शुभ जावो!"
                )
            )

        # -------------------------------------------------------------
        # 3. OTP-RELATED ASSISTANCE
        # -------------------------------------------------------------
        if any(w in lower for w in ["otp", "resend", "दोबारा भेजो", "ओटीपी", "पुन्हा पाठवा", "code"]):
            return VoiceCommandResponse(
                transcript=raw_text,
                language_detected=lang,
                intent="AUTH_NAVIGATION",
                action="RESEND_OTP",
                spoken_response=SpokenResponse(
                    en="Requesting a fresh 6-digit verification code. Please check your SMS.",
                    hi="नया 6 अंकों का सत्यापन कोड भेजा जा रहा है। कृपया अपना एसएमएस देखें।",
                    mr="नवीन 6 अंकी पडताळणी कोड पाठवत आहोत. कृपया आपला एसएमएस तपासा."
                )
            )

        # -------------------------------------------------------------
        # 4. PRICE & MARKET RATE QUERIES
        # -------------------------------------------------------------
        if any(w in lower for w in ["price", "rate", "bhav", "cost", "भाव", "दर", "किंमत", "रेट", "पैसा"]):
            rate_info = {
                "PCB_ASSEMBLY": "₹110 - ₹280 per kg",
                "METALS_COPPER": "₹420 - ₹680 per kg",
                "CRT_DISPLAY": "₹18 - ₹35 per kg",
                "LI_BATTERY": "₹65 - ₹120 per kg",
                "CABLES_WIRES": "₹120 - ₹210 per kg",
            }
            mat = material or "PCB_ASSEMBLY"
            quote = rate_info.get(mat, "₹25 - ₹150 per kg")
            entities["market_rate"] = quote
            return VoiceCommandResponse(
                transcript=raw_text,
                language_detected=lang,
                intent="QUERY_STATUS",
                action="SPOKEN_RATE_QUERY",
                entities=entities,
                spoken_response=SpokenResponse(
                    en=f"Prevailing MSP market rate for {mat.replace('_', ' ')} is {quote}.",
                    hi=f"{mat.replace('_', ' ')} का वर्तमान एमएसपी बाजार भाव {quote} है।",
                    mr=f"{mat.replace('_', ' ')} चा सध्याचा एमएसपी बाजार दर {quote} आहे."
                )
            )

        # -------------------------------------------------------------
        # 5. LOT CREATION & INTAKE ACTIONS
        # -------------------------------------------------------------
        if any(w in lower for w in ["create lot", "new lot", "intake", "नया लॉट", "नवीन लॉट", "कलेक्शन शुरू", "कचरा दर्ज", "लॉट बनाओ", "तयार करा", "लॉट तयार", "नोंदणी"]):
            return VoiceCommandResponse(
                transcript=raw_text,
                language_detected=lang,
                intent="NAVIGATE",
                action="START_LOT_CREATION",
                target_route="/collector/intake",
                entities=entities,
                spoken_response=SpokenResponse(
                    en="Opening lot creation window. Select your e-waste material and weight.",
                    hi="लॉट निर्माण विंडो खोली जा रही है। अपनी ई-वेस्ट सामग्री और वजन चुनें।",
                    mr="लॉट निर्मिती विंडो उघडत आहोत. आपली ई-वेस्ट सामग्री आणि वजन निवडा."
                )
            )

        # -------------------------------------------------------------
        # 6. LOT LIST / MY LOTS NAVIGATION
        # -------------------------------------------------------------
        if any(w in lower for w in ["my lots", "all lots", "lots list", "लॉट्स दिखाओ", "लॉट बघा", "माझे लॉट", "मेरे लॉट"]):
            target = "/collector/intake/lots" if user_role in ["COLLECTION_COLLECTOR", "INFORMAL_AGGREGATOR"] else "/user/lots"
            return VoiceCommandResponse(
                transcript=raw_text,
                language_detected=lang,
                intent="NAVIGATE",
                action="VIEW_LOTS",
                target_route=target,
                spoken_response=SpokenResponse(
                    en="Opening your registered e-waste lots ledger.",
                    hi="आपके पंजीकृत ई-वेस्ट लॉट्स की सूची खोली जा रही है।",
                    mr="आपल्या नोंदणीकृत ई-वेस्ट लॉट्सची यादी उघडत आहोत."
                )
            )

        # -------------------------------------------------------------
        # 7. FIELD APP / VERNACULAR TOUCH APP
        # -------------------------------------------------------------
        if any(w in lower for w in ["field app", "mobile app", "vernacular", "कलेक्टर ऐप", "फील्ड ऐप", "मोबाईल ॲप"]):
            return VoiceCommandResponse(
                transcript=raw_text,
                language_detected=lang,
                intent="NAVIGATE",
                action="OPEN_FIELD_APP",
                target_route="/field-app",
                spoken_response=SpokenResponse(
                    en="Opening vernacular touch and voice field collector application.",
                    hi="स्थानीय भाषा आधारित टच और वॉइस कलेक्टर ऐप खोला जा रहा है।",
                    mr="स्थानिक भाषा टच आणि व्हॉइस कलेक्टर ॲप उघडत आहोत."
                )
            )

        # -------------------------------------------------------------
        # 8. EARNINGS & FINANCE
        # -------------------------------------------------------------
        if any(w in lower for w in ["earning", "earnings", "payout", "balance", "ledger", "कमाई", "पैसे", "बैलेंस", "खाते"]):
            target = "/collector/earnings" if user_role == "COLLECTION_COLLECTOR" else "/recycler/payments"
            return VoiceCommandResponse(
                transcript=raw_text,
                language_detected=lang,
                intent="NAVIGATE",
                action="VIEW_EARNINGS",
                target_route=target,
                spoken_response=SpokenResponse(
                    en="Opening verified earnings and payout settlement ledger.",
                    hi="आपकी सत्यापित कमाई और भुगतान खाता खोला जा रहा है।",
                    mr="आपली पडताळलेली कमाई आणि देयके तपशील उघडत आहोत."
                )
            )

        # -------------------------------------------------------------
        # 9. RECYCLER OPPORTUNITIES & QUOTES
        # -------------------------------------------------------------
        if any(w in lower for w in ["opportunities", "bids", "quotes", "ऑफर", "बोली", "क्वोट"]):
            return VoiceCommandResponse(
                transcript=raw_text,
                language_detected=lang,
                intent="NAVIGATE",
                action="VIEW_OPPORTUNITIES",
                target_route="/recycler/opportunities",
                spoken_response=SpokenResponse(
                    en="Opening high-volume B2B e-waste lot opportunities.",
                    hi="बल्क ई-वेस्ट लॉट अवसर खोले जा रहे हैं।",
                    mr="मोठ्या प्रमाणातील ई-वेस्ट संधी उघडत आहोत."
                )
            )

        # -------------------------------------------------------------
        # 10. RECYCLER HANDOVERS & FORM 6 MANIFESTS
        # -------------------------------------------------------------
        if any(w in lower for w in ["handover", "form 6", "manifest", "रसीद", "हैंडओवर", "फॉर्म 6", "पावती"]):
            return VoiceCommandResponse(
                transcript=raw_text,
                language_detected=lang,
                intent="NAVIGATE",
                action="VIEW_HANDOVERS",
                target_route="/recycler/handovers",
                spoken_response=SpokenResponse(
                    en="Opening CPCB Form 6 digital manifests and transfer receipts.",
                    hi="सीपीसीबी फॉर्म 6 डिजिटल मेनिफेस्ट और रसीदें खोली जा रही हैं।",
                    mr="CPCB फॉर्म 6 डिजिटल मॅनिफेस्ट आणि पावत्या उघडत आहोत."
                )
            )

        # -------------------------------------------------------------
        # 11. DATASETS & AUDIT COMPLIANCE HUB
        # -------------------------------------------------------------
        if any(w in lower for w in ["dataset", "datasets", "compliance", "research", "डेटासेट", "संशोधन"]):
            return VoiceCommandResponse(
                transcript=raw_text,
                language_detected=lang,
                intent="NAVIGATE",
                action="VIEW_DATASETS",
                target_route="/datasets",
                spoken_response=SpokenResponse(
                    en="Opening 7 Structured Datasets and SIH Compliance Hub.",
                    hi="7 संरचित डेटासेट और अनुपालन हब खोला जा रहा है।",
                    mr="7 संरचित डेटासेट आणि संशोधन हब उघडत आहोत."
                )
            )

        # -------------------------------------------------------------
        # 12. GENERAL DASHBOARD NAVIGATION
        # -------------------------------------------------------------
        if any(w in lower for w in ["dashboard", "home", "main", "डैशबोर्ड", "डॅशबोर्ड", "होम"]):
            target = "/collector/dashboard"
            if any(w in lower for w in ["admin", "government", "प्रशासन", "सरकार"]):
                target = "/admin/dashboard"
            elif any(w in lower for w in ["recycler", "रीसायकलर", "रिसायकलर"]):
                target = "/recycler/dashboard"
            elif user_role == "AUTHORIZED_RECYCLER":
                target = "/recycler/dashboard"
            elif user_role == "GOVERNMENT_ADMIN":
                target = "/admin/dashboard"
            return VoiceCommandResponse(
                transcript=raw_text,
                language_detected=lang,
                intent="NAVIGATE",
                action="OPEN_DASHBOARD",
                target_route=target,
                spoken_response=SpokenResponse(
                    en="Navigating to your role dashboard overview.",
                    hi="आपके डैशबोर्ड पर ले जाया जा रहा है।",
                    mr="आपल्या मुख्य डॅशबोर्डवर नेत आहोत."
                )
            )

        # -------------------------------------------------------------
        # 13. CONFIRMATION / ACTION EXECUTION
        # -------------------------------------------------------------
        if any(w in lower for w in ["yes", "confirm", "submit", "हाँ", "होय", "सबमिट", "जमा करो"]):
            return VoiceCommandResponse(
                transcript=raw_text,
                language_detected=lang,
                intent="ACTION_TRIGGER",
                action="EXECUTE_CONFIRMED_ACTION",
                spoken_response=SpokenResponse(
                    en="Confirmation received. Executing verified action.",
                    hi="पुष्टि प्राप्त हुई। कार्रवाई निष्पादित की जा रही है।",
                    mr="पुष्टी मिळाली. कृती पूर्ण केली जात आहे."
                )
            )

        # -------------------------------------------------------------
        # 14. EXPLANATION & HELP QUERIES
        # -------------------------------------------------------------
        if any(w in lower for w in ["what is", "explain", "help", "क्या है", "काय आहे", "मदद"]):
            if "epr" in lower:
                return VoiceCommandResponse(
                    transcript=raw_text,
                    language_detected=lang,
                    intent="QUERY_EXPLANATION",
                    action="EXPLAIN_EPR",
                    spoken_response=SpokenResponse(
                        en="Extended Producer Responsibility (EPR) mandates that electronic manufacturers ensure recycling of end-of-life products through CPCB credits.",
                        hi="विस्तारित निर्माता उत्तरदायित्व (ईपीआर) इलेक्ट्रॉनिक निर्माताओं को सीपीसीबी क्रेडिट के माध्यम से पुराने उत्पादों का पुनर्चक्रण सुनिश्चित करने के लिए बाध्य करता है।",
                        mr="विस्तारित उत्पादक जबाबदारी (EPR) इलेक्ट्रॉनिक्स उत्पादकांना जुन्या उत्पादनांचे सुरक्षित पुनर्वापर सीपीसीबी क्रेडिटद्वारे करण्याचे बंधन घालते."
                    )
                )
            if any(w in lower for w in ["form 6", "manifest", "फॉर्म 6"]):
                return VoiceCommandResponse(
                    transcript=raw_text,
                    language_detected=lang,
                    intent="QUERY_EXPLANATION",
                    action="EXPLAIN_FORM6",
                    spoken_response=SpokenResponse(
                        en="CPCB Form 6 is the official statutory transfer manifest certifying safe chain-of-custody transfer from informal collectors to formal recyclers.",
                        hi="सीपीसीबी फॉर्म 6 आधिकारिक वैधानिक मेनिफेस्ट है जो अनौपचारिक संग्राहकों से अधिकृत रीसायकलर्स को सुरक्षित सामग्री हस्तांतरण प्रमाणित करता है।",
                        mr="CPCB फॉर्म 6 ही अधिकृत वैधानिक पावती आहे जी संकलकांकडून अधिकृत रीसायकलरकडे सुरक्षित हस्तांतरण प्रमाणित करते."
                    )
                )

        # -------------------------------------------------------------
        # 15. DEFAULT SMART FALLBACK
        # -------------------------------------------------------------
        return VoiceCommandResponse(
            transcript=raw_text,
            language_detected=lang,
            intent="GENERAL_QUERY",
            action="VOICE_GUIDANCE",
            spoken_response=SpokenResponse(
                en="I heard your request. You can say 'open lots', 'check prices', 'create lot', or 'show dashboard'.",
                hi="मैंने आपकी बात सुनी। आप 'लॉट्स खोलो', 'भाव बताओ', 'नया लॉट', या 'डैशबोर्ड' कह सकते हैं।",
                mr="मी ऐकले. आपण 'लॉट्स उघडा', 'दर सांगा', 'नवीन लॉट', किंवा 'डॅशबोर्ड' म्हणू शकता."
            )
        )
