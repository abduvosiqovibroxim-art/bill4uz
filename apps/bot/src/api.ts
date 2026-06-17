const apiBaseUrl = process.env.BOT_API_URL ?? "http://localhost:4000/api";
const botSecret = process.env.BOT_INTERNAL_SECRET ?? "";

export class BotApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super("Bot API request failed");
    this.name = "BotApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function botApiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(botSecret ? { "x-bot-secret": botSecret } : {}),
      ...init.headers
    }
  });

  const rawBody = await response.text();
  const payload = rawBody ? safeParse(rawBody) : null;

  if (!response.ok) {
    throw new BotApiError(response.status, payload);
  }

  return payload as T;
}

export async function publicApiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      Accept: "application/json"
    }
  });

  const rawBody = await response.text();
  const payload = rawBody ? safeParse(rawBody) : null;

  if (!response.ok) {
    throw new BotApiError(response.status, payload);
  }

  return unwrapApiPayload(payload) as T;
}

export function toBotErrorMessage(error: unknown) {
  if (error instanceof BotApiError) {
    switch (error.status) {
      case 401:
        return "Сначала привяжите аккаунт";
      case 403:
        return "У вас нет доступа к этому действию.";
      case 409:
        return "Действие сейчас недоступно в текущем состоянии.";
      case 400:
        return "Проверьте данные и попробуйте снова.";
      default:
        return "Не удалось выполнить действие.";
    }
  }

  return "Не удалось выполнить действие.";
}

function safeParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function unwrapApiPayload(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    "data" in payload &&
    (payload as { success?: unknown }).success === true
  ) {
    return (payload as { data: unknown }).data;
  }

  return payload;
}
