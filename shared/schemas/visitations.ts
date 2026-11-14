import { z } from "zod";
import { isoDate } from "./common";
import {
  bdPhone,
  stripHtml,
  honeypotField,
  turnstileTokenField,
} from "./forms";

export const visitationTimeSlotEnum = z.enum([
  "morning",
  "midday",
  "evening",
  "special_aarti",
]);
export type VisitationTimeSlot = z.infer<typeof visitationTimeSlotEnum>;

export const visitationPurposeEnum = z.enum([
  "general_darshan",
  "special_darshan",
  "group_pilgrimage",
  "annadanam",
  "rites_guidance",
  "other",
]);
export type VisitationPurpose = z.infer<typeof visitationPurposeEnum>;

export const visitationStatusEnum = z.enum([
  "requested",
  "confirmed",
  "checked_in",
  "cancelled",
]);
export type VisitationStatus = z.infer<typeof visitationStatusEnum>;

// Time slot human-readable display mapping
export const TIME_SLOT_DESCRIPTIONS: Record<VisitationTimeSlot, string> = {
  morning: "Morning Darshan (05:00 AM – 12:30 PM)",
  midday: "Midday Bhog Aarti & Rest Period",
  evening: "Evening Darshan & Sandhya Aarti (04:30 PM – 09:30 PM)",
  special_aarti: "Special Aarti & Sanctum Parikrama",
};

// 1. Devotee Visitation Booking Submission
export const createVisitationSchema = z.object({
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
  visitDate: isoDate,
  timeSlot: visitationTimeSlotEnum.default("morning"),
  visitorCount: z
    .number()
    .int("Visitor count must be a whole number")
    .min(1, "At least 1 visitor required")
    .max(50, "For groups larger than 50, please contact temple office directly")
    .default(1),
  purpose: visitationPurposeEnum.default("general_darshan"),
  specialNeeds: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? stripHtml(v) : v)),
  honeypot: honeypotField,
  turnstileToken: turnstileTokenField,
});

export type CreateVisitationInput = z.infer<typeof createVisitationSchema>;

// 2. Admin List Query Schema
export const listVisitationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: visitationStatusEnum.optional(),
  timeSlot: visitationTimeSlotEnum.optional(),
  purpose: visitationPurposeEnum.optional(),
  date: z.string().optional(),
  search: z.string().trim().optional(),
});

export type ListVisitationsQuery = z.infer<typeof listVisitationsQuerySchema>;

// 3. Admin Update Status Schema
export const updateVisitationStatusSchema = z.object({
  id: z.number().int().positive(),
  status: visitationStatusEnum,
  adminNotes: z.string().max(500).optional(),
  handledBy: z.string().optional(),
});

export type UpdateVisitationStatusInput = z.infer<typeof updateVisitationStatusSchema>;

// 4. Admin Check-in Schema
export const checkInVisitationSchema = z.object({
  id: z.number().int().positive(),
  notes: z.string().max(500).optional(),
});

export type CheckInVisitationInput = z.infer<typeof checkInVisitationSchema>;
