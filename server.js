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

import User from './models/user';
import Party from './models/party';
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



server.use(flash());

require('./config/passport')(passport);

server.use(passport.initialize());
server.use(passport.session());



//testing purposes
server.set('view engine', 'ejs');
server.use(express.static('public'));

var Pusher = require('pusher');
var pusher = new Pusher({
  appId: '646223',
  key: '96771d53b6966f07b9f3',
  secret: '0175682d7deff09c6ea6',
  cluster: 'us2',
  encrypted: true
});


//separating routes
server.use('/merchant', require('./routes/merchant_routes.js'));
server.use('/user', require('./routes/user_routes.js'));


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




/*
    Table Logic

*/
// join a table at a restaurant
server.get('/party/:restaurantId/:tableNumber', async (req, res) => {
    try {
        const party = await Party.findOne({
            restaurantId: req.params.restaurantId, 
            tableNumber: req.params.tableNumber,
            finished: false
        });
        if(!party){
            res.status(404).send('No party is found');
        } else {
            res.status(200).send(party);
        }
    } catch (err) {
        console.log(err);
        res.status(500).send(`Internal error from Mongoose: ${err.message}`);
    }
});

server.get('/party/:partyId', async (req, res, next) => {
    try {
        const party = await Party.findOne({_id: req.params.partyId});
        if(!party) {
            res.status(404).send('No party is found');
        } else {
            res.status(200).send(party);
        }
    } catch (err) {
        res.status(500).send(`Internal error from Mongoose: ${err.message}`);
        next(err);
    }
    
});


server.post('/party/:restaurantId/:tableNumber', async (req, res, next)=> {
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
            return res.status(500).send({orderId});
        });

    } catch (err) {
        res.status(500).send(`failed to add a new order to the orders: ${err.message}`);
        next(`failed to add a new order to the orders: ${err.message}`);

    }

});


server.post('/order/split', async (req, res, next) => {
    try {
        var party = await Party.findOne({_id: req.body.partyId}, ['orders','members']).exec();
        party.orders.forEach((order)=> {
            if(order._id == req.body.orderId) {
                //check if the user is already one of the buyers
                var isBuyer = false;
                var isFinished = false;
                var index = -1;
                var count = 0;
                order.buyers.forEach((buyer) => {
                    if(buyer.userId.toString() === req.user._id.toString()) {
                        isFinished = buyer.finished;
                        isBuyer = true;
                        index = count;
                    }
                    count++;
                });
                
                if(!isFinished) {
                    if(!isBuyer) {
                        order.buyers.push({firstName: req.user.firstName, 
                            lastName: req.user.lastName, userId: req.user._id, finished: false});
                        
                        // check if the user is already a member of the party
                        var isMember = false;
                        var indexOfMember = -1;
                        party.members.forEach((member, index) =>{
                            if(member.userId.toString() === req.user._id.toString()) {
                                isMember = true;
                                indexOfMember = index;
                            }
                        });

                        if(!isMember) {
                            party.members.push({userId: req.user._id, count: 1, tax: 0, tip: 0});
                        } else {
                            party.members[indexOfMember]['count'] = party.members[indexOfMember]['count'] + 1;
                        }
                        
                        party.save(err => {
                            if(err) {
                                next(err.message);
                            }
                            pusher.trigger(req.body.partyId, 'splitting', {
                              'add': true,
                              'isMember': isMember,
                              'orderId': req.body.orderId,
                              'firstName': req.user.firstName,
                              'lastName': req.user.lastName,
                              'userId': req.user._id
                            });
                            return res.sendStatus(200);
                        });
                    } else {
                        order.buyers.splice(index, 1);
                        // const indexToRemove = party.members.indexOf(req.user._id);
                        // party.members.splice(indexToRemove, 1);
                        party.members.forEach(member => {
                                if(member.userId.toString() === req.user._id.toString()) {
                                    member.count --;
                                }
                            });
                        party.save(err => {
                            if(err) {
                                next(err.message);
                            }
                            pusher.trigger(req.body.partyId, 'splitting', {
                              'add': false,
                              'orderId': req.body.orderId,
                              'userId': req.user._id
                            });
                            return res.status(200).send('user is already one of the buyers');
                        });
                        //res.status(500).send('user is already one of the buyers');
                    }
                }
            }
        });

    } catch (err) {
        res.status(500).send(`failed to split the order for the user: ${err.message}`);
        next(`failed to split the order for the user: ${err.message}`);
    }
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



//create charges
server.post('/user/makePayment', async (req, res, next) => {

    const {amount, tax, tip, points, restaurantId, partyId} = req.body;

    try {
        //create charge
        const merchant = await Merchant.findOne({_id: restaurantId}).exec();
        const customer = await stripe.customers.retrieve(req.user.stripeCustomerId);
        const charge = await stripe.charges.create({
                                  amount: amount,
                                  currency: 'usd',
                                  description: 'Example charge',
                                  customer: req.user.stripeCustomerId,
                                  source: customer.default_source.id,
                                  destination: {
                                    account: merchant.stripeAccountId,
                                  }
                             });

        const currentTime = new Date();
        //push chargeId to merchant's transactions

        var isTransaction = false;
        var indexOfTransaction = -1;
        merchant.transactions.forEach((transaction, index) => {
            if(transaction.partyId.toString() === partyId.toString()) {
                isTransaction = true;
                indexOfTransaction = index;
            }
        });

        if(!isTransaction) {
            merchant.transactions.push({
                 partyId: partyId,
                    charges: [{
                        time: currentTime,
                        chargeId: charge.id,
                        firstName: req.user.firstName,
                        lastName: req.user.lastName
                    }]
                });
        } else {
            merchant.transactions[indexOfTransaction]['charges'].push({
                time: currentTime,
                chargeId: charge.id,
                firstName: req.user.firstName,
                lastName: req.user.lastName
            });
        }
        merchant.markModified('transactions');


        //update party
        const party = await Party.findOne({_id: partyId}).exec();

        party.orders.forEach(order => {
            order.buyers.forEach(buyer => {
                if(buyer.userId.toString() === req.user._id.toString()) {
                    buyer.finished = true;
                    party.markModified('orders');
                }
            });
        });

        //push partyId to user's pastOrders, update user's loyalty points
        var user = await User.findOne({_id: req.user._id}).exec();
        const restaurant = await Merchant.findOne({_id: restaurantId}).exec();

        var isCustomer = false;
        user.loyaltyPoints.forEach(loyaltyPoint => {
            if(loyaltyPoint.restaurantId.toString() === restaurantId.toString()) {
                isCustomer = true;
                loyaltyPoint.points = loyaltyPoint.points + points;
                user.markModified('loyaltyPoints');
            }
        });
        
        var isPastOrder = false;
        user.pastOrders.forEach(order => {
            if(order.partyId.toString() == partyId.toString()) {
                isPastOrder = true;
                order.chargeIds.push(charge.id);
                order.tax += tax;
                order.tip += tip;
                user.markModified('pastOrders');
            }
        });

        if(!isPastOrder) {
            user.pastOrders.push({time: currentTime, partyId: partyId, 
            chargeIds: [charge.id], 
            restaurantId,
            tax,
            tip,
            restaurantName: restaurant.name,
            description: restaurant.description,
            address: restaurant.address});
        }
        
        
        if(!isCustomer) {
            user.loyaltyPoints.push({restaurantId, 
                points: points, 
                restaurantName: restaurant.name,
                description: restaurant.description,
                address: restaurant.address});
        }

        await user.save();
        await merchant.save();
        await party.save();
        res.status(200).json(charge);

    } catch (err) {
        res.status(500).json(err.message);
        next(`Error charging a customer: ${err.message}`);
    }

});


server.post('/party/charge', async (req, res, next) => {

    const {source, partyId} = req.body;
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
.use(vhost('api.shareatpay.com', subdomain.app))
.listen(config.port, () => {
  console.info('Express listening on port', config.port);
});
