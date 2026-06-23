import { createServer } from "http";
import { Bot, GrammyError, InlineKeyboard, Keyboard, session, webhookCallback } from "grammy";
import type { Context, SessionFlavor } from "grammy";
import { BotApiError, botApiFetch, publicApiFetch, toBotErrorMessage } from "./api";
import { validateProductionEnv } from "./production-env";
import type { BotSessionData } from "./types";

type BotContext = Context & SessionFlavor<BotSessionData>;
type BotLanguage = "ru" | "uz";
type JoinStatus = "joined" | "already_participant" | "requires_confirmation" | "full";
type GroupMatchStatus = "LIVE" | "FINISHED" | "CANCELLED";

interface SessionInfo {
  linked: boolean;
  user?: {
    id: string;
    role: "PLAYER" | "CLUB" | "ORGANIZER" | "ADMIN";
    language?: BotLanguage;
    playerProfile?: {
      id: string;
      fullName: string;
    } | null;
  };
}

interface TournamentItem {
  id: string;
  title: string;
  startsAt: string;
  clubName: string;
  disciplineName: string;
  participantsCount: number;
  capacity: number | null;
  status: string;
  canJoinInBot: boolean;
  siteUrl: string;
}

interface MyTournamentItem {
  id: string;
  title: string;
  startsAt: string;
  clubName: string;
  status: string;
  siteUrl: string;
}

interface GroupMatch {
  id: string;
  chatId: string;
  messageId: number | null;
  playerOneTelegramId: string;
  playerOneName: string;
  playerTwoTelegramId: string;
  playerTwoName: string;
  scoreOne: number;
  scoreTwo: number;
  status: GroupMatchStatus;
  createdByTelegramId: string;
  createdAt: string;
  finishedAt: string | null;
  headToHead?: {
    playerOneWins: number;
    playerTwoWins: number;
  };
}

interface TelegramPlayerLookup {
  found: boolean;
  username: string;
  telegramId?: string;
  telegramUsername?: string | null;
  fullName?: string;
  language?: string;
}

const WEB_APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "").trim() ?? "";
const token = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
const bot = new Bot<BotContext>(token || "telegram-bot-disabled");

const text: Record<BotLanguage, Record<string, string>> = {
  ru: {
    chooseLanguage: "Выберите язык",
    menu: "Главное меню",
    registration: "Регистрация",
    tournaments: "Турниры",
    myTournaments: "Мои турниры",
    groupMatch: "Матч 1 на 1",
    matchScores: "Счёт игр",
    askName: "Введите имя игрока",
    askCity: "Введите город",
    askPhone: "Отправьте телефон через кнопку ниже",
    sendPhone: "Отправить телефон",
    alreadyRegistered: "Вы уже зарегистрированы",
    registered: "Регистрация завершена",
    phoneExists: "Этот телефон уже есть на сайте. Можно привязать Telegram к существующему аккаунту.",
    linkExisting: "Привязать Telegram",
    linked: "Telegram привязан к существующему аккаунту",
    siteOnly: "Организаторы регистрируются на сайте",
    openSite: "Открыть сайт",
    noTournaments: "Турниров пока нет",
    noMyTournaments: "Вы пока не участвуете в турнирах",
    participate: "Участвовать",
    openTournament: "Открыть турнир",
    joined: "Вы участник турнира",
    alreadyParticipant: "Вы уже участник",
    requiresSite: "Этот турнир требует подтверждения на сайте",
    full: "Мест нет",
    registerFirst: "Сначала зарегистрируйтесь",
    groupHelp: "Матч 1 на 1 работает в Telegram-группе. Добавьте бота в группу и ответьте /match на сообщение соперника.",
    askOpponentUsername: "Введите Telegram username друга. Например: @username",
    opponentNotFound: "Игрок с таким Telegram username не найден. Друг должен открыть бота и пройти регистрацию.",
    cannotInviteSelf: "Нельзя создать матч с самим собой",
    directInviteSent: "Матч создан. Приглашение отправлено другу.",
    directInviteSendFailed: "Матч создан, но бот не смог отправить сообщение другу. Попросите друга открыть бота и написать /start.",
    directInviteReceived: "Вас пригласили на матч 1 на 1",
    openBot: "Открыть бота",
    groupOnly: "Эта команда работает в группе",
    replyRequired: "Ответьте командой /match на сообщение соперника",
    botOpponent: "Нельзя создать матч с ботом",
    activeMatches: "Активные матчи группы",
    noActiveMatches: "Активных матчей нет",
    myMatchesTitle: "Мои матчи",
    noMatches: "Матчей пока нет",
    notAllowed: "Вы не участник этого матча",
    tiedFinish: "Нельзя завершить матч при ничье",
    closedMatch: "Матч уже завершён",
    cancelled: "Матч отменён"
  },
  uz: {
    chooseLanguage: "Tilni tanlang",
    menu: "Asosiy menyu",
    registration: "Ro'yxatdan o'tish",
    tournaments: "Turnirlar",
    myTournaments: "Mening turnirlarim",
    groupMatch: "1 ga 1 o'yin",
    matchScores: "O'yinlar hisobi",
    askName: "O'yinchi ismini kiriting",
    askCity: "Shaharni kiriting",
    askPhone: "Telefon raqamingizni quyidagi tugma orqali yuboring",
    sendPhone: "Telefonni yuborish",
    alreadyRegistered: "Siz allaqachon ro'yxatdan o'tgansiz",
    registered: "Ro'yxatdan o'tish yakunlandi",
    phoneExists: "Bu telefon saytda mavjud. Telegramni mavjud akkauntga bog'lash mumkin.",
    linkExisting: "Telegramni bog'lash",
    linked: "Telegram mavjud akkauntga bog'landi",
    siteOnly: "Klublar va tashkilotchilar saytda ro'yxatdan o'tadi",
    openSite: "Saytni ochish",
    noTournaments: "Hozircha turnirlar yo'q",
    noMyTournaments: "Siz hali turnirlarda qatnashmayapsiz",
    participate: "Qatnashish",
    openTournament: "Turnirni ochish",
    joined: "Siz turnir ishtirokchisisiz",
    alreadyParticipant: "Siz allaqachon ishtirokchisiz",
    requiresSite: "Bu turnir tasdiqlashni saytda talab qiladi",
    full: "Joy yo'q",
    registerFirst: "Avval ro'yxatdan o'ting",
    groupHelp: "1 ga 1 o'yin Telegram guruhida ishlaydi. Botni guruhga qo'shing va raqib xabariga /match deb javob bering.",
    askOpponentUsername: "Do'stingizning Telegram username'ini kiriting. Masalan: @username",
    opponentNotFound: "Bunday Telegram username bilan o'yinchi topilmadi. Do'stingiz botni ochib ro'yxatdan o'tishi kerak.",
    cannotInviteSelf: "O'zingiz bilan o'yin yaratib bo'lmaydi",
    directInviteSent: "O'yin yaratildi. Taklif do'stingizga yuborildi.",
    directInviteSendFailed: "O'yin yaratildi, lekin bot do'stingizga xabar yubora olmadi. Do'stingiz botni ochib /start yozsin.",
    directInviteReceived: "Sizni 1 ga 1 o'yinga taklif qilishdi",
    openBot: "Botni ochish",
    groupOnly: "Bu buyruq guruhda ishlaydi",
    replyRequired: "Raqib xabariga /match deb javob bering",
    botOpponent: "Bot bilan o'yin yaratib bo'lmaydi",
    activeMatches: "Guruhdagi faol o'yinlar",
    noActiveMatches: "Faol o'yinlar yo'q",
    myMatchesTitle: "Mening o'yinlarim",
    noMatches: "Hozircha o'yinlar yo'q",
    notAllowed: "Siz bu o'yin ishtirokchisi emassiz",
    tiedFinish: "Durrang hisobda o'yinni yakunlab bo'lmaydi",
    closedMatch: "O'yin allaqachon yakunlangan",
    cancelled: "O'yin bekor qilindi"
  }
};

bot.use(session({ initial: (): BotSessionData => ({}) }));

bot.catch((error) => {
  console.error("telegram bot handler failed", error.error);
});

bot.command("start", async (ctx) => {
  if (!isPrivateChat(ctx)) {
    await ctx.reply("Откройте бота в личных сообщениях");
    return;
  }

  const payload = ctx.match?.trim();
  if (payload?.startsWith("link_")) {
    await consumeLegacyLink(ctx, payload.slice("link_".length));
    return;
  }

  await showLanguageChoice(ctx);
});

bot.command("menu", async (ctx) => {
  if (!isPrivateChat(ctx)) {
    await ctx.reply("Откройте меню в личных сообщениях");
    return;
  }

  await sendMainMenu(ctx);
});

bot.callbackQuery(/^lang:(ru|uz)$/, async (ctx) => {
  const language = ctx.match[1] as BotLanguage;
  ctx.session.language = language;
  const telegramId = requireTelegramId(ctx);

  try {
    await botApiFetch("/bot/internal/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId, language })
    });
  } catch {
    // The user may not be registered yet; language still stays in the Telegram session.
  }

  await ctx.answerCallbackQuery();
  await editOrReply(ctx, t(language, "menu"), await mainMenuKeyboard(ctx, language));
});

bot.callbackQuery("menu", async (ctx) => {
  await ctx.answerCallbackQuery();
  await editOrReply(ctx, t(lang(ctx), "menu"), await mainMenuKeyboard(ctx, lang(ctx)));
});

bot.callbackQuery("reg:start", async (ctx) => {
  const language = lang(ctx);
  const sessionInfo = await getLinkedSessionSafe(requireTelegramId(ctx));
  if (sessionInfo.linked && sessionInfo.user?.role === "PLAYER") {
    await ctx.answerCallbackQuery({ text: t(language, "alreadyRegistered"), show_alert: true });
    return;
  }

  ctx.session.registration = { step: "name" };
  await ctx.answerCallbackQuery();
  await ctx.reply(t(language, "askName"));
});

bot.callbackQuery("reg:link_existing", async (ctx) => {
  const language = lang(ctx);
  const phone = ctx.session.existingPhone;
  if (!phone) {
    await ctx.answerCallbackQuery({ text: t(language, "registerFirst"), show_alert: true });
    return;
  }

  try {
    const result = await botApiFetch<{ status: string }>("/bot/internal/register/link-existing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegramId: requireTelegramId(ctx),
        telegramUsername: ctx.from?.username ?? undefined,
        phone
      })
    });

    ctx.session.existingPhone = undefined;
    await ctx.answerCallbackQuery();
    await ctx.reply(result.status === "site_required" ? t(language, "siteOnly") : t(language, "linked"), {
      reply_markup: await mainMenuKeyboard(ctx, language)
    });
  } catch (error) {
    await ctx.answerCallbackQuery({ text: toBotErrorMessage(error), show_alert: true });
  }
});

bot.callbackQuery("tournaments", async (ctx) => {
  await ctx.answerCallbackQuery();
  await sendUpcomingTournaments(ctx);
});

bot.callbackQuery(/^join:([^:]+)$/, async (ctx) => {
  const language = lang(ctx);
  const tournamentId = ctx.match[1];

  try {
    const result = await botApiFetch<{ status: JoinStatus; siteUrl?: string }>(`/bot/internal/tournaments/${tournamentId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: requireTelegramId(ctx) })
    });

    const message =
      result.status === "joined"
        ? t(language, "joined")
        : result.status === "already_participant"
          ? t(language, "alreadyParticipant")
          : result.status === "full"
            ? t(language, "full")
            : t(language, "requiresSite");

    await ctx.answerCallbackQuery({ text: message, show_alert: true });

    if (result.status === "requires_confirmation" && result.siteUrl) {
      const keyboard = tournamentUrlKeyboard(t(language, "openSite"), result.siteUrl);
      await ctx.reply(message, keyboard ? { reply_markup: keyboard } : undefined);
    }
  } catch (error) {
    if (error instanceof BotApiError && error.status === 401) {
      await ctx.answerCallbackQuery({ text: t(language, "registerFirst"), show_alert: true });
      return;
    }

    await ctx.answerCallbackQuery({ text: toBotErrorMessage(error), show_alert: true });
  }
});

bot.callbackQuery("my_tournaments", async (ctx) => {
  await ctx.answerCallbackQuery();
  await sendMyTournaments(ctx);
});

bot.callbackQuery("my_matches", async (ctx) => {
  await ctx.answerCallbackQuery();
  await sendMyMatches(ctx);
});

bot.callbackQuery(/^standings:([^:]+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const tournamentId = ctx.match[1];

  try {
    const data = await publicApiFetch<{
      finished: boolean;
      standings: Array<{ position: number; name: string; wins: number; losses: number; points: number; scoreDiff: number }>;
    }>(`/tournaments/${tournamentId}/standings`);

    if (!data.standings?.length) {
      await ctx.reply("Таблица пока пуста — результатов ещё нет.");
      return;
    }

    const header = data.finished ? "🏆 Итоговая таблица" : "📊 Турнирная таблица";
    const lines = data.standings
      .slice(0, 32)
      .map((row) => `${row.position}. ${row.name} — ${row.points} очк. (${row.wins}-${row.losses})`);

    await ctx.reply([header, "", ...lines].join("\n"));
  } catch (error) {
    await ctx.reply(toBotErrorMessage(error));
  }
});

bot.callbackQuery(/^report:([^:]+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const tournamentId = ctx.match[1];

  try {
    const data = await botApiFetch<{
      title: string;
      matches: Array<{
        matchId: string;
        matchNumber: number;
        playerA: { participantId: string; name: string };
        playerB: { participantId: string; name: string };
      }>;
    }>(`/bot/internal/tournaments/${tournamentId}/reportable-matches?telegramId=${requireTelegramId(ctx)}`);

    if (!data.matches.length) {
      await ctx.reply("Нет матчей, готовых к вводу результата.");
      return;
    }

    for (const match of data.matches) {
      const keyboard = new InlineKeyboard()
        .text(`✅ ${match.playerA.name}`, `rwin:${match.matchId}:${match.playerA.participantId}`)
        .row()
        .text(`✅ ${match.playerB.name}`, `rwin:${match.matchId}:${match.playerB.participantId}`);
      await ctx.reply(`Матч #${match.matchNumber}: ${match.playerA.name} vs ${match.playerB.name}\nКто победил?`, {
        reply_markup: keyboard
      });
    }
  } catch (error) {
    await ctx.reply(toBotErrorMessage(error));
  }
});

bot.callbackQuery(/^rwin:([^:]+):([^:]+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const matchId = ctx.match[1];
  const winnerParticipantId = ctx.match[2];

  try {
    await botApiFetch(`/bot/internal/matches/${matchId}/report-result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: requireTelegramId(ctx), winnerParticipantId })
    });
    await ctx.reply("✅ Результат записан. Сетка обновлена.");
  } catch (error) {
    await ctx.reply(toBotErrorMessage(error));
  }
});

bot.callbackQuery("match_invite:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  await startPrivateMatchInvite(ctx);
});

bot.callbackQuery("group_help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await startPrivateMatchInvite(ctx);
});

bot.on("message:contact", async (ctx) => {
  if (!isPrivateChat(ctx) || ctx.session.registration?.step !== "phone") {
    return;
  }

  const contact = ctx.message.contact;
  if (contact.user_id && ctx.from && contact.user_id !== ctx.from.id) {
    await ctx.reply(t(lang(ctx), "askPhone"));
    return;
  }

  ctx.session.registration.phone = contact.phone_number;
  await completeRegistration(ctx);
});

bot.on("message:text", async (ctx) => {
  if (!isPrivateChat(ctx) || ctx.message.text.startsWith("/")) {
    return;
  }

  const value = ctx.message.text.trim();
  if (!value) {
    return;
  }

  if (ctx.session.matchInvite?.step === "username") {
    await completePrivateMatchInvite(ctx, value);
    return;
  }

  if (!ctx.session.registration) {
    return;
  }

  const registration = ctx.session.registration;

  if (registration.step === "name") {
    registration.fullName = value;
    registration.step = "city";
    await ctx.reply(t(lang(ctx), "askCity"));
    return;
  }

  if (registration.step === "city") {
    registration.city = value;
    registration.step = "phone";
    await ctx.reply(t(lang(ctx), "askPhone"), {
      reply_markup: new Keyboard().requestContact(t(lang(ctx), "sendPhone")).resized().oneTime()
    });
  }
});

bot.command("match", async (ctx) => {
  if (!isGroupChat(ctx)) {
    if (isPrivateChat(ctx)) {
      await startPrivateMatchInvite(ctx);
      return;
    }

    await ctx.reply(t(lang(ctx), "groupOnly"));
    return;
  }

  const opponent = ctx.message?.reply_to_message?.from;
  if (!opponent) {
    await ctx.reply(t(lang(ctx), "replyRequired"));
    return;
  }

  if (opponent.is_bot || opponent.id === ctx.from?.id) {
    await ctx.reply(t(lang(ctx), "botOpponent"));
    return;
  }

  const creator = ctx.from;
  if (!creator) {
    return;
  }

  try {
    const match = await botApiFetch<GroupMatch>("/bot/internal/group-matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: String(ctx.chat.id),
        playerOneTelegramId: String(creator.id),
        playerOneName: displayName(creator),
        playerTwoTelegramId: String(opponent.id),
        playerTwoName: displayName(opponent),
        createdByTelegramId: String(creator.id)
      })
    });

    const sent = await ctx.reply(renderGroupMatch(match), {
      reply_markup: groupMatchKeyboard(match)
    });

    await botApiFetch(`/bot/internal/group-matches/${match.id}/message`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: String(ctx.chat.id),
        messageId: sent.message_id
      })
    });
  } catch (error) {
    await ctx.reply(toBotErrorMessage(error));
  }
});

bot.command("score", async (ctx) => {
  if (!isGroupChat(ctx)) {
    await ctx.reply(t(lang(ctx), "groupOnly"));
    return;
  }

  const matches = await botApiFetch<GroupMatch[]>(`/bot/internal/group-matches/active/${ctx.chat.id}`);
  if (!matches.length) {
    await ctx.reply(t(lang(ctx), "noActiveMatches"));
    return;
  }

  await ctx.reply([t(lang(ctx), "activeMatches"), "", ...matches.map(renderGroupMatchLine)].join("\n"));
});

bot.command("mymatches", async (ctx) => {
  await sendMyMatches(ctx);
});

bot.command("cancelmatch", async (ctx) => {
  if (!isGroupChat(ctx)) {
    await ctx.reply(t(lang(ctx), "groupOnly"));
    return;
  }

  const matches = await botApiFetch<GroupMatch[]>(`/bot/internal/group-matches/active/${ctx.chat.id}`);
  if (!matches.length) {
    await ctx.reply(t(lang(ctx), "noActiveMatches"));
    return;
  }

  const keyboard = new InlineKeyboard();
  matches.forEach((match) => {
    keyboard.text(`${match.playerOneName} ${match.scoreOne}-${match.scoreTwo} ${match.playerTwoName}`, `gm:cancel:${match.id}`).row();
  });

  await ctx.reply(t(lang(ctx), "activeMatches"), { reply_markup: keyboard });
});

bot.callbackQuery(/^gm:p:([^:]+):(1|2)$/, async (ctx) => {
  const matchId = ctx.match[1];
  const side = Number(ctx.match[2]) as 1 | 2;

  try {
    const match = await botApiFetch<GroupMatch>(`/bot/internal/group-matches/${matchId}/point`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(await groupActionPayload(ctx)),
        side
      })
    });

    await ctx.answerCallbackQuery();
    await updateGroupMatchMessage(ctx, match);
  } catch (error) {
    await answerGroupMatchError(ctx, error);
  }
});

bot.callbackQuery(/^gm:undo:([^:]+)$/, async (ctx) => {
  const matchId = ctx.match[1];

  try {
    const match = await botApiFetch<GroupMatch>(`/bot/internal/group-matches/${matchId}/undo`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(await groupActionPayload(ctx))
    });

    await ctx.answerCallbackQuery();
    await updateGroupMatchMessage(ctx, match);
  } catch (error) {
    await answerGroupMatchError(ctx, error);
  }
});

bot.callbackQuery(/^gm:finish:([^:]+)$/, async (ctx) => {
  const matchId = ctx.match[1];

  try {
    const match = await botApiFetch<GroupMatch>(`/bot/internal/group-matches/${matchId}/finish`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(await groupActionPayload(ctx))
    });

    await ctx.answerCallbackQuery();
    await updateGroupMatchMessage(ctx, match);
  } catch (error) {
    await answerGroupMatchError(ctx, error);
  }
});

bot.callbackQuery(/^gm:cancel:([^:]+)$/, async (ctx) => {
  const matchId = ctx.match[1];

  try {
    const match = await botApiFetch<GroupMatch>(`/bot/internal/group-matches/${matchId}/cancel`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(await groupActionPayload(ctx))
    });

    await ctx.answerCallbackQuery({ text: t(lang(ctx), "cancelled") });
    await updateGroupMatchMessage(ctx, match);
  } catch (error) {
    await answerGroupMatchError(ctx, error);
  }
});

async function consumeLegacyLink(ctx: BotContext, tokenValue: string) {
  const language = lang(ctx);
  try {
    await botApiFetch("/bot/internal/link/consume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: tokenValue,
        telegramId: requireTelegramId(ctx),
        telegramUsername: ctx.from?.username ?? undefined
      })
    });
    await ctx.reply(t(language, "linked"), {
      reply_markup: await mainMenuKeyboard(ctx, language)
    });
  } catch (error) {
    await ctx.reply(toBotErrorMessage(error));
  }
}

async function showLanguageChoice(ctx: BotContext) {
  await ctx.reply(t(lang(ctx), "chooseLanguage"), {
    reply_markup: new InlineKeyboard().text("Русский", "lang:ru").text("O'zbek", "lang:uz")
  });
}

async function sendMainMenu(ctx: BotContext) {
  const language = await resolveLanguage(ctx);
  await ctx.reply(t(language, "menu"), {
    reply_markup: await mainMenuKeyboard(ctx, language)
  });
}

async function mainMenuKeyboard(ctx: BotContext, language: BotLanguage) {
  const sessionInfo = await getLinkedSessionSafe(requireTelegramId(ctx));
  const registeredPlayer = sessionInfo.linked && sessionInfo.user?.role === "PLAYER";
  const keyboard = new InlineKeyboard();

  if (!registeredPlayer) {
    keyboard.text(t(language, "registration"), "reg:start").row();
    keyboard.text(t(language, "tournaments"), "tournaments");
    return keyboard;
  }

  keyboard.text(t(language, "tournaments"), "tournaments").row();
  keyboard.text(t(language, "myTournaments"), "my_tournaments").row();
  keyboard.text(t(language, "groupMatch"), "match_invite:start").row();
  keyboard.text(t(language, "matchScores"), "my_matches");
  return keyboard;
}

async function completeRegistration(ctx: BotContext) {
  const language = lang(ctx);
  const registration = ctx.session.registration;
  if (!registration?.fullName || !registration.city || !registration.phone) {
    await ctx.reply(t(language, "askPhone"));
    return;
  }

  try {
    const result = await botApiFetch<{ status: string; phone?: string }>("/bot/internal/register/player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegramId: requireTelegramId(ctx),
        telegramUsername: ctx.from?.username ?? undefined,
        language,
        fullName: registration.fullName,
        city: registration.city,
        phone: registration.phone
      })
    });

    ctx.session.registration = undefined;

    if (result.status === "already_registered") {
      await ctx.reply(t(language, "alreadyRegistered"), {
        reply_markup: { remove_keyboard: true }
      });
      await sendMainMenu(ctx);
      return;
    }

    if (result.status === "phone_exists" && result.phone) {
      ctx.session.existingPhone = result.phone;
      await ctx.reply(t(language, "phoneExists"), {
        reply_markup: new InlineKeyboard().text(t(language, "linkExisting"), "reg:link_existing").url(t(language, "openSite"), WEB_APP_URL)
      });
      return;
    }

    if (result.status === "site_required") {
      await ctx.reply(t(language, "siteOnly"), {
        reply_markup: new InlineKeyboard().url(t(language, "openSite"), WEB_APP_URL)
      });
      return;
    }

    await ctx.reply(t(language, "registered"), {
      reply_markup: { remove_keyboard: true }
    });
    await sendMainMenu(ctx);
  } catch (error) {
    if (error instanceof BotApiError && error.status === 400) {
      await ctx.reply("Проверьте город и телефон. Попробуйте регистрацию заново.", {
        reply_markup: { remove_keyboard: true }
      });
      ctx.session.registration = undefined;
      return;
    }

    await ctx.reply(toBotErrorMessage(error), {
      reply_markup: { remove_keyboard: true }
    });
  }
}

async function startPrivateMatchInvite(ctx: BotContext) {
  const language = lang(ctx);
  const sessionInfo = await getLinkedSessionSafe(requireTelegramId(ctx));
  if (!sessionInfo.linked || sessionInfo.user?.role !== "PLAYER") {
    await ctx.reply(t(language, "registerFirst"));
    return;
  }

  ctx.session.matchInvite = { step: "username" };
  await ctx.reply(t(language, "askOpponentUsername"));
}

async function completePrivateMatchInvite(ctx: BotContext, rawUsername: string) {
  const language = lang(ctx);
  const creatorTelegramId = requireTelegramId(ctx);
  const username = normalizeTelegramUsername(rawUsername);

  if (!username) {
    await ctx.reply(t(language, "askOpponentUsername"));
    return;
  }

  const sessionInfo = await getLinkedSessionSafe(creatorTelegramId);
  if (!sessionInfo.linked || sessionInfo.user?.role !== "PLAYER") {
    ctx.session.matchInvite = undefined;
    await ctx.reply(t(language, "registerFirst"));
    return;
  }

  try {
    const opponent = await botApiFetch<TelegramPlayerLookup>(`/bot/internal/players/by-username/${encodeURIComponent(username)}`);

    if (!opponent.found || !opponent.telegramId) {
      await replyOpponentNotFound(ctx, language);
      return;
    }

    if (opponent.telegramId === creatorTelegramId || username.toLowerCase() === (ctx.from?.username ?? "").toLowerCase()) {
      await ctx.reply(t(language, "cannotInviteSelf"));
      return;
    }

    const creatorName = sessionInfo.user.playerProfile?.fullName ?? displayName(requireTelegramUser(ctx));
    const opponentName = opponent.fullName ?? `@${username}`;
    const match = await botApiFetch<GroupMatch>("/bot/internal/group-matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: createDirectMatchChatId(creatorTelegramId, opponent.telegramId),
        playerOneTelegramId: creatorTelegramId,
        playerOneName: creatorName,
        playerTwoTelegramId: opponent.telegramId,
        playerTwoName: opponentName,
        createdByTelegramId: creatorTelegramId
      })
    });

    const opponentLanguage: BotLanguage = opponent.language === "uz" ? "uz" : "ru";
    let inviteSent = true;
    try {
      await bot.api.sendMessage(opponent.telegramId, [t(opponentLanguage, "directInviteReceived"), "", renderGroupMatch(match)].join("\n"), {
        reply_markup: groupMatchKeyboard(match)
      });
    } catch {
      inviteSent = false;
    }

    ctx.session.matchInvite = undefined;
    await ctx.reply([t(language, inviteSent ? "directInviteSent" : "directInviteSendFailed"), "", renderGroupMatch(match)].join("\n"), {
      reply_markup: groupMatchKeyboard(match)
    });
  } catch (error) {
    ctx.session.matchInvite = undefined;
    await ctx.reply(toBotErrorMessage(error));
  }
}

async function sendUpcomingTournaments(ctx: BotContext) {
  const language = lang(ctx);
  const tournaments = await botApiFetch<TournamentItem[]>("/bot/internal/tournaments/upcoming");

  if (!tournaments.length) {
    await ctx.reply(t(language, "noTournaments"));
    return;
  }

  for (const tournament of tournaments) {
    const keyboard = new InlineKeyboard();
    if (tournament.canJoinInBot) {
      keyboard.text(t(language, "participate"), `join:${tournament.id}`).row();
    }
    keyboard.text("📊 Таблица", `standings:${tournament.id}`).text("✍️ Результат", `report:${tournament.id}`).row();
    if (isTelegramSafeUrl(tournament.siteUrl)) {
      keyboard.url(t(language, "openTournament"), tournament.siteUrl);
    }

    await ctx.reply(renderTournament(tournament, language), {
      reply_markup: keyboard
    });
  }
}

async function sendMyTournaments(ctx: BotContext) {
  const language = lang(ctx);

  try {
    const tournaments = await botApiFetch<MyTournamentItem[]>(`/bot/internal/player/${requireTelegramId(ctx)}/tournaments`);
    if (!tournaments.length) {
      await ctx.reply(t(language, "noMyTournaments"));
      return;
    }

    for (const tournament of tournaments) {
      const keyboard = new InlineKeyboard()
        .text("📊 Таблица", `standings:${tournament.id}`)
        .text("✍️ Результат", `report:${tournament.id}`)
        .row();
      if (isTelegramSafeUrl(tournament.siteUrl)) {
        keyboard.url(t(language, "openTournament"), tournament.siteUrl);
      }
      await ctx.reply(renderMyTournament(tournament), {
        reply_markup: keyboard
      });
    }
  } catch (error) {
    if (error instanceof BotApiError && error.status === 401) {
      await ctx.reply(t(language, "registerFirst"));
      return;
    }

    await ctx.reply(toBotErrorMessage(error));
  }
}

async function sendMyMatches(ctx: BotContext) {
  const language = lang(ctx);

  try {
    const matches = await botApiFetch<GroupMatch[]>(`/bot/internal/group-matches/mine/${requireTelegramId(ctx)}`);
    if (!matches.length) {
      await ctx.reply(t(language, "noMatches"));
      return;
    }

    await ctx.reply(t(language, "myMatchesTitle"));
    for (const match of matches) {
      await ctx.reply(renderGroupMatch(match), {
        reply_markup: match.chatId.startsWith("direct:") ? groupMatchKeyboard(match) : undefined
      });
    }
  } catch (error) {
    if (error instanceof BotApiError && error.status === 401) {
      await ctx.reply(t(language, "registerFirst"));
      return;
    }

    await ctx.reply(toBotErrorMessage(error));
  }
}

function renderTournament(tournament: TournamentItem, language: BotLanguage) {
  const capacity = tournament.capacity ?? "-";
  const joinLabel = tournament.canJoinInBot ? "" : `\n${t(language, "requiresSite")}`;
  return [
    tournament.title,
    `Дата: ${formatDateTime(tournament.startsAt)}`,
    `Клуб: ${tournament.clubName}`,
    `Дисциплина: ${tournament.disciplineName}`,
    `Участники: ${tournament.participantsCount} / ${capacity}`,
    `Статус: ${tournament.status}${joinLabel}`
  ].join("\n");
}

function renderMyTournament(tournament: MyTournamentItem) {
  return [
    tournament.title,
    `Дата: ${formatDateTime(tournament.startsAt)}`,
    `Клуб: ${tournament.clubName}`,
    `Статус: ${tournament.status}`
  ].join("\n");
}

function renderGroupMatch(match: GroupMatch) {
  if (match.status === "FINISHED") {
    const winner = match.scoreOne > match.scoreTwo ? match.playerOneName : match.playerTwoName;
    return [
      "Матч завершён",
      `${match.playerOneName} ${match.scoreOne} - ${match.scoreTwo} ${match.playerTwoName}`,
      `Победитель: ${winner}`,
      ...renderHeadToHead(match)
    ].join("\n");
  }

  if (match.status === "CANCELLED") {
    return [
      "Матч отменён",
      `${match.playerOneName} ${match.scoreOne} - ${match.scoreTwo} ${match.playerTwoName}`,
      ...renderHeadToHead(match)
    ].join("\n");
  }

  return [
    `${match.playerOneName} vs ${match.playerTwoName}`,
    `Счёт: ${match.scoreOne} - ${match.scoreTwo}`,
    ...renderHeadToHead(match)
  ].join("\n");
}

function renderGroupMatchLine(match: GroupMatch) {
  return `${match.playerOneName} ${match.scoreOne}-${match.scoreTwo} ${match.playerTwoName} [${match.status}]`;
}

function renderHeadToHead(match: GroupMatch) {
  if (!match.headToHead) {
    return [];
  }

  return [
    `Общий счёт: ${match.playerOneName} ${match.headToHead.playerOneWins} - ${match.headToHead.playerTwoWins} ${match.playerTwoName}`
  ];
}

function groupMatchKeyboard(match: GroupMatch) {
  const keyboard = new InlineKeyboard();
  if (match.status !== "LIVE") {
    return keyboard.text("Счёт игр", "my_matches");
  }

  keyboard.text(`+1 ${match.playerOneName}`, `gm:p:${match.id}:1`).row();
  keyboard.text(`+1 ${match.playerTwoName}`, `gm:p:${match.id}:2`).row();
  keyboard.text("Отменить очко", `gm:undo:${match.id}`).row();
  keyboard.text("Завершить матч", `gm:finish:${match.id}`).row();
  keyboard.text("Счёт игр", "my_matches");
  return keyboard;
}

async function updateGroupMatchMessage(ctx: BotContext, match: GroupMatch) {
  await ctx.editMessageText(renderGroupMatch(match), {
    reply_markup: groupMatchKeyboard(match)
  });
}

async function answerGroupMatchError(ctx: BotContext, error: unknown) {
  const language = lang(ctx);
  if (error instanceof BotApiError && error.status === 403) {
    await ctx.answerCallbackQuery({ text: t(language, "notAllowed"), show_alert: true });
    return;
  }

  if (error instanceof BotApiError && error.status === 400) {
    await ctx.answerCallbackQuery({ text: t(language, "tiedFinish"), show_alert: true });
    return;
  }

  if (error instanceof BotApiError && error.status === 409) {
    await ctx.answerCallbackQuery({ text: t(language, "closedMatch"), show_alert: true });
    return;
  }

  await ctx.answerCallbackQuery({ text: toBotErrorMessage(error), show_alert: true });
}

async function groupActionPayload(ctx: BotContext) {
  const chatId = ctx.callbackQuery?.message?.chat.id;
  if (!chatId) {
    throw new Error("Chat is missing");
  }

  return {
    chatId: String(chatId),
    actorTelegramId: requireTelegramId(ctx),
    actorIsAdmin: await isGroupAdmin(ctx)
  };
}

async function isGroupAdmin(ctx: BotContext) {
  const chat = ctx.callbackQuery?.message?.chat ?? ctx.chat;
  const from = ctx.from;
  if (!chat || !from || (chat.type !== "group" && chat.type !== "supergroup")) {
    return false;
  }

  try {
    const member = await ctx.api.getChatMember(chat.id, from.id);
    return member.status === "administrator" || member.status === "creator";
  } catch {
    return false;
  }
}

async function dispatchNotifications() {
  try {
    await botApiFetch("/bot/internal/notifications/sweep-reminders", {
      method: "POST"
    });
    const pending = await botApiFetch<Array<any>>("/bot/internal/notifications/pending?limit=50");

    for (const notification of pending) {
      if (!notification.user?.telegramId) {
        continue;
      }

      const tournamentId = extractReminderTournamentId(notification.eventKey);
      await bot.api.sendMessage(notification.user.telegramId, notification.message, {
        reply_markup: tournamentId
          ? new InlineKeyboard().url("Открыть турнир", `${WEB_APP_URL}/tournaments/${tournamentId}`)
          : undefined
      });
      await botApiFetch(`/bot/internal/notifications/${notification.id}/delivered`, {
        method: "PATCH"
      });
    }
  } catch (error) {
    console.error("telegram notification dispatch failed", error);
  }
}

function startNotificationLoop() {
  void dispatchNotifications();
  setInterval(() => {
    void dispatchNotifications();
  }, 30000);
}

async function getLinkedSessionSafe(telegramId: string): Promise<SessionInfo> {
  try {
    return await botApiFetch<SessionInfo>(`/bot/internal/session/${telegramId}`);
  } catch {
    return { linked: false };
  }
}

async function resolveLanguage(ctx: BotContext): Promise<BotLanguage> {
  const sessionLanguage = ctx.session.language;
  if (sessionLanguage) {
    return sessionLanguage;
  }

  const sessionInfo = await getLinkedSessionSafe(requireTelegramId(ctx));
  const userLanguage = sessionInfo.user?.language;
  if (userLanguage === "uz" || userLanguage === "ru") {
    ctx.session.language = userLanguage;
    return userLanguage;
  }

  ctx.session.language = "ru";
  return "ru";
}

function lang(ctx: BotContext): BotLanguage {
  return ctx.session.language ?? "ru";
}

function t(language: BotLanguage, key: string) {
  return text[language][key] ?? text.ru[key] ?? key;
}

function isPrivateChat(ctx: BotContext) {
  return ctx.chat?.type === "private";
}

function isGroupChat(ctx: BotContext) {
  return ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";
}

function requireTelegramId(ctx: BotContext) {
  if (!ctx.from) {
    throw new Error("Telegram user is missing");
  }

  return String(ctx.from.id);
}

function requireTelegramUser(ctx: BotContext) {
  if (!ctx.from) {
    throw new Error("Telegram user is missing");
  }

  return ctx.from;
}

function displayName(user: { first_name: string; last_name?: string; username?: string }) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.username || "Player";
}

function normalizeTelegramUsername(value: string) {
  return value.trim().replace(/^@+/, "").replace(/[^a-zA-Z0-9_]/g, "");
}

function createDirectMatchChatId(playerOneTelegramId: string, playerTwoTelegramId: string) {
  return ["direct", ...[playerOneTelegramId, playerTwoTelegramId].sort()].join(":");
}

function isTelegramSafeUrl(value?: string | null) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname);
  } catch {
    return false;
  }
}

function tournamentUrlKeyboard(label: string, value?: string | null) {
  return isTelegramSafeUrl(value) ? new InlineKeyboard().url(label, value!) : undefined;
}

async function replyOpponentNotFound(ctx: BotContext, language: BotLanguage) {
  const keyboard = BOT_USERNAME ? new InlineKeyboard().url(t(language, "openBot"), `https://t.me/${BOT_USERNAME}`) : undefined;
  await ctx.reply(t(language, "opponentNotFound"), keyboard ? { reply_markup: keyboard } : undefined);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function extractReminderTournamentId(eventKey?: string | null) {
  // Event keys that carry a tournament id as the first segment after the prefix.
  const match = eventKey?.match(/^(?:tournament_reminder_2h|tournament-finished|tournament-champion):([^:]+)/);
  return match?.[1] ?? null;
}

async function editOrReply(ctx: BotContext, message: string, keyboard: InlineKeyboard) {
  try {
    await ctx.editMessageText(message, { reply_markup: keyboard });
  } catch {
    await ctx.reply(message, { reply_markup: keyboard });
  }
}

async function bootstrap() {
  validateProductionEnv();

  if (!token) {
    startDisabledMode("TELEGRAM_BOT_TOKEN is not configured");
    return;
  }

  try {
    await bot.api.setMyCommands([
      { command: "start", description: "Запустить бота" },
      { command: "menu", description: "Открыть меню" },
      { command: "match", description: "Матч 1 на 1 по username или reply" },
      { command: "score", description: "Показать активные матчи группы" },
      { command: "mymatches", description: "Показать мои матчи" },
      { command: "cancelmatch", description: "Отменить активный матч" }
    ]);

    startNotificationLoop();

    const mode = (process.env.BOT_MODE ?? "polling").toLowerCase();
    if (mode === "webhook") {
      const port = Number(process.env.BOT_PORT ?? 4100);
      const path = process.env.BOT_WEBHOOK_PATH ?? "/telegram/webhook";
      const webhookUrl = process.env.BOT_WEBHOOK_URL;

      if (!webhookUrl) {
        throw new Error("BOT_WEBHOOK_URL is required in webhook mode");
      }

      await bot.api.setWebhook(`${webhookUrl}${path}`);
      const handler = webhookCallback(bot, "http");
      createServer((req, res) => {
        if (req.url === "/health") {
          res.statusCode = 200;
          res.end("telegram bot webhook");
          return;
        }

        if (req.url !== path || req.method !== "POST") {
          res.statusCode = 404;
          res.end("not found");
          return;
        }

        void handler(req, res);
      }).listen(port, () => {
        console.log(`Telegram bot webhook listening on ${port}${path}`);
      });
      return;
    }

    startHealthServer();
    await bot.api.deleteWebhook();
    await bot.start();
  } catch (error) {
    if (isTelegramUnauthorized(error)) {
      startDisabledMode("TELEGRAM_BOT_TOKEN was rejected by Telegram");
      return;
    }

    throw error;
  }
}

function isTelegramUnauthorized(error: unknown) {
  return error instanceof GrammyError && error.error_code === 401;
}

function startHealthServer() {
  const port = Number(process.env.BOT_PORT ?? 4100);

  createServer((req, res) => {
    if (req.url === "/health") {
      res.statusCode = 200;
      res.end("telegram bot polling");
      return;
    }

    res.statusCode = 404;
    res.end("not found");
  }).listen(port, () => {
    console.log(`Telegram bot health server listening on ${port}`);
  });
}

function startDisabledMode(reason: string) {
  const port = Number(process.env.BOT_PORT ?? 4100);

  createServer((req, res) => {
    if (req.url === "/health") {
      res.statusCode = 200;
      res.end("telegram bot disabled");
      return;
    }

    res.statusCode = 503;
    res.end(reason);
  }).listen(port, () => {
    console.warn(`Telegram bot is disabled: ${reason}. Standby server listening on ${port}.`);
  });
}

void bootstrap();
