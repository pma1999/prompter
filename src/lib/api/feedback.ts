import type { z } from 'zod';

export interface FeedbackData {
  message: string;
  email?: string;
}

export async function postFeedback(data: FeedbackData) {
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to submit feedback');
  }

  return response.json();
}