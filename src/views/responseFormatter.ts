export function formatSuccess<T>(data: T, message?: string): { success: true; data: T; message?: string } {
  return { success: true, data, message };
}

export function formatError(error: string, statusCode: number): { success: false; error: string; statusCode: number } {
  return { success: false, error, statusCode };
}
