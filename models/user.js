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
        subTotal: Number,
        tax: Number,
        tip: Number,
        restaurantName: String,
        restaurantId: String,
        address: String,
    }],
    loyaltyPoints    : [{
        restaurantAmazonUserSub: String,
        restaurantName: String,
        description: String,
        address: String,
        points: Number,
        redemptions: [{
            time: Date
        }]
    }],
    cards : [{
        omnivore_encrypted_data : String,
        last4Digits : Number,
        type: {type: String},
        selected: Boolean
    }]
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