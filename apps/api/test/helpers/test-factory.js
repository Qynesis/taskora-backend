"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_ADMIN = exports.TEST_USER = void 0;
exports.createMockRepository = createMockRepository;
exports.createMockTransactionHelper = createMockTransactionHelper;
exports.createMockEventEmitter = createMockEventEmitter;
exports.createMockQueueDispatcher = createMockQueueDispatcher;
exports.createTestModule = createTestModule;
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
exports.TEST_USER = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@example.com',
    roles: ['USER'],
    metadata: {},
};
exports.TEST_ADMIN = {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'admin@example.com',
    roles: ['ADMIN'],
    metadata: {},
};
function createMockRepository() {
    return {
        find: jest.fn(),
        findOne: jest.fn(),
        findOneBy: jest.fn(),
        findAndCount: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        softRemove: jest.fn(),
        count: jest.fn(),
    };
}
function createMockTransactionHelper() {
    return {
        run: jest.fn().mockImplementation(async (cb) => {
            const mockQueryRunner = {
                manager: {
                    save: jest.fn().mockImplementation((_entity, data) => ({
                        id: '00000000-0000-0000-0000-000000000099',
                        ...(data || {}),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })),
                },
            };
            return cb(mockQueryRunner);
        }),
    };
}
function createMockEventEmitter() {
    return {
        emit: jest.fn(),
    };
}
function createMockQueueDispatcher() {
    return {
        dispatch: jest.fn(),
    };
}
async function createTestModule(metadata) {
    return testing_1.Test.createTestingModule({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env.test',
                ignoreEnvFile: true,
                load: [
                    () => ({
                        app: { nodeEnv: 'test', port: 3000, apiPrefix: 'api', logLevel: 'silent' },
                        database: {
                            host: 'localhost',
                            port: 5432,
                            username: 'test',
                            password: 'test',
                            name: 'test',
                            synchronize: true,
                            ssl: false,
                        },
                        redis: { host: 'localhost', port: 6379, password: '' },
                        queue: { defaultAttempts: 1, defaultBackoff: 1000 },
                        auth: {
                            jwtSecret: 'test-secret',
                            jwtExpiration: '1h',
                            jwtAccessSecret: 'test-access-secret',
                            jwtRefreshSecret: 'test-refresh-secret',
                            jwtAccessExpiry: '15m',
                            jwtRefreshExpiry: '30d',
                        },
                        cache: { defaultTtl: 60, maxItems: 100 },
                    }),
                ],
            }),
            ...(metadata.imports || []),
        ],
        controllers: metadata.controllers || [],
        providers: metadata.providers || [],
        exports: metadata.exports || [],
    }).compile();
}