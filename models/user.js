import mongoose from 'mongoose';
import bcrypt from 'bcrypt';


const saltRounds = 10;

// define the schema for our user model
var userSchema = mongoose.Schema({
    facebook         : {
        id           : String,
        token        : String,
    },
    email        	 : String,
    name         	 : String,
    password         : String,
    profilepic       : String,
    friends          : Array
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, saltRounds);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};



// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);