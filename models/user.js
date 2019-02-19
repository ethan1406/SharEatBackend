import mongoose from 'mongoose';
import bcrypt from 'bcrypt';


const saltRounds = 10;

// define the schema for our user model
var UserSchema = mongoose.Schema({
    facebook         : {
        id           : String,
        token        : String,
    },
    email        	 : String,
    firstName        : String,
    lastName         : String,
    password         : String,
    profilepic       : String,
    pastOrders       : [{
        time         : Date,
        partyId      : String,
        orders       : Array
    }],
    friends          : Array,
    loyaltyPoints    : Array,
    // Stripe customer ID storing the payment sources.
    stripeCustomerId : String
});

// methods ======================
// generating a hash
UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, saltRounds);
};

// checking if password is valid
UserSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};



// create the model for users and expose it to our app
module.exports = mongoose.model('User', UserSchema);