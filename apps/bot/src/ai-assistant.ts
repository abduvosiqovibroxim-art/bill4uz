import { botApiFetch, publicApiFetch } from "./api";

export type BotLanguage = "ru" | "uz";
export type AiQuickAction = "tournaments" | "booking" | "myBookings" | "profile" | "rules" | "menu";

interface AiAnswerInput {
  text: string;
  language: BotLanguage;
  telegramId: string;
}

interface AiAnswer {
  text: string;
  actions: AiQuickAction[];
}

type AiIntent =
  | "slots"
  | "myBookings"
  | "bookingHowTo"
  | "tournaments"
  | "apply"
  | "bracket"
  | "freePyramid"
  | "russianPyramid"
  | "rules"
  | "platform"
  | "terms"
  | "unknown";

const relevantPatterns = [
  /бильярд|биллиард|пирамида|кий|шар|луза|стол|матч|правил|турнир|сетка|брон|клуб|игрок|заявк|кабинет|регистр|результ|bye|bracket|seed|final/i,
  /bilyard|billiard|piramida|kiy|shar|stol|match|qoida|turnir|setka|bron|klub|oyinchi|o'yinchi|ariza|natija|kabinet|royxat|ro'yxat|bye|bracket|seed|final/i,
  /free pyramid|russian pyramid|tournament|booking|club|player|platform|application|dashboard|rules/i
];

const blockedPatterns = [
  /президент|политик|выбор|войн|медицин|диагноз|лекарств|кредит|инвест|акци|крипт|биткоин|налог|код|программ|javascript|python|php|java|погода|рецепт/i,
  /prezident|siyosat|saylov|urush|tibbiyot|dori|kredit|invest|aksiya|kripto|bitcoin|soliq|dastur|kod|ob[- ]?havo|retsept/i,
  /president|politic|election|war|medical|medicine|diagnosis|loan|invest|stock|crypto|bitcoin|tax|programming|weather|recipe/i
];

export class BilliardAiAssistant {
  async answer(input: AiAnswerInput): Promise<AiAnswer> {
    const text = input.text.trim();
    if (!this.isAllowedQuestion(text)) {
      return {
        text: this.outOfDomain(input.language),
        actions: ["tournaments", "booking", "rules"]
      };
    }

    try {
      switch (this.detectIntent(text)) {
        case "slots":
          return await this.answerSlots(text, input.language);
        case "myBookings":
          return await this.answerMyBookings(input.telegramId, input.language);
        case "bookingHowTo":
          return this.staticAnswer(this.bookingHowTo(input.language), ["booking", "myBookings"]);
        case "tournaments":
          return await this.answerTournaments(input.language);
        case "apply":
          return this.staticAnswer(this.applyHowTo(input.language), ["tournaments", "menu"]);
        case "bracket":
          return this.staticAnswer(this.bracketExplanation(input.language), ["tournaments", "rules"]);
        case "freePyramid":
          return this.staticAnswer(this.freePyramidExplanation(input.language), ["rules", "tournaments"]);
        case "russianPyramid":
          return this.staticAnswer(this.russianPyramidExplanation(input.language), ["rules", "tournaments"]);
        case "rules":
          return this.staticAnswer(this.rulesOverview(input.language), ["rules", "tournaments"]);
        case "platform":
          return this.staticAnswer(this.platformHelp(input.language), ["tournaments", "booking", "menu"]);
        case "terms":
          return this.staticAnswer(this.termsHelp(input.language), ["rules", "tournaments"]);
        default:
          return this.staticAnswer(this.domainFallback(input.language), ["tournaments", "booking", "rules"]);
      }
    } catch {
      return {
        text:
          input.language === "uz"
            ? "Hozir ma'lumotni olishning imkoni bo'lmadi. Menyudan kerakli bo'limni tanlang yoki keyinroq urinib ko'ring."
            : "Сейчас не удалось получить данные. Выберите нужный раздел в меню или попробуйте позже.",
        actions: ["menu", "tournaments"]
      };
    }
  }

  private isAllowedQuestion(text: string) {
    if (!text || blockedPatterns.some((pattern) => pattern.test(text))) {
      return false;
    }

    return relevantPatterns.some((pattern) => pattern.test(text));
  }

  private detectIntent(text: string): AiIntent {
    const value = text.toLowerCase();

    if (/(мои\s+брони|моя\s+брон|bronlarim|mening\s+bron|my\s+bookings)/i.test(value)) {
      return "myBookings";
    }

    if (/(свободн.*слот|свободн.*врем|free\s+slot|bo.?sh.*vaqt|slot)/i.test(value)) {
      return "slots";
    }

    if (/(заброни|брон|book|bron\s+qil|stol\s+bron|отмен.*брон|cancel.*booking)/i.test(value)) {
      return "bookingHowTo";
    }

    if (/(подать\s+заяв|заявк|apply|ariza|qatnash)/i.test(value)) {
      return "apply";
    }

    if (/(турнир|tournament|turnir|соревн)/i.test(value)) {
      return "tournaments";
    }

    if (/(сетка|bracket|bye|seed|посев|финал|final|setka)/i.test(value)) {
      return "bracket";
    }

    if (/(свободн.*пирам|free\s+pyramid|erkin\s+piramida)/i.test(value)) {
      return "freePyramid";
    }

    if (/(русск.*пирам|russian\s+pyramid|rus\s+piramidasi)/i.test(value)) {
      return "russianPyramid";
    }

    if (/(правил|qoida|rules|как\s+игра|match|матч)/i.test(value)) {
      return "rules";
    }

    if (/(регистр|кабинет|роль|profile|dashboard|platform|платформ|kabinet|ro'yxat|royxat)/i.test(value)) {
      return "platform";
    }

    if (/(термин|bye|seed|bracket|final|финал|посев)/i.test(value)) {
      return "terms";
    }

    return "unknown";
  }

  private async answerSlots(text: string, language: BotLanguage): Promise<AiAnswer> {
    const clubs = await publicApiFetch<Array<any>>("/clubs");
    const club = this.findMentionedClub(text, clubs);
    if (!club) {
      return {
        text:
          language === "uz"
            ? "Bo'sh vaqtni ko'rish uchun avval bilyard joyini tanlang."
            : "Чтобы посмотреть свободное время, сначала выберите бильярдное место.",
        actions: ["booking"]
      };
    }

    const date = tashkentDate(0);
    const availability = await botApiFetch<Array<any>>(
      `/bot/internal/clubs/${club.id}/booking-slots?date=${date}&durationMinutes=60`
    );
    const slots = availability
      .flatMap((table) =>
        (table.slots ?? []).map((slot: any) => `${table.tableName ?? table.tableNumber} / ${formatDateTime(slot.startAt)}`)
      )
      .slice(0, 6);

    if (slots.length === 0) {
      return {
        text:
          language === "uz"
            ? "Bugun bu joyda 1 soatlik bo'sh vaqt topilmadi."
            : "На сегодня в этом месте нет свободных слотов на 1 час.",
        actions: ["booking"]
      };
    }

    return {
      text: `${resolveText(club.name)}\n${language === "uz" ? "Bugungi bo'sh vaqtlar:" : "Свободное время на сегодня:"}\n${slots.join("\n")}`,
      actions: ["booking"]
    };
  }

  private async answerMyBookings(telegramId: string, language: BotLanguage): Promise<AiAnswer> {
    try {
      const bookings = await botApiFetch<Array<any>>(`/bot/internal/bookings/${telegramId}`);
      if (bookings.length === 0) {
        return {
          text: language === "uz" ? "Sizda hozircha bronlar yo'q." : "У вас пока нет броней.",
          actions: ["booking"]
        };
      }

      const lines = bookings.slice(0, 6).map((booking) => {
        const clubName = resolveText(booking.club?.name) || "-";
        const tableName = booking.table?.name ?? "-";
        return `${clubName} | ${tableName} | ${formatDateTime(booking.startAt)} | ${booking.status}`;
      });

      return {
        text: `${language === "uz" ? "Mening bronlarim:" : "Ваши брони:"}\n${lines.join("\n")}`,
        actions: ["myBookings", "booking"]
      };
    } catch {
      return {
        text:
          language === "uz"
            ? "Shaxsiy bronlarni ko'rish uchun Telegram akkauntingizni saytdagi profilingizga bog'lang."
            : "Чтобы видеть свои брони, привяжите Telegram к аккаунту на сайте.",
        actions: ["menu", "booking"]
      };
    }
  }

  private async answerTournaments(language: BotLanguage): Promise<AiAnswer> {
    const tournaments = await publicApiFetch<Array<any>>("/tournaments");
    if (tournaments.length === 0) {
      return {
        text: language === "uz" ? "Hozircha turnirlar yo'q." : "Сейчас турниров нет.",
        actions: ["menu"]
      };
    }

    const lines = tournaments.slice(0, 6).map((tournament, index) => {
      return `${index + 1}. ${resolveText(tournament.title)} | ${tournament.status} | ${formatDateTime(tournament.startsAt)}`;
    });

    return {
      text: `${language === "uz" ? "Turnirlar:" : "Турниры:"}\n${lines.join("\n")}`,
      actions: ["tournaments", "menu"]
    };
  }

  private staticAnswer(text: string, actions: AiQuickAction[]): AiAnswer {
    return { text, actions };
  }

  private bookingHowTo(language: BotLanguage) {
    return language === "uz"
      ? "Bron qilish: joyni tanlang, vaqtni tanlang, stolni tanlang va tasdiqlang. Bronlaringizni \"Mening bronlarim\" bo'limida ko'rasiz."
      : "Бронь стола: выберите место, время, стол и подтвердите. Свои брони можно открыть в разделе «Мои брони».";
  }

  private applyHowTo(language: BotLanguage) {
    return language === "uz"
      ? "Turnirga ariza berish uchun PLAYER akkauntini bog'lang, turnirni tanlang va ariza yuboring. Tashkilotchi uni tasdiqlaydi yoki rad etadi."
      : "Чтобы подать заявку, привяжите аккаунт PLAYER, выберите турнир и отправьте заявку. Организатор подтвердит или отклонит её.";
  }

  private bracketExplanation(language: BotLanguage) {
    return language === "uz"
      ? "Setka tasdiqlangan ishtirokchilar poolidan yaratiladi. Seed - o'yinchining joyi. BYE - raqibsiz keyingi bosqichga o'tish."
      : "Сетка строится из подтверждённых участников. Seed - место игрока в посеве. BYE - проход дальше без соперника.";
  }

  private freePyramidExplanation(language: BotLanguage) {
    return language === "uz"
      ? "Erkin piramida - rus bilyardi turi. Aniq format va cheklovlar turnir reglamentida ko'rsatiladi."
      : "Свободная пирамида - дисциплина русского бильярда. Точный формат и ограничения задаются регламентом турнира.";
  }

  private russianPyramidExplanation(language: BotLanguage) {
    return language === "uz"
      ? "Rus piramidasi - katta stol, og'ir sharlar va tor cho'ntaklar bilan o'ynaladigan bilyard yo'nalishi."
      : "Русская пирамида - направление бильярда с большим столом, тяжёлыми шарами и узкими лузами.";
  }

  private rulesOverview(language: BotLanguage) {
    return language === "uz"
      ? "Asosiy qoida: zarba to'g'ri bo'lishi, shar cho'ntakka tushishi yoki bortga tegishi kerak. Turnir formati reglamentda ko'rsatiladi."
      : "Базово: удар должен быть корректным, шар должен быть забит или после контакта должен быть борт. Формат турнира смотрите в регламенте.";
  }

  private platformHelp(language: BotLanguage) {
    return language === "uz"
      ? "Platformada PLAYER turnirlarda qatnashadi, ORGANIZER turnir yaratadi, ADMIN bilyard joylari va platformani moderatsiya qiladi."
      : "На платформе PLAYER участвует в турнирах, ORGANIZER создаёт турниры, ADMIN модерирует бильярдные места и платформу.";
  }

  private termsHelp(language: BotLanguage) {
    return language === "uz"
      ? "Terminlar: bracket - turnir setkasi; seed - ishtirokchi o'rni; BYE - bosqichni raqibsiz o'tish; final - oxirgi match."
      : "Термины: bracket - турнирная сетка; seed - место в посеве; BYE - проход без соперника; final - последний матч.";
  }

  private domainFallback(language: BotLanguage) {
    return language === "uz"
      ? "Aniqroq so'rang: qoidalar, turnirlar, bron qilish yoki platformadan foydalanish bo'yicha yordam bera olaman."
      : "Спросите конкретнее: я помогаю с правилами, турнирами, бронью и использованием платформы.";
  }

  private outOfDomain(language: BotLanguage) {
    return language === "uz"
      ? "Men faqat bilyard va billiard-platform bo'yicha yordam beraman. Turnirlar, bron yoki qoidalar haqida so'rang."
      : "Я помогаю только по бильярду и billiard-platform. Спросите про турниры, бронь, правила или сетку.";
  }

  private findMentionedClub(text: string, clubs: Array<any>) {
    const normalizedText = normalize(text);
    return clubs.find((club) => {
      const name = normalize(resolveText(club.name));
      return name.length >= 3 && normalizedText.includes(name);
    });
  }
}

function resolveText(value: any) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.ru ?? value.uz ?? value.en ?? "";
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-zа-яё0-9]+/giu, "");
}

function tashkentDate(offsetDays: number) {
  const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(date);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
