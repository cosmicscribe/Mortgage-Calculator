export type DesiredAction = "REFINANCE_SAVE" | "RENEW_SWITCH";

export type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: "US" | "CA";
  loanBalance: number;
  desiredAction: DesiredAction;
  createdAt: string;
};

export const LEAD_REPOSITORY = Symbol("LEAD_REPOSITORY");

export interface LeadRepository {
  save(lead: Lead): Promise<Lead>;
}
