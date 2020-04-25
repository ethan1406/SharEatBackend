'use strict';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const saltRounds = 10;

// define the schema for our merchant model
const MerchantSchema = mongoose.Schema({
    email        	     : String,
    userType             : String,
    name         	     : String,
    name_lower           : String,
    profilepic           : String,
    omnivore             : {},
    omnivore_id          : String,
    password             : String,
    address              : String,
    location             : {
        longitude        : Number,
        latitude         : Number
    },
    transactions: [{
        partyId: mongoose.Schema.Types.ObjectId,
        first_payment_time: Date,
        charges: [{
            time: Date,
            amazonUserSub: String
        }]
    }],
    rewards:  [{
        reward: String,
        pointsRequired: Number,
        redemptions: [{
            time: Date,
            amazonUserSub: String
        }]
    }],
    members: [{
        amazonUserSub: String,
        signup_time: Date
    }],
    visits: [{
        amazonUserSub: String,
        partyId: mongoose.Schema.Types.ObjectId,
        time: Date,
        returning: Boolean
    }],
    description : String,
    details: String
});

//methods ======================
//generating a hash
MerchantSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, saltRounds);
};

// checking if password is valid
MerchantSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};



MerchantSchema.statics.insertDefaultPassengers = async ()=> {
    try{
        const data = 
    
            {
               location: {
                    latitude: 0.593909085261,
                    longitude: -2.064290598799
                },
                email : 'qinwest@gmail.com',
                name: 'Qin West Noodle',
                name_lower: 'qin west noodle',
                address: '2520 S Figueroa St, Los Angeles, CA 90007',
                profilepic: 'https://s3-us-west-1.amazonaws.com/elasticbeanstalk-us-west-1-474391618037/restaurants/qinwest/cover.jpg',
                menu: {
                    Classic: [
                        {
                            title: 'Home Made Spicy Chicken',
                            price: 11.95,
                            description: 'spicy chicken dipped in home sauce',
                            picture: 'https://s3-us-west-1.amazonaws.com/elasticbeanstalk-us-west-1-474391618037/restaurants/qinwest/homemadespicychicken.jpg',
                            foodId : new mongoose.Types.ObjectId,
                        },
                        {
                            title: 'Spicy Cumin Beef',
                            price: 10.75,
                            description: '',
                            picture: '',
                            foodId : new mongoose.Types.ObjectId
                        },
                        {
                            title: 'Twice-Cooked Pork',
                            price: 11.95,
                            description: '',
                            picture: '',
                            foodId : new mongoose.Types.ObjectId
                        }
                    ],
                    Side: [
                        {
                            title: 'Steamed Dumpling',
                            price: 3.95,
                            description: '',
                            picture: '',
                            foodId : new mongoose.Types.ObjectId
                        },
                        {
                            title: 'Pan Fried Dumpling',
                            price: 4.5,
                            description: '',
                            picture: '',
                            foodId : new mongoose.Types.ObjectId
                        },
                        {
                            title: 'Cold Dish - Beef Tendon',
                            price: 4,
                            description: '',
                            picture: '',
                            foodId : new mongoose.Types.ObjectId
                        }
                    ]
                },
            };
            const merchant = new Merchant(data);

            await merchant.save();



    } catch (err) {
        console.log(err);
    }



};
const Merchant = mongoose.model('Merchant', MerchantSchema);


// create the model for merchants and expose it to our app
module.exports = Merchant;

//34.025826
//-118.294096