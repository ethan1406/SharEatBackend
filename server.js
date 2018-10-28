import config from './config';
//import path from 'path';
import request from 'request';
import morgan from 'morgan';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
//import sassMiddleware from 'node-sass-middleware';
import passport from 'passport';
import flash from 'connect-flash';
//handling subdomains
import vhost from 'vhost';
import subdomain from './routes/api';
import configAuth from './config/auth';
import querystring from 'querystring';

//aws s3
// import AWS from 'aws-sdk';
// const s3 = new AWS.S3();

// import apiRouter from './api';

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


// server.get('*', function(req, res, next){ 
//   console.log(req.headers.host);
//   console.log(req.url);
//   next(); 
// });

server.use(flash());

require('./config/passport')(passport);

server.use(passport.initialize());
server.use(passport.session());



//testing purposes
server.set('view engine', 'ejs');
server.use(express.static('public'));



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
            return res.status(401).json({error : info.message});
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.sendStatus(200);
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
            return res.status(401).json({error : info.message});
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.status(200).json({email:req.user.email});
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


        res.status(200).json(closestMerchants);

    });
    
});

//return menu based on restaurant id
server.get('/menu/:restaurantId', (req, res)=> {

    Merchant.findOne({_id: req.params.restaurantId}, 'menu', (err, menu) => {
        if(err)
        {
            console.log('menu error: ' + err);
        }

        res.json(menu);

    });

});




import Party from './models/party';
/*
    Table Logic

*/
// join a table at a restaurant
server.get('/party/:restaurantId/:tableNumber', (req, res) => {
    return Party.grabPartyByResIdandTableNum(req.params.restaurantId, req.params.tableNumber)
        .then((party) => {
                if(!party){
                    res.status(400).send('No party is found');
                } else {
                    res.status(200).send(party);
                }
            }
        )
        .catch((err) => {
                console.log(err);
                res.status(500).send(`Internal error from Mongoose: ${err.message}`);
            }           
        );

});




server.post('/party/:restaurantId/:tableNumber', (req, res)=> {

    if(!req.user)
    {
        console.log('user is not logged in');
    }
    else
    {
        Merchant.findOne({_id: req.params.restaurantId}, (err, merchant) => {
            if(err)
            {
                console.log('table join merchant error: ' + err);
            }

            if(!merchant)
            {
                console.log('no merchant by the id exists');
                return res.send({ status : -1, message: 'no merchant by the id exists'});
            }
            else
            {
                Party.findOne({restaurantId: req.params.restaurantId, tableNumber: req.params.tableNumber}, (err, party) => {
                    if(err)
                    {
                        console.log('table join party error: ' + err);
                    }
                    if(party)
                    {
                        party.members.push(req.user._id);

                        party.save((err) => {
                            if(err)
                            {
                                console.log('failed to save a party member" ' + err);
                            }
                            return res.send({ status : 0, partyId: party._id});
                        });
                    }
                    else
                    {
                        var newParty = new Party(); 
                        newParty.members.push(req.user._id);
                        newParty.restaurantId = req.params.restaurantId;
                        newParty.finished = false;
                        newParty.tableNumber = req.params.tableNumber;
                        newParty.time = Date.now();
                        newParty.orderTotal = 10;
                        newParty.save((err) => {
                            if(err)
                            {
                                console.log('failed to save a new party: " ' + err);
                            }
                            return res.send({ status : 0, partyId: newParty._id});
                        });
                    }
                    
                });
            }


        });
    }
});



server.post('/order/:partyId/:foodId', async (req, res, next) => {
    
    try {
        const party = await Party.findOne({_id: req.params.partyId}).exec();
        const restaurant = await Merchant.findOne({_id: party.restaurantId}, 'menu').exec();
        var price = 0;
        Object.entries(restaurant.menu).forEach(([category, items]) => {
            items.forEach(item => {
                if (item.foodId == req.params.foodId) {
                    price = item.price;
                }
            });
        });
        party.orderTotal += price;
        party.orders.push({foodId : req.params.foodId, buyers:[req.user._id]});
        
        party.save((err, order) =>{
            if(err)
            {
                res.status(500).send(`failed to add a new order to the orders: ${err.message}`);
                next(`failed to add a new order to the orders: ${err.message}`);
            }
            const orderId = order._id;
            return res.send({ status : 0, orderId});
        });

    } catch (err) {
        res.status(500).send(`failed to add a new order to the orders: ${err.message}`);
        next(`failed to add a new order to the orders: ${err.message}`);

    }



    // Party.findOne({_id: req.params.partyId}, 'orders', (err, party) => {
    //     if(err)
    //     {
    //         res.status(500).send(`failed to add a new order to the party:  ${err.message}`);
    //         next(`failed to add a new order to the party:  ${err.message}`);
    //     }
    //     const party = await Party.findOne({_id: partyId}).exec();

    //     party.orders.push({foodId : req.params.foodId, buyers:[req.user._id]});
    //     party.save((err, order) =>{
    //         if(err)
    //         {
    //             res.status(500).send(`failed to add a new order to the orders: ${err.message}`);
    //             next(`failed to add a new order to the orders: ${err.message}`);
    //         }
    //         const orderId = order._id;
    //         return res.send({ status : 0, orderId});
    //     });
    // });

});



server.post('/order/split/:partyId/:orderId', async (req, res, next) => {
    
    try {
        const party = await Party.findOne({_id: req.params.partyId}, 'orders').exec();
        party.orders.forEach((order)=> {
            if(order._id == req.params.orderId) {
                //check if the user is already one of the buyers
                var isBuyer = false;
                order.buyers.forEach((buyerId) => {
                    if(buyerId.equals(req.user._id)) {
                        isBuyer = true;
                    }
                });
                if(!isBuyer) {
                    order.buyers.push(req.user._id);
                    party.save();
                    res.sendStatus(200);
                } else {
                    res.status(500).send('user is already one of the buyers');
                }
            }
        });

    } catch (err) {
        res.status(500).send(`failed to split the order for the user: ${err.message}`);
        next(`failed to split the order for the user: ${err.message}`);
    }
});


//localhost:8080/order/split/5b74843071e0c8949999a808/5b7486b03cb45c9524de9065



const stripe = require('stripe')(configAuth.stripe.secretKey);


server.get('/merchant/dashboard', (req,res) => {
    res.render('index', {
        content: '...'
    });
});


server.get('/merchant/authorize', (req,res) => {
    //Generate a random string as state to protect from CSRF and place it in the session.
    req.session.state = Math.random().toString(36).slice(2);
    // Prepare the mandatory Stripe parameters.
    let parameters = {
        redirect_uri:'https://www.shareatpay.com/merchant/token',
        client_id: configAuth.stripe.clientId,
        state: req.session.state
    };
    // Optionally, Stripe Connect accepts `first_name`, `last_name`, `email`,
    // and `phone` in the query parameters for them to be autofilled.
    parameters = Object.assign(parameters, {
        // 'stripe_user[business_type]': req.user.type || 'individual',
        // 'stripe_user[first_name]': req.user.firstName || undefined,
        // 'stripe_user[last_name]': req.user.lastName || undefined,
        'stripe_user[email]': 'qinwest@gmail.com',
        
    });
    // Redirect to Stripe to start the Connect onboarding.
    res.redirect(configAuth.stripe.authorizeUri + '?' + querystring.stringify(parameters));
});


/**
 * GET /pilots/stripe/token
 *
 * Connect the new Stripe account to the platform account.
 */
server.get('/merchant/token', async (req, res) => {
    // Check the state we got back equals the one we generated before proceeding.
    if (req.session.state != req.query.state) {
        res.redirect('/merchant/dashboard');
    }
    // Post the authorization code to Stripe to complete the authorization flow.
    request.post(configAuth.stripe.tokenUri, {
        form: {
            grant_type: 'authorization_code',
            client_id: configAuth.stripe.clientId,
            client_secret: configAuth.stripe.secretKey,
            code: req.query.code
        },
            json: true
    }, (err, response, body) => {
        console.log(body);
        if (err || body.error) {
          console.log('The Stripe onboarding process has not succeeded.');
        } else {
          // Update the model and store the Stripe account ID in the datastore.
          // This Stripe account ID will be used to pay out to the merchant.
            Merchant.findOne({_id: '5b346f48d585fb0e7d3ed3fc'}, (err, merchant) => {
                merchant.stripeAccountId = body.stripe_user_id;
                merchant.save();
            });
        }
        // Redirect to the final stage.
        res.redirect('/merchant/dashboard');
    });
});

/**
 * POST /api/passengers/me/ephemeral_keys
 *
 * Generate an ephemeral key for the logged in customer.
 */
server.post('/customer/me/ephemeral_keys', async (req, res, next) => {
    const apiVersion = req.query.api_version;
    console.log(apiVersion);
    try {
    // Create ephemeral key for customer.
        const ephemeralKey = await stripe.ephemeralKeys.create({
            customer: req.user.stripeCustomerId
        }, {
            stripe_version: apiVersion
        });
        // Respond with ephemeral key.
        res.send(ephemeralKey);
    } catch (err) {
        res.sendStatus(500);
        next(`Error creating ephemeral key for customer: ${err.message}`);
    }
});



/**
 * POST /party
 *
 * Create a new ride with the corresponding parameters.
 */
server.post('/party/charge', async (req, res, next) => {

    const {source, partyId} = req.body;
    console.log(source);
    console.log(partyId);
  //const { source, amount, currency } = req.body;
    try {
        const party = await Party.findOne({_id: partyId}).exec();
        const restaurant = await Merchant.findOne({_id: party.restaurantId}).exec();
        const charge = await stripe.charges.create({
            source: source,
            amount: party.orderTotal,
            currency: 'usd',
            customer: party.members[0],
            description: `charged ${party.members[0]} on behalf of ${restaurant.name}`,
            statement_descriptor: 'shareat',
            destination: {
                amount: party.orderTotal * 0.2,
                account: restaurant.stripeAccountId
            }
        });
        console.log("sup4");
        party.finished = true;
        party.stripeChargeId = charge.id;
        party.saved();

        res.send({
            orders: party.orders
        });
        

    } catch(err) {
        res.sendStatus(500);
        next(`Error adding token to customer: ${err.message}`);
    }
});



/*
================================================
================================================
FUNCTIONS for Square POS system
*/
server.post('/square', (req,res) => {
	res.send('OK');

	const data = req.body;
	console.log(data);

});




    

/*
================================================
================================================
FUNCITONS FOR TESTING PURPOSES

*/



server.post('/mer', async (req, res) =>
{
    return await Merchant.insertDefaultPassengers();

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

/*
================================================
================================================
================================================
================================================


// server.get('*', loggedIn, (req, res) => {

//  //res.render(__dirname + "/views/index.ejs");
//   res.render('index', {
//     content: '...'
//   });
// });
// if(typeof (party.orders.find(order => order.foodId === req.params.foodId)) === 'undefined')
            // {
            //  party.orders.push({foodId: req.params.foodId, buyers:[req.user._id]});
            // }
            // else
            // {
            //  party.orders.
            // }
================================================
================================================
================================================
*/




server
.use(vhost('api.shareatpay.com', subdomain.app))
.listen(config.port, () => {
  console.info('Express listening on port', config.port);
});
