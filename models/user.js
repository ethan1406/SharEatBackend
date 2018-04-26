import mongoose from 'mongoose';


// define the schema for our user model
var userSchema = mongoose.Schema({
    id           : String,
    name         : String
});

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);