import mongoose from 'mongoose';
import bcrypt from 'bcrypt';


const saltRounds = 10;

// define the schema for our user model
var UserSchema = mongoose.Schema({
    userType         : String,
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
        partyId      : mongoose.Schema.Types.ObjectId,
        chargeIds     : [String],
        tax: Number,
        tip: Number,
        restaurantName: String,
        restaurantId: String,
        description: String,
        address: String,
    }],
    friends          : Array,
    loyaltyPoints    : [{
        restaurantId: mongoose.Schema.Types.ObjectId,
        restaurantName: String,
        description: String,
        address: String,
        points: Number
    }],
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