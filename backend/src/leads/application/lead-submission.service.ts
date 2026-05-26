import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { createLeadId, leadSubmissionSchema, type LeadSubmissionResponse } from "../../shared/lead-contracts";
import { LEAD_REPOSITORY, type LeadRepository } from "../domain/lead.entity";
import { SubmitLeadDto } from "../dto/submit-lead.dto";

@Injectable()
export class LeadSubmissionService {
  constructor(@Inject(LEAD_REPOSITORY) private readonly leads: LeadRepository) {}

  async submit(input: SubmitLeadDto): Promise<LeadSubmissionResponse> {
    const parsed = leadSubmissionSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException({
        error: "Invalid lead submission.",
        details: parsed.error.flatten()
      });
    }

    const id = createLeadId();

    await this.leads.save({
      id,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      country: parsed.data.country,
      loanBalance: parsed.data.loanBalance,
      desiredAction: parsed.data.desiredAction,
      createdAt: new Date().toISOString()
    });

    return {
      leadId: id,
      status: "received",
      nextStep: "A licensed mortgage advisor will review the scenario and follow up."
    };
  }
}
