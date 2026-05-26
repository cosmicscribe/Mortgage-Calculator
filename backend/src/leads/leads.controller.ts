import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { LeadSubmissionService } from "./application/lead-submission.service";
import { SubmitLeadDto } from "./dto/submit-lead.dto";

@Controller()
export class LeadsController {
  constructor(private readonly leadSubmission: LeadSubmissionService) {}

  @Post("submit-lead")
  @HttpCode(HttpStatus.CREATED)
  submitLead(@Body() body: SubmitLeadDto) {
    return this.leadSubmission.submit(body);
  }
}
