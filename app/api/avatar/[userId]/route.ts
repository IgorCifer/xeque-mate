import { auth } from "@/lib/auth";
import { getAvatar } from "@/features/perfil/dal";

type AvatarRouteContext = {
  params: Promise<{ userId: string }>;
};

export async function GET(req: Request, { params }: AvatarRouteContext) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return new Response(null, { status: 401 });

  const { userId } = await params;
  const avatar = await getAvatar({ userId: session.user.id }, userId);
  if (!avatar) return new Response(null, { status: 404 });

  return new Response(avatar.data, {
    headers: {
      "Content-Type": avatar.contentType,
      "Content-Length": String(avatar.data.byteLength),
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
