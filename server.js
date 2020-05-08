import config from './config';
//import path from 'path';
import morgan from 'morgan';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';

//import sassMiddleware from 'node-sass-middleware';
import passport from 'passport';
import flash from 'connect-flash';

import {jsonWebKeys} from './config/auth';

import Merchant from './models/merchant';


const server = express();

// //mongodb setup
mongoose.connect(config.mongodbUri, { useNewUrlParser: true });
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


// server.use(sassMiddleware({
//  src: path.join(__dirname, 'sass'),
//  dest: path.join(__dirname, 'public'),
//  debug: true 
// }));


server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));

const corsOptions = {
  origin: 'https://analytics.shareatpay.com',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

server.use(cors(corsOptions));


server.use(flash());

require('./config/passport')(passport);

server.use(passport.initialize());
server.use(passport.session());



server.set('view engine', 'ejs');
server.use(express.static(path.join(__dirname, 'build')));



function decodeTokenHeader(token, reject) {
    try {
        const [headerEncoded] = token.split('.');
        const buff = new Buffer(headerEncoded, 'base64');
        const text = buff.toString('ascii');
        const header =  JSON.parse(text);
        return header;
    } catch (err) {
        reject(err);
    }
    
}

function getJsonWebKeyWithKID(kid) {
    for (let jwk of jsonWebKeys) {
        if (jwk.kid === kid) {
            return jwk;
        }
    }
    return null;
}

function validateToken(token) {

    return new Promise((resolve, reject) => {
        const header = decodeTokenHeader(token, reject); 
        const jsonWebKey = getJsonWebKeyWithKID(header.kid);

        if(jsonWebKey === null) {
            reject('no key matched');
        }

        const pem = jwkToPem(jsonWebKey);

        try {
            const decoded = jwt.verify(token, pem, {algorithms: ['RS256']});
            resolve(decoded);
        } catch (err) {
            reject(err);
        }
    });
}


server.all('/*', async (req, res, next) => {
    if (req.url === '/merchant/webhook/omnivore') {
        next();
        return;
    }
    
    const authHeader = req.headers.authorization;

    if (authHeader=== undefined) {
        return res.status(401).send('Please provide a valid user token');
    }

    var token;
    if (authHeader.startsWith('Bearer ')){
        token = authHeader.substring(7, authHeader.length);
    } else {
        return res.status(401).send('Please provide a valid user token');
    }

    try {
        const decoded = await validateToken(token);
        next();
    } catch (err) {
        console.log(err);
        return res.status(401).send('user is not authorized');
    }

});

//separating routes
server.use('/merchant', require('./routes/merchant_routes.js'));
server.use('/user', require('./routes/user_routes.js'));
server.use('/party', require('./routes/party_routes.js'));



// server.get('/analytics', (req,res) => {
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });


//create charges

    

/*
================================================
================================================
FUNCITONS FOR TESTING PURPOSES

*/



server.post('/mer', async (req, res) =>
{
    return await Merchant.insertDefaultPassengers();

});


server.get('/user', (req, res) =>
{
    res.send(req.user);
});





server
.listen(config.port, () => {
  console.info('Express listening on port', config.port);
});
