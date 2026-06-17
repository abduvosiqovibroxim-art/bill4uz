import { ApiError } from "./client";
import type { Locale } from "@/lib/types";

type Translate = (path: string) => string;

interface UserFacingApiErrorOptions {
  locale: Locale;
  t: Translate;
  fallbackKey?: string;
  statusKeys?: Partial<Record<number, string>>;
  payloadMessageKeys?: Record<string, string>;
  debugLabel?: string;
}

const statusMessages: Record<Locale, Record<number, string>> = {
  ru: {
    400: "\u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u0434\u0430\u043d\u043d\u044b\u0435 \u0438 \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0441\u043d\u043e\u0432\u0430",
    401: "\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0432\u043e\u0439\u0434\u0438\u0442\u0435 \u0432 \u0430\u043a\u043a\u0430\u0443\u043d\u0442",
    403: "\u0423 \u0432\u0430\u0441 \u043d\u0435\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u0430 \u043a \u044d\u0442\u043e\u043c\u0443 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044e",
    409:
      "\u042d\u0442\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u0441\u0435\u0439\u0447\u0430\u0441 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e \u0432 \u0442\u0435\u043a\u0443\u0449\u0435\u043c \u0441\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u0438",
    429: "\u0421\u043b\u0438\u0448\u043a\u043e\u043c \u043c\u043d\u043e\u0433\u043e \u043f\u043e\u0432\u0442\u043e\u0440\u043d\u044b\u0445 \u0437\u0430\u043f\u0440\u043e\u0441\u043e\u0432. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0447\u0443\u0442\u044c \u043f\u043e\u0437\u0436\u0435"
  },
  uz: {
    400: "Ma'lumotlarni tekshirib, qayta urinib ko'ring",
    401: "Avval akkauntga kiring",
    403: "Bu amal uchun sizda ruxsat yo'q",
    409: "Hozirgi holatda bu amalni bajarib bo'lmaydi",
    429: "Juda ko'p qayta so'rov yuborildi. Birozdan keyin urinib ko'ring"
  },
  en: {
    400: "Check the data and try again",
    401: "Sign in to continue",
    403: "You do not have access to this action",
    409: "This action is not available in the current state",
    429: "Too many repeated requests. Try again shortly"
  }
};

export function getApiPayloadMessage(payload: unknown) {
  if (typeof payload === "string") {
    return payload;
  }

  if (!payload || typeof payload !== "object" || !("message" in payload)) {
    return null;
  }

  const message = (payload as { message?: unknown }).message;
  if (Array.isArray(message)) {
    return message.find((item): item is string => typeof item === "string") ?? null;
  }

  return typeof message === "string" ? message : null;
}

export function getUserFacingApiError(error: unknown, options: UserFacingApiErrorOptions) {
  const { debugLabel = "api", fallbackKey = "system.errorText", locale, payloadMessageKeys, statusKeys, t } = options;

  if (error instanceof ApiError) {
    const payloadMessage = getApiPayloadMessage(error.payload);

    if (payloadMessage && payloadMessageKeys?.[payloadMessage]) {
      return t(payloadMessageKeys[payloadMessage]);
    }

    if (statusKeys?.[error.status]) {
      return t(statusKeys[error.status]!);
    }

    if (statusMessages[locale][error.status]) {
      return statusMessages[locale][error.status];
    }

    logApiError(debugLabel, error.status, error.payload);
    return t(fallbackKey);
  }

  if (error instanceof Error) {
    logApiError(debugLabel, null, error.message);
  }

  return t(fallbackKey);
}

function logApiError(label: string, status: number | null, payload: unknown) {
  void label;
  void status;
  void payload;
}
