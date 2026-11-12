import { z } from 'zod';

// Slug regex: lowercase letters, numbers, hyphens only
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Time regex: HH:MM (24-hour format)
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
// Date regex: YYYY-MM-DD
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const siteCreateSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(150, 'Name cannot exceed 150 characters.'),
  slug: z.string().trim().toLowerCase().regex(SLUG_REGEX, 'Slug must contain only lowercase letters, numbers, and hyphens (e.g. hampi-complex).'),
  tagline: z.string().trim().max(200).optional().default(''),
  description: z.string().trim().min(10, 'Description must be at least 10 characters.'),
  historicalBackground: z.string().trim().optional().default(''),
  state: z.string().trim().min(2, 'State is required.'),
  city: z.string().trim().min(2, 'City is required.'),
  address: z.string().trim().optional().default(''),
  latitude: z.coerce.number().min(-90).max(90).optional().default(0),
  longitude: z.coerce.number().min(-180).max(180).optional().default(0),
  category: z.string().trim().min(2, 'Category is required.'),
  openingHours: z.object({
    open: z.string().regex(TIME_REGEX, 'Opening time must be in HH:MM format (e.g., 06:00).').default('06:00'),
    close: z.string().regex(TIME_REGEX, 'Closing time must be in HH:MM format (e.g., 18:00).').default('18:00'),
  }).optional().default({ open: '06:00', close: '18:00' }),
  weeklyClosingDay: z.string().trim().optional().default('None'),
  entryFee: z.object({
    indianAdult: z.coerce.number().min(0, 'Fee cannot be negative.').default(50),
    saarcBimstec: z.coerce.number().min(0, 'Fee cannot be negative.').default(540),
    foreignerAdult: z.coerce.number().min(0, 'Fee cannot be negative.').default(1100),
    child: z.coerce.number().min(0, 'Fee cannot be negative.').default(0),
    mausoleumSupplement: z.coerce.number().min(0, 'Supplement cannot be negative.').default(0),
  }).optional().default({ indianAdult: 50, saarcBimstec: 540, foreignerAdult: 1100, child: 0, mausoleumSupplement: 0 }),
  visitorInstructions: z.array(z.string().trim()).optional().default([]),
  websiteUrl: z.string().trim().url('Must be a valid URL (http/https).').or(z.literal('')).optional().default(''),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  images: z.array(z.string().trim()).optional().default([]),
  demonstrationCapacity: z.object({
    maxPerHour: z.coerce.number().min(1, 'Max capacity per hour must be at least 1.').default(1000),
    standardSlotCapacity: z.coerce.number().min(1, 'Slot capacity must be at least 1.').default(200),
  }).optional().default({ maxPerHour: 1000, standardSlotCapacity: 200 }),
});

export const siteUpdateSchema = siteCreateSchema.partial();

export const slotCreateSchema = z.object({
  heritageSite: z.string().trim().min(2, 'Heritage site slug is required.'),
  date: z.string().regex(DATE_REGEX, 'Date must be formatted as YYYY-MM-DD.'),
  startTime: z.string().regex(TIME_REGEX, 'Start time must be in HH:MM format.'),
  endTime: z.string().regex(TIME_REGEX, 'End time must be in HH:MM format.'),
  capacity: z.coerce.number().int('Capacity must be an integer.').min(1, 'Capacity must be at least 1 visitor.'),
  slotLabel: z.string().trim().optional().default(''),
  isActive: z.boolean().optional().default(true),
});

export const slotUpdateSchema = z.object({
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1 visitor.').optional(),
  isActive: z.boolean().optional(),
});

export const userStatusUpdateSchema = z.object({
  isActive: z.boolean(),
});

export const adminChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, 'Current password must be at least 8 characters.'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation do not match.',
    path: ['confirmPassword'],
  });

export const crowdConfigSchema = z.object({
  lowMax: z.coerce.number().min(1).max(90, 'Low threshold must be between 1 and 90.'),
  moderateMax: z.coerce.number().min(10).max(99, 'Moderate threshold must be between 10 and 99.'),
  highMax: z.coerce.number().min(50).max(100, 'High threshold must be 100 or less.'),
  simulationMultiplier: z.coerce.number().min(0.1).max(5).default(1.0),
});
