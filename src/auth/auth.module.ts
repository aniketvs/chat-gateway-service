import { Global, Module } from "@nestjs/common";
import { AuthService } from "./service/auth.service";
@Global()
@Module({
controllers: [],
providers: [AuthService],
exports: [AuthService],
})

export class AuthModule{};