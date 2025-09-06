import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/server/keyStore";

const COOKIE_NAME = "pp.byok.sid";

export const runtime = "nodejs";
export const preferredRegion = "home";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME)?.value;
    if (cookie) deleteSession(cookie);
    const res = NextResponse.json({ connected: false });
    const secure = process.env.NODE_ENV === "production";
    res.cookies.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure,
      sameSite: "strict",
      path: "/api",
      maxAge: 0,
    });
    res.cookies.set(`${COOKIE_NAME}.enc`, "", {
      httpOnly: true,
      secure,
      sameSite: "strict",
      path: "/api",
      maxAge: 0,
    });
    try { console.debug("[byok][auth:clear] cleared", { hadCookie: !!cookie }); } catch {}
    return res;
  } catch (err: unknown) {
    const e = err as { message?: string };
    try { console.error("[byok][auth:clear] error", { error: e?.message }); } catch {}
    return NextResponse.json({ error: { code: "INTERNAL", message: e?.message || "Internal error" } }, { status: 500 });
  }
}


