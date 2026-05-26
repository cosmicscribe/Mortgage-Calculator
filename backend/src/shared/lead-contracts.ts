import { z } from "zod";

export const ctaTrackingSchema = z.object({
  decision: z.enum(["BENEFICIAL", "TRADE_OFFS", "NOT_BENEFICIAL"]),
  ctaType: z.enum(["primary", "secondary", "subtle"]),
  clicked: z.boolean()
});

export const leadSubmissionSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().min(1, "Last name is required.").max(80),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().min(7, "Enter a valid phone number.").max(30),
  country: z.enum(["US", "CA"]),
  loanBalance: z.number().positive(),
  desiredAction: z.enum(["REFINANCE_SAVE", "RENEW_SWITCH"]),
  ctaTracking: ctaTrackingSchema.optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Consent is required before submitting." })
  })
});

export type CtaTrackingInput = z.infer<typeof ctaTrackingSchema>;
export type LeadSubmissionInput = z.infer<typeof leadSubmissionSchema>;

export type LeadSubmissionResponse = {
  leadId: string;
  status: "received";
  nextStep: string;
};

export function createLeadId() {
  return `lead_${crypto.randomUUID()}`;
}
