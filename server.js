import config from './config';
// import path from 'path';
import passport from 'passport';
import express from 'express';
import flash from 'connect-flash';
import session from 'express-session';
import mongoose from 'mongoose';
import User from './models/user';
import bodyParser from 'body-parser';


// import apiRouter from './api';

const server = express();

// //mongodb setup
mongoose.connect(config.mongodbUri);
const db = mongoose.connection;
db.on('error', console.error.bind(console, '# MongoDB - connection error: '));

export default db;




server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));


require('./config/passport')(passport);


server.use(session({ 
	secret: 'stephakittie555',
	resave: false,
	saveUninitialized: true,
}));
server.use(passport.initialize());
server.use(passport.session());

server.use(flash());


server.get('/auth/facebook', passport.authenticate('facebook', { scope : ['email', 'user_friends'],
																failureFlash: true ,
																successFlash: 'Welcome!'}));

    // handle the callback after facebook has authenticated the user
server.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/loginsuccess',
            failureRedirect : '/login',


}));

server.get('/test', (req, res) =>
{
	res.send('sup');
});

server.get('/testdb', (req, res) =>
{
	var newUser = new User();
	newUser.id = '12345';
	newUser.name = 'Ethan Chang';
	newUser.save();
	res.send('here');
});


// function loggedIn(req, res, next) {
//     //console.log(req.user);
//     if (req.user) {
//         next();
//     } else {
//         res.redirect('/login');
//     }
// }

server.get('/login', (req,res)=> {
	res.send('youre not logged in');
});

server.get('/loginsuccess', (req,res)=> {
	res.send('youre logged in');
});

// server.get('*', loggedIn, (req, res) => {

//  //res.render(__dirname + "/views/index.ejs");
//   res.render('index', {
//     content: '...'
//   });
// });

// server.use('/api', apiRouter);



server.listen(config.port, () => {
  console.info('Express listening on port', config.port);
});
