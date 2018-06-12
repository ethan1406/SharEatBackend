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

//aws s3
import AWS from 'aws-sdk';
const s3 = new AWS.S3();

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





// Authenticaiton APIs


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


import Merchant from './models/merchant';


server.get('/map/find', (req, res) =>
{
	var name = req.query.name.toLowerCase();
	var query = Merchant.find({'name_lower' : { $regex: new RegExp(name, 'i') }}).limit(10);

	query.exec((err, merchants) =>
	{
		res.json(merchants);
	});
});


// merchant APIs


server.get('/map/findclosest', (req, res) =>
{
	const currLatitude = req.query.latitude;
	const currLongitude = req.query.longitude;

	Merchant.find({}, (err, merchants) => {
		if(err)
		{
			console.log(err);
		}
		var distances = [];

		var index = 0;

		//Haversine Formula
		merchants.forEach((merchant) => {
			const R = 6371;

			const lat = merchant.location.latitude;
			const lon = merchant.location.longitude;
			const dLat = currLatitude - lat;
			const dLon = currLongitude - lon;

			const temp = Math.sin(dLat/2) * Math.sin(dLat/2)
				+ Math.cos(lat) * Math.cos(currLatitude)
				* Math.sin(dLon/2) * Math.sin(dLon/2);

			const temp2 = 2 * Math.atan2(Math.sqrt(temp), Math.sqrt(1-temp));

			const distance = R * temp2;
			distances.push({distance, index});
			index++;

		});
		distances.sort((a , b) => {
			return a.distance - b.distance;
		});

		var closestMerchants = [];

		const numMerchants = distances.length > 10 ? 10 : distances.length;
		for(var i = 0; i < numMerchants; i++)
		{
			closestMerchants.push(merchants[distances[i].index]);
		}


		res.json(closestMerchants);

	});
	
});

//return menu based on restaurant id
server.get('/menu/:id', (req, res)=> {

	Merchant.findOne({_id: req.params.id}, 'menu', (err, merchant) => {
		if(err)
		{
			console.log('menu error' + err);
		}

		res.json(merchant);

	});

});







server.post('/mer', (req, res) =>
{
	var merchant = new Merchant();
	merchant.email = 'qinwest@gmail.com';
	merchant.name = "Qin West Noodle";
	merchant.location.latitude = 0.593909085261;
	merchant.location.longitude = -2.064290598799;
	merchant.save();

});


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
