import mongoose from 'mongoose';



// define the schema for our party model
var PartySchema = mongoose.Schema({
    members        	     : [{
        amazonUserSub: String, 
        count: Number,
        tax: Number,
        tip: Number
    }],
    restaurant_name                  : String,
    restaurant_amazonUserSub         : String,
    restaurant_omnivore_id           : String,
    omnivore_ticket_id               : String,
    ticket_name          : String,
    tableNumber          : Number,
    finished             : Boolean,
    orderTotal           : Number,
    sub_total            : Number,
    tax                  : Number,
    guest_count           : Number,
    time                 : Date,
    orders               : [{
        id               : String,
        name             : String,
        price            : Number, 
        buyers           : [{
            firstName: String, 
            lastName: String, 
            amazonUserSub: String,
            finished: Boolean
        }]
        
    }]
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
