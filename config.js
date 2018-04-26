const env = process.env;

export const nodeEnv = env.NODE_ENV || 'development';

export default {
  localMongodbUri: 'mongodb://localhost:27017/shareat',
  mongodbUri: 'mongodb://testUser:test@ds057204.mlab.com:57204/refriend',
  port: env.PORT || 8080,
  host: env.HOST || '0.0.0.0',
  get serverUrl() {
    return `http://${this.host}:${this.port}`;
  }
};
