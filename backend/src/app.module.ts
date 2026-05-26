import { Module } from "@nestjs/common";
import { LeadsModule } from "./leads/leads.module";
import { RefinanceModule } from "./refinance/refinance.module";

@Module({
  imports: [RefinanceModule, LeadsModule]
})
export class AppModule {}
