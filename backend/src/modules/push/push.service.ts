import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { In, Repository } from 'typeorm';
import { PushToken } from './entities/push-token.entity';
import { RegisterPushTokenDto } from './dto/push.dto';

export interface NewMessagePushPayload {
  chatId: string;
  messageId: string;
  senderName: string;
  preview: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly expo: Expo;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(PushToken)
    private readonly pushTokensRepository: Repository<PushToken>,
  ) {
    const accessToken = this.configService.get<string>('expo.accessToken');
    this.expo = new Expo(accessToken ? { accessToken } : undefined);
  }

  async registerToken(
    userId: string,
    dto: RegisterPushTokenDto,
  ): Promise<{ success: true }> {
    if (!Expo.isExpoPushToken(dto.expoPushToken)) {
      return { success: true };
    }

    const existing = await this.pushTokensRepository.findOne({
      where: { expoPushToken: dto.expoPushToken },
    });

    if (existing) {
      existing.userId = userId;
      existing.platform = dto.platform;
      existing.lastUsedAt = new Date();
      await this.pushTokensRepository.save(existing);
      return { success: true };
    }

    await this.pushTokensRepository.save(
      this.pushTokensRepository.create({
        userId,
        expoPushToken: dto.expoPushToken,
        platform: dto.platform,
        lastUsedAt: new Date(),
      }),
    );

    return { success: true };
  }

  async unregisterToken(
    userId: string,
    expoPushToken: string,
  ): Promise<{ success: true }> {
    await this.pushTokensRepository.delete({ userId, expoPushToken });
    return { success: true };
  }

  async sendNewMessageNotification(
    recipientIds: string[],
    payload: NewMessagePushPayload,
  ): Promise<void> {
    if (recipientIds.length === 0) {
      return;
    }

    const tokens = await this.pushTokensRepository.find({
      where: { userId: In(recipientIds) },
    });

    if (tokens.length === 0) {
      return;
    }

    const messages: ExpoPushMessage[] = tokens
      .filter((token) => Expo.isExpoPushToken(token.expoPushToken))
      .map((token) => ({
        to: token.expoPushToken,
        sound: 'default',
        title: payload.senderName,
        body: payload.preview,
        data: {
          chatId: payload.chatId,
          messageId: payload.messageId,
          type: 'message:new',
        },
      }));

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        await this.handleTickets(tickets, chunk);
      } catch (error) {
        this.logger.warn(
          `Push send failed: ${error instanceof Error ? error.message : error}`,
        );
      }
    }
  }

  private async handleTickets(
    tickets: ExpoPushTicket[],
    messages: ExpoPushMessage[],
  ): Promise<void> {
    for (let index = 0; index < tickets.length; index += 1) {
      const ticket = tickets[index];
      if (ticket.status !== 'error') {
        continue;
      }

      if (ticket.details?.error === 'DeviceNotRegistered') {
        const token = messages[index]?.to;
        if (typeof token === 'string') {
          await this.pushTokensRepository.delete({ expoPushToken: token });
        }
      }
    }
  }
}
