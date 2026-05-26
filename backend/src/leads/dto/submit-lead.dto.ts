import { IsBoolean, IsEmail, IsIn, IsNumber, IsPhoneNumber, IsString, MaxLength, Min } from "class-validator";
import type { DesiredAction } from "../domain/lead.entity";

export class SubmitLeadDto {
  @IsString()
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MaxLength(80)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsPhoneNumber()
  phone!: string;

  @IsIn(["US", "CA"])
  country!: "US" | "CA";

  @IsNumber()
  @Min(1)
  loanBalance!: number;

  @IsIn(["REFINANCE_SAVE", "RENEW_SWITCH"])
  desiredAction!: DesiredAction;

  @IsBoolean()
  consent!: true;
}
