import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ReportWarningSentHandler } from './events/report-warning-sent.handler';
import { EventsModule } from '../../events/events.module';
import { SecurityModule } from '../../security/security.module';

@Module({
  imports: [EventsModule, SecurityModule],
  providers: [ChatGateway, ReportWarningSentHandler],
  exports: [ChatGateway],
})
export class MessageModule {}
