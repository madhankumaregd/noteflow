/* =============================================
   INTERNATIONALIZATION (i18n)
   ============================================= */

const LANG_KEY = "noteflow_language";

const languages = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文 (Chinese)' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'ar', name: 'العربية (Arabic)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'ru', name: 'Русский (Russian)' },
  { code: 'pt', name: 'Português (Portuguese)' },
  { code: 'id', name: 'Bahasa Indonesia' }
];

const translations = {
  en: {
    language: "Language",
    selectLanguage: "Select Language",
    newNote: "+ New Note",
    templateBlank: "Blank Note",
    templateDiary: "Diary Entry",
    templateScript: "Script / Screenplay",
    newDiary: "New Diary",
    existingDiary: "Existing Diary",
    searchPlaceholder: "Search notes...",
    tags: "TAGS",
    emptyTitle: "Select a note or create one",
    emptySubtitle: "Your thoughts deserve a beautiful home.",
    emptyBtn: "Create your first note",
    diaryPromptPlaceholder: "e.g. My Travel Journal",
    diaryReflectionHeading: "Dear Diary,",
    saved: "Saved",
    saving: "Saving...",
    wordsSuffix: "words",
    deleteNote: "Delete Note",
    settings: "Settings",
    noteSettings: "Note Settings",
    checklist: "Checklist",
    sketch: "Sketch",
    duplicate: "Duplicate",
    export: "Export",
    read: "Read",
    close: "Close",
    save: "Save",
    cancel: "Cancel",
    proceed: "Proceed"
  },
  zh: {
    language: "语言", selectLanguage: "选择语言", newNote: "+ 新笔记", templateBlank: "空白笔记", templateDiary: "日记", templateScript: "剧本",
    newDiary: "新日记", existingDiary: "现有日记", searchPlaceholder: "搜索笔记...", tags: "标签", emptyTitle: "选择或创建笔记", emptySubtitle: "您的想法值得拥有一个美丽的家。",
    emptyBtn: "创建第一篇笔记", diaryPromptPlaceholder: "例如：我的旅行日记", diaryReflectionHeading: "每日反思：", saved: "已保存", saving: "保存中...",
    wordsSuffix: "字", deleteNote: "删除笔记", settings: "设置", noteSettings: "笔记设置", checklist: "清单", sketch: "草图", duplicate: "复制",
    export: "导出", read: "阅读", close: "关闭", save: "保存", cancel: "取消", proceed: "继续"
  },
  hi: {
    language: "भाषा", selectLanguage: "भाषा चुनें", newNote: "+ नया नोट", templateBlank: "खाली नोट", templateDiary: "डायरी प्रविष्टि", templateScript: "स्क्रिप्ट",
    newDiary: "नई डायरी", existingDiary: "मौजूदा डायरी", searchPlaceholder: "नोट्स खोजें...", tags: "टैग", emptyTitle: "नोट चुनें या नया बनाएं", emptySubtitle: "आपके विचार एक सुंदर घर के हकदार हैं।",
    emptyBtn: "अपना पहला नोट बनाएं", diaryPromptPlaceholder: "उदा. मेरी यात्रा डायरी", diaryReflectionHeading: "दैनिक चिंतन:", saved: "सहेजा गया", saving: "सहेज रहा है...",
    wordsSuffix: "शब्द", deleteNote: "नोट हटाएं", settings: "सेटिंग्स", noteSettings: "नोट सेटिंग्स", checklist: "चेकलिस्ट", sketch: "स्केच", duplicate: "डुप्लिकेट",
    export: "निर्यात", read: "पढ़ें", close: "बंद करें", save: "सहेजें", cancel: "रद्द करें", proceed: "आगे बढ़ें"
  },
  es: {
    language: "Idioma", selectLanguage: "Seleccionar Idioma", newNote: "+ Nueva Nota", templateBlank: "Nota en Blanco", templateDiary: "Entrada de Diario", templateScript: "Guión",
    newDiary: "Nuevo Diario", existingDiary: "Diario Existente", searchPlaceholder: "Buscar notas...", tags: "ETIQUETAS", emptyTitle: "Selecciona una nota o crea una", emptySubtitle: "Tus ideas merecen un hogar hermoso.",
    emptyBtn: "Crea tu primera nota", diaryPromptPlaceholder: "ej. Mi Diario de Viaje", diaryReflectionHeading: "Reflexión Diaria:", saved: "Guardado", saving: "Guardando...",
    wordsSuffix: "palabras", deleteNote: "Eliminar Nota", settings: "Configuración", noteSettings: "Ajustes de Nota", checklist: "Lista", sketch: "Dibujo", duplicate: "Duplicar",
    export: "Exportar", read: "Leer", close: "Cerrar", save: "Guardar", cancel: "Cancelar", proceed: "Proceder"
  },
  fr: {
    language: "Langue", selectLanguage: "Choisir la Langue", newNote: "+ Nouvelle Note", templateBlank: "Note Vierge", templateDiary: "Entrée de Journal", templateScript: "Scénario",
    newDiary: "Nouveau Journal", existingDiary: "Journal Existant", searchPlaceholder: "Rechercher...", tags: "TAGS", emptyTitle: "Sélectionnez ou créez une note", emptySubtitle: "Vos idées méritent une belle maison.",
    emptyBtn: "Créer la première note", diaryPromptPlaceholder: "ex. Mon journal de voyage", diaryReflectionHeading: "Réflexion Quotidienne:", saved: "Enregistré", saving: "Enregistrement...",
    wordsSuffix: "mots", deleteNote: "Supprimer la note", settings: "Paramètres", noteSettings: "Paramètres de note", checklist: "Liste", sketch: "Dessin", duplicate: "Dupliquer",
    export: "Exporter", read: "Lire", close: "Fermer", save: "Enregistrer", cancel: "Annuler", proceed: "Continuer"
  },
  ar: {
    language: "اللغة", selectLanguage: "اختر اللغة", newNote: "+ ملاحظة جديدة", templateBlank: "ملاحظة فارغة", templateDiary: "يوميات", templateScript: "سيناريو",
    newDiary: "يوميات جديدة", existingDiary: "يوميات موجودة", searchPlaceholder: "البحث في الملاحظات...", tags: "العلامات", emptyTitle: "اختر ملاحظة أو أنشئ واحدة", emptySubtitle: "أفكارك تستحق منزلاً جميلاً.",
    emptyBtn: "أنشئ ملاحظتك الأولى", diaryPromptPlaceholder: "مثال: مذكرات سفري", diaryReflectionHeading: "التأمل اليومي:", saved: "تم الحفظ", saving: "جاري الحفظ...",
    wordsSuffix: "كلمات", deleteNote: "حذف الملاحظة", settings: "الإعدادات", noteSettings: "إعدادات الملاحظة", checklist: "قائمة", sketch: "رسم", duplicate: "تكرار",
    export: "تصدير", read: "قراءة", close: "إغلاق", save: "حفظ", cancel: "إلغاء", proceed: "متابعة"
  },
  bn: {
    language: "ভাষা", selectLanguage: "ভাষা নির্বাচন করুন", newNote: "+ নতুন নোট", templateBlank: "খালি নোট", templateDiary: "ডায়েরি এন্ট্রি", templateScript: "স্ক্রিপ্ট",
    newDiary: "নতুন ডায়েরি", existingDiary: "বিদ্যমান ডায়েরি", searchPlaceholder: "নোট অনুসন্ধান করুন...", tags: "ট্যাগ", emptyTitle: "একটি নোট নির্বাচন করুন বা তৈরি করুন", emptySubtitle: "আপনার ধারণা একটি সুন্দর বাড়ি প্রাপ্য।",
    emptyBtn: "প্রথম নোট তৈরি করুন", diaryPromptPlaceholder: "উদাঃ আমার ভ্রমণ ডায়েরি", diaryReflectionHeading: "দৈনিক প্রতিফলন:", saved: "সংরক্ষিত", saving: "সংরক্ষণ করা হচ্ছে...",
    wordsSuffix: "শব্দ", deleteNote: "নোট মুছুন", settings: "সেটিংস", noteSettings: "নোট সেটিংস", checklist: "চেকলিস্ট", sketch: "স্কেচ", duplicate: "প্রতিলিপি",
    export: "রপ্তানি", read: "পড়ুন", close: "বন্ধ করুন", save: "সংরক্ষণ করুন", cancel: "বাতিল করুন", proceed: "এগিয়ে যান"
  },
  ru: {
    language: "Язык", selectLanguage: "Выберите язык", newNote: "+ Новая заметка", templateBlank: "Пустая заметка", templateDiary: "Дневник", templateScript: "Сценарий",
    newDiary: "Новый дневник", existingDiary: "Существующий дневник", searchPlaceholder: "Поиск заметок...", tags: "ТЕГИ", emptyTitle: "Выберите или создайте заметку", emptySubtitle: "Ваши идеи заслуживают красивого дома.",
    emptyBtn: "Создайте первую заметку", diaryPromptPlaceholder: "напр. Мой дневник путешествий", diaryReflectionHeading: "Ежедневные размышления:", saved: "Сохранено", saving: "Сохранение...",
    wordsSuffix: "слов", deleteNote: "Удалить заметку", settings: "Настройки", noteSettings: "Настройки заметки", checklist: "Список", sketch: "Эскиз", duplicate: "Дублировать",
    export: "Экспорт", read: "Читать", close: "Закрыть", save: "Сохранить", cancel: "Отмена", proceed: "Продолжить"
  },
  pt: {
    language: "Idioma", selectLanguage: "Selecione o Idioma", newNote: "+ Nova Nota", templateBlank: "Nota em Branco", templateDiary: "Entrada de Diário", templateScript: "Roteiro",
    newDiary: "Novo Diário", existingDiary: "Diário Existente", searchPlaceholder: "Pesquisar notas...", tags: "TAGS", emptyTitle: "Selecione ou crie uma nota", emptySubtitle: "Suas ideias merecem uma bela casa.",
    emptyBtn: "Crie a primeira nota", diaryPromptPlaceholder: "ex. Meu Diário de Viagem", diaryReflectionHeading: "Reflexão Diária:", saved: "Salvo", saving: "Salvando...",
    wordsSuffix: "palavras", deleteNote: "Excluir Nota", settings: "Configurações", noteSettings: "Ajustes da Nota", checklist: "Lista", sketch: "Esboço", duplicate: "Duplicar",
    export: "Exportar", read: "Ler", close: "Fechar", save: "Salvar", cancel: "Cancelar", proceed: "Prosseguir"
  },
  id: {
    language: "Bahasa", selectLanguage: "Pilih Bahasa", newNote: "+ Catatan Baru", templateBlank: "Catatan Kosong", templateDiary: "Buku Harian", templateScript: "Naskah",
    newDiary: "Buku Harian Baru", existingDiary: "Buku Harian Ada", searchPlaceholder: "Cari catatan...", tags: "TAG", emptyTitle: "Pilih atau buat catatan", emptySubtitle: "Ide Anda pantas mendapatkan tempat yang indah.",
    emptyBtn: "Buat catatan pertama", diaryPromptPlaceholder: "cth. Jurnal Perjalanan", diaryReflectionHeading: "Refleksi Harian:", saved: "Tersimpan", saving: "Menyimpan...",
    wordsSuffix: "kata", deleteNote: "Hapus Catatan", settings: "Pengaturan", noteSettings: "Pengaturan Catatan", checklist: "Daftar", sketch: "Sketsa", duplicate: "Duplikat",
    export: "Ekspor", read: "Baca", close: "Tutup", save: "Simpan", cancel: "Batal", proceed: "Lanjutkan"
  }
};

let currentLang = localStorage.getItem(LANG_KEY) || "en";

function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) || translations.en[key] || key;
}

function applyLanguage(lang) {
  currentLang = lang || currentLang;
  localStorage.setItem(LANG_KEY, currentLang);

  // Update all elements with data-i18n attribute
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[currentLang] && translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });

  // Update all placeholder attributes
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (translations[currentLang] && translations[currentLang][key]) {
      el.placeholder = translations[currentLang][key];
    }
  });

  // Update language label in settings
  const currentLanguageLabel = document.getElementById("currentLanguageLabel");
  if (currentLanguageLabel) {
    const langObj = languages.find(l => l.code === currentLang);
    if (langObj) currentLanguageLabel.textContent = langObj.name;
  }
}

// Initialize language list in modal
function initLanguageList() {
  const languageList = document.getElementById("languageList");
  if (!languageList) return;
  
  languageList.innerHTML = '';
  languages.forEach(lang => {
    const btn = document.createElement("button");
    btn.className = "lang-list-btn";
    btn.style.padding = "10px";
    btn.style.border = "1px solid var(--border)";
    btn.style.borderRadius = "var(--radius-sm)";
    btn.style.background = lang.code === currentLang ? "var(--accent-glow)" : "transparent";
    btn.style.color = lang.code === currentLang ? "var(--accent)" : "var(--text-primary)";
    btn.style.cursor = "pointer";
    btn.textContent = lang.name;
    
    btn.addEventListener("click", () => {
      applyLanguage(lang.code);
      document.getElementById("languageModalOverlay").classList.remove("open");
      initLanguageList(); // Re-render to update active styling
    });
    
    languageList.appendChild(btn);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyLanguage(currentLang);
  initLanguageList();
});
