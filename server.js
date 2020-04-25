import config from './config';
//import path from 'path';
import request from 'request';
import morgan from 'morgan';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import path from 'path';
import cors from 'cors';
//import sassMiddleware from 'node-sass-middleware';
import passport from 'passport';
import flash from 'connect-flash';

//handling subdomains
import vhost from 'vhost';
import subdomain from './routes/api';
import configAuth from './config/auth';
import querystring from 'querystring';


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


//separating routes
server.use('/merchant', require('./routes/merchant_routes.js'));
server.use('/user', require('./routes/user_routes.js'));
server.use('/party', require('./routes/party_routes.js'));



server.get('/analytics', (req,res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
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


server.post('/party/:restaurantId/:tableNumber/:amazonUserSub', async (req, res, next)=> {
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
                    party.members.push(req.params.amazonUserSub);

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
                    newParty.members.push(req.params.amazonUserSub);
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
    
});

server.post('/order/:partyId/:foodId/:amazonUserSub', async (req, res, next) => {
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
        party.orders.push({foodId : req.params.foodId, buyers:[req.params.amazonUserSub]});
        
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
