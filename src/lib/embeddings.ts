/**
 * Embeddings Utility
 * Converts text prompts into 1536-dimensional dense vector embeddings.
 * Supports OpenAI's text-embedding-3-small with an automatic local fallback.
 */

export const EMBEDDING_DIMENSION = 1536;

/**
 * Computes a deterministic 1536-dimensional normalized vector from text.
 * Used as a zero-dependency fallback when OPENAI_API_KEY is not configured
 * or when the external API is unreachable.
 */
export function generateLocalFallbackEmbedding(text: string): number[] {
  const cleanText = (text || '').trim().toLowerCase();
  const vector: number[] = new Array(EMBEDDING_DIMENSION).fill(0);

  // Compute a simple hash seed from the input characters
  let seed = 0;
  for (let i = 0; i < cleanText.length; i++) {
    seed = (seed << 5) - seed + cleanText.charCodeAt(i);
    seed |= 0;
  }
  const absSeed = Math.abs(seed) + 1;

  // Keyword feature extraction to influence harmonic weights
  const hasSafety = /(safe|ncap|airbag|adas|brak|guard)/i.test(cleanText) ? 1.5 : 1.0;
  const hasElectric = /(electric|ev|battery|range|charge)/i.test(cleanText) ? 1.8 : 1.0;
  const hasSuv = /(suv|ground|high|4x4|awd)/i.test(cleanText) ? 1.4 : 1.0;
  const hasLuxury = /(sunroof|leather|ventilated|jbl|luxury|screen)/i.test(cleanText) ? 1.3 : 1.0;

  let normSquare = 0;

  for (let i = 1; i <= EMBEDDING_DIMENSION; i++) {
    const angle1 = i * 0.031 + absSeed * 0.73;
    const angle2 = i * 0.017 + (cleanText.length * 0.12);

    let val =
      Math.sin(angle1) * 0.55 * hasSafety +
      Math.cos(angle2) * 0.45 * hasElectric * hasSuv * hasLuxury;

    // Constrain precision
    val = Math.round(val * 100000) / 100000;
    normSquare += val * val;
    vector[i - 1] = val;
  }

  // L2 unit normalization for cosine similarity
  const norm = Math.sqrt(normSquare) || 1;
  return vector.map((v) => Number((v / norm).toFixed(6)));
}

/**
 * Generates a 1536-dimensional embedding for an input string.
 * Calls OpenAI API (text-embedding-3-small) if OPENAI_API_KEY is configured;
 * otherwise gracefully falls back to the deterministic local embedding generator.
 *
 * @param text The input prompt, description, or search keywords
 * @returns Promise<number[]> An array of exactly 1536 floating-point numbers
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return new Array(EMBEDDING_DIMENSION).fill(0);
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey && apiKey !== 'your-openai-api-key-here') {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          input: trimmed,
          model: 'text-embedding-3-small',
          dimensions: EMBEDDING_DIMENSION,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json?.data?.[0]?.embedding) {
          return json.data[0].embedding;
        }
      } else {
        const errorText = await response.text();
        console.warn(`OpenAI embedding API returned status ${response.status}: ${errorText}. Using fallback.`);
      }
    } catch (err) {
      console.warn('Network error calling OpenAI embedding API. Falling back to local embedding generator:', err);
    }
  }

  // Graceful deterministic fallback
  return generateLocalFallbackEmbedding(trimmed);
}
