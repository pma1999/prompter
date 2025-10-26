import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

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

  const now = Date.now();
  let timestamps = rateLimitMap.get(ip) || [];

  // Filter old timestamps
  timestamps = timestamps.filter((timestamp) => now - timestamp < RATE_WINDOW_MS);

  if (timestamps.length >= RATE_LIMIT) {
    return NextResponse.json(
      { error: 'Too many feedback submissions. Please try again later.' },
      { status: 429 }
    );
  }

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  try {
    const body = await request.json();
    const validated = feedbackSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input: Message must be 10-2000 characters.' },
        { status: 400 }
      );
    }

    const { message, email } = validated.data;

    // Send email via Resend
    await resend.emails.send({
      from: 'feedback@yourdomain.com', // Replace with verified domain in Resend
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
User Agent: ${request.headers.get('user-agent') || 'Unknown'}
      `.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback email error:', error);
    return NextResponse.json(
      { error: 'Failed to send feedback. Please try again later.' },
      { status: 500 }
    );
  }
}