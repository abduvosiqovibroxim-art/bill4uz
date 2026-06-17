import type { Locale } from "./types";

export const dictionaryQualityPass: Record<Locale, Record<string, unknown>> = {
  ru: {
    commonUi: {
      exploreTournaments: "�������� �������"
    },
    home: {
      sections: {
        rankingsSubtitle: "������������ ������� �� ����� ������, ����� � ������������."
      }
    },
    clubs: {
      subtitle: "����������� �������� � ����������, ��������� � ��������� �����������.",
      networkCities: "������ ����"
    }
  },
  uz: {
    commonUi: {
      exploreTournaments: "Turnirlarni ko'rish"
    },
    home: {
      sections: {
        rankingsSubtitle: "Mavsum formasi, ballar va barqarorlik bo'yicha milliy reyting."
      }
    },
    clubs: {
      subtitle: "Kontaktlar, servislar va turnir faolligi ko'rsatilgan tasdiqlangan maydonlar.",
      networkCities: "Tarmoq shaharlari"
    }
  },
  en: {
    commonUi: {
      exploreTournaments: "Explore tournaments"
    },
    home: {
      sections: {
        rankingsSubtitle: "National ranking by current form, points, and seasonal consistency."
      }
    },
    clubs: {
      subtitle: "Verified venues with contacts, services, and tournament activity.",
      networkCities: "Network cities"
    }
  }
};
