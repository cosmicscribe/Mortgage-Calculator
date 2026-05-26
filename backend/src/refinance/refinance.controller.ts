import { Body, Controller, Post } from "@nestjs/common";
import { RefinanceCalculatorService } from "./application/refinance-calculator.service";
import { CalculateRefinanceDto } from "./dto/calculate-refinance.dto";

@Controller()
export class RefinanceController {
  constructor(private readonly calculator: RefinanceCalculatorService) {}

  @Post("calculate-refinance")
  calculateRefinance(@Body() body: CalculateRefinanceDto) {
    return this.calculator.calculate(body);
  }
}
