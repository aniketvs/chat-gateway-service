import { Module } from "@nestjs/common";
import { CallGateway } from "./gateway/call.gatway";
import { CallService } from "./services/call.service";
import { CallEventsSubscriberService } from "./services/call-event-subscriber.service";

@Module({
    providers: [CallGateway,CallService,CallEventsSubscriberService],
    exports: [],
    imports: [],
    controllers: [],
})
export class CallModule{
    
}