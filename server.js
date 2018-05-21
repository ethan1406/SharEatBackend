import config from './config';
// import path from 'path';
import morgan from 'morgan';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';

//handling subdomains
import vhost from 'vhost';
import subdomain from './routes/api';

// import apiRouter from './api';

const server = express();

// //mongodb setup
mongoose.connect(config.mongodbUri);
const db = mongoose.connection;
db.on('error', console.error.bind(console, '# MongoDB - connection error: '));

export default db;


//setting up express
server.use(morgan('dev'));


server.use(session({ 
	secret: 'stephakittie555',
	resave: false,
	saveUninitialized: true,
}));

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));


server
.use(vhost('api.localhost', subdomain.app))
.listen(config.port, () => {
  console.info('Express listening on port', config.port);
});
