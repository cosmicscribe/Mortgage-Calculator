import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { LeadsModule } from "./leads/leads.module";
import { RefinanceModule } from "./refinance/refinance.module";

@Module({
  controllers: [HealthController],
  imports: [RefinanceModule, LeadsModule]
})
export class AppModule {}
