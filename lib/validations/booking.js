import { z } from 'zod';

export const availabilityQuerySchema = z.object({
  site: z.string({ required_error: 'Site slug is required.' }).trim().min(1),
  date: z
    .string({ required_error: 'Date is required.' })
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD.'),
});

export const createBookingSchema = z.preprocess((val) => {
  if (typeof val === 'object' && val !== null) {
    const raw = { ...val };
    if (!raw.siteSlug && raw.heritageSite) raw.siteSlug = raw.heritageSite;
    if (raw.visitorDetails && typeof raw.visitorDetails === 'object') {
      const vd = { ...raw.visitorDetails };
      if (!vd.primaryName && vd.fullName) vd.primaryName = vd.fullName;
      if (!vd.primaryEmail && vd.email) vd.primaryEmail = vd.email;
      if (!vd.primaryPhone && vd.phone) vd.primaryPhone = vd.phone;
      raw.visitorDetails = vd;
    }
    return raw;
  }
  return val;
}, z.object({
  siteSlug: z.string({ required_error: 'Destination identifier is required.' }).trim().min(1),
  visitDate: z
    .string({ required_error: 'Visit date is required.' })
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD.'),
  slotId: z.string({ required_error: 'Time slot ID is required.' }).trim().min(1),
  includeMausoleum: z.boolean().optional().default(false),
  tickets: z
    .array(
      z.object({
        category: z.string({ required_error: 'Ticket category is required.' }),
        quantity: z
          .number({ required_error: 'Quantity is required.' })
          .int('Quantity must be an integer.')
          .min(0, 'Quantity cannot be negative.')
          .max(10, 'Maximum 10 tickets per category.'),
      })
    )
    .min(1, 'At least one ticket category must be included.'),
  visitorDetails: z.object({
    primaryName: z
      .string({ required_error: 'Primary visitor name is required.' })
      .trim()
      .min(2, 'Name must be at least 2 characters long.'),
    primaryEmail: z
      .string({ required_error: 'Primary contact email is required.' })
      .trim()
      .email('Please provide a valid email address.'),
    primaryPhone: z.string().trim().optional().or(z.literal('')),
    nationality: z.string().trim().optional().or(z.literal('')),
    additionalVisitors: z
      .array(
        z.object({
          name: z.string().trim().default(''),
          age: z.number().int().min(0).max(120).optional().nullable(),
          idType: z.string().trim().default('ID Proof at Gate'),
        })
      )
      .optional()
      .default([]),
  }),
}));

export const cancelBookingSchema = z.object({
  reason: z.string().trim().default('Visitor request'),
});
