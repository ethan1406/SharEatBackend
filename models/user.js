import mongoose from 'mongoose';


// define the schema for our user model
var userSchema = mongoose.Schema({
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String,
        dpUrl        : String,
        
    },
    friends          : Array,
});

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);