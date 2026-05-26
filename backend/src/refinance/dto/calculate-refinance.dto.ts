import { IsBoolean, IsIn, IsNumber, IsOptional, Max, Min } from "class-validator";

export class CalculateRefinanceDto {
  @IsIn(["US", "CA"])
  country!: "US" | "CA";

  @IsNumber()
  @Min(1)
  currentLoanBalance!: number;

  @IsNumber()
  @Min(0)
  @Max(30)
  currentRate!: number;

  @IsNumber()
  @Min(1)
  @Max(40)
  currentRemainingYears!: number;

  @IsNumber()
  @Min(0)
  @Max(30)
  newRate!: number;

  @IsNumber()
  @Min(1)
  @Max(40)
  newAmortizationYears!: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  termYears = 5;

  @IsNumber()
  @Min(0)
  closingCosts!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  points = 0;

  @IsNumber()
  @Min(0)
  cashOutAmount!: number;

  @IsNumber()
  @Min(1)
  @Max(40)
  expectedStayYears!: number;

  @IsOptional()
  @IsBoolean()
  rollClosingCosts = false;
}
