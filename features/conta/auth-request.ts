type AuthResponse = { error: { message?: string } | null };

export async function authRequestError(
  request: () => Promise<AuthResponse>,
  fallback: string,
): Promise<string | null> {
  try {
    const { error } = await request();
    if (!error) return null;
    return error.message || fallback;
  } catch {
    return fallback;
  }
}
