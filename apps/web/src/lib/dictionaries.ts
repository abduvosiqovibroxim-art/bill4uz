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
      language: "����",
      brand: "Billard.uz Pro",
      platformTag: "����������� ��������� ����������",
      appDescription: "�������� ��������� ��� ������, ��������, ������� � ��������� �����������.",
      readMore: "���������",
      details: "�������",
      all: "���",
      noResults: "�� ������� �������� ������ �� �������.",
      stats: {
        elo: "ELO",
        wins: "������",
        losses: "���������",
        winRate: "�������",
        rating: "�������",
        tables: "�����",
        prizePool: "�������� ����",
        participants: "���������",
        organizer: "�����������",
        format: "������",
        address: "�����",
        club: "����",
        date: "����",
        city: "�����",
        country: "������",
        disciplines: "����������",
        services: "������",
        workHours: "���� ������"
      },
      statuses: {
        upcoming: "�����",
        live: "���� ������",
        finished: "��������"
      },
      categories: {
        platform: "���������",
        tournament: "������",
        product: "�������",
        media: "�����"
      },
      cities: {
        tashkent: "�������",
        samarkand: "���������",
        bukhara: "������",
        andijan: "�������",
        namangan: "��������",
        fergana: "�������",
        nukus: "�����"
      },
      districts: {
        mirabad: "����������� �����",
        registan: "��������",
        oldTown: "������ �����"
      },
      countries: {
        uzbekistan: "����������"
      },
      disciplines: {
        freePyramid: "��������� ��������",
        russianPyramid: "������� ��������"
      },
      services: {
        academy: "��������",
        vip: "VIP-���",
        coaching: "������",
        stream: "��������"
      },
      mediaTypes: {
        highlights: "��������",
        report: "��������",
        interview: "��������"
      },
      localeNames: {
        ru: "���",
        uz: "O'z",
        en: "Eng"
      }
    },
    nav: {
      home: "�������",
      tournaments: "�������",
      players: "������",
      rankings: "��������",
      clubs: "�����",
      news: "�������",
      media: "�����",
      about: "� ���������",
      contacts: "��������",
      signin: "�����",
      signup: "�����������"
    },
    commonUi: {
      exploreTournament: "�������� �������",
      explorePlayer: "������� ������",
      exploreClub: "������� �����",
      readArticle: "������ �������",
      loading: "��������",
      retry: "���������",
      backHome: "�� �������"
    },
    home: {
      eyebrow: "���������� ���������� �����������",
      title: "��������� ��� ��������, ������, ������� � ���������",
      subtitle: "������ ����� ��� �����������, ����������, �����, ���������� � ���������� ���������� ������ �� ��������� � ��������.",
      ctaPlayer: "����� �������",
      ctaClub: "�������� ����",
      ctaTournament: "������� ������",
      tournamentsTitle: "��������� �������",
      tournamentsSubtitle: "���������� ������� �� ������� � ������",
      playersTitle: "��� �������",
      playersSubtitle: "���������� ������ �� ELO � ������������ ������",
      clubsTitle: "���������� �����",
      clubsSubtitle: "�������� � �������������� ��������������� � ��������� ������",
      rankingsTitle: "������������ �������",
      rankingsSubtitle: "������� �������, ������� � ����������� � API � live-�����������",
      newsTitle: "������� � ����������",
      newsSubtitle: "����������� ������, ��������� �������� � �������� ������",
      metrics: {
        clubs: "������������ �����",
        players: "������ � �������",
        tournaments: "������� ������"
      }
    },
    tournaments: {
      title: "�������",
      subtitle: "����������, �������, ������� ������� � �������� �������",
      cityPlaceholder: "��� ������",
      statusPlaceholder: "��� �������",
      disciplinePlaceholder: "��� ����������",
      clubsCount: "������ � ��������",
      empty: "������� �� ��������� ���������� �� �������.",
      detail: {
        schedule: "���������� ������",
        participants: "���������",
        register: "������ ������",
        registration: "�����������",
        venue: "�������"
      }
    },
    players: {
      title: "������",
      subtitle: "������� ������� � �������, ����������� � �����������",
      searchPlaceholder: "����� ������",
      cityPlaceholder: "��� ������",
      sortByElo: "ELO �� ��������",
      sortByWins: "������ ����� �����",
      achievements: "����������",
      history: "������� ��������",
      profile: {
        bio: "������� ������"
      }
    },
    rankings: {
      title: "��������",
      subtitle: "����� �������, ���������� � ������������ �����",
      disciplinesAll: "����� �������",
      regionsAll: "��� �������",
      searchPlaceholder: "����� ������",
      sortByElo: "���������� �� ELO",
      sortByWins: "���������� �� �������",
      headers: {
        place: "#",
        player: "�����",
        city: "�����",
        elo: "ELO",
        winRate: "�������"
      }
    },
    clubs: {
      title: "�����",
      subtitle: "����������� ��������, ������� � ����� ��� ������� ����������",
      cityPlaceholder: "��� ������",
      servicesPlaceholder: "��� ������",
      searchPlaceholder: "����� �����",
      mapTitle: "����� ������",
      mapSubtitle: "����� ���������� � Leaflet ��� Google Maps �� ����������� ��������",
      tournaments: "������� �����",
      reviews: "������� � ������",
      profile: {
        description: "� �����"
      }
    },
    news: {
      title: "�������",
      subtitle: "��������� ��������, ���������� ��������� � ����������� ������",
      categoryPlaceholder: "��� ���������",
      searchPlaceholder: "����� ����������",
      articleBody: "��� �������� ������ ��� ����������� CMS, SEO-���������� � ��������������� �������� �� API."
    },
    media: {
      title: "���� � �����",
      subtitle: "����� ��������, �������� ������� � ����������"
    },
    footer: {
      tagline: "����������� ��������� ���������� ��� ���������� ����� ����������� � ����������� ������������� �����.",
      contact: "�������",
      telegram: "Telegram",
      address: "�����",
      addressValue: "�������, ������������� �����",
      rights: "Billard.uz Pro. ��� ����� ��������."
    },
    forms: {
      name: "���",
      phone: "�������",
      email: "Email",
      password: "������",
      request: "��� ������",
      send: "��������� ������",
      continue: "����������",
      createAccount: "������� �������",
      firstName: "���",
      lastName: "�������",
      role: "����",
      playerRole: "�����",
      clubRole: "����",
      organizerRole: "�����������"
    },
    auth: {
      signinTitle: "����",
      signupTitle: "�����������",
      signinSubtitle: "���� � ���������� �������� � ������",
      signupSubtitle: "�������� �������, ����� �����������, ����������� � ��������� ���������"
    },
    about: {
      title: "� ���������",
      mission: "������: ������� ���������� � data-driven �������������� ��� ���������� ��������� �����������.",
      players: "��� �������",
      clubs: "��� ������",
      organizers: "��� �������������",
      playersText: "������ �� �������, ������ ����������, ������� � �����������.",
      clubsText: "������� ������, �������� ��������, ���������� � ���������� �������.",
      organizersText: "�������� ��������, �������� �����, ���������� � �����������."
    },
    contacts: {
      title: "��������",
      subtitle: "��������� � �������� ��������� �� ��������, ����������� ����� ��� ����������������."
    },
    dashboard: {
      player: {
        title: "������� ������",
        tournaments: "��� �������",
        elo: "������� ELO",
        notifications: "�����������",
        note: "������� ������, ������ �� ������� � ������������ ����������."
      },
      club: {
        title: "������� �����",
        published: "�������������� �������",
        applications: "�������� ������",
        completion: "������������� �������",
        note: "�������� �������� �����, ���������� �����, ����������� � �������� �������."
      },
      organizer: {
        title: "������� ������������",
        running: "������ �������",
        brackets: "�������� �����",
        approvals: "������� �������������",
        note: "���������� ��������� ������, �������, ������������ � �����������."
      },
      admin: {
        title: "�����-������",
        users: "������������",
        clubs: "�����",
        tournaments: "�������",
        reports: "�������",
        note: "��������� ������, �������, ��������, �������� � ��������� ���������."
      }
    },
    system: {
      errorTitle: "���-�� ����� �� ���",
      errorText: "���������� ��� ��� ��� ���������� � ���������, ���� ������ ����������.",
      notFoundTitle: "�������� �� �������",
      notFoundText: "����������� ������ ����������� ��� ��� ���������."
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
        russianPyramid: "Rus piramidasi"
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
      cityPlaceholder: "Barcha shaharlar",
      sortByElo: "ELO bo'yicha kamayish",
      sortByWins: "Eng ko'p g'alaba",
      achievements: "Yutuqlar",
      history: "Turnirlar tarixi",
      profile: {
        bio: "O'yinchi profili"
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
        russianPyramid: "Russian pyramid"
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
      cityPlaceholder: "All cities",
      sortByElo: "ELO descending",
      sortByWins: "Most wins",
      achievements: "Achievements",
      history: "Tournament history",
      profile: {
        bio: "Player profile"
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
