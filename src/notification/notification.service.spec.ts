import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { RabbitMQProvider } from './rabbitmq.provider';
import { IncomingMessage } from './types';

describe('NotificationService', () => {
  let service: NotificationService;
  let rabbitMQProvider: jest.Mocked<RabbitMQProvider>;
  let configService: jest.Mocked<ConfigService>;
  let mockChannel: any;

  beforeEach(async () => {
    mockChannel = {
      sendToQueue: jest.fn(),
    };

    const mockRabbitMQProvider = {
      getChannel: jest.fn().mockReturnValue(mockChannel),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: RabbitMQProvider,
          useValue: mockRabbitMQProvider,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    rabbitMQProvider = module.get(RabbitMQProvider);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publishIncoming', () => {
    it('should publish message to queue and set status to RECEBIDO', async () => {
      const testMessage: IncomingMessage = {
        mensagemId: 'test-123',
        conteudoMensagem: 'Test message content',
      };

      const expectedQueue = 'notification.input.test';
      configService.get.mockReturnValue(expectedQueue);

      await service.publishIncoming(testMessage);

      expect(rabbitMQProvider.getChannel).toHaveBeenCalledTimes(1);
      expect(configService.get).toHaveBeenCalledWith('QUEUE_IN');
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        expectedQueue,
        Buffer.from(JSON.stringify(testMessage)),
        { persistent: true }
      );
      expect(service.getStatus(testMessage.mensagemId)).toBe('RECEBIDO');
    });

    it('should handle different message types correctly', async () => {
      const testMessage: IncomingMessage = {
        mensagemId: 'different-id-456',
        conteudoMensagem: 'Another test message',
      };

      const expectedQueue = 'notification.input.test';
      configService.get.mockReturnValue(expectedQueue);

      await service.publishIncoming(testMessage);

      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        expectedQueue,
        Buffer.from(JSON.stringify(testMessage)),
        { persistent: true }
      );
      expect(service.getStatus(testMessage.mensagemId)).toBe('RECEBIDO');
    });

    it('should use correct queue name from configuration', async () => {
      const testMessage: IncomingMessage = {
        mensagemId: 'test-789',
        conteudoMensagem: 'Test message',
      };

      const customQueue = 'custom.notification.queue';
      configService.get.mockReturnValue(customQueue);

      await service.publishIncoming(testMessage);

      expect(configService.get).toHaveBeenCalledWith('QUEUE_IN');
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        customQueue,
        expect.any(Buffer),
        { persistent: true }
      );
    });

    it('should serialize message correctly to JSON', async () => {
      const testMessage: IncomingMessage = {
        mensagemId: 'test-serialization',
        conteudoMensagem: 'Message with special chars: !@#$%^&*()',
      };

      configService.get.mockReturnValue('test.queue');

      await service.publishIncoming(testMessage);

      const expectedPayload = Buffer.from(JSON.stringify(testMessage));
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'test.queue',
        expectedPayload,
        { persistent: true }
      );
    });

    it('should set persistent option to true', async () => {
      const testMessage: IncomingMessage = {
        mensagemId: 'test-persistent',
        conteudoMensagem: 'Test message',
      };

      configService.get.mockReturnValue('test.queue');

      await service.publishIncoming(testMessage);

      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Buffer),
        { persistent: true }
      );
    });
  });

  describe('getStatus', () => {
    it('should return undefined for non-existent message ID', () => {
      expect(service.getStatus('non-existent-id')).toBeUndefined();
    });

    it('should return correct status for existing message ID', async () => {
      const testMessage: IncomingMessage = {
        mensagemId: 'status-test',
        conteudoMensagem: 'Test message',
      };

      configService.get.mockReturnValue('test.queue');
      await service.publishIncoming(testMessage);

      expect(service.getStatus('status-test')).toBe('RECEBIDO');
    });
  });
});
