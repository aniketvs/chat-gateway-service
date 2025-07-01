import { Module } from "@nestjs/common";
import { CallGateway } from "./gateway/call.gatway";
import { CallService } from "./services/call.service";
import { CallEventsSubscriberService } from "./services/call-event-subscriber.service";
import { CallTimeoutListenerService } from "./services/call-timeout-listner.service";
import { callTimeoutSubscriberService } from "./services/call-timeout-subscriber.service";
import { CallHelperService } from "./helper/call.helper";
import { WebRTCService } from "./services/webrtc.service";

@Module({
    providers: [CallGateway,CallService,CallEventsSubscriberService,CallTimeoutListenerService,callTimeoutSubscriberService,CallHelperService
        ,WebRTCService
    ],
    exports: [],
    imports: [],
    controllers: [],
})
export class CallModule{
    
}