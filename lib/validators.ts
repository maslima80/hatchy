import { z } from 'zod';

// Auth validators
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signinSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Onboarding validators
export const onboardingStep1Schema = z.object({
  brandName: z.string().min(2, 'Brand name must be at least 2 characters'),
  country: z.string().min(2, 'Please select a country'),
  currency: z.string().min(3, 'Currency is required'),
  brandColor: z.string().optional(),
});

export const onboardingStep2Schema = z.object({
  contactEmail: z.string().email('Invalid email address'),
  whatsapp: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
});

// Types
export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2Input = z.infer<typeof onboardingStep2Schema>;
