import type { Locale } from "./types";

export const dictionaryShowcasePass: Record<Locale, Record<string, unknown>> = {
  ru: {
    commonUi: {
      followLive: "������� ������",
      openTournamentCenter: "������� ������",
      seeProfile: "�������� �������",
      seeClub: "�������� ����",
      seeAllNews: "��� �������",
      discoverMedia: "������� �����",
      seeAllPlayers: "��� ������",
      seeAllClubs: "��� �����"
    },
    home: {
      showcase: {
        heroTitle: "����� ��������� ��� ��������, ������ � ��������� ��������",
        heroSubtitle:
          "Billard.uz Pro ���������� ��������� �������� ��������, live-�����, �������, �����, ������� � �������� ������������� � ���� ������� �������.",
        liveNow: "Live ������",
        stage: "������",
        matchesPlayed: "������ �������",
        matchesRemaining: "������ ��������",
        latestChampion: "��������� �������",
        awaitingFinal: "������� ����������� ����� ������",
        championFallback: "��������� ���� ��� �� ������, �� ����� � ���������� ��� �������� ��������.",
        featuredPlayerTitle: "����� ������",
        featuredClubTitle: "���� ������",
        semifinalStage: "������������� ������",
        quarterfinalStage: "����������������� ������",
        mainBracketStage: "�������� �����",
        liveControlEyebrow: "Live-�����",
        liveControlTitle: "��� ���������� �� ��������� ����� ������",
        liveControlSubtitle:
          "�������� �������, ��������� ����������, ������ ������� � �����-������� � ����� �����.",
        liveTrackerEmpty: "������ ��� ��������� live-�����, �� ��������� ����� ��� ������������.",
        latestUpdate: "��������� ����������",
        awaitingLive: "�������� ���������� live-�����",
        latestUpdateFallback: "��� ������ ���� ������� � LIVE ��� FINISHED, �� �������� �����.",
        recentUpdatesTitle: "��������� ����������",
        mediaTitle: "����� � highlights",
        mediaFallback: "���� ������ ��������� � ��������� ������ ���������.",
        assets: "����������",
        howItWorksEyebrow: "��� ��� ��������",
        howItWorksTitle: "�� ������ �� ��������",
        howItWorksSubtitle:
          "��������� ��������� �����������, ��������� �������� �������, live-���������� � ���������� � ���� �������� ��������.",
        steps: {
          applyTitle: "����� ����� ������",
          applyText: "�����������, ������� � ��������� � ����� ���� ����� ������ ������� ������� � �����.",
          trackTitle: "������� ������ �� �����",
          trackText: "��������� �������� ���������� ����������, �����, ����������, ����������, ���������� � ��������� ��� �����.",
          manageTitle: "����������� ���� ������",
          manageText: "������� ��������� �����������, ���������� �����, ��������� ������ � ��������� ���������."
        },
        audiencesEyebrow: "��� ���� ���",
        audiencesTitle: "���� ��������� ��� �������, ������ � �������������",
        audiencesSubtitle:
          "� ������ ���� ���� ������� ��������, � ��������� �������� � �������� ������ �������� �������.",
        audiencePlayersTitle: "��� �������",
        audiencePlayersText:
          "�������, ������� ��������, ������� � ������� ������ � �������� �������� ��� ����� � �����������.",
        audienceClubsTitle: "��� ������",
        audienceClubsText:
          "��������� ������� ��������, ��������� ����������, �������� � ����� ��� ����� ������.",
        audienceOrganizersTitle: "��� �������������",
        audienceOrganizersText:
          "���������� ������� ��� �����, ���������� � ����������� ��� ���������� backend ��� ������ ������.",
        nextToStart: "��������� ������",
        upcomingSubtitle: "��������� ������� ��� ������ � ���������, ����������� � ����������.",
        latestNewsTitle: "������� �����"
      }
    },
    tournamentCenter: {
      showcase: {
        matchesPlayed: "������� ������",
        matchesRemaining: "�������� ������",
        stage: "������� ������",
        finalPair: "��������� ����",
        livePulse: "Live-�����",
        awaitingNextMatch: "�������� ���������� live-�����",
        bracketReady: "����� ������ � ���������",
        latestResult: "��������� ���������",
        storyline: "��� �������",
        storylineFallback: "��� ������� ������������ �� ���� ����������� �����.",
        championResolved: "����� ������, ������� ��������, ���������� �������������.",
        upcomingStory: "������ ����� ��������: ������, ��������� � ����� �������� �������.",
        liveStory: "������ ���: ��������� ������������ �� �����, ��������� �������� ����������� �� �������� ������.",
        awaitingChampion: "������� ��� �� ��������"
      }
    }
  },
  uz: {
    commonUi: {
      followLive: "Jonli kuzatish",
      openTournamentCenter: "Turnirni ochish",
      seeProfile: "Profilni ko'rish",
      seeClub: "Klubni ko'rish",
      seeAllNews: "Barcha yangiliklar",
      discoverMedia: "Media ochish",
      seeAllPlayers: "Barcha o'yinchilar",
      seeAllClubs: "Barcha klublar"
    },
    home: {
      showcase: {
        heroTitle: "Billiard turnirlari, klublari va reytinglari uchun jonli platforma",
        heroSubtitle:
          "Billard.uz Pro ommaviy turnir sahifalari, jonli setkalar, o'yinchilar, klublar, yangiliklar va tashkilotchilar kabinetini bitta mahsulotga birlashtiradi.",
        liveNow: "Hozir jonli",
        stage: "Bosqich",
        matchesPlayed: "Yakunlangan matchlar",
        matchesRemaining: "Qolgan matchlar",
        latestChampion: "So'nggi chempion",
        awaitingFinal: "Chempion finaldan keyin aniqlanadi",
        championFallback: "Final hali yopilmagan, lekin setka va natijalar ommaviy ko'rinishda.",
        featuredPlayerTitle: "Hafta o'yinchisi",
        featuredClubTitle: "Hafta klubi",
        semifinalStage: "Yarim final bosqichi",
        quarterfinalStage: "Chorak final bosqichi",
        mainBracketStage: "Asosiy setka",
        liveControlEyebrow: "Jonli markaz",
        liveControlTitle: "Platformada hozir nima bo'layapti",
        liveControlSubtitle:
          "Jonli turnirlar, so'nggi yangilanishlar, oxirgi chempion va media hikoyalar bir joyda.",
        liveTrackerEmpty: "Hozir faol jonli match yo'q, lekin yaqin setkalar allaqachon e'lon qilingan.",
        latestUpdate: "So'nggi yangilanish",
        awaitingLive: "Keyingi jonli match kutilmoqda",
        latestUpdateFallback: "Match LIVE yoki FINISHED bo'lgach, shu blokda ko'rinadi.",
        recentUpdatesTitle: "So'nggi yangilanishlar",
        mediaTitle: "Media va highlights",
        mediaFallback: "Bu albom platformaning ommaviy ma'lumotlariga ulangan.",
        assets: "material",
        howItWorksEyebrow: "Qanday ishlaydi",
        howItWorksTitle: "Arizadan chempiongacha",
        howItWorksSubtitle:
          "Platforma ro'yxatdan o'tish, ommaviy turnir sahifasi, jonli yangilanishlar va boshqaruv kabinetini bitta oqimga birlashtiradi.",
        steps: {
          applyTitle: "O'yinchi ariza topshiradi",
          applyText: "Ro'yxatdan o'tish, turnirda qatnashish va setkaga kirish yagona o'yinchi va rol tizimi orqali ishlaydi.",
          trackTitle: "Tomoshabin jarayonni kuzatadi",
          trackText: "Turnir sahifasi ma'lumot, setka, ishtirokchilar, jadval, natijalar va reglamentni loginlarsiz ko'rsatadi.",
          manageTitle: "Tashkilotchi turnirni boshqaradi",
          manageText: "Kabinet ishtirokchilar, setka yaratish, match statuslari va final chempionini boshqaradi."
        },
        audiencesEyebrow: "Kimlar uchun",
        audiencesTitle: "O'yinchilar, klublar va tashkilotchilar uchun bitta platforma",
        audiencesSubtitle:
          "Har bir rolning o'z oqimi bor, ommaviy sahifalar va real ma'lumotlar esa yagona qoladi.",
        audiencePlayersTitle: "O'yinchilar uchun",
        audiencePlayersText:
          "Reyting, turnirlar tarixi, profil sahifasi va faol tadbirlarga tez kirish bitta joyda.",
        audienceClubsTitle: "Klublar uchun",
        audienceClubsText:
          "Klubning ommaviy profili, turnir faolligi, kontaktlar va yangi mehmonlar uchun media.",
        audienceOrganizersTitle: "Tashkilotchilar uchun",
        audienceOrganizersText:
          "Setka, ishtirokchilar va natijalarni boshqarish uchun himoyalangan kabinet.",
        nextToStart: "Tez oradagi startlar",
        upcomingSubtitle: "Yaqin turnirlar ko'rish, ro'yxatdan o'tish va ulashish uchun tayyor.",
        latestNewsTitle: "Sahna hikoyalari"
      }
    },
    tournamentCenter: {
      showcase: {
        matchesPlayed: "O'ynalgan matchlar",
        matchesRemaining: "Qolgan matchlar",
        stage: "Joriy bosqich",
        finalPair: "Final juftligi",
        livePulse: "Jonli holat",
        awaitingNextMatch: "Keyingi jonli match kutilmoqda",
        bracketReady: "Setka ko'rish uchun tayyor",
        latestResult: "So'nggi natija",
        storyline: "Turnir jarayoni",
        storylineFallback: "Turnir jarayoni setka rivojlangani sari shakllanadi.",
        championResolved: "Final yopildi, chempion aniqlangan va natijalar tasdiqlangan.",
        upcomingStory: "Turnir tez orada boshlanadi: tarkib, reglament va setka oldindan ko'rinadi.",
        liveStory: "Turnir davom etmoqda: ishtirokchilar setka bo'ylab harakatlanmoqda va ommaviy sahifa real ma'lumot bilan yangilanmoqda.",
        awaitingChampion: "Chempion hali aniqlanmagan"
      }
    }
  },
  en: {
    commonUi: {
      followLive: "Follow live",
      openTournamentCenter: "Open tournament",
      seeProfile: "View profile",
      seeClub: "View club",
      seeAllNews: "All news",
      discoverMedia: "Open media",
      seeAllPlayers: "All players",
      seeAllClubs: "All clubs"
    },
    home: {
      showcase: {
        heroTitle: "A live platform for billiards tournaments, clubs, and rankings",
        heroSubtitle:
          "Billard.uz Pro brings public tournament pages, live brackets, players, clubs, news, and organizer dashboards into one product.",
        liveNow: "Live now",
        stage: "Stage",
        matchesPlayed: "Matches played",
        matchesRemaining: "Matches remaining",
        latestChampion: "Latest champion",
        awaitingFinal: "Champion will be defined after the final",
        championFallback: "The final is not closed yet, but the bracket and results are already public.",
        featuredPlayerTitle: "Player of the week",
        featuredClubTitle: "Club of the week",
        semifinalStage: "Semifinal stage",
        quarterfinalStage: "Quarterfinal stage",
        mainBracketStage: "Main bracket",
        liveControlEyebrow: "Live center",
        liveControlTitle: "What is happening on the platform right now",
        liveControlSubtitle:
          "Live tournaments, latest updates, the newest champion, and media stories in one block.",
        liveTrackerEmpty: "There is no active live match right now, but upcoming brackets are already public.",
        latestUpdate: "Latest update",
        awaitingLive: "Waiting for the next live match",
        latestUpdateFallback: "As soon as a match switches to LIVE or FINISHED, it will appear here.",
        recentUpdatesTitle: "Recent updates",
        mediaTitle: "Media and highlights",
        mediaFallback: "This gallery is already connected to public platform data.",
        assets: "assets",
        howItWorksEyebrow: "How it works",
        howItWorksTitle: "From application to champion",
        howItWorksSubtitle:
          "The platform connects tournament entry, public page, live updates, and management dashboard into one flow.",
        steps: {
          applyTitle: "The player applies",
          applyText: "Registration, participation, and bracket entry all run through the same player and role system.",
          trackTitle: "The audience tracks progress",
          trackText: "The tournament page shows info, bracket, participants, schedule, results, and regulation without login.",
          manageTitle: "The organizer runs the tournament",
          manageText: "The dashboard manages participants, bracket generation, match statuses, and the final champion."
        },
        audiencesEyebrow: "Who it is for",
        audiencesTitle: "One platform for players, clubs, and organizers",
        audiencesSubtitle:
          "Each role has its own workflow, while public pages and real data stay consistent.",
        audiencePlayersTitle: "For players",
        audiencePlayersText:
          "Rankings, tournament history, profile page, and fast access to active events without messy schedules.",
        audienceClubsTitle: "For clubs",
        audienceClubsText:
          "A public venue profile, tournament activity, contacts, and media for new visitors.",
        audienceOrganizersTitle: "For organizers",
        audienceOrganizersText:
          "A protected dashboard for bracket, participant, and result management.",
        nextToStart: "Starting soon",
        upcomingSubtitle: "Upcoming tournaments are ready for viewing, registration, and sharing.",
        latestNewsTitle: "Stories from the scene"
      }
    },
    tournamentCenter: {
      showcase: {
        matchesPlayed: "Matches played",
        matchesRemaining: "Matches remaining",
        stage: "Current stage",
        finalPair: "Final pairing",
        livePulse: "Live pulse",
        awaitingNextMatch: "Waiting for the next live match",
        bracketReady: "Bracket is ready to explore",
        latestResult: "Latest result",
        storyline: "Tournament storyline",
        storylineFallback: "The tournament storyline will emerge as the bracket advances.",
        championResolved: "The final is closed, the champion is defined, and the results are locked in.",
        upcomingStory: "The tournament starts soon: lineup, regulation, and bracket are already visible.",
        liveStory: "The tournament is live: players move through the bracket and the public page updates from real data.",
        awaitingChampion: "Champion not defined yet"
      }
    }
  }
};
