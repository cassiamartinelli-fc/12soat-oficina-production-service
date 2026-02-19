import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  it('deve retornar status ok', () => {
    const result = controller.check();

    expect(result).toEqual({
      status: 'ok',
      service: 'production-service',
    });
  });
});
