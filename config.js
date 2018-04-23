const env = process.env;

export const nodeEnv = env.NODE_ENV || 'development';

export const logStars = function(message) {
  console.info('**********');
  console.info(message);
  console.info('**********');
};

export default {
  localMongodbUri: 'mongodb://localhost:27017/reFriend',
  mongodbUri: 'mongodb://testUser:test@ds057204.mlab.com:57204/refriend',
  port: env.PORT || 8080,
  host: env.HOST || '0.0.0.0',
  get serverUrl() {
    return `http://${this.host}:${this.port}`;
  }
};
//10209863220197701

//https://graph.facebook.com/10209863220197701;EAALBael1ZAqIBAFuBA0QJxYqU4RNjTxlOG5VPiEAWxrKQ2z4KBCa4LHgqyGOWJenrZBgT6NCky6HFEUNNI6LjD7eY03FmFebPK298CPN2vWz6vzZB1choE7okC1rnUSXQC8h2uemcTbtChzZBGprsvgBFVkdH3gZD=775610585933474|8ce931d8eb2cf5c67ea80968b171740d

//https://graph.facebook.com/endpoint?key=value&amp;access_token=app_id|app_secret