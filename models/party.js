import mongoose from 'mongoose';



// define the schema for our party model
var partySchema = mongoose.Schema({
    members        	     : Array,
    restaurantId         : String,
    tableNumber          : Number,
    finished             : Boolean,
    time                 : Date,
    orders               : [{
        title            : String,
        buyers           : Array
        
    }]
});



// create the model for parties and expose it to our app
module.exports = mongoose.model('Party', partySchema);
