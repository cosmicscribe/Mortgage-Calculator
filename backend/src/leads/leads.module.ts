import { Module } from "@nestjs/common";
import { LeadSubmissionService } from "./application/lead-submission.service";
import { LEAD_REPOSITORY } from "./domain/lead.entity";
import { InMemoryLeadRepository } from "./infrastructure/in-memory-lead.repository";
import { LeadsController } from "./leads.controller";

@Module({
  controllers: [LeadsController],
  providers: [
    LeadSubmissionService,
    {
      provide: LEAD_REPOSITORY,
      useClass: InMemoryLeadRepository
    }
  ]
})
export class LeadsModule {}
