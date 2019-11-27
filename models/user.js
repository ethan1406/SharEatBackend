import mongoose from 'mongoose';
import bcrypt from 'bcrypt';


const saltRounds = 10;

// define the schema for our user model
var UserSchema = mongoose.Schema({
    email            : String,
    amazonUserSub    : String,
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
    loyaltyPoints    : [{
        restaurantId: mongoose.Schema.Types.ObjectId,
        restaurantName: String,
        description: String,
        address: String,
        points: Number
    }],
    cards : [{
        last4Digits : Number,
        token : String,
        type: {type: String},
        selected: Boolean
    }],
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