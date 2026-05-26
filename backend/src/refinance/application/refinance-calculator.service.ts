import { BadRequestException, Injectable } from "@nestjs/common";
import {
  calculateRefinance,
  refinanceInputSchema,
  type RefinanceResult
} from "../../shared/refinance-engine";
import { CalculateRefinanceDto } from "../dto/calculate-refinance.dto";

@Injectable()
export class RefinanceCalculatorService {
  calculate(input: CalculateRefinanceDto): RefinanceResult {
    const parsed = refinanceInputSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException({
        error: "Invalid calculation input.",
        details: parsed.error.flatten()
      });
    }

    return calculateRefinance(parsed.data);
  }
}
