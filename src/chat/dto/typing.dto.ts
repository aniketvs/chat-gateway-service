import { IsNumber, IsString } from 'class-validator';

export class TypingDto {
  @IsNumber()
  toUserId: number;

  @IsString()
  toUserNumber: string;
}
