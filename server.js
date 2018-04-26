import config from './config';
// import path from 'path';
// import passport from 'passport';
import express from 'express';
// // import flash from 'connect-flash';
// import session from 'express-session';
// import mongoose from 'mongoose';
// import bodyParser from 'body-parser';


// import apiRouter from './api';

const server = express();

// //mongodb setup
// mongoose.connect(config.localMongodbUri);
// const db = mongoose.connection;
// db.on('error', console.error.bind(console, '# MongoDB - connection error: '));


// export default db;


// server.use(bodyParser.json());
// server.use(bodyParser.urlencoded({ extended: false }));


// // require('./config/passport')(passport);


// server.use(session({ 
// 	secret: 'stephakittie555',
// 	resave: false,
// 	saveUninitialized: true,
// }));
// server.use(passport.initialize());
// server.use(passport.session());

// server.use(flash());


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


server.get('/test', (req, res) =>
{
	res.send('sup');
});


server.listen(config.port, () => {
  console.info('Express listening on port', config.port);
});
