export default class LoggerRepository {
  constructor({ Logger }) {
    this._logger = Logger;
  }

  async create(tipo, inputTokenCosmos) {
    const dbEntity = {
      tipo,
      token: inputTokenCosmos,
    };

    await this._logger.create(dbEntity);
  }
}
