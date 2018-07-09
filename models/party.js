import mongoose from 'mongoose';



// define the schema for our party model
var PartySchema = mongoose.Schema({
    members        	     : Array,
    restaurantId         : String,
    tableNumber          : Number,
    finished             : Boolean,
    time                 : Date,
    orders               : [{
        foodId           : mongoose.Schema.Types.ObjectId,
        orderId          : mongoose.Schema.Types.ObjectId,
        buyers           : Array
        
    }]
});



// create the model for parties and expose it to our app
module.exports = mongoose.model('Party', PartySchema);
