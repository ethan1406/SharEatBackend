import mongoose from 'mongoose';
//import bcrypt from 'bcrypt';


//const saltRounds = 10;

// define the schema for our user model
var merchantSchema = mongoose.Schema({
    email        	 : String,
    name         	 : String,
    name_lower       : String,
    //password         : String,
    profilepic       : String,
    location         : {
        longitude    : Number,
        latitude     : Number
    },
    menu             : [{
        dish         : String,
        picture      : String
    }]
});

// methods ======================
// generating a hash
// merchantSchema.methods.generateHash = function(password) {
//     return bcrypt.hashSync(password, saltRounds);
// };

// // checking if password is valid
// merchantSchema.methods.validPassword = function(password) {
//     return bcrypt.compareSync(password, this.password);
// };



// create the model for users and expose it to our app
module.exports = mongoose.model('Merchant', merchantSchema);


//34.025826
//-118.294096