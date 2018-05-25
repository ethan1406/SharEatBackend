import config from './config';
// import path from 'path';
import morgan from 'morgan';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import passport from 'passport';
import flash from 'connect-flash';
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


server.get('*', function(req, res, next){ 
  console.log(req.headers.host);
  console.log(req.url);
  next(); 
});


server.use(flash());


require('./config/passport')(passport);



server.use(passport.initialize());
server.use(passport.session());



//testing purposes
server.set('view engine', 'ejs');



server.get('/auth/facebook', passport.authenticate('facebook', { scope : ['email', 'user_friends'],
																failureFlash: true ,
																successFlash: 'Welcome!'}));

    // handle the callback after facebook has authenticated the user
server.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/loginsuccess',
            failureRedirect : '/login',
}));



server.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

server.get('/login', (req,res)=> {
	res.render('login.ejs', { message: req.flash('loginMessage') });
});


server.post('/signup', (req, res, next) => {
	passport.authenticate('local-signup', (err, user, info) =>{
		if(err)
		{
			return next(err);
		}
		if(!user)
		{
			req.session.message = info.message;
			return res.send({ status: -1, message: info.message });
		}
		req.logIn(user, function(err) {
			if (err) { return next(err); }
			return res.send({ status : 0 });
		});
	})(req, res, next);
});

// server.post('/signup', passport.authenticate('local-signup', {
//         successRedirect : '/loginsuccess', // redirect to the secure profile section
//         failureRedirect : '/signup', // redirect back to the signup page if there is an error
//         failureFlash : true // allow flash messages
//  }));



server.post('/login', (req, res, next) => {
	passport.authenticate('local-login', (err, user, info) =>{
		if(err)
		{
			return next(err);
		}
		if(!user)
		{
			req.session.message = info.message;
			return res.send({ status: -1, message: info.message });
		}
		req.logIn(user, function(err) {
			if (err) { return next(err); }
			return res.send({ status : 0 });
		});
	})(req, res, next);
});


// server.post('/login', passport.authenticate('local-login', {
//         successRedirect : '/loginsuccess', // redirect to the secure profile section
//         failureRedirect : '/login', // redirect back to the signup page if there is an error
//         failureFlash : true // allow flash messages
// }));





server.get('/test', (req, res) =>
{
	res.send('sup');
});

server.get('/user', (req, res) =>
{
	res.send(req.user);
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


server
.use(vhost('api.shareatpay.com', subdomain.app))
.listen(config.port, () => {
  console.info('Express listening on port', config.port);
});
