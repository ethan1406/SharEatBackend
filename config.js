const env = process.env;

export const nodeEnv = env.NODE_ENV || 'development';

export default {
  localMongodbUri: 'mongodb://localhost:27017/shareat',
  mongodbUri: 'mongodb://ethan:chang@ds259109.mlab.com:59109/shareat',
  port: env.PORT || 8080,
  host: env.HOST || '0.0.0.0',
  get serverUrl() {
    return `http://${this.host}:${this.port}`;
  }
};
