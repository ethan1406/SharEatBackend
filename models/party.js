import mongoose from 'mongoose';



// define the schema for our party model
var PartySchema = mongoose.Schema({
    members        	     : Array,
    restaurantId         : String,
    tableNumber          : Number,
    finished             : Boolean,
    orderTotal           : Number,
    time                 : Date,
    orders               : [{
        foodId           : mongoose.Schema.Types.ObjectId,
        buyers           : Array
        
    }],
    stripeChargeId       : Number
});



PartySchema.statics.grabParty = function(partyId) {
  return Party.findOne({_id: partyId})
    .exec();
};

const Party = mongoose.model('Party', PartySchema);

// create the model for parties and expose it to our app
module.exports = Party;
