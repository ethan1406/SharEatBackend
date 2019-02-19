import mongoose from 'mongoose';



// define the schema for our party model
var PartySchema = mongoose.Schema({
    members        	     : [{userId: String, count: Number}],
    restaurantId         : String,
    tableNumber          : Number,
    finished             : Boolean,
    orderTotal           : Number,
    time                 : Date,
    orders               : [{
        foodId           : mongoose.Schema.Types.ObjectId,
        buyers           : [{firstName: String, lastName: String, userId: mongoose.Schema.Types.ObjectId}]
        
    }],
    stripeChargeId       : Number
});



PartySchema.statics.grabParty = function(partyId) {
  return Party.findOne({_id: partyId})
    .exec();
};

PartySchema.statics.grabPartyByResIdandTableNum = function(restaurantId, tableNum) {
  return Party.findOne({restaurantId: restaurantId, tableNumber: tableNum})
    .exec();
};

const Party = mongoose.model('Party', PartySchema);

// create the model for parties and expose it to our app
module.exports = Party;
