// App Logic for Nayan-Bharat

// --- AWS Configuration Stub ---
const AWS_CONFIG = {
    COGNITO_USER_POOL_ID: 'ap-south-1_XXXXX',
    COGNITO_CLIENT_ID: 'xxxxxxxxxxxxxxxxx',
    API_GATEWAY_URL: 'https://t4ctasdm38.execute-api.ap-south-1.amazonaws.com',
    S3_BUCKET_NAME: 'nayan-bharat-fundus-images'
};

let mobilenetModel = null;
let isModelLoading = false;

async function loadAIModel() {
    if (mobilenetModel || isModelLoading) return;
    try {
        isModelLoading = true;
        console.log('Loading MobileNet model...');
        mobilenetModel = await mobilenet.load();
        console.log('MobileNet model loaded successfully');
    } catch (error) {
        console.error('Failed to load MobileNet model', error);
        showToast('Warning: Offline AI model failed to load.');
    } finally {
        isModelLoading = false;
    }
}

// --- Multi-Language Dictionary ---
const translations = {
    en: {
        nav_patients: "Patients", nav_referrals: "Referrals", nav_scan: "Scan",
        nav_stats: "Stats", nav_sync: "Sync", login_subtitle: "ASHA Worker Portal",
        login_id_label: "Worker ID", login_id_placeholder: "e.g. AW-84920",
        login_otp_label: "OTP / PIN", login_otp_placeholder: "Enter PIN or OTP",
        login_btn: "Login Securely", login_or: "Or login with", login_biometric: "Biometric Scan",
        dark_mode: "Dark Mode", light_mode: "Light Mode", logout: "Logout",
        greeting_asha: "Namaste, ASHA Worker", cloud_sync_active: "Cloud Sync: Active",
        start_screening: "Start New Screening", scans_today: "Scans Today", referrals: "Referrals",
        capture_focus: "Focus", capture_light: "Light", capture_motion: "Motion",
        capture_instruction: "Align the camera with the pupil. Hold steady.", btn_cancel: "Cancel",
        patient_details: "Patient Details", abha_id_label: "ABHA ID", abha_id_placeholder: "e.g. 12-3456-7890-1234",
        patient_name_label: "Patient Name (Optional)", patient_name_placeholder: "Enter name",
        abdm_consent_text: "I confirm patient consent to link this screening record to their Ayushman Bharat Health Account (ABHA) locker via ABDM Gateway.",
        btn_analyze: "Analyze & Save", ai_loading_title: "Running Edge AI Analysis...",
        ai_loading_subtitle: "TensorFlow Lite (Quantized MobileNetV3)", screening_results: "Screening Results",
        dr_label: "Diabetic Retinopathy (DR)", cataract_label: "Cataract", glaucoma_label: "Glaucoma Risk",
        amd_label: "AMD", kerato_label: "Keratoconus", confidence_label: "Confidence",
        btn_book_consult: "Book eSanjeevani Tele-Consult", btn_done_return: "Done & Return",
        search_placeholder: "Search by name or ABHA ID", btn_register_patient: "Register New Patient",
        latest_diagnosis: "Latest Diagnosis", confidence_score: "Confidence Score",
        treatment_status: "Treatment Status", assigned_doctor: "Assigned Doctor", current_status: "Current Status",
        btn_view_history: "View Full History", sync_title: "AWS S3 & KMS Secure Sync",
        sync_subtitle: "All data is encrypted before upload.", sync_pending: "Pending", sync_today: "Synced Today",
        btn_force_sync: "Force Sync Now", connected_status: "Connected to Wi-Fi / 4G",
        btn_new_consult: "New eSanjeevani Consult", upcoming_appointments: "Upcoming Appointments",
        analytics_region: "Your Region: Block A", analytics_insights: "Aggregated insights from AWS HealthLake",
        total_screened: "Total Screened", dr_prevalence: "DR Prevalence",
        analytics_web_notice: "Detailed demographic breakdown available on Web Portal.",
        history_modal_title: "Full Medical History", offline_text: "Offline", online_text: "Online"
    },
    hi: {
        nav_patients: "मरीज", nav_referrals: "रेफरल", nav_scan: "स्कैन",
        nav_stats: "आंकड़े", nav_sync: "सिंक", login_subtitle: "आशा कार्यकर्ता पोर्टल",
        login_id_label: "कार्यकर्ता आईडी", login_id_placeholder: "उदा. AW-84920",
        login_otp_label: "ओटीपी / पिन", login_otp_placeholder: "पिन या ओटीपी दर्ज करें",
        login_btn: "सुरक्षित लॉगिन करें", login_or: "या इससे लॉगिन करें", login_biometric: "बायोमेट्रिक स्कैन",
        dark_mode: "डार्क मोड", light_mode: "लाइट मोड", logout: "लॉग आउट",
        greeting_asha: "नमस्ते, आशा कार्यकर्ता", cloud_sync_active: "क्लाउड सिंक: सक्रिय",
        start_screening: "नई स्क्रीनिंग शुरू करें", scans_today: "आज के स्कैन", referrals: "रेफरल",
        capture_focus: "फोकस", capture_light: "प्रकाश", capture_motion: "गति",
        capture_instruction: "कैमरे को पुतली से संरेखित करें। स्थिर रहें।", btn_cancel: "रद्द करें",
        patient_details: "मरीज का विवरण", abha_id_label: "आभा आईडी", abha_id_placeholder: "उदा. 12-3456-7890-1234",
        patient_name_label: "मरीज का नाम (वैकल्पिक)", patient_name_placeholder: "नाम दर्ज करें",
        abdm_consent_text: "मैं एबीडीएम गेटवे के माध्यम से इस स्क्रीनिंग को आभा लॉकर से जोड़ने की पुष्टि करती हूं।",
        btn_analyze: "विश्लेषण करें और सहेजें", ai_loading_title: "एज एआई विश्लेषण चल रहा है...",
        ai_loading_subtitle: "टेंसरफ्लो लाइट (क्वांटाइज्ड MobileNetV3)", screening_results: "स्क्रीनिंग परिणाम",
        dr_label: "डायबिटिक रेटिनोपैथी (डीआर)", cataract_label: "मोतियाबिंद", glaucoma_label: "ग्लूकोमा जोखिम",
        amd_label: "एएमडी", kerato_label: "केराटोकोनस", confidence_label: "सटीकता",
        btn_book_consult: "ई-संजीवनी टेली-परामर्श बुक करें", btn_done_return: "संपन्न और वापस जाएं",
        search_placeholder: "नाम या आभा आईडी से खोजें", btn_register_patient: "नया मरीज पंजीकृत करें",
        latest_diagnosis: "नवीनतम निदान", confidence_score: "सटीकता स्कोर",
        treatment_status: "उपचार की स्थिति", assigned_doctor: "नियुक्त डॉक्टर", current_status: "वर्तमान स्थिति",
        btn_view_history: "पूरा इतिहास देखें", sync_title: "AWS S3 सुरक्षित सिंक",
        sync_subtitle: "अपलोड करने से पहले सभी डेटा एन्क्रिप्ट किया गया है।", sync_pending: "लंबित", sync_today: "आज सिंक किया गया",
        btn_force_sync: "अभी सिंक करें", connected_status: "वाई-फाई / 4जी से जुड़ा है",
        btn_new_consult: "नया ई-संजीवनी परामर्श", upcoming_appointments: "आगामी नियुक्तियां",
        analytics_region: "आपका क्षेत्र: ब्लॉक ए", analytics_insights: "AWS HealthLake से एकत्रित जानकारी",
        total_screened: "कुल स्क्रीन किए गए", dr_prevalence: "डीआर का प्रसार",
        analytics_web_notice: "विस्तृत विवरण वेब पोर्टल पर उपलब्ध है।",
        history_modal_title: "पूरा चिकित्सा इतिहास", offline_text: "ऑफ़लाइन", online_text: "ऑनलाइन"
    },
    bn: {
        nav_patients: "রোগী", nav_referrals: "রেফারেল", nav_scan: "স্ক্যান",
        nav_stats: "পরিসংখ্যান", nav_sync: "সিঙ্ক", login_subtitle: "আশা কর্মী পোর্টাল",
        login_id_label: "কর্মী আইডি", login_id_placeholder: "উদাঃ AW-84920",
        login_otp_label: "ওটিপি / পিন", login_otp_placeholder: "পিন বা ওটিপি লিখুন",
        login_btn: "নিরাপদে লগইন করুন", login_or: "অথবা এর মাধ্যমে লগইন করুন", login_biometric: "বায়োমেট্রিক স্ক্যান",
        dark_mode: "ডার্ক মোড", light_mode: "লাইট মোড", logout: "লগ আউট",
        greeting_asha: "নমস্কার, আশা কর্মী", cloud_sync_active: "ক্লাউড সিঙ্ক: সক্রিয়",
        start_screening: "নতুন স্ক্রীনিং শুরু করুন", scans_today: "আজ স্ক্যান করা হয়েছে", referrals: "রেফারেল",
        capture_focus: "ফোকাস", capture_light: "আলো", capture_motion: "গতি",
        capture_instruction: "ক্যামেরাকে পিউপিলের সাথে সারিবদ্ধ করুন। স্থির থাকুন।", btn_cancel: "বাতিল করুন",
        patient_details: "রোগীর বিবরণ", abha_id_label: "আভা আইডি", abha_id_placeholder: "উদাঃ 12-3456-7890-1234",
        patient_name_label: "রোগীর নাম (ঐচ্ছিক)", patient_name_placeholder: "নাম লিখুন",
        abdm_consent_text: "আমি এবিডিএম গেটওয়ের মাধ্যমে এই স্ক্রীনিং রেকর্ড আভা লকারের সাথে যুক্ত করার সম্মতি নিশ্চিত করছি।",
        btn_analyze: "বিশ্লেষণ করুন এবং সংরক্ষণ করুন", ai_loading_title: "এজ এআই বিশ্লেষণ চলছে...",
        ai_loading_subtitle: "টেনসরফ্লো লাইট", screening_results: "স্ক্রীনিং ফলাফল",
        dr_label: "ডায়াবেটিক রেটিনোপ্যাথি (ডিআর)", cataract_label: "ছানি", glaucoma_label: "গ্লুকোমা ঝুঁকি",
        amd_label: "এএমডি", kerato_label: "কেরাটোকোনাস", confidence_label: "সঠিকতা",
        btn_book_consult: "ই-সঞ্জীবনী টেলি-পরামর্শ বুক করুন", btn_done_return: "সম্পন্ন এবং ফিরে যান",
        search_placeholder: "নাম বা আভা আইডি দিয়ে অনুসন্ধান করুন", btn_register_patient: "নতুন রোগী নিবন্ধন করুন",
        latest_diagnosis: "সর্বশেষ রোগ নির্ণয়", confidence_score: "সঠিকতা স্কোর",
        treatment_status: "চিকিত্সার স্থিতি", assigned_doctor: "নির্ধারিত চিকিৎসক", current_status: "বর্তমান অবস্থা",
        btn_view_history: "সম্পূর্ণ ইতিহাস দেখুন", sync_title: "AWS S3 সুরক্ষিত সিঙ্ক",
        sync_subtitle: "আপলোডের আগে সমস্ত ডেটা এনক্রিপ্ট করা হয়।", sync_pending: "মুলতুবি", sync_today: "আজ সিঙ্ক হয়েছে",
        btn_force_sync: "এখনই সিঙ্ক করুন", connected_status: "ওয়াই-ফাই / 4জি এর সাথে সংযুক্ত",
        btn_new_consult: "নতুন ই-সঞ্জীবনী পরামর্শ", upcoming_appointments: "আসন্ন অ্যাপয়েন্টমেন্ট",
        analytics_region: "আপনার অঞ্চল: ব্লক এ", analytics_insights: "AWS HealthLake থেকে অন্তর্দৃষ্টি",
        total_screened: "মোট স্ক্রীন করা হয়েছে", dr_prevalence: "ডিআর প্রকোপ",
        analytics_web_notice: "বিস্তারিত ওয়েব পোর্টালে উপলব্ধ।",
        history_modal_title: "সম্পূর্ণ চিকিৎসা ইতিহাস", offline_text: "অফলাইন", online_text: "অনলাইন"
    },
    ta: {
        nav_patients: "நோயாளிகள்", nav_referrals: "பரிந்துரைகள்", nav_scan: "ஸ்கேன்",
        nav_stats: "புள்ளிவிவரங்கள்", nav_sync: "ஒத்திசைவு", login_subtitle: "ஆஷா பணியாளர் போர்டல்",
        login_id_label: "பணியாளர் ஐடி", login_id_placeholder: "எ.கா. AW-84920",
        login_otp_label: "OTP / PIN", login_otp_placeholder: "பின் அல்லது OTP ஐ உள்ளிடவும்",
        login_btn: "பாதுகாப்பாக உள்நுழையவும்", login_or: "அல்லது இதன் மூலம் உள்நுழையவும்", login_biometric: "பயோமெட்ரிக் ஸ்கேன்",
        dark_mode: "டார்க் மோட்", light_mode: "லைட் மோட்", logout: "வெளியேறு",
        greeting_asha: "நமஸ்தே, ஆஷா பணியாளர்", cloud_sync_active: "கிளவுட் ஒத்திசைவு: செயலில் உள்ளது",
        start_screening: "புதிய ஸ்கிரீனிங்கைப் தொடங்கவும்", scans_today: "இன்று ஸ்கேன்", referrals: "பரிந்துரைகள்",
        capture_focus: "கவனம்", capture_light: "ஒளி", capture_motion: "இயக்கம்",
        capture_instruction: "கேமராவை கண்ணின் கருவிழியுடன் சீரமைக்கவும். நிலையாக இருங்கள்.", btn_cancel: "ரத்துசெய்",
        patient_details: "நோயாளி விவரங்கள்", abha_id_label: "ABHA ஐடி", abha_id_placeholder: "எ.கா. 12-3456-7890-1234",
        patient_name_label: "நோயாளி பெயர் (விரும்பினால்)", patient_name_placeholder: "பெயரை உள்ளிடவும்",
        abdm_consent_text: "ஏபிடிஎம் கேட்வே மூலம் நோயாளி ஒப்புதலை நான் உறுதி செய்கிறேன்.",
        btn_analyze: "பகுப்பாய்வு செய்து சேமிக்கவும்", ai_loading_title: "எட்ஜ் ஏஐ பகுப்பாய்வு இயங்குகிறது...",
        ai_loading_subtitle: "டென்சர்ஃப்ளோ லைட்", screening_results: "ஸ்கிரீனிங் முடிவுகள்",
        dr_label: "நீரிழிவு விழித்திரை நோய் (DR)", cataract_label: "கண்புரை", glaucoma_label: "குளுக்கோமா ஆபத்து",
        amd_label: "AMD", kerato_label: "கெரடோகோனஸ்", confidence_label: "துல்லியம்",
        btn_book_consult: "இ-சஞ்சீவனி டெலி-கான்சல்ட்", btn_done_return: "முடிந்தது மற்றும் திரும்பு",
        search_placeholder: "பெயர் அல்லது ABHA ஐடி மூலம் தேடவும்", btn_register_patient: "புதிய நோயாளியை பதிவு செய்யவும்",
        latest_diagnosis: "சமீபத்திய நோயறிதல்", confidence_score: "நம்பிக்கை மதிப்பெண்",
        treatment_status: "சிகிச்சை நிலை", assigned_doctor: "மருத்துவர்", current_status: "தற்போதைய நிலை",
        btn_view_history: "முழு வரலாற்றையும் காண்க", sync_title: "AWS S3 பாதுகாப்பான ஒத்திசைவு",
        sync_subtitle: "தரவுகள் குறியாக்கம் செய்யப்படுகின்றன.", sync_pending: "நிலுவையில்", sync_today: "இன்று ஒத்திசைக்கப்பட்டது",
        btn_force_sync: "இப்போது ஒத்திசைக்கவும்", connected_status: "வைஃபை / 4ஜி உடன் இணைக்கப்பட்டுள்ளது",
        btn_new_consult: "புதிய இ-சஞ்சீவனி ஆலோசனை", upcoming_appointments: "சந்திப்புகள்",
        analytics_region: "உங்கள் பகுதி: பிளாக் ஏ", analytics_insights: "AWS HealthLake நுண்ணறிவு",
        total_screened: "மொத்தம் ஸ்கிரீன் செய்யப்பட்டது", dr_prevalence: "DR பரவல்",
        analytics_web_notice: "விரிவான விவரம் இணைய போர்ட்டலில் கிடைக்கிறது.",
        history_modal_title: "முழு மருத்துவ வரலாறு", offline_text: "ஆஃப்லைன்", online_text: "ஆன்லைன்"
    },
    te: {
        nav_patients: "రోగులు", nav_referrals: "రిఫరల్స్", nav_scan: "స్కాన్",
        nav_stats: "గణాంకాలు", nav_sync: "సమకాలీకరణ", login_subtitle: "ఆశా వర్కర్ పోర్టల్",
        login_id_label: "వర్కర్ ఐడి", login_id_placeholder: "ఉదా. AW-84920",
        login_otp_label: "OTP / PIN", login_otp_placeholder: "PIN లేదా OTP నమోదు చేయండి",
        login_btn: "సురక్షితంగా లాగిన్ అవ్వండి", login_or: "లేదా వీటితో లాగిన్ అవ్వండి", login_biometric: "బయోమెట్రిక్ స్కాన్",
        dark_mode: "డార్క్ మోడ్", light_mode: "లైట్ మోడ్", logout: "లాగ్ అవుట్",
        greeting_asha: "నమస్తే, ఆశా వర్కర్", cloud_sync_active: "క్లౌడ్ సింక్: యాక్టివ్",
        start_screening: "కొత్త స్క్రీనింగ్ ప్రారంభించండి", scans_today: "నేటి స్కాన్‌లు", referrals: "రిఫరల్స్",
        capture_focus: "ఫోకస్", capture_light: "కాంతి", capture_motion: "కదలిక",
        capture_instruction: "కెమెరాను కంటి పాపతో సమలేఖనం చేయండి. స్థిరంగా ఉండండి.", btn_cancel: "రద్దు చేయి",
        patient_details: "రోగి వివరాలు", abha_id_label: "ABHA ID", abha_id_placeholder: "ఉదా. 12-3456-7890-1234",
        patient_name_label: "రోగి పేరు (ఐచ్ఛికం)", patient_name_placeholder: "పేరు నమోదు చేయండి",
        abdm_consent_text: "ఎబిడిఎం గేట్‌వే ద్వారా ఈ రికార్డును లింక్ చేయడానికి నేను సమ్మతిని ధృవీకరిస్తున్నాను.",
        btn_analyze: "విశ్లేషించండి మరియు సేవ్ చేయండి", ai_loading_title: "ఎడ్జ్ AI విశ్లేషణ రన్ అవుతోంది...",
        ai_loading_subtitle: "టెన్సార్‌ఫ్లో లైట్", screening_results: "స్క్రీనింగ్ ఫలితాలు",
        dr_label: "డయాబెటిక్ రెటినోపతి", cataract_label: "కంటిశుక్లం", glaucoma_label: "గ్లాకోమా ప్రమాదం",
        amd_label: "AMD", kerato_label: "కెరాటోకోనస్", confidence_label: "ఖచ్చితత్వం",
        btn_book_consult: "ఇ-సంజీవని కన్సల్ట్ బుక్ చేయండి", btn_done_return: "పూర్తయింది మరియు తిరిగి వెళ్ళు",
        search_placeholder: "పేరు లేదా ABHA ID ద్వారా శోధించండి", btn_register_patient: "కొత్త రోగిని నమోదు చేయండి",
        latest_diagnosis: "తాజా రోగ నిర్ధారణ", confidence_score: "కాన్ఫిడెన్స్ స్కోర్",
        treatment_status: "చికిత్స స్థితి", assigned_doctor: "కేటాయించిన డాక్టర్", current_status: "ప్రస్తుత స్థితి",
        btn_view_history: "పూర్తి చరిత్రను వీక్షించండి", sync_title: "AWS S3 సురక్షిత సింక్",
        sync_subtitle: "మొత్తం డేటా గుప్తీకరించబడుతుంది.", sync_pending: "పెండింగ్‌లో ఉంది", sync_today: "ఈరోజు సమకాలీకరించబడింది",
        btn_force_sync: "ఇప్పుడే సమకాలీకరించండి", connected_status: "Wi-Fi / 4Gకి కనెక్ట్ చేయబడింది",
        btn_new_consult: "కొత్త ఇ-సంజీవని కన్సల్ట్", upcoming_appointments: "రాబోయే అపాయింట్‌మెంట్‌లు",
        analytics_region: "మీ ప్రాంతం: బ్లాక్ ఎ", analytics_insights: "AWS HealthLake నుండి అంతర్దృష్టులు",
        total_screened: "మొత్తం స్క్రీన్ చేయబడింది", dr_prevalence: "DR ప్రాబల్యం",
        analytics_web_notice: "వివరణాత్మక వెబ్ పోర్టల్‌లో అందుబాటులో ఉంది.",
        history_modal_title: "పూర్తి వైద్య చరిత్ర", offline_text: "ఆఫ్‌లైన్", online_text: "ఆన్‌లైన్"
    },
    mr: {
        nav_patients: "रुग्ण", nav_referrals: "संदर्भ", nav_scan: "स्कॅन",
        nav_stats: "आकडेवारी", nav_sync: "सिंक", login_subtitle: "आशा कार्यकर्ता पोर्टल",
        login_id_label: "कामगार आयडी", login_id_placeholder: "उदा. AW-84920",
        login_otp_label: "OTP / PIN", login_otp_placeholder: "पिन किंवा OTP प्रविष्ट करा",
        login_btn: "सुरक्षितपणे लॉग इन करा", login_or: "किंवा यासह लॉग इन करा", login_biometric: "बायोमेट्रिक स्कॅन",
        dark_mode: "डार्क मोड", light_mode: "लाईट मोड", logout: "लॉग आउट",
        greeting_asha: "नमस्ते, आशा कार्यकर्ता", cloud_sync_active: "क्लाउड सिंक: सक्रिय",
        start_screening: "नवीन स्क्रीनिंग सुरू करा", scans_today: "आजचे स्कॅन", referrals: "संदर्भ",
        capture_focus: "फोकस", capture_light: "प्रकाश", capture_motion: "गती",
        capture_instruction: "कॅमेरा बुबुळाशी जुळवा. स्थिर रहा.", btn_cancel: "रद्द करा",
        patient_details: "रुग्णाचे तपशील", abha_id_label: "आभा आयडी", abha_id_placeholder: "उदा. 12-3456-7890-1234",
        patient_name_label: "रुग्णाचे नाव (पर्यायी)", patient_name_placeholder: "नाव प्रविष्ट करा",
        abdm_consent_text: "मी रुग्णाच्या संमतीची पुष्टी करतो.",
        btn_analyze: "विश्लेषण करा आणि जतन करा", ai_loading_title: "एज AI विश्लेषण चालू आहे...",
        ai_loading_subtitle: "टेन्सरफ्लो लाइट", screening_results: "स्क्रीनिंग परिणाम",
        dr_label: "डायबेटिक रेटिनोपॅथी", cataract_label: "मोतीबिंदू", glaucoma_label: "काचबिंदू धोका",
        amd_label: "एएमडी", kerato_label: "केराटोकोनस", confidence_label: "अचूकता",
        btn_book_consult: "ई-संजीवनी टेली-सल्ला बुक करा", btn_done_return: "पूर्ण आणि परत जा",
        search_placeholder: "नाव किंवा आभा आयडीद्वारे शोधा", btn_register_patient: "नवीन रुग्णाची नोंदणी करा",
        latest_diagnosis: "नवीनतम निदान", confidence_score: "कॉन्फिडन्स स्कोअर",
        treatment_status: "उपचाराची स्थिती", assigned_doctor: "नियुक्त डॉक्टर", current_status: "सद्यस्थिती",
        btn_view_history: "संपूर्ण इतिहास पहा", sync_title: "AWS S3 आणि KMS सुरक्षित सिंक",
        sync_subtitle: "अपलोड करण्यापूर्वी सर्व डेटा एनक्रिप्ट केला जातो.", sync_pending: "प्रलंबित", sync_today: "आज सिंक केले",
        btn_force_sync: "आता सिंक करा", connected_status: "वाय-फाय / 4G शी कनेक्टेड",
        btn_new_consult: "नवीन ई-संजीवनी सल्ला", upcoming_appointments: "आगामी भेटी",
        analytics_region: "तुमचा प्रदेश: ब्लॉक ए", analytics_insights: "AWS HealthLake कडील अंतर्दृष्टी",
        total_screened: "एकूण तपासणी केली", dr_prevalence: "डीआर प्रिव्हलन्स",
        analytics_web_notice: "तपशीलवार विश्लेषण वेब पोर्टलवर उपलब्ध.",
        history_modal_title: "संपूर्ण वैद्यकीय इतिहास", offline_text: "ऑफलाइन", online_text: "ऑनलाइन"
    }
};

let currentLang = 'en';

function applyTranslations(langCode) {
    if (!translations[langCode]) return;
    currentLang = langCode;
    const dict = translations[langCode];

    // Find all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            // Check if it's an input placeholder or text content
            if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                el.placeholder = dict[key];
            } else {
                el.innerText = dict[key];
            }
        }
    });

    // Update Dark/Light Mode text manually if overriding
    const themeText = document.getElementById('theme-text');
    if (themeText) {
        if (document.body.classList.contains('dark-mode')) {
            themeText.innerText = dict['light_mode'] || "Light Mode";
        } else {
            themeText.innerText = dict['dark_mode'] || "Dark Mode";
        }
    }

    // Update Online/Offline text based on connectivity
    updateOnlineStatus();
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Screen Management ---
    const screens = {
        login: document.getElementById('screen-login'),
        dashboard: document.getElementById('screen-dashboard'),
        capture: document.getElementById('screen-capture'),
        patientForm: document.getElementById('screen-patient-form'),
        results: document.getElementById('screen-results'),
        patients: document.getElementById('screen-patients'),
        patientDetails: document.getElementById('screen-patient-details'),
        sync: document.getElementById('screen-sync'),
        referrals: document.getElementById('screen-referrals'),
        analytics: document.getElementById('screen-analytics')
    };

    // --- Mobile Hamburger Sidebar Toggle ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sideNav = document.getElementById('main-nav');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    function openMobileSidebar() {
        sideNav.classList.add('mobile-open');
        sidebarOverlay.classList.add('active');
    }

    function closeMobileSidebar() {
        sideNav.classList.remove('mobile-open');
        sidebarOverlay.classList.remove('active');
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            if (sideNav.classList.contains('mobile-open')) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileSidebar);
    }

    // Close sidebar on mobile when a nav item is clicked
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeMobileSidebar();
            }
        });
    });

    function showScreen(screenName) {
        // Hide all screens
        Object.values(screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });
        // Show target screen
        if (screens[screenName]) {
            screens[screenName].classList.add('active');
        }

        // Manage header, wrapper, and side nav visibility
        const header = document.querySelector('.app-header');
        const nav = document.getElementById('main-nav');
        const mainWrapper = document.querySelector('.main-wrapper');

        if (screenName === 'login') {
            header.style.display = 'none';
            nav.classList.add('hidden');
            if (mainWrapper) mainWrapper.style.display = 'none';
        }
        else if (screenName === 'capture') {
            header.style.display = 'none';
            nav.classList.add('hidden');
            if (mainWrapper) mainWrapper.style.display = 'flex';
        } else {
            header.style.display = 'flex';
            nav.classList.remove('hidden');
            if (mainWrapper) mainWrapper.style.display = 'flex';

            // Update Header Title depending on screen
            const pageTitleEl = document.getElementById('current-page-title');
            if (pageTitleEl) {
                pageTitleEl.style.display = 'block';
                let title = 'Dashboard';
                if (screenName === 'patients') title = 'My Patients';
                if (screenName === 'patientDetails') title = 'Patient Details';
                if (screenName === 'referrals') title = 'Referrals';
                if (screenName === 'analytics') title = 'Population Analytics';
                if (screenName === 'sync') title = 'Cloud Synchronization';
                if (screenName === 'patientForm') title = 'Patient Info';
                pageTitleEl.textContent = title;
            }
        }

        // Update active states on side nav buttons if routing to main screens
        if (['dashboard', 'patients', 'sync', 'referrals', 'analytics'].includes(screenName)) {
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            let targetNav = screenName === 'dashboard' ? 'nav-scan' : `nav-${screenName}`;
            const targetEl = document.getElementById(targetNav);
            if (targetEl) targetEl.classList.add('active');
        }
    }

    // --- Login Logic (AWS Cognito Integration) ---
    document.getElementById('btn-login').addEventListener('click', async () => {
        const id = document.getElementById('login-id').value;
        const otp = document.getElementById('login-otp').value;

        if (id && otp) {
            const btn = document.getElementById('btn-login');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;margin:0;margin-right:8px;border-top-color:#fff;display:inline-block;vertical-align:middle;"></div> Authenticating...';
            btn.disabled = true;

            // Simulate AWS Cognito Authentication
            try {
                console.log(`Authenticating with AWS Cognito Pool: ${AWS_CONFIG.COGNITO_USER_POOL_ID}`);
                // await awsCognitoAuth(id, otp);
                await new Promise(resolve => setTimeout(resolve, 800)); // simulated network delay

                showScreen('dashboard');
                showToast('AWS Cognito Login successful. Namaste!');
            } catch (err) {
                showToast('Authentication failed.');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } else {
            showToast('Please enter both ID and OTP.');
        }
    });

    document.getElementById('btn-biometric').addEventListener('click', () => {
        // Simulate biometric popup delay
        setTimeout(() => {
            showScreen('dashboard');
            showToast('Biometric match successful.');
        }, 1000);
    });

    // Initialize state
    showScreen('login');
    // Pre-load the AI model in the background
    loadAIModel();

    // --- Header & Profile Interaction Logic ---
    const btnProfile = document.getElementById('btn-profile');
    const profileDropdown = document.getElementById('profile-dropdown');
    const btnToggleTheme = document.getElementById('btn-toggle-theme');
    const btnLogout = document.getElementById('btn-logout');
    const langSwitcher = document.getElementById('language-switcher');
    const connectivityText = document.getElementById('connectivity-text');
    const connectivityIndicator = document.getElementById('connectivity-indicator');
    const connectivityDot = connectivityIndicator.querySelector('.status-dot');

    // Toggle Dropdown
    btnProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('show');
    });

    // Close Dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!btnProfile.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('show');
        }
    });

    // Dark Mode Toggle
    btnToggleTheme.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const themeIcon = document.getElementById('theme-icon');
        const themeText = document.getElementById('theme-text');

        const dict = translations[currentLang] || translations['en'];

        if (document.body.classList.contains('dark-mode')) {
            themeIcon.name = 'sunny-outline';
            themeText.innerText = dict['light_mode'] || 'Light Mode';
        } else {
            themeIcon.name = 'moon-outline';
            themeText.innerText = dict['dark_mode'] || 'Dark Mode';
        }
        profileDropdown.classList.remove('show');
    });

    // Language Switcher Logic
    langSwitcher.addEventListener('change', (e) => {
        const selectedLang = e.target.value;
        applyTranslations(selectedLang);
        showToast(`Language updated successfully`);
        profileDropdown.classList.remove('show');
    });

    // Logout Logic
    btnLogout.addEventListener('click', () => {
        profileDropdown.classList.remove('show');

        // Hide Main app, Show Login
        document.querySelector('.main-wrapper').style.display = 'none';
        document.getElementById('screen-login').classList.add('active'); // Corrected from 'login-screen'

        // Clear forms/states (mock reset)
        document.getElementById('login-otp').value = '';
    });

    // Dynamic Connectivity Status
    function updateOnlineStatus() {
        const dict = translations[currentLang] || translations['en'];
        if (navigator.onLine) {
            connectivityText.innerText = dict['online_text'] || 'Online';
            connectivityIndicator.style.background = '#e6f4ea';
            connectivityIndicator.style.color = '#166534';
            connectivityIndicator.style.borderColor = '#cce8d5';
            connectivityDot.style.backgroundColor = '#4ade80';
        } else {
            connectivityText.innerText = dict['offline_text'] || 'Offline';
            connectivityIndicator.style.background = '#fef2f2';
            connectivityIndicator.style.color = '#b91c1c';
            connectivityIndicator.style.borderColor = '#fecaca';
            connectivityDot.style.backgroundColor = '#ef4444';
        }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus(); // Init on load

    // --- Navigation Links ---
    let currentVideoStream = null;

    async function requestCameraAndStartCapture() {
        try {
            currentVideoStream = await navigator.mediaDevices.getUserMedia({ video: true });

            const videoEl = document.getElementById('camera-feed');
            const mockEl = document.querySelector('.camera-feed-mock');
            if (videoEl) {
                videoEl.srcObject = currentVideoStream;
                videoEl.style.display = 'block';
                if (mockEl) mockEl.style.display = 'none';
            }

            showScreen('capture');
            startCaptureSimulation();
        } catch (err) {
            console.error('Camera access error:', err);
            showToast('Camera permission is required to start the scan.');
        }
    }

    document.getElementById('btn-start-screening').addEventListener('click', () => {
        requestCameraAndStartCapture();
    });

    document.getElementById('btn-cancel-capture').addEventListener('click', () => {
        showScreen('dashboard');
        stopCaptureSimulation();
    });

    document.getElementById('btn-back-to-capture').addEventListener('click', () => {
        requestCameraAndStartCapture();
    });

    document.getElementById('btn-back-to-dashboard').addEventListener('click', () => {
        showScreen('dashboard');
    });

    document.getElementById('btn-done').addEventListener('click', () => {
        showScreen('dashboard');
        showToast('Screening data queued for cloud sync.');
    });

    // Patient Details Navigation
    const btnBackToPatients = document.getElementById('btn-back-to-patients');
    if (btnBackToPatients) {
        btnBackToPatients.addEventListener('click', () => {
            showScreen('patients');
        });
    }

    // Full History Modal Logic
    const btnViewHistory = document.getElementById('btn-view-history');
    const historyModal = document.getElementById('history-modal');
    const btnCloseHistory = document.getElementById('btn-close-history');

    if (btnViewHistory && historyModal && btnCloseHistory) {
        btnViewHistory.addEventListener('click', () => {
            historyModal.classList.remove('hidden');
        });

        btnCloseHistory.addEventListener('click', () => {
            historyModal.classList.add('hidden');
        });

        // Close when clicking outside modal content
        historyModal.addEventListener('click', (e) => {
            if (e.target === historyModal) {
                historyModal.classList.add('hidden');
            }
        });
    }

    // Tab Navigation Logic
    document.getElementById('nav-patients').addEventListener('click', () => {
        showScreen('patients');
    });

    document.getElementById('nav-referrals').addEventListener('click', () => {
        showScreen('referrals');
    });

    document.getElementById('nav-scan').addEventListener('click', () => {
        showScreen('dashboard');
    });

    document.getElementById('nav-analytics').addEventListener('click', () => {
        showScreen('analytics');
    });

    document.getElementById('nav-sync').addEventListener('click', () => {
        showScreen('sync');
    });

    // Patient and Sync Screen basic interactions
    document.getElementById('btn-new-patient').addEventListener('click', () => {
        requestCameraAndStartCapture();
    });

    document.getElementById('btn-new-consult').addEventListener('click', () => {
        showToast('Checking eSanjeevani availability via API Gateway...');
        setTimeout(() => {
            showToast('Consultation successfully booked.');
            addReferralItem('New Patient', 'Dr. Sharma (Ophthalmologist) • Just Now');
            showScreen('referrals');
        }, 1500);
    });

    // --- AWS API Gateway & DynamoDB Sync ---
    document.getElementById('btn-force-sync').addEventListener('click', async () => {
        const btn = document.getElementById('btn-force-sync');
        const oldText = btn.innerHTML;
        btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;margin:0;margin-right:8px;border-top-color:#fff;display:inline-block;vertical-align:middle;"></div> Syncing to AWS...';
        btn.disabled = true;

        try {
            console.log(`Syncing data to ${AWS_CONFIG.API_GATEWAY_URL}/sync`);
            // Simulate API Gateway latency
            await new Promise(resolve => setTimeout(resolve, 2000));

            btn.innerHTML = '<ion-icon name="checkmark-outline" style="vertical-align:middle;"></ion-icon> Sync Complete';
            document.querySelector('.sync-num').textContent = '0';

            setTimeout(() => {
                btn.innerHTML = oldText;
                btn.disabled = false;
            }, 2000);
            showToast('12 records successfully synced via API Gateway to RDS.');
        } catch (err) {
            showToast('Sync failed. Please check network.');
            btn.innerHTML = oldText;
            btn.disabled = false;
        }
    });

    // Capture to Form Transition
    document.getElementById('btn-take-picture').addEventListener('click', () => {
        if (!isAligned) {
            showToast('Please align camera before capturing.');
        } else {
            let capturedImageDataUrl = null;
            const videoEl = document.getElementById('camera-feed');

            if (videoEl && videoEl.videoWidth > 0) {
                const canvas = document.createElement('canvas');
                canvas.width = videoEl.videoWidth;
                canvas.height = videoEl.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                capturedImageDataUrl = canvas.toDataURL('image/jpeg');
            }

            proceedToForm(capturedImageDataUrl);
        }
    });

    // Handle Image Upload
    document.getElementById('btn-upload-image').addEventListener('click', () => {
        document.getElementById('image-upload').click();
    });

    let currentUploadedFileName = null;

    document.getElementById('image-upload').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            currentUploadedFileName = file.name;
            const reader = new FileReader();
            reader.onload = function (e) {
                proceedToForm(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    function proceedToForm(imageSrc) {
        if (!imageSrc) {
            currentUploadedFileName = null;
        }
        stopCaptureSimulation();

        // Set mock date
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        document.getElementById('scan-time').textContent = `${dateStr}, ${timeStr}`;

        // Handle thumbnail
        const mockThumb = document.getElementById('mock-thumbnail');
        const imgThumb = document.getElementById('preview-thumbnail');

        if (imageSrc) {
            if (mockThumb) mockThumb.style.display = 'none';
            if (imgThumb) {
                imgThumb.src = imageSrc;
                imgThumb.style.display = 'block';
            }
        } else {
            if (mockThumb) mockThumb.style.display = 'block';
            if (imgThumb) imgThumb.style.display = 'none';
        }

        showScreen('patientForm');
    }

    // --- Capture Simulation (Quality Check & Alignment) ---
    let captureInterval;
    let isAligned = false;

    function startCaptureSimulation() {
        const guide = document.querySelector('.alignment-guide');
        const qFocus = document.querySelector('#q-focus .q-indicator');
        const qLighting = document.querySelector('#q-lighting .q-indicator');
        const qMotion = document.querySelector('#q-motion .q-indicator');

        let passCount = 0;

        captureInterval = setInterval(() => {
            // Randomly toggle states for mock, biasing towards success after a few seconds
            passCount++;

            if (passCount > 3) qFocus.classList.add('pass');
            if (passCount > 5) qLighting.classList.add('pass');
            if (passCount > 7) qMotion.classList.add('pass');

            if (passCount > 8) {
                guide.classList.add('aligned');
                document.querySelector('.instruction-overlay').textContent = 'Perfect alignment. Press capture.';
                isAligned = true;
            } else {
                guide.classList.remove('aligned');
                isAligned = false;
            }
        }, 800);
    }

    function stopCaptureSimulation() {
        clearInterval(captureInterval);
        isAligned = false;

        // Stop camera stream
        if (currentVideoStream) {
            currentVideoStream.getTracks().forEach(track => track.stop());
            currentVideoStream = null;
        }

        const videoEl = document.getElementById('camera-feed');
        const mockEl = document.querySelector('.camera-feed-mock');
        if (videoEl) {
            videoEl.style.display = 'none';
            videoEl.srcObject = null;
        }
        if (mockEl) {
            mockEl.style.display = 'block';
        }

        // Reset indicators
        document.querySelector('.alignment-guide').classList.remove('aligned');
        document.querySelectorAll('.q-indicator').forEach(el => el.classList.remove('pass'));
        document.querySelector('.instruction-overlay').textContent = 'Align the camera with the pupil. Hold steady.';
    }

    // --- AI Inference via SageMaker Cloud + Offline Fallback ---
    document.getElementById('btn-run-analysis').addEventListener('click', async () => {
        const abhaId = document.getElementById('abha-id').value;
        if (!abhaId) {
            showToast("Please enter ABHA ID. (e.g. any number)");
            return;
        }

        const abdmConsent = document.getElementById('abdm-consent')?.checked;
        if (abdmConsent) {
            console.log(`ABDM Consent verified. Payload will be sent to Health Stack Gateway via ${AWS_CONFIG.API_GATEWAY_URL}`);
        }

        const overlay = document.getElementById('ai-loading-overlay');
        const progressBar = document.getElementById('ai-progress');
        overlay.classList.remove('hidden');

        // Check if we have an image to process
        const imageElement = currentUploadedFileName ?
            document.getElementById('preview-thumbnail') : null;

        let progress = 0;
        const inferenceInterval = setInterval(() => {
            progress += 5;
            progressBar.style.width = `${Math.min(progress, 85)}%`;
            if (progress >= 85) {
                clearInterval(inferenceInterval);
            }
        }, 200);

        try {
            let resultData = null;
            let usedCloudAI = false;

            // Try cloud SageMaker inference first
            if (imageElement && imageElement.src && AWS_CONFIG.API_GATEWAY_URL) {
                try {
                    // Convert image to base64
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = imageElement.naturalWidth || imageElement.width;
                    canvas.height = imageElement.naturalHeight || imageElement.height;
                    ctx.drawImage(imageElement, 0, 0);
                    const base64Image = canvas.toDataURL('image/jpeg', 0.9);

                    console.log('Sending image to OcuNet v4 SageMaker endpoint...');
                    const response = await fetch(`${AWS_CONFIG.API_GATEWAY_URL}/screen`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: base64Image })
                    });

                    if (response.ok) {
                        resultData = await response.json();
                        usedCloudAI = true;
                        console.log('OcuNet v4 Cloud AI Results:', resultData);
                    } else {
                        console.warn('Cloud API returned error, falling back to offline AI');
                    }
                } catch (fetchErr) {
                    console.warn('Cloud API unreachable, falling back to offline AI:', fetchErr.message);
                }
            }

            // Offline fallback: use MobileNet mock
            if (!resultData) {
                if (!mobilenetModel && !isModelLoading) {
                    await loadAIModel();
                }

                let resultLevel = 'normal';
                if (imageElement && imageElement.src && mobilenetModel) {
                    if (!imageElement.complete) {
                        await new Promise(resolve => { imageElement.onload = resolve; });
                    }
                    const predictions = await mobilenetModel.classify(imageElement);
                    console.log('Offline AI Predictions:', predictions);
                    if (predictions && predictions.length > 0) {
                        const topPrediction = predictions[0];
                        if (topPrediction.probability > 0.6) resultLevel = 'normal';
                        else if (topPrediction.probability > 0.3) resultLevel = 'mild';
                        else resultLevel = 'severe';
                    }
                } else {
                    resultLevel = ['normal', 'mild', 'severe'][Math.floor(Math.random() * 3)];
                }

                // Build a mock resultData object to match the cloud format
                resultData = {
                    risk_level: resultLevel,
                    confidence: resultLevel === 'normal' ? 87.2 : (resultLevel === 'mild' ? 72.5 : 91.3),
                    dr: { class: resultLevel === 'severe' ? 'Proliferative DR' : (resultLevel === 'mild' ? 'Mild NPDR' : 'No Signs of DR'), detected: resultLevel !== 'normal' },
                    cataract: { class: resultLevel === 'severe' ? 'Dense' : (resultLevel === 'mild' ? 'Incipient' : 'Clear'), detected: resultLevel === 'severe' },
                    glaucoma: { class: resultLevel === 'severe' ? 'Advanced' : (resultLevel === 'mild' ? 'Suspect' : 'Normal'), detected: resultLevel !== 'normal' },
                    amd: { class: resultLevel === 'severe' ? 'Advanced/Wet' : (resultLevel === 'mild' ? 'Early Signs' : 'No Drusen'), detected: resultLevel === 'severe' },
                    keratoconus: { class: resultLevel === 'severe' ? 'Advanced' : (resultLevel === 'mild' ? 'Borderline' : 'Normal'), detected: false }
                };
            }

            progressBar.style.width = '95%';

            // Simulate S3 upload
            console.log(`Requesting S3 Presigned URL for bucket: ${AWS_CONFIG.S3_BUCKET_NAME}`);
            progressBar.style.width = '98%';
            await new Promise(resolve => setTimeout(resolve, 300));
            console.log('Image securely uploaded to S3 with KMS encryption.');

            progressBar.style.width = '100%';

            setTimeout(() => {
                overlay.classList.add('hidden');
                progressBar.style.width = '0%';

                // Update global Population Analytics stats
                const totalScreenedEl = document.getElementById('total-screened-count');
                const drPrevalenceEl = document.getElementById('dr-prevalence');

                if (totalScreenedEl && drPrevalenceEl) {
                    let currentTotal = parseInt(totalScreenedEl.innerText) || 142;
                    let currentPrev = parseInt(drPrevalenceEl.innerText) || 18;

                    let drCount = Math.round((currentPrev / 100) * currentTotal);
                    currentTotal++;

                    if (resultData.risk_level !== 'normal') {
                        drCount++;
                    }

                    let newPrev = Math.round((drCount / currentTotal) * 100);

                    totalScreenedEl.innerText = currentTotal;
                    drPrevalenceEl.innerText = newPrev + '%';
                }

                displayResults(resultData, usedCloudAI);
                showScreen('results');
            }, 500);

        } catch (err) {
            console.error('Inference error', err);
            clearInterval(inferenceInterval);
            overlay.classList.add('hidden');
            progressBar.style.width = '0%';
            showToast('Analysis failed. Please try again.');
        }

    });

    // --- Results Display (Cloud AI or Offline Fallback) ---
    function displayResults(data, isCloudAI) {
        const header = document.getElementById('vulnerability-header');
        const vulnLevelText = document.getElementById('vuln-level');
        const vulnIcon = document.getElementById('vuln-icon');
        const actionContainer = document.getElementById('referral-action');
        const suggestionBox = document.getElementById('suggestion-box');
        const warningText = document.getElementById('warning-text');
        const btnBookReferral = document.getElementById('btn-book-referral');
        const aiSourceBadge = document.getElementById('ai-source-badge');
        const confidenceEl = document.getElementById('confidence-score');

        // Update confidence & AI source
        if (confidenceEl) confidenceEl.textContent = `Confidence: ${data.confidence}%`;
        if (aiSourceBadge) aiSourceBadge.textContent = isCloudAI ? '☁️ OcuNet v4 Cloud AI' : '📱 Offline Edge AI';

        // Reset header classes
        header.classList.remove('normal', 'mild', 'severe');

        const level = data.risk_level;

        // Set summary header
        if (level === 'severe') {
            header.classList.add('severe');
            vulnLevelText.textContent = 'Severe Risk Detected';
            vulnIcon.setAttribute('name', 'alert-circle');
        } else if (level === 'mild') {
            header.classList.add('mild');
            vulnLevelText.textContent = 'Mild/Moderate Risk';
            vulnIcon.setAttribute('name', 'warning');
        } else {
            header.classList.add('normal');
            vulnLevelText.textContent = 'All Clear — No Issues Found';
            vulnIcon.setAttribute('name', 'checkmark-circle');
        }

        // Helper: determine card-level severity from disease data
        function getCardSeverity(diseaseData) {
            if (!diseaseData || !diseaseData.detected) return 'normal';
            const cls = (diseaseData.class || '').toLowerCase();
            // Severe keywords
            if (cls.includes('proliferative') || cls.includes('dense') || cls.includes('hypermature') ||
                cls.includes('mature') || cls.includes('advanced') || cls.includes('wet') ||
                cls.includes('high risk')) return 'severe';
            // Mild keywords
            if (cls.includes('mild') || cls.includes('incipient') || cls.includes('early') ||
                cls.includes('suspect') || cls.includes('borderline') || cls.includes('monitor')) return 'mild';
            // Moderate
            if (cls.includes('moderate') || cls.includes('intermediate') || cls.includes('immature')) return 'mild';
            return 'mild'; // Default detected = at least mild
        }

        // Helper: get "clear" text for each disease
        function getNormalText(diseaseKey) {
            const normals = {
                dr: 'No Signs of DR ✓',
                cataract: 'Lens Clear ✓',
                glaucoma: 'Normal Optic Nerve ✓',
                amd: 'No Drusen Detected ✓',
                keratoconus: 'Normal Cornea ✓'
            };
            return normals[diseaseKey] || 'Normal ✓';
        }

        // Update each disease card
        const diseases = [
            { key: 'dr', cardId: 'card-dr', resultId: 'dr-result' },
            { key: 'cataract', cardId: 'card-cataract', resultId: 'cataract-result' },
            { key: 'glaucoma', cardId: 'card-glaucoma', resultId: 'glaucoma-result' },
            { key: 'amd', cardId: 'card-amd', resultId: 'amd-result' },
            { key: 'keratoconus', cardId: 'card-kerato', resultId: 'kerato-result' }
        ];

        let anyDiseaseDetected = false;

        diseases.forEach(({ key, cardId, resultId }) => {
            const card = document.getElementById(cardId);
            const resultEl = document.getElementById(resultId);
            const diseaseData = data[key];

            // Reset status classes
            card.classList.remove('status-normal', 'status-mild', 'status-severe');

            const severity = getCardSeverity(diseaseData);
            card.classList.add(`status-${severity}`);

            if (diseaseData && diseaseData.detected) {
                resultEl.textContent = diseaseData.class || 'Detected';
                anyDiseaseDetected = true;
            } else {
                resultEl.textContent = getNormalText(key);
            }
        });

        // e-Sanjeevani: show unless NO disease detected at all
        actionContainer.style.display = 'block';
        if (anyDiseaseDetected) {
            if (level === 'severe') {
                suggestionBox.style.display = 'none';
                warningText.style.display = 'block';
                warningText.textContent = '⚠️ Immediate specialist consultation required.';
                warningText.style.color = '';
            } else {
                suggestionBox.style.display = 'block';
                suggestionBox.innerHTML = '<strong>Precautions:</strong> Monitor blood sugar levels closely, maintain a healthy diet, and wear UV-protective sunglasses. Schedule a follow-up in 3 months.';
                warningText.style.display = 'block';
                warningText.textContent = 'Consultation recommended for further evaluation.';
                warningText.style.color = 'var(--color-navy)';
            }
            btnBookReferral.style.display = 'flex';
        } else {
            suggestionBox.style.display = 'block';
            suggestionBox.innerHTML = '<strong>🎉 Great News!</strong> No eye diseases detected. Continue eating a balanced diet rich in leafy greens, get regular exercise, and minimize screen time. Keep up the good work!';
            warningText.style.display = 'none';
            btnBookReferral.style.display = 'none';
        }
    }

    // --- eSanjeevani Referral (AWS Lambda Proxy) ---
    document.getElementById('btn-book-referral').addEventListener('click', () => {
        showToast('Redirecting to the official eSanjeevani portal...');
        setTimeout(() => {
            const patientName = document.getElementById('patient-name').value || 'Unknown Patient';
            addReferralItem(patientName, 'Dr. Sharma (Ophthalmologist) • Today, 3:00 PM');
            showScreen('referrals');
            window.open('https://esanjeevaniopd.in/', '_blank');
        }, 1500);
    });

    // Helper to add referral items
    function addReferralItem(name, details) {
        const referralList = document.querySelector('#screen-referrals .patient-list');
        const newCard = document.createElement('div');
        newCard.className = 'patient-card';
        newCard.innerHTML = `
            <div class="patient-info">
                <h4>${name}</h4>
                <p>${details}</p>
                <span class="status-badge-small" style="background-color: var(--color-navy); color: white;">Confirmed</span>
            </div>
            <a href="tel:+919876543210" style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px; color: var(--color-navy); text-decoration: none;">
                <div style="display: flex; align-items: center; gap: 4px; font-weight: 600; font-size: 14px;">
                    <ion-icon name="call-outline"></ion-icon>
                    <span>+91 98765 43210</span>
                </div>
                <span style="font-size: 11px; color: gray; font-weight: 400;">Reception</span>
            </a>
        `;
        // Insert after the h3 title
        const title = referralList.querySelector('h3');
        if (title && title.nextSibling) {
            title.parentNode.insertBefore(newCard, title.nextSibling);
        } else {
            referralList.appendChild(newCard);
        }
    }

    // --- Utilities ---
    function showToast(message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        container.appendChild(toast);

        // Trigger reflow & show
        setTimeout(() => toast.classList.add('show'), 10);

        // Hide and remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
});

// Global function to be accessible from inline HTML onclick
function viewPatientDetails(name, id, statusBadge, drResult, cataractResult, glaucomaResult, amdResult, keratoResult, doctor, treatmentStatus) {
    // Populate the details view
    document.getElementById('detail-name').textContent = name;
    document.getElementById('detail-id').textContent = 'ID: ' + id;

    // Setup badge class logic
    const badgeEl = document.getElementById('detail-status-badge');
    badgeEl.textContent = statusBadge;
    badgeEl.className = 'status-badge-small';
    if (statusBadge === 'Cleared') {
        badgeEl.classList.add('normal');
    } else {
        badgeEl.classList.add('warning');
    }

    document.getElementById('detail-dr').textContent = drResult;
    document.getElementById('detail-cataract').textContent = cataractResult;
    document.getElementById('detail-glaucoma').textContent = glaucomaResult;
    document.getElementById('detail-amd').textContent = amdResult;
    document.getElementById('detail-kerato').textContent = keratoResult;
    document.getElementById('detail-doctor').textContent = doctor;
    document.getElementById('detail-treatment').textContent = treatmentStatus;

    // Show the screen (we need to manual do the logic since showScreen is scoped inside DOMContentLoaded)
    // First hide all active screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    // Show the target screen
    const targetScreen = document.getElementById('screen-patient-details');
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}
