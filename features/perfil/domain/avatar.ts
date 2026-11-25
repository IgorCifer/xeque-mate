export const AVATAR_SIZE = 256;
export const AVATAR_MAX_BYTES = 300 * 1024;
export const AVATAR_SOURCE_MAX_BYTES = 10 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type AvatarContentType = (typeof AVATAR_TYPES)[number];

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

export function detectImageType(bytes: Uint8Array): AvatarContentType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "image/webp";
  }
  return null;
}

export function avatarUrl(userId: string, updatedAt: Date) {
  return `/api/avatar/${encodeURIComponent(userId)}?v=${updatedAt.getTime()}`;
}
