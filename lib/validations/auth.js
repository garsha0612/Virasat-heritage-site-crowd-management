import { z } from 'zod';

/**
 * Validation schema for new visitor registration.
 * Explicitly ignores/disallows user-supplied roles to prevent privilege escalation.
 */
export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Full name is required.' })
    .trim()
    .min(2, 'Name must be at least 2 characters long.')
    .max(100, 'Name cannot exceed 100 characters.'),
  email: z
    .string({ required_error: 'Email address is required.' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address.'),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(8, 'Password must be at least 8 characters long.')
    .max(100, 'Password cannot exceed 100 characters.')
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)/,
      'Password must contain at least one letter and one number.'
    ),
  phone: z
    .string()
    .trim()
    .max(20, 'Phone number cannot exceed 20 characters.')
    .optional()
    .or(z.literal('')),
  nationality: z
    .string()
    .trim()
    .max(50, 'Nationality cannot exceed 50 characters.')
    .optional()
    .or(z.literal('')),
});

/**
 * Validation schema for user authentication.
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required.' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address.'),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, 'Password cannot be empty.'),
});

/**
 * Validation schema for updating user profile attributes.
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long.')
    .max(100, 'Name cannot exceed 100 characters.')
    .optional(),
  phone: z
    .string()
    .trim()
    .max(20, 'Phone number cannot exceed 20 characters.')
    .optional()
    .or(z.literal('')),
  nationality: z
    .string()
    .trim()
    .max(50, 'Nationality cannot exceed 50 characters.')
    .optional()
    .or(z.literal('')),
});

/**
 * Validation schema for changing account password.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'Current password is required.' })
      .min(1, 'Current password cannot be empty.'),
    newPassword: z
      .string({ required_error: 'New password is required.' })
      .min(8, 'New password must be at least 8 characters long.')
      .max(100, 'New password cannot exceed 100 characters.')
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)/,
        'New password must contain at least one letter and one number.'
      ),
    confirmPassword: z
      .string({ required_error: 'Password confirmation is required.' })
      .min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation do not match.',
    path: ['confirmPassword'],
  });
