export function estimateTextMetrics(text: string) {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  // Rough token estimation: 1 token ≈ 4 characters (very approximate)
  const tokens = Math.max(1, Math.round(chars / 4));
  return { chars, words, tokens };
}
