import { z } from 'zod';

export const VALID_FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'] as const;
export const VALID_TRANSMISSIONS = ['Manual', 'Automatic', 'AMT', 'CVT', 'DCT'] as const;
export const VALID_BODY_TYPES = ['SUV', 'Sedan', 'Hatchback', 'MUV', 'Coupe', 'Convertible'] as const;

export const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'all', 'also', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'best', 'but', 'by', 'can', 'car', 'cars', 'do', 'find', 'for',
  'from', 'get', 'give', 'good', 'has', 'have', 'i', 'in', 'into', 'is', 'it', 'its',
  'just', 'like', 'looking', 'me', 'more', 'most', 'my', 'need', 'needs', 'of', 'on',
  'or', 'our', 'please', 'recommend', 'search', 'show', 'some', 'than', 'that', 'the',
  'their', 'them', 'then', 'there', 'these', 'they', 'this', 'to', 'under', 'up', 'us',
  'vehicle', 'vehicles', 'want', 'wants', 'we', 'what', 'which', 'who', 'will', 'with',
  'would', 'you', 'your'
]);

/**
 * Extracts normalized search tokens by removing punctuation, splitting by whitespace,
 * and filtering out common English stop words.
 */
export function extractSearchTokens(prompt: string): string[] {
  if (!prompt || typeof prompt !== 'string') return [];
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
}

/**
 * Zod Schema for Runtime Input Validation on /api/recommend
 */
export const RecommendationQuerySchema = z
  .object({
    prompt: z.string().optional().default(''),
    minPrice: z
      .union([z.number(), z.string()])
      .optional()
      .nullable()
      .transform((val) => {
        if (val === undefined || val === null || val === '') return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      })
      .refine((val) => val === null || val >= 0, {
        message: 'minPrice must be a non-negative number',
      }),
    maxPrice: z
      .union([z.number(), z.string()])
      .optional()
      .nullable()
      .transform((val) => {
        if (val === undefined || val === null || val === '') return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      })
      .refine((val) => val === null || val >= 0, {
        message: 'maxPrice must be a non-negative number',
      }),
    fuelType: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val && val !== 'all' ? val.trim() : null))
      .refine(
        (val) => !val || VALID_FUEL_TYPES.some((f) => f.toLowerCase() === val.toLowerCase()),
        {
          message: `Invalid fuelType. Allowed: ${VALID_FUEL_TYPES.join(', ')}`,
        }
      ),
    transmission: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val && val !== 'all' ? val.trim() : null))
      .refine(
        (val) => !val || VALID_TRANSMISSIONS.some((t) => t.toLowerCase() === val.toLowerCase()),
        {
          message: `Invalid transmission. Allowed: ${VALID_TRANSMISSIONS.join(', ')}`,
        }
      ),
    bodyType: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val && val !== 'all' ? val.trim() : null))
      .refine(
        (val) => !val || VALID_BODY_TYPES.some((b) => b.toLowerCase() === val.toLowerCase()),
        {
          message: `Invalid bodyType. Allowed: ${VALID_BODY_TYPES.join(', ')}`,
        }
      ),
    minSafety: z
      .union([z.number(), z.string()])
      .optional()
      .nullable()
      .transform((val) => {
        if (val === undefined || val === null || val === '') return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      })
      .refine((val) => val === null || (val >= 0 && val <= 5), {
        message: 'minSafety must be between 0.0 and 5.0',
      }),
    limit: z
      .union([z.number(), z.string()])
      .optional()
      .default(12)
      .transform((val) => {
        const num = Number(val);
        return Math.min(Math.max(isNaN(num) || num <= 0 ? 12 : num, 1), 50);
      }),
  })
  .refine(
    (data) => {
      if (data.minPrice !== null && data.maxPrice !== null) {
        return data.minPrice <= data.maxPrice;
      }
      return true;
    },
    {
      message: 'minPrice cannot exceed maxPrice',
      path: ['minPrice'],
    }
  );

/**
 * Zod Schema for Vehicle Variant Creation on POST /api/admin/cars
 */
export const CarVariantAdminSchema = z.object({
  modelId: z.coerce.number().int().positive({ message: 'modelId must be a positive integer' }),
  variantName: z.string().trim().min(1, { message: 'variantName is required' }),
  price: z.coerce.number().positive({ message: 'price must be a positive number' }),
  fuelType: z.enum(VALID_FUEL_TYPES, {
    message: `fuelType must be one of: ${VALID_FUEL_TYPES.join(', ')}`,
  }),
  transmission: z.enum(VALID_TRANSMISSIONS, {
    message: `transmission must be one of: ${VALID_TRANSMISSIONS.join(', ')}`,
  }),
  engineDisplacementCc: z.coerce.number().int().nonnegative().optional().nullable(),
  powerBhp: z.coerce.number().positive().optional().nullable(),
  torqueNm: z.coerce.number().positive().optional().nullable(),
  mileageKmpl: z.coerce.number().nonnegative().optional().nullable(),
  safetyRating: z.coerce
    .number()
    .min(0, { message: 'safetyRating must be between 0.0 and 5.0' })
    .max(5, { message: 'safetyRating must be between 0.0 and 5.0' })
    .optional()
    .nullable(),
  featureIds: z.array(z.coerce.number().int().positive()).optional().default([]),
});

/**
 * Zod Schema for Vehicle Variant Updates on PUT /api/admin/cars
 */
export const CarVariantUpdateSchema = z.object({
  variantId: z.coerce.number().int().positive({ message: 'variantId is required and must be a positive integer' }),
  variantName: z.string().trim().min(1).optional(),
  price: z.coerce.number().positive({ message: 'price must be positive' }).optional(),
  fuelType: z.enum(VALID_FUEL_TYPES).optional(),
  transmission: z.enum(VALID_TRANSMISSIONS).optional(),
  engineDisplacementCc: z.coerce.number().int().nonnegative().optional().nullable(),
  powerBhp: z.coerce.number().positive().optional().nullable(),
  torqueNm: z.coerce.number().positive().optional().nullable(),
  mileageKmpl: z.coerce.number().nonnegative().optional().nullable(),
  safetyRating: z.coerce
    .number()
    .min(0, { message: 'safetyRating must be between 0.0 and 5.0' })
    .max(5, { message: 'safetyRating must be between 0.0 and 5.0' })
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});
