import { Locale } from "./types";
import { dictionaryBracketHardening } from "./dictionary-bracket-hardening";
import { dictionaryAuditPass } from "./dictionary-audit-pass";
import { dictionaryPatches } from "./dictionary-patches";
import { dictionaryQualityPass } from "./dictionary-quality-pass";
import { dictionaryShowcasePass } from "./dictionary-showcase-pass";

export interface DictionaryBranch {
  [key: string]: DictionaryNode;
}

export type DictionaryNode = string | DictionaryBranch;

export const defaultLocale: Locale = "ru";
export const LOCALE_COOKIE = "billard-locale";

export const dictionaries: Record<Locale, Record<string, DictionaryNode>> = {
  ru: {
    common: {
      language: "Язык",
      brand: "Billard.uz Pro",
      platformTag: "Премиальная турнирная экосистема",
      appDescription: "Цифровая платформа для клубов, турниров, игроков и рейтингов Узбекистана.",
      readMore: "Подробнее",
      details: "Открыть",
      all: "Все",
      noResults: "По текущим фильтрам ничего не найдено.",
      stats: {
        elo: "ELO",
        wins: "Победы",
        losses: "Поражения",
        winRate: "Процент побед",
        rating: "Рейтинг",
        tables: "Столы",
        prizePool: "Призовой фонд",
        participants: "Участники",
        organizer: "Организатор",
        format: "Формат",
        address: "Адрес",
        club: "Клуб",
        date: "Дата",
        city: "Город",
        country: "Страна",
        disciplines: "Дисциплины",
        services: "Услуги",
        workHours: "Часы работы"
      },
      statuses: {
        upcoming: "Скоро",
        live: "В эфире",
        finished: "Завершён"
      },
      categories: {
        platform: "Платформа",
        tournament: "Турнир",
        product: "Продукт",
        media: "Медиа"
      },
      cities: {
        tashkent: "Ташкент",
        samarkand: "Самарканд",
        bukhara: "Бухара",
        andijan: "Андижан",
        namangan: "Наманган",
        fergana: "Фергана",
        nukus: "Нукус"
      },
      districts: {
        mirabad: "Мирабадский район",
        registan: "Регистан",
        oldTown: "Старый город"
      },
      countries: {
        uzbekistan: "Узбекистан"
      },
      disciplines: {
        freePyramid: "Свободная пирамида",
        russianPyramid: "Русская пирамида",
        combinedPyramid: "Комбинированная пирамида",
        dynamicPyramid: "Динамичная пирамида",
        moscowPyramid: "Московская пирамида",
        pool8: "Пул-8",
        pool9: "Пул-9",
        pool10: "Пул-10",
        pool141: "14.1",
        snooker: "Снукер",
        chineseBilliards: "Китайский бильярд"
      },
      services: {
        academy: "Академия",
        vip: "VIP-зал",
        coaching: "Тренер",
        stream: "Трансляция"
      },
      mediaTypes: {
        highlights: "Хайлайты",
        report: "Репортаж",
        interview: "Интервью"
      },
      localeNames: {
        ru: "Рус",
        uz: "O'z",
        en: "Eng"
      }
    },
    nav: {
      home: "Главная",
      tournaments: "Турниры",
      players: "Игроки",
      coaches: "Тренеры",
      rankings: "Рейтинги",
      clubs: "Клубы",
      news: "Новости",
      media: "Медиа",
      about: "О платформе",
      contacts: "Контакты",
      signin: "Войти",
      signup: "Регистрация"
    },
    commonUi: {
      exploreTournament: "Страница турнира",
      explorePlayer: "Профиль игрока",
      exploreClub: "Профиль клуба",
      readArticle: "Читать статью",
      loading: "Загрузка",
      retry: "Повторить",
      backHome: "На главную"
    },
    home: {
      eyebrow: "Бильярдная экосистема Узбекистана",
      title: "Платформа для турниров, клубов, игроков и рейтингов",
      subtitle: "Единая среда для регистрации, статистики, медиа, расписаний и управления на мобильных и десктопе.",
      ctaPlayer: "Стать игроком",
      ctaClub: "Добавить клуб",
      ctaTournament: "Создать турнир",
      tournamentsTitle: "Ближайшие турниры",
      tournamentsSubtitle: "Текущие события по городам и клубам",
      playersTitle: "Топ игроков",
      playersSubtitle: "Лидеры по ELO и стабильности в сезоне",
      clubsTitle: "Популярные клубы",
      clubsSubtitle: "Площадки с подтверждённой инфраструктурой и активным турнирным ритмом",
      rankingsTitle: "Национальный рейтинг",
      rankingsSubtitle: "Текущая таблица, готовая к API и live-обновлениям",
      newsTitle: "Новости и обновления",
      newsSubtitle: "Релизы продукта, турнирная повестка и ключевые анонсы",
      metrics: {
        clubs: "Подключённые клубы",
        players: "Игроки в системе",
        tournaments: "Турниры сезона"
      }
    },
    tournaments: {
      title: "Турниры",
      subtitle: "Расписания, статусы, быстрые фильтры и карточки событий",
      cityPlaceholder: "Все города",
      statusPlaceholder: "Все статусы",
      disciplinePlaceholder: "Все дисциплины",
      clubsCount: "Клубы в каталоге",
      empty: "Турниры по выбранным фильтрам не найдены.",
      detail: {
        schedule: "Расписание матчей",
        participants: "Участники",
        register: "Подать заявку",
        registration: "Регистрация",
        venue: "Площадка"
      }
    },
    players: {
      title: "Игроки",
      subtitle: "Каталог с поиском, сортировкой и статистикой игроков",
      searchPlaceholder: "Поиск игрока",
      countryPlaceholder: "Все страны",
      cityPlaceholder: "Все города",
      ratingPlaceholder: "Любой уровень",
      disciplinePlaceholder: "Все дисциплины",
      clearFilters: "Очистить фильтры",
      tournamentsPlayed: "Турниры",
      sortByElo: "ELO по убыванию",
      sortByWins: "Больше всего побед",
      achievements: "Достижения",
      history: "История турниров",
      profile: {
        bio: "Профиль игрока"
      }
    },
    coaches: {
      title: "Тренеры",
      subtitle: "Каталог тренеров с поиском по имени, региону, городу, дисциплине и квалификации",
      searchPlaceholder: "Поиск по имени",
      regionPlaceholder: "Все регионы",
      cityPlaceholder: "Все города",
      disciplinePlaceholder: "Все дисциплины",
      qualificationPlaceholder: "Любая квалификация",
      clearFilters: "Очистить фильтры",
      specialization: "Специализация",
      club: "Клуб",
      students: "Учеников",
      personalPrice: "Персональная",
      groupPrice: "Групповая",
      viewProfile: "Профиль",
      experience: "Опыт",
      yearsShort: "лет",
      about: "О тренере",
      gallery: "Галерея",
      reviews: "Отзывы учеников",
      achievements: "Достижения",
      studentsList: "Ученики",
      contacts: "Контакты",
      qualifications: {
        instructor: "Инструктор",
        master: "Мастер спорта",
        internationalMaster: "Мастер спорта международного класса",
        honoredCoach: "Заслуженный тренер"
      }
    },
    rankings: {
      title: "Рейтинги",
      subtitle: "Общая таблица, дисциплины и региональные срезы",
      disciplinesAll: "Общий рейтинг",
      regionsAll: "Все регионы",
      searchPlaceholder: "Найти игрока",
      sortByElo: "Сортировать по ELO",
      sortByWins: "Сортировать по победам",
      headers: {
        place: "#",
        player: "Игрок",
        city: "Город",
        elo: "ELO",
        winRate: "Процент побед"
      }
    },
    clubs: {
      title: "Клубы",
      subtitle: "Проверенные площадки, фильтры и профили клубов с поддержкой карты",
      cityPlaceholder: "Все города",
      servicesPlaceholder: "Все услуги",
      searchPlaceholder: "Поиск клуба",
      mapTitle: "Карта клубов",
      mapSubtitle: "Точка интеграции с Leaflet или Google Maps по координатам клубов",
      tournaments: "Турниры клуба",
      reviews: "Новости и отзывы",
      profile: {
        description: "О клубе"
      }
    },
    news: {
      title: "Новости",
      subtitle: "Освещение турниров, обновления платформы и релизы продукта",
      categoryPlaceholder: "Все категории",
      searchPlaceholder: "Поиск статьи",
      articleBody: "Эта страница готова для интеграции CMS, SEO-метаданных и локализованного контента из API."
    },
    media: {
      title: "Фото и видео",
      subtitle: "Архив альбомов, хайлайтов матчей и репортажей"
    },
    footer: {
      tagline: "Премиальная турнирная экосистема для бильярдной сцены Узбекистана и будущего регионального роста.",
      contact: "Контакт",
      telegram: "Telegram",
      address: "Адрес",
      addressValue: "Ташкент, Яккасарайский район",
      rights: "Billard.uz Pro. Все права защищены."
    },
    forms: {
      name: "Имя",
      phone: "Телефон",
      email: "Email",
      password: "Пароль",
      request: "Ваш запрос",
      send: "Отправить запрос",
      continue: "Продолжить",
      createAccount: "Создать аккаунт",
      firstName: "Имя",
      lastName: "Фамилия",
      role: "Роль",
      playerRole: "Игрок",
      clubRole: "Клуб",
      organizerRole: "Организатор"
    },
    auth: {
      signinTitle: "Вход",
      signupTitle: "Регистрация",
      signinSubtitle: "Доступ к турнирной и клубной экосистеме",
      signupSubtitle: "Создайте профиль, чтобы участвовать, публиковать и управлять событиями"
    },
    about: {
      title: "О платформе",
      mission: "Миссия: создать прозрачную, data-driven инфраструктуру для бильярдной индустрии Узбекистана.",
      players: "Для игроков",
      clubs: "Для клубов",
      organizers: "Для организаторов",
      playersText: "Заявки на турниры, личная статистика, рейтинг и уведомления.",
      clubsText: "Каталог клубов, страницы площадок, расписания и публикация событий.",
      organizersText: "Создание турниров, управление сеткой, участники и результаты."
    },
    contacts: {
      title: "Контакты",
      subtitle: "Свяжитесь с командой по вопросам продукта, подключения клуба или медиапартнёрства."
    },
    dashboard: {
      player: {
        title: "Кабинет игрока",
        tournaments: "Мои турниры",
        elo: "Текущий ELO",
        notifications: "Уведомления",
        note: "История матчей, заявки на турниры и личная статистика."
      },
      club: {
        title: "Кабинет клуба",
        published: "Опубликованные турниры",
        applications: "Активные заявки",
        completion: "Заполненность профиля",
        note: "Редактор страницы клуба, медиа, расписание и управление заявками игроков."
      },
      organizer: {
        title: "Кабинет организатора",
        running: "Текущие турниры",
        brackets: "Активные сетки",
        approvals: "Ожидают подтверждения",
        note: "Управление турнирной сеткой, матчами, результатами и участниками."
      },
      admin: {
        title: "Админ-панель",
        users: "Пользователи",
        clubs: "Клубы",
        tournaments: "Турниры",
        reports: "Отчёты",
        note: "Модерация клубов, игроков, новостей, турниров и аналитика платформы."
      }
    },
    system: {
      errorTitle: "Что-то пошло не так",
      errorText: "Попробуйте ещё раз или обратитесь в поддержку, если ошибка повторяется.",
      notFoundTitle: "Страница не найдена",
      notFoundText: "Запрошенный раздел не существует или был перемещён."
    }
  },
  uz: {
    common: {
      language: "Til",
      brand: "Billard.uz Pro",
      platformTag: "Premium turnir ekotizimi",
      appDescription: "O'zbekiston klublari, turnirlari, o'yinchilari va reytinglari uchun raqamli platforma.",
      readMore: "Batafsil",
      details: "Ochish",
      all: "Barchasi",
      noResults: "Joriy filtrlar bo'yicha hech narsa topilmadi.",
      stats: {
        elo: "ELO",
        wins: "G'alabalar",
        losses: "Mag'lubiyatlar",
        winRate: "Yutuq foizi",
        rating: "Reyting",
        tables: "Stollar",
        prizePool: "Mukofot jamg'armasi",
        participants: "Ishtirokchilar",
        organizer: "Tashkilotchi",
        format: "Format",
        address: "Manzil",
        club: "Klub",
        date: "Sana",
        city: "Shahar",
        country: "Mamlakat",
        disciplines: "Yo'nalishlar",
        services: "Xizmatlar",
        workHours: "Ish vaqti"
      },
      statuses: {
        upcoming: "Yaqinda",
        live: "Jonli",
        finished: "Yakunlangan"
      },
      categories: {
        platform: "Platforma",
        tournament: "Turnir",
        product: "Mahsulot",
        media: "Media"
      },
      cities: {
        tashkent: "Toshkent",
        samarkand: "Samarqand",
        bukhara: "Buxoro",
        andijan: "Andijon",
        namangan: "Namangan",
        fergana: "Farg'ona",
        nukus: "Nukus"
      },
      districts: {
        mirabad: "Mirobod tumani",
        registan: "Registon",
        oldTown: "Eski shahar"
      },
      countries: {
        uzbekistan: "O'zbekiston"
      },
      disciplines: {
        freePyramid: "Erkin piramida",
        russianPyramid: "Rus piramidasi",
        combinedPyramid: "Kombinatsiyalangan piramida",
        dynamicPyramid: "Dinamik piramida",
        moscowPyramid: "Moskva piramidasi",
        pool8: "Pul-8",
        pool9: "Pul-9",
        pool10: "Pul-10",
        pool141: "14.1",
        snooker: "Snuker",
        chineseBilliards: "Xitoy bilyardi"
      },
      services: {
        academy: "Akademiya",
        vip: "VIP zal",
        coaching: "Murabbiy",
        stream: "Striming"
      },
      mediaTypes: {
        highlights: "Haylaytlar",
        report: "Reportaj",
        interview: "Intervyu"
      },
      localeNames: {
        ru: "Rus",
        uz: "O'z",
        en: "Eng"
      }
    },
    nav: {
      home: "Bosh sahifa",
      tournaments: "Turnirlar",
      players: "O'yinchilar",
      coaches: "Murabbiylar",
      rankings: "Reytinglar",
      clubs: "Klublar",
      news: "Yangiliklar",
      media: "Media",
      about: "Platforma haqida",
      contacts: "Kontaktlar",
      signin: "Kirish",
      signup: "Ro'yxatdan o'tish"
    },
    commonUi: {
      exploreTournament: "Turnir sahifasi",
      explorePlayer: "O'yinchi profili",
      exploreClub: "Klub profili",
      readArticle: "Maqolani o'qish",
      loading: "Yuklanmoqda",
      retry: "Qayta urinish",
      backHome: "Bosh sahifaga"
    },
    home: {
      eyebrow: "O'zbekiston billiard ekotizimi",
      title: "Turnirlar, klublar, o'yinchilar va reytinglar uchun platforma",
      subtitle: "Ro'yxatdan o'tish, statistika, media, jadval va boshqaruvni birlashtirgan zamonaviy raqamli muhit.",
      ctaPlayer: "O'yinchi bo'lish",
      ctaClub: "Klub qo'shish",
      ctaTournament: "Turnir yaratish",
      tournamentsTitle: "Yaqin turnirlar",
      tournamentsSubtitle: "Shaharlar va klublar bo'yicha joriy tadbirlar",
      playersTitle: "Top o'yinchilar",
      playersSubtitle: "ELO va mavsumiy barqarorlik bo'yicha yetakchilar",
      clubsTitle: "Mashhur klublar",
      clubsSubtitle: "Tasdiqlangan infratuzilma va turnir ritmiga ega maydonlar",
      rankingsTitle: "Milliy reyting",
      rankingsSubtitle: "API va live yangilanishga tayyor joriy jadval",
      newsTitle: "Yangiliklar va yangilanishlar",
      newsSubtitle: "Mahsulot relizlari, turnirlar va asosiy e'lonlar",
      metrics: {
        clubs: "Ulangan klublar",
        players: "Tizimdagi o'yinchilar",
        tournaments: "Mavsum turnirlari"
      }
    },
    tournaments: {
      title: "Turnirlar",
      subtitle: "Jadval, statuslar, tezkor filtrlar va tadbir kartalari",
      cityPlaceholder: "Barcha shaharlar",
      statusPlaceholder: "Barcha statuslar",
      disciplinePlaceholder: "Barcha yo'nalishlar",
      clubsCount: "Katalogdagi klublar",
      empty: "Tanlangan parametrlarga mos turnir topilmadi.",
      detail: {
        schedule: "Uchrashuvlar jadvali",
        participants: "Ishtirokchilar",
        register: "Ariza topshirish",
        registration: "Ro'yxatdan o'tish",
        venue: "Joy"
      }
    },
    players: {
      title: "O'yinchilar",
      subtitle: "Qidiruv, saralash va statistika bilan katalog",
      searchPlaceholder: "O'yinchini qidirish",
      countryPlaceholder: "Barcha davlatlar",
      cityPlaceholder: "Barcha shaharlar",
      ratingPlaceholder: "Istalgan daraja",
      disciplinePlaceholder: "Barcha yo'nalishlar",
      clearFilters: "Filtrlarni tozalash",
      tournamentsPlayed: "Turnirlar",
      sortByElo: "ELO bo'yicha kamayish",
      sortByWins: "Eng ko'p g'alaba",
      achievements: "Yutuqlar",
      history: "Turnirlar tarixi",
      profile: {
        bio: "O'yinchi profili"
      }
    },
    coaches: {
      title: "Murabbiylar",
      subtitle: "Ism, hudud, shahar, yo'nalish va malaka bo'yicha murabbiylar katalogi",
      searchPlaceholder: "Ism bo'yicha qidirish",
      regionPlaceholder: "Barcha hududlar",
      cityPlaceholder: "Barcha shaharlar",
      disciplinePlaceholder: "Barcha yo'nalishlar",
      qualificationPlaceholder: "Istalgan malaka",
      clearFilters: "Filtrlarni tozalash",
      specialization: "Mutaxassisligi",
      club: "Klub",
      students: "Shogirdlar",
      personalPrice: "Shaxsiy",
      groupPrice: "Guruhli",
      viewProfile: "Profil",
      experience: "Tajriba",
      yearsShort: "yil",
      about: "Murabbiy haqida",
      gallery: "Galereya",
      reviews: "Shogirdlar fikrlari",
      achievements: "Yutuqlar",
      studentsList: "Shogirdlar",
      contacts: "Kontaktlar",
      qualifications: {
        instructor: "Instruktor",
        master: "Sport ustasi",
        internationalMaster: "Xalqaro toifa sport ustasi",
        honoredCoach: "Xizmat ko'rsatgan murabbiy"
      }
    },
    rankings: {
      title: "Reytinglar",
      subtitle: "Umumiy jadval, yo'nalishlar va hududiy kesimlar",
      disciplinesAll: "Umumiy reyting",
      regionsAll: "Barcha hududlar",
      searchPlaceholder: "O'yinchini topish",
      sortByElo: "ELO bo'yicha saralash",
      sortByWins: "G'alabalar bo'yicha saralash",
      headers: {
        place: "#",
        player: "O'yinchi",
        city: "Shahar",
        elo: "ELO",
        winRate: "Yutuq foizi"
      }
    },
    clubs: {
      title: "Klublar",
      subtitle: "Tasdiqlangan maydonlar, filtrlar va kelajakdagi xarita integratsiyasi",
      cityPlaceholder: "Barcha shaharlar",
      servicesPlaceholder: "Barcha xizmatlar",
      searchPlaceholder: "Klubni qidirish",
      mapTitle: "Klublar xaritasi",
      mapSubtitle: "Leaflet yoki Google Maps bilan integratsiya nuqtasi",
      tournaments: "Klub turnirlari",
      reviews: "Yangiliklar va sharhlar",
      profile: {
        description: "Klub haqida"
      }
    },
    news: {
      title: "Yangiliklar",
      subtitle: "Turnir hayoti, platforma yangilanishlari va mahsulot relizlari",
      categoryPlaceholder: "Barcha kategoriyalar",
      searchPlaceholder: "Maqolani qidirish",
      articleBody: "Bu sahifa keyinchalik CMS, SEO metadata va lokalizatsiya qilingan API-kontent uchun tayyorlangan."
    },
    media: {
      title: "Foto va video",
      subtitle: "Albomlar, match highlight va reportajlar arxivi"
    },
    footer: {
      tagline: "O'zbekiston billiard sahnasi va keyingi mintaqaviy o'sish uchun premium turnir ekotizimi.",
      contact: "Kontakt",
      telegram: "Telegram",
      address: "Manzil",
      addressValue: "Toshkent, Yakkasaroy tumani",
      rights: "Billard.uz Pro. Barcha huquqlar himoyalangan."
    },
    forms: {
      name: "Ism",
      phone: "Telefon",
      email: "Email",
      password: "Parol",
      request: "So'rovingiz",
      send: "So'rov yuborish",
      continue: "Davom etish",
      createAccount: "Akkaunt yaratish",
      firstName: "Ism",
      lastName: "Familiya",
      role: "Rol",
      playerRole: "O'yinchi",
      clubRole: "Klub",
      organizerRole: "Tashkilotchi"
    },
    auth: {
      signinTitle: "Kirish",
      signupTitle: "Ro'yxatdan o'tish",
      signinSubtitle: "Turnir va klub ekotizimiga kirish",
      signupSubtitle: "Ishtirok etish, e'lon qilish va boshqarish uchun profil yarating"
    },
    about: {
      title: "Platforma haqida",
      mission: "Missiya: O'zbekiston billiard sanoati uchun shaffof va data-driven infratuzilma yaratish.",
      players: "O'yinchilar uchun",
      clubs: "Klublar uchun",
      organizers: "Tashkilotchilar uchun",
      playersText: "Turnirlarga ariza, shaxsiy statistika, reyting va bildirishnomalar.",
      clubsText: "Klublar katalogi, maydon sahifalari, jadval va tadbirlar nashri.",
      organizersText: "Turnir yaratish, setkani boshqarish, ishtirokchilar va natijalar."
    },
    contacts: {
      title: "Kontaktlar",
      subtitle: "Mahsulot, klub ulash yoki media hamkorlik bo'yicha jamoa bilan bog'laning."
    },
    dashboard: {
      player: {
        title: "O'yinchi kabineti",
        tournaments: "Mening turnirlarim",
        elo: "Joriy ELO",
        notifications: "Bildirishnomalar",
        note: "Match tarixi, turnir arizalari va shaxsiy statistika."
      },
      club: {
        title: "Klub kabineti",
        published: "E'lon qilingan turnirlar",
        applications: "Faol arizalar",
        completion: "Profil to'ldirilishi",
        note: "Klub sahifasi muharriri, media, jadval va o'yinchi arizalarini boshqarish."
      },
      organizer: {
        title: "Tashkilotchi kabineti",
        running: "Davom etayotgan turnirlar",
        brackets: "Faol setkalar",
        approvals: "Tasdiq kutayotganlar",
        note: "Turnir setkasi, matchlar, natijalar va ishtirokchilarni boshqarish."
      },
      admin: {
        title: "Admin paneli",
        users: "Foydalanuvchilar",
        clubs: "Klublar",
        tournaments: "Turnirlar",
        reports: "Hisobotlar",
        note: "Klublar, o'yinchilar, yangiliklar, turnirlar moderatsiyasi va platforma analitikasi."
      }
    },
    system: {
      errorTitle: "Nimadir xato ketdi",
      errorText: "Yana urinib ko'ring yoki xato takrorlansa supportga murojaat qiling.",
      notFoundTitle: "Sahifa topilmadi",
      notFoundText: "So'ralgan bo'lim mavjud emas yoki ko'chirilgan."
    }
  },
  en: {
    common: {
      language: "Language",
      brand: "Billard.uz Pro",
      platformTag: "Premium tournament ecosystem",
      appDescription: "Digital platform for Uzbekistan clubs, tournaments, players, and rankings.",
      readMore: "Read more",
      details: "Open",
      all: "All",
      noResults: "Nothing matched the current filters.",
      stats: {
        elo: "ELO",
        wins: "Wins",
        losses: "Losses",
        winRate: "Win rate",
        rating: "Rating",
        tables: "Tables",
        prizePool: "Prize pool",
        participants: "Participants",
        organizer: "Organizer",
        format: "Format",
        address: "Address",
        club: "Club",
        date: "Date",
        city: "City",
        country: "Country",
        disciplines: "Disciplines",
        services: "Services",
        workHours: "Working hours"
      },
      statuses: {
        upcoming: "Upcoming",
        live: "Live",
        finished: "Finished"
      },
      categories: {
        platform: "Platform",
        tournament: "Tournament",
        product: "Product",
        media: "Media"
      },
      cities: {
        tashkent: "Tashkent",
        samarkand: "Samarkand",
        bukhara: "Bukhara",
        andijan: "Andijan",
        namangan: "Namangan",
        fergana: "Fergana",
        nukus: "Nukus"
      },
      districts: {
        mirabad: "Mirabad district",
        registan: "Registan",
        oldTown: "Old town"
      },
      countries: {
        uzbekistan: "Uzbekistan"
      },
      disciplines: {
        freePyramid: "Free pyramid",
        russianPyramid: "Russian pyramid",
        combinedPyramid: "Combined pyramid",
        dynamicPyramid: "Dynamic pyramid",
        moscowPyramid: "Moscow pyramid",
        pool8: "Pool-8",
        pool9: "Pool-9",
        pool10: "Pool-10",
        pool141: "14.1",
        snooker: "Snooker",
        chineseBilliards: "Chinese billiards"
      },
      services: {
        academy: "Academy",
        vip: "VIP lounge",
        coaching: "Coaching",
        stream: "Streaming"
      },
      mediaTypes: {
        highlights: "Highlights",
        report: "Report",
        interview: "Interview"
      },
      localeNames: {
        ru: "Rus",
        uz: "Uzb",
        en: "Eng"
      }
    },
    nav: {
      home: "Home",
      tournaments: "Tournaments",
      players: "Players",
      coaches: "Coaches",
      rankings: "Rankings",
      clubs: "Clubs",
      news: "News",
      media: "Media",
      about: "About",
      contacts: "Contacts",
      signin: "Sign in",
      signup: "Sign up"
    },
    commonUi: {
      exploreTournament: "Tournament page",
      explorePlayer: "Player profile",
      exploreClub: "Club profile",
      readArticle: "Read article",
      loading: "Loading",
      retry: "Retry",
      backHome: "Back home"
    },
    home: {
      eyebrow: "Uzbekistan billiards ecosystem",
      title: "Platform for tournaments, clubs, players, and rankings",
      subtitle: "A unified environment for registration, stats, media, schedules, and management across mobile and desktop.",
      ctaPlayer: "Join as player",
      ctaClub: "Add a club",
      ctaTournament: "Create tournament",
      tournamentsTitle: "Upcoming tournaments",
      tournamentsSubtitle: "Current events across cities and clubs",
      playersTitle: "Top players",
      playersSubtitle: "Leaders by ELO and seasonal consistency",
      clubsTitle: "Popular clubs",
      clubsSubtitle: "Venues with verified infrastructure and strong tournament rhythm",
      rankingsTitle: "National rankings",
      rankingsSubtitle: "Current table ready for API and live updates",
      newsTitle: "News and updates",
      newsSubtitle: "Product releases, tournament agenda, and key announcements",
      metrics: {
        clubs: "Connected clubs",
        players: "Players in system",
        tournaments: "Season tournaments"
      }
    },
    tournaments: {
      title: "Tournaments",
      subtitle: "Schedules, statuses, quick filters, and event cards",
      cityPlaceholder: "All cities",
      statusPlaceholder: "All statuses",
      disciplinePlaceholder: "All disciplines",
      clubsCount: "Clubs in catalog",
      empty: "No tournaments found for the selected filters.",
      detail: {
        schedule: "Match schedule",
        participants: "Participants",
        register: "Apply now",
        registration: "Registration",
        venue: "Venue"
      }
    },
    players: {
      title: "Players",
      subtitle: "Directory with search, sorting, and player statistics",
      searchPlaceholder: "Search player",
      countryPlaceholder: "All countries",
      cityPlaceholder: "All cities",
      ratingPlaceholder: "Any level",
      disciplinePlaceholder: "All disciplines",
      clearFilters: "Clear filters",
      tournamentsPlayed: "Tournaments",
      sortByElo: "ELO descending",
      sortByWins: "Most wins",
      achievements: "Achievements",
      history: "Tournament history",
      profile: {
        bio: "Player profile"
      }
    },
    coaches: {
      title: "Coaches",
      subtitle: "Coaches directory with search by name, region, city, discipline, and qualification",
      searchPlaceholder: "Search by name",
      regionPlaceholder: "All regions",
      cityPlaceholder: "All cities",
      disciplinePlaceholder: "All disciplines",
      qualificationPlaceholder: "Any qualification",
      clearFilters: "Clear filters",
      specialization: "Specialization",
      club: "Club",
      students: "Students",
      personalPrice: "Personal",
      groupPrice: "Group",
      viewProfile: "Profile",
      experience: "Experience",
      yearsShort: "yrs",
      about: "About the coach",
      gallery: "Gallery",
      reviews: "Student reviews",
      achievements: "Achievements",
      studentsList: "Students",
      contacts: "Contacts",
      qualifications: {
        instructor: "Instructor",
        master: "Master of Sport",
        internationalMaster: "International Master of Sport",
        honoredCoach: "Honored Coach"
      }
    },
    rankings: {
      title: "Rankings",
      subtitle: "Overall table, disciplines, and regional slices",
      disciplinesAll: "Overall ranking",
      regionsAll: "All regions",
      searchPlaceholder: "Find player",
      sortByElo: "Sort by ELO",
      sortByWins: "Sort by wins",
      headers: {
        place: "#",
        player: "Player",
        city: "City",
        elo: "ELO",
        winRate: "Win rate"
      }
    },
    clubs: {
      title: "Clubs",
      subtitle: "Verified venues, filters, and map-ready club profiles",
      cityPlaceholder: "All cities",
      servicesPlaceholder: "All services",
      searchPlaceholder: "Search club",
      mapTitle: "Club map",
      mapSubtitle: "Integration point for Leaflet or Google Maps using club coordinates",
      tournaments: "Club tournaments",
      reviews: "News and reviews",
      profile: {
        description: "About the club"
      }
    },
    news: {
      title: "News",
      subtitle: "Tournament coverage, platform updates, and product releases",
      categoryPlaceholder: "All categories",
      searchPlaceholder: "Search article",
      articleBody: "This page is ready for CMS integration, SEO metadata, and localized API-driven content."
    },
    media: {
      title: "Photo and video",
      subtitle: "Archive of albums, match highlights, and reports"
    },
    footer: {
      tagline: "Premium tournament ecosystem for Uzbekistan's billiards scene and future regional growth.",
      contact: "Contact",
      telegram: "Telegram",
      address: "Address",
      addressValue: "Tashkent, Yakkasaray district",
      rights: "Billard.uz Pro. All rights reserved."
    },
    forms: {
      name: "Name",
      phone: "Phone",
      email: "Email",
      password: "Password",
      request: "Your request",
      send: "Send request",
      continue: "Continue",
      createAccount: "Create account",
      firstName: "First name",
      lastName: "Last name",
      role: "Role",
      playerRole: "Player",
      clubRole: "Club",
      organizerRole: "Organizer"
    },
    auth: {
      signinTitle: "Sign in",
      signupTitle: "Create account",
      signinSubtitle: "Access the tournament and club ecosystem",
      signupSubtitle: "Create a profile to participate, publish, and manage events"
    },
    about: {
      title: "About platform",
      mission: "Mission: build transparent, data-driven infrastructure for the billiards industry in Uzbekistan.",
      players: "For players",
      clubs: "For clubs",
      organizers: "For organizers",
      playersText: "Tournament applications, personal statistics, rankings, and notifications.",
      clubsText: "Club directory, venue profiles, schedules, and event publishing.",
      organizersText: "Tournament creation, bracket control, participants, and results."
    },
    contacts: {
      title: "Contacts",
      subtitle: "Reach the team for product questions, club onboarding, or media partnership."
    },
    dashboard: {
      player: {
        title: "Player dashboard",
        tournaments: "My tournaments",
        elo: "Current ELO",
        notifications: "Notifications",
        note: "Match history, tournament applications, and personal statistics."
      },
      club: {
        title: "Club dashboard",
        published: "Published tournaments",
        applications: "Active applications",
        completion: "Profile completion",
        note: "Club profile editor, media, schedule, and player application management."
      },
      organizer: {
        title: "Organizer dashboard",
        running: "Running tournaments",
        brackets: "Active brackets",
        approvals: "Pending approvals",
        note: "Tournament bracket, match result, and participant management."
      },
      admin: {
        title: "Admin panel",
        users: "Users",
        clubs: "Clubs",
        tournaments: "Tournaments",
        reports: "Reports",
        note: "Moderation of clubs, players, news, tournaments, and platform analytics."
      }
    },
    system: {
      errorTitle: "Something went wrong",
      errorText: "Try again or contact support if the issue persists.",
      notFoundTitle: "Page not found",
      notFoundText: "The requested section does not exist or has been moved."
    }
  }
};

for (const locale of Object.keys(dictionaryPatches) as Locale[]) {
  mergeDictionaryBranch(dictionaries[locale], dictionaryPatches[locale] as Record<string, DictionaryNode>);
}

for (const locale of Object.keys(dictionaryBracketHardening) as Locale[]) {
  mergeDictionaryBranch(dictionaries[locale], dictionaryBracketHardening[locale] as Record<string, DictionaryNode>);
}

for (const locale of Object.keys(dictionaryQualityPass) as Locale[]) {
  mergeDictionaryBranch(dictionaries[locale], dictionaryQualityPass[locale] as Record<string, DictionaryNode>);
}

for (const locale of Object.keys(dictionaryShowcasePass) as Locale[]) {
  mergeDictionaryBranch(dictionaries[locale], dictionaryShowcasePass[locale] as Record<string, DictionaryNode>);
}

for (const locale of Object.keys(dictionaryAuditPass) as Locale[]) {
  mergeDictionaryBranch(dictionaries[locale], dictionaryAuditPass[locale] as Record<string, DictionaryNode>);
}

function mergeDictionaryBranch(target: Record<string, DictionaryNode>, patch: Record<string, DictionaryNode>) {
  for (const [key, value] of Object.entries(patch)) {
    const current = target[key];

    if (isBranch(current) && isBranch(value)) {
      mergeDictionaryBranch(current, value);
      continue;
    }

    target[key] = value;
  }
}

function isBranch(value: DictionaryNode | undefined): value is Record<string, DictionaryNode> {
  return Boolean(value) && typeof value === "object";
}
