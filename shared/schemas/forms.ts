import { z } from "zod";
import { isoDate } from "./common";

// Bangladesh mobile phone validation: accepts 01XXXXXXXXX or with +880 / 880 prefix
export const bdPhone = z
  .string()
  .trim()
  .regex(
    /^(?:\+?880|0)?1[3-9]\d{8}$/,
    "Invalid Bangladesh mobile number format (e.g. 01819123456)"
  );

// Simple sanitization helper to strip HTML tags
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>?/gm, "").trim();
}

// Honeypot field: must be empty if human; bots often fill all input fields
export const honeypotField = z
  .string()
  .max(0, "Spam submission detected")
  .optional()
  .default("");

// Cloudflare Turnstile token
export const turnstileTokenField = z
  .string()
  .min(1, "Verification challenge token required");

// 1. Puja Booking Request Submission (Standard & Custom Rituals)
export const pujaTypeEnum = z.enum(["standard", "custom"]);
export type PujaType = z.infer<typeof pujaTypeEnum>;

export const pujaBookingSubmissionSchema = z
  .object({
    pujaType: pujaTypeEnum.default("standard"),
    pujaId: z.number().int().positive().optional(),
    customPujaName: z
      .string()
      .trim()
      .max(150)
      .optional()
      .transform((v) => (v ? stripHtml(v) : v)),
    specialInstructions: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .transform((v) => (v ? stripHtml(v) : v)),
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100)
      .transform(stripHtml),
    phone: bdPhone,
    email: z
      .string()
      .trim()
      .email("Invalid email format")
      .optional()
      .or(z.literal("")),
    gotra: z.string().trim().max(100).optional().transform((v) => (v ? stripHtml(v) : v)),
    preferredDate: isoDate,
    note: z.string().trim().max(500).optional().transform((v) => (v ? stripHtml(v) : v)),
    honeypot: honeypotField,
    turnstileToken: turnstileTokenField,
  })
  .refine(
    (data) => {
      if (data.pujaType === "custom") {
        return !!data.customPujaName && data.customPujaName.length >= 2;
      }
      return true;
    },
    {
      message: "Custom puja name is required for custom puja bookings",
      path: ["customPujaName"],
    }
  );

export type PujaBookingSubmission = z.infer<typeof pujaBookingSubmissionSchema>;

// 2. Contact Message Submission
export const contactMessageSubmissionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100)
    .transform(stripHtml),
  phone: z.string().trim().max(20).optional(),
  email: z
    .string()
    .trim()
    .email("Invalid email format")
    .optional()
    .or(z.literal("")),
  subject: z
    .string()
    .trim()
    .min(2, "Subject must be at least 2 characters")
    .max(200)
    .transform(stripHtml),
  message: z
    .string()
    .trim()
    .min(5, "Message must be at least 5 characters")
    .max(2000)
    .transform(stripHtml),
  honeypot: honeypotField,
  turnstileToken: turnstileTokenField,
});

export type ContactMessageSubmission = z.infer<typeof contactMessageSubmissionSchema>;

// 3. Volunteer Registration Submission
export const volunteerAreaEnum = z.enum([
  "annadanam",
  "crowd",
  "decoration",
  "medical",
  "other",
]);

export type VolunteerArea = z.infer<typeof volunteerAreaEnum>;

export const volunteerSubmissionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100)
    .transform(stripHtml),
  phone: bdPhone,
  area: volunteerAreaEnum.default("other"),
  note: z.string().trim().max(500).optional().transform((v) => (v ? stripHtml(v) : v)),
  honeypot: honeypotField,
  turnstileToken: turnstileTokenField,
});

export type VolunteerSubmission = z.infer<typeof volunteerSubmissionSchema>;

// --- Admin Query Schemas ---
export const bookingStatusEnum = z.enum(["new", "confirmed", "completed", "cancelled"]);
export type BookingStatus = z.infer<typeof bookingStatusEnum>;

export const listBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: bookingStatusEnum.optional(),
  pujaType: pujaTypeEnum.optional(),
  date: z.string().optional(),
  search: z.string().trim().optional(),
});

export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;

export const updateBookingStatusSchema = z.object({
  id: z.number().int().positive(),
  status: bookingStatusEnum,
  adminNote: z.string().max(500).optional(),
  customDakshina: z.number().int().min(0).optional(),
  handledBy: z.string().optional(),
});

export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;

export const messageStatusEnum = z.enum(["new", "read", "replied", "archived"]);
export type MessageStatus = z.infer<typeof messageStatusEnum>;

export const listMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: messageStatusEnum.optional(),
  search: z.string().trim().optional(),
});

export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;

export const updateMessageStatusSchema = z.object({
  id: z.number().int().positive(),
  status: messageStatusEnum,
  adminNote: z.string().max(500).optional(),
});

export type UpdateMessageStatusInput = z.infer<typeof updateMessageStatusSchema>;

export const volunteerStatusEnum = z.enum(["new", "contacted", "active", "archived"]);
export type VolunteerStatus = z.infer<typeof volunteerStatusEnum>;

export const listVolunteersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  area: volunteerAreaEnum.optional(),
  status: volunteerStatusEnum.optional(),
  search: z.string().trim().optional(),
});

export type ListVolunteersQuery = z.infer<typeof listVolunteersQuerySchema>;

export const updateVolunteerStatusSchema = z.object({
  id: z.number().int().positive(),
  status: volunteerStatusEnum,
  adminNote: z.string().max(500).optional(),
});

export type UpdateVolunteerStatusInput = z.infer<typeof updateVolunteerStatusSchema>;
