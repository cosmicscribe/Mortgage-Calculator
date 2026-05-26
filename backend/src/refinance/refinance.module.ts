import { Module } from "@nestjs/common";
import { RefinanceCalculatorService } from "./application/refinance-calculator.service";
import { RefinanceController } from "./refinance.controller";

@Module({
  controllers: [RefinanceController],
  providers: [RefinanceCalculatorService]
})
export class RefinanceModule {}
