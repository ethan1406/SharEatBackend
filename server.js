import config from './config';
// import sassMiddleware from 'node-sass-middleware';
// import path from 'path';
// import passport from 'passport';
import express from 'express';
// import flash from 'connect-flash';
// import session from 'express-session';
// import mongoose from 'mongoose';
// import bodyParser from 'body-parser';


// import apiRouter from './api';

const server = express();

//mongodb setup
// mongoose.connect(config.mongodbUri);
// const db = mongoose.connection;
// db.on('error', console.error.bind(console, '# MongoDB - connection error: '));


//export default db;


// server.use(bodyParser.json());
// server.use(bodyParser.urlencoded({ extended: false }));


// require('./config/passport')(passport);


// server.use(sassMiddleware({
//   src: path.join(__dirname, 'sass'),
//   dest: path.join(__dirname, 'public'),
//   debug: true 
// }));

// server.use(session({ 
// 	secret: 'keyboard cat',
// 	resave: false,
// 	saveUninitialized: true,
// }));
// server.use(passport.initialize());
// server.use(passport.session());

// server.use(flash());

// server.set('view engine', 'ejs');

server.use(express.static('public'));

// server.get('/auth/facebook', passport.authenticate('facebook', { scope : ['email', 'user_friends'],
// 																failureFlash: true }));

//     // handle the callback after facebook has authenticated the user
// server.get('/auth/facebook/callback',
//         passport.authenticate('facebook', {
//             successRedirect : '/friendList',
//             failureRedirect : '/login',


// }));




// function loggedIn(req, res, next) {
//     //console.log(req.user);
//     if (req.user) {
//         next();
//     } else {
//         res.redirect('/login');
//     }
// }

// server.get('/login', (req,res) => {
// 	res.render('index', {
// 		content: '...'
// 	});
// });


// server.use('/api', apiRouter);


// server.get('*', loggedIn, (req, res) => {

//  //res.render(__dirname + "/views/index.ejs");
//   res.render('index', {
//     content: '...'
//   });
// });


server.get('/test', (req, res)=>
{
	res.send('sup');
});


server.listen(config.port, () => {
  console.info('Express listening on port', config.port);
});
