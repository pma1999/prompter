import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

const hasResendKey = !!process.env.RESEND_API_KEY;
const feedbackEmailConfigured = !!process.env.FEEDBACK_EMAIL;
const feedbackFrom = process.env.FEEDBACK_FROM;
const feedbackFromConfigured = !!feedbackFrom;

console.debug('[feedback][init] RESEND_API_KEY present:', hasResendKey);
console.debug('[feedback][init] FEEDBACK_EMAIL present:', feedbackEmailConfigured);
console.debug('[feedback][init] FEEDBACK_FROM present:', feedbackFromConfigured);

const resend = new Resend(process.env.RESEND_API_KEY!);

const feedbackSchema = z.object({
  message: z.string().min(10).max(2000).trim(),
  email: z.string().email().optional().or(z.literal('')),
});

// Simple in-memory rate limiting (note: resets on serverless cold starts; for production, use Upstash or similar)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  // Get client IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  console.debug('[feedback][request] IP:', ip, 'User-Agent:', userAgent);

  // Validate configuration at request time (we already logged presence at init)
  if (!hasResendKey || !feedbackEmailConfigured || !feedbackFromConfigured) {
    console.error('[feedback][init] Missing required email configuration', {
      RESEND_API_KEY: hasResendKey,
      FEEDBACK_EMAIL: feedbackEmailConfigured,
      FEEDBACK_FROM: feedbackFromConfigured,
    });
    return NextResponse.json(
      { error: 'Email service not configured. Please set RESEND_API_KEY, FEEDBACK_EMAIL and FEEDBACK_FROM.' },
      { status: 500 }
    );
  }

  const now = Date.now();
  let timestamps = rateLimitMap.get(ip) || [];

  // Filter old timestamps
  timestamps = timestamps.filter((timestamp) => now - timestamp < RATE_WINDOW_MS);

  if (timestamps.length >= RATE_LIMIT) {
    console.warn('[feedback][rate-limit] Too many submissions from IP:', ip);
    return NextResponse.json(
      { error: 'Too many feedback submissions. Please try again later.' },
      { status: 429 }
    );
  }

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  try {
    const body = await request.json();
    // Log a preview of the incoming payload (don't log secrets)
    try {
      const preview = typeof body === 'object' && body !== null
        ? { ...body, message: body.message ? String(body.message).slice(0, 200) + (String(body.message).length > 200 ? '...' : '') : body.message }
        : body;
      console.debug('[feedback][body-preview]', preview);
    } catch (e) {
      console.debug('[feedback][body-preview] unable to create preview', e);
    }

    const validated = feedbackSchema.safeParse(body);

    if (!validated.success) {
      console.warn('[feedback][validation] Validation failed', validated.error);
      return NextResponse.json(
        { error: 'Invalid input: Message must be 10-2000 characters.' },
        { status: 400 }
      );
    }

    const { message, email } = validated.data;
    console.debug('[feedback][validated]', { messagePreview: message.slice(0, 200), email });

    // Send email via Resend
    const sendPayload = {
      from: feedbackFrom, // Use configured, verified sender
      to: [process.env.FEEDBACK_EMAIL!],
      subject: 'New User Feedback - Prompt Perfection',
      text: `
New feedback received:

Message:
${message}

User Email: ${email || 'Not provided'}

---
Submitted at: ${new Date().toISOString()}
IP Address: ${ip}
User Agent: ${userAgent}
      `.trim(),
    };

    console.debug('[feedback][send-payload-preview]', { to: sendPayload.to, from: sendPayload.from, subject: sendPayload.subject, textPreview: sendPayload.text.slice(0, 200) });

    const resendResponse = await resend.emails.send(sendPayload);
    console.debug('[feedback][send-response]', resendResponse);

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log detailed error information and attempt to surface Resend-specific errors
    let errObj: unknown = null;

    if (error instanceof Error) {
      console.error('[feedback][email-error] Error sending feedback email:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      const maybeErr = error as unknown as Record<string, unknown>;
      const sdkError = maybeErr.error ?? maybeErr.response ?? maybeErr;
      errObj = sdkError ?? null;

      if (errObj) {
        console.error('[feedback][email-error][details]', errObj);
      }
    } else {
      // Non-Error thrown (e.g., string or plain object)
      errObj = error ?? null;
      console.error('[feedback][email-error] Non-error thrown:', error);
    }

    const getNestedValue = (obj: unknown, path: string[]) => {
      if (!obj || typeof obj !== 'object') return undefined;
      let current: unknown = obj;
      for (const key of path) {
        if (typeof current !== 'object' || current === null || !(key in current)) return undefined;
        current = (current as Record<string, unknown>)[key];
      }
      return current;
    };

    const rawStatus = getNestedValue(errObj, ['statusCode']) ?? getNestedValue(errObj, ['status']) ?? getNestedValue(errObj, ['error', 'statusCode']);
    const statusCode = typeof rawStatus === 'number' ? rawStatus : (typeof rawStatus === 'string' && /^\d+$/.test(rawStatus) ? Number(rawStatus) : null);

    const rawMessage = getNestedValue(errObj, ['message']) ?? getNestedValue(errObj, ['error', 'message']);
    const errMessage = typeof rawMessage === 'string' ? rawMessage : (error instanceof Error ? error.message : undefined);

    // Map Resend 403 validation error (unverified sender domain) to a clear frontend message
    if (statusCode === 403 || (typeof errMessage === 'string' && /not verified|domain is not verified|not verificado/i.test(errMessage))) {
      console.warn('[feedback][email-error][mapped] Resend sender/domain not verified', { statusCode, errMessage });
      return NextResponse.json(
        { error: 'Remitente no verificado en Resend. Configura FEEDBACK_FROM con un remitente verificado.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send feedback. Please try again later.' },
      { status: 500 }
    );
  }
}