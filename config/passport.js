// config/passport.js


import flash from 'connect-flash';

// load all the things we need
var FacebookStrategy = require('passport-facebook').Strategy;

var LocalStrategy = require('passport-local').Strategy;

// load up the user model
var User       = require('../models/user');

// load the auth variables
var configAuth = require('./auth');
const stripe = require('stripe')(configAuth.stripe.secretKey);

function validateEmail(email) {
  var re = /\S+@\S+\.\S+/;
  return re.test(email);
}

module.exports = async function(passport) {

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
    

    // code for login (use('local-signup', new LocalStategy))
    passport.use('local-signup', new LocalStrategy(
    {
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    async function(req, email, password, done) 
    {
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        // asynchronous
        // User.findOne wont fire unless data is sent back
        password = password.trim();
        process.nextTick(async function() 
        {

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'email' :  email }, async function(err, user) {
            // if there are any errors, return the error
            if (err)
                return done(err);

            // check to see if theres already a user with that email
            if (user) 
            {
                return done(null, false, {message: 'That email is already taken.'});
            } else 
            {
                if(!validateEmail(email)) {
                    return done(null, false, {message: 'email must be valid'});
                }

                if(password.length <= 7)
                {
                   return done(null, false, {message: 'Password must be longer than 7 letters.'});
                }
                var letterNum = 0;
                var numNum = 0;
                for(var i = 0; i < password.length ; i++)
                {
                    if(password[i] >= '0' && password[i] <= '9')
                    {
                        numNum ++;
                    }
                    if((password[i] >= 'a' && password[i] <= 'z') || (password[i] >= 'A' && password[i] <= 'Z'))
                    {
                        letterNum ++;
                    }
                }

                if(!numNum)
                {
                    return done(null, false, {message: 'Password must contain at least one number.'});
                }
                if(!letterNum)
                {
                    return done(null, false, {message: 'Password must contain at least one letter.'});
                }

                // if there is no user with that email
                // create the user
                var newUser            = new User();
                // set the user's local credentials
                newUser.email    = email;
                newUser.password = newUser.generateHash(password);
                newUser.firstName = firstName;
                newUser.lastName = lastName;

                
                // Create a Stripe account for the user
                const customer = await stripe.customers.create({
                    email: newUser.email,
                    description: `Customer for ${newUser.email}`
                });
                newUser.stripeCustomerId = customer.id;
    
                // save the user
                newUser.save(function(err) 
                {
                    if (err){
                        throw err;
                    }
                    return done(null, newUser);
                });
            }

        });    

        });

    }));
    // code for signup (use('local-login', new LocalStategy))

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        password = password.trim();
        User.findOne({ 'email' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, {message: 'No user found.'}); // req.flash is the way to set flashdata using connect-flash

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, {message: 'Incorrect password.'}); // create the loginMessage and save it to session as flashdata

            // all is well, return successful user
            return done(null, user);
        });

    }));


    // FACEBOOK ================================================================
    passport.use(new FacebookStrategy({

        // pull in our app id and secret from our auth.js file
        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL,
        profileFields: ['id', 'email', 'name', 'picture','friends'],
    },

    // facebook will send back the token and profile
    async function(token, refreshToken, profile, done) {

        //asynchronous
        process.nextTick(async function() {
            
           //console.log(profile._json.friends);
            // find the user in the database based on their facebook id
            User.findOne({ 'facebook.id' : profile.id }, async function(err, user) {

                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err)
                    return done(err);

                // if the user is found, then log them in
                if (user) 
                {
                    return done(null, user); // user found, return that user

                    //return done(null, false, { message: 'testing.' });
                } 
                else 
                {
                    // if there is no user found with that facebook id, create them
                    var newUser = new User();

                    // set all of the facebook information in our user model
                    newUser.facebook.id    = profile.id; // set the users facebook id                   
                    newUser.facebook.token = token; // we will save the token that facebook provides to the user                    
                    newUser.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                    if(profile.emails !== undefined)
                    newUser.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
                    newUser.profilepic = profile._json.picture.data.url;
                    
                    // Create a Stripe account for the user
                    const customer = await stripe.customers.create({
                        email: newUser.email,
                        description: `Customer for ${newUser.email}`
                    });
                    newUser.stripeCustomerId = customer.id;

                    var promises = [];
                    var friends =  profile._json.friends.data.map((friend) =>{

                            var mutualfriend = friend;


                             //checking if friends are already using the app and if so, add the user to their friend list
                            
                                promises.push( new Promise((resolve, reject) =>{
                                User.findOne({'facebook.id' : friend.id}, (err, existedUser) => {
                               
                                    if(err){
                                        console.log('error in passport.js finding for users friends');
                                        reject(err);
                                        
                                    }
                                    if(existedUser){
                                      
                                        var alreadyExisted = existedUser.friends.filter(friend => {
                                            return friend.id === profile.id;
                                        });
                                        if( alreadyExisted.length === 0){
                                            var friendObject = {};
                                            friendObject['name'] = newUser.name;
                                            friendObject['id'] = newUser.facebook.id;
                                            friendObject['profilepic'] = newUser.profilepic;
                                            existedUser.friends.push(friendObject);
                                            
                                            existedUser.save((err, updatedExistedUser) => {
                                                if(err){
                                                    console.err(err);
                                                }
                                            });
                                        }
                                       

                                        //assigning dpUrl to the user
                                        mutualfriend.profilepic = existedUser.profilepic;
                                    } else{
                                        //testing purposes
                                        mutualfriend['profilepic'] = 'testing';
                                    }
                                    resolve();
                              
                                  });
                                })
                                );

                            return mutualfriend;

                        });


                    Promise.all(promises)
                    .then(function() {
                         newUser.friends = friends;
                         // save our user to the database
                        newUser.save(function(err) {
                            if (err)
                                throw err;

                            // if successful, return the new user
                            return done(null, newUser);

                        });

                    })
                    .catch(reason => {console.log('promise error + ' + reason);});
                   
                   
                }

            });
        });

    }));

};


