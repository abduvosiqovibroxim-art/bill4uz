export function sendBracketSuccess<T>(message: string, data: T) {
  return {
    success: true,
    message,
    data
  };
}
