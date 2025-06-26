import { IsNumber, IsString } from "class-validator";

export class UserCallDto {
    @IsNumber()
    toUserId:number;

    @IsString()
    toUserNumber:string;
}