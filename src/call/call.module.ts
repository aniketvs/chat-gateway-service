import { Module } from "@nestjs/common";
import { CallGateway } from "./gateway/call.gatway";
import { CallService } from "./services/call.service";
import { CallEventsSubscriberService } from "./services/call-event-subscriber.service";
import { CallTimeoutListenerService } from "./services/call-timeout-listner.service";
import { callTimeoutSubscriberService } from "./services/call-timeout-subscriber.service";

@Module({
    providers: [CallGateway,CallService,CallEventsSubscriberService,CallTimeoutListenerService,callTimeoutSubscriberService],
    exports: [],
    imports: [],
    controllers: [],
})
export class CallModule{
    
}