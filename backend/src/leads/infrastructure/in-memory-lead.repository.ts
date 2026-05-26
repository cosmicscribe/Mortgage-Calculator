import { Injectable } from "@nestjs/common";
import type { Lead, LeadRepository } from "../domain/lead.entity";

@Injectable()
export class InMemoryLeadRepository implements LeadRepository {
  private readonly leads: Lead[] = [];

  async save(lead: Lead) {
    this.leads.push(lead);
    return lead;
  }
}
