import express from 'express';

import User from '../models/user';
import Merchant from '../models/merchant';
import Party from '../models/party';
import {spreedly, omnivore} from '../config/auth';
import { pusher } from '../util/Pusher';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

import mongoose from 'mongoose';

import moment from 'moment';
import 'moment-timezone';

import NodeRSA from 'node-rsa';

const router = express.Router();


router.post('/signup', async (req, res, next) => {
    try {
        const count = await User.count({amazonUserSub: req.body.amazonUserSub}).exec();
        if (count == 0) {
            var newUser = new User();                   
            newUser.email = req.body.email;
            newUser.amazonUserSub = req.body.amazonUserSub;
            await newUser.save();
            res.status(200).send();
        } else {
            res.status(500).json('User with the id already exists');
            next();
        }
    } catch(err) {
        res.status(500).json(err.message);
        next(err);
    }
});


// router.post('/login', (req, res, next) => {
//     passport.authenticate('local-login', (err, user, info) =>{
//         if(err)
//         {
//             return next(err);
//         }
//         if(!user)
//         {
//             req.session.message = info.message;
//             return res.status(401).json({error : info.message});
//         }
//         req.logIn(user, function(err) {
//             if (err) { return next(err); }
//             return res.status(200).json({email:req.user.email, id:req.user.id, 
//                 firstName: req.user.firstName, lastName: req.user.lastName, 
//                 loyaltyPoints: req.user.loyaltyPoints});
//         });
//     })(req, res, next);
// });

router.post('/:amazonUserSub/storeCardToken', async (req, res, next) => {
    try {
        const {data} = await axios.put(`${spreedly.spreedlyAddCardURL}/${req.body.payment_method.token}/retain.json`,
                {}, {auth: {username: spreedly.environment_key, password: spreedly.secret_key}});
        const user = await User.findOne({amazonUserSub: req.params.amazonUserSub}, 'cards').exec();

        user.cards.forEach(card => {
            card.selected = false;
        });

        const card = {
            last4Digits: data.transaction.payment_method.last_four_digits,
            token: data.transaction.payment_method.token,
            type: data.transaction.payment_method.data.type,
            selected: true
        };
        user.cards.push(card);

        await user.save();
        res.status(200).json({'card': card});
    } catch (err) {
        res.status(500).json(err);
        next(err.message);
    }
});


router.post('/:amazonUserSub/storeOmnivoreCard', async (req, res, next) => {
    fs.readFile(path.join(__dirname, '../config/public.key'),'utf8', async (err, data) => {
        if (err) {
            res.status(500).json(err);
            next(err.message);
            return;
        }
        if (req.body.card == undefined) {
            res.status(500).json('please provide card information');
            next('no card information provided');
            return;
        }
        if (req.body.cardType == undefined) {
            res.status(500).json('please provide card type');
            next('no card type provided');
            return;
        }

        const card = req.body.card;
        const key = new NodeRSA(data,  {encryptionScheme: 'pkcs1', signingScheme: 'pkcs1'});
        const encrypted = key.encrypt(JSON.stringify(req.body.card), 'base64');

        try {
            const user = await User.findOne({amazonUserSub: req.params.amazonUserSub}, 'cards').exec();

            user.cards.forEach(card => {
                card.selected = false;
            });

            const newCard = {
                last4Digits: card.number.slice(card.number.length - 4),
                type: req.body.cardType,
                omnivore_encrypted_data: encrypted,
                selected: true
            };

            user.cards.push(newCard);

            await user.save();
            res.status(200).json({'card': newCard});

        } catch (err) {
            res.status(500).json(err);
            next(err.message);
        }        
    });
});


router.get('/:amazonUserSub/getCards', async (req, res, next) => {
    try {
       const {cards} = await User.findOne({amazonUserSub: req.params.amazonUserSub}, 'cards').exec();
       
       //remove token field
       const userCards = cards.map(card => {
         return {_id: card._id, last4Digits: card.last4Digits, selected: card.selected,
            type: card.type};
       });
       res.status(200).json({cards: userCards});

    } catch (err) {
        next(`could not retrieve the list of cards for the user: ${err.message}`);
        res.sendStatus(500).json(err);
    }

});


router.post('/:amazonUserSub/changeDefaultPayment', async (req, res, next) => {
    try {
        const user = await User.findOne({amazonUserSub: req.params.amazonUserSub}, 'cards').exec();
        user.cards.forEach(card => {
            if(card._id.toString() == req.body.cardId.toString()) {
                card.selected = true;
            } else {
                card.selected = false;
            }
        });
        await user.save();
        res.status(200).json({'cards' : user.cards});
    } catch (err) {
        next(`could not update source: ${err.message}`);
        res.status(500).json(err);
    }
});



router.get('/:amazonUserSub/receipts', async (req, res) => {
    try {
        const {pastOrders} = await User.findOne({amazonUserSub: req.params.amazonUserSub}, 'pastOrders').exec();
        res.status(200).json(pastOrders);
    } catch (err) {
        res.status(500).send(`could not retrieve user's receipts: ${err.message}`);
    }
});


router.get('/:amazonUserSub/loyaltyPoints', async (req, res) => {
    try {
        const {loyaltyPoints} = await User.findOne({amazonUserSub: req.params.amazonUserSub}, 'loyaltyPoints').exec();
        res.status(200).json(loyaltyPoints);
    } catch (err) {
        res.status(500).send(`could not retrieve user's receipts: ${err.message}`);
    }
});

router.get('/getMerchantInfo', async (req, res) => {
    try {
        const restaurantId = req.query.restaurantId;
        const merchant = await Merchant.findOne({_id: restaurantId}).exec();
        res.status(200).json(merchant);
    } catch(err) {
        console.log(`error when getting merchant info: ${err.message}`);
        res.sendStatus(500);
    }
});


router.post('/:amazonUserSub/makePayment', async (req, res, next) => {
    const {subTotal, tip, tax, points, ticketId, restaurantOmnivoreId, partyId, restaurantAmazonSub} = req.body;

    const userSub = req.params.amazonUserSub;

    try {
        var defaultPaymentCard = {};
        const user = await User.findOne({amazonUserSub: userSub}).exec();
        user.cards.forEach(card => {
            if (card.selected == true) {
                defaultPaymentCard = card;
            }
        });
        
        await axios.post(`${omnivore.url}/${restaurantOmnivoreId}/tickets/${ticketId}/payments`,
                {amount: subTotal + tax, tip: tip, type: 'card_not_present',
                    card_info: {
                        encrypted_data: defaultPaymentCard.omnivore_encrypted_data,
                        encryption_key_id: omnivore.encryption_key_id
                    }
                },
                {headers: {
                    'Api-Key': omnivore.api_key
                }});


        res.sendStatus(200);


        const merchant = await Merchant.findOne({amazonUserSub: restaurantAmazonSub}).exec();
        const party = await Party.findOne({_id: partyId}).exec();
        
        var isReturning = false;
        merchant.members.forEach(member => {
            if (member.amazonUserSub == userSub) {
                isReturning = true;
            }
        });

        const currentTime =  moment().tz('America/Los_Angeles').format();

        // creating new member
        if (!isReturning) {
            merchant.members.push({signup_time: currentTime, amazonUserSub: userSub});
        }

        // creating new visit
        merchant.visits.push({amazonUserSub: userSub, partyId: partyId, time: currentTime, returning: isReturning});

        // creating new transaction/charge
        var isFirstCharge = true;
        const chargeId = new mongoose.Types.ObjectId;
        merchant.transactions.forEach(transaction => {
            if (transaction.partyId == partyId) {
                isFirstCharge = false;
                transaction.charges.push({time: currentTime, amazonUserSub: userSub, chargeId: chargeId});
            }
        });

        if (isFirstCharge) {
            merchant.transactions.push({partyId: partyId, first_payment_time: currentTime, charges: [{
                time: currentTime, amazonUserSub: userSub, chargeId: chargeId
            }]});
        } 


        if (!isReturning) {
            user.loyaltyPoints.forEach(loyaltyPoint => {
                if (loyaltyPoint.restaurantAmazonSub == restaurantAmazonSub) {
                    loyaltyPoint.points += points;
                }
            });
        } else {
            user.loyaltyPoints.push({
                restaurantAmazonSub: restaurantAmazonSub, 
                restaurantName: merchant.name, 
                description: merchant.description,
                address: merchant.address,
                points: points,
                redemptions: []
            });
        }
        

        user.pastOrders.push({
            time         : currentTime,
            partyId      : partyId,
            chargeIds     : [chargeId],
            subTotal: subTotal,
            tax: tax,
            tip: tip,
            restaurantName: merchant.name,
            restaurantAmazonSub: restaurantAmazonSub,
            address: merchant.address,
        });

            
        party.orders.forEach(order => {
            order.buyers.forEach(buyer => {
                if (buyer.amazonUserSub === userSub) {
                    buyer.finished = true;
                }
            });
        });

        party.members.forEach(member => {
            if (member.amazonUserSub == userSub) {
                member.hasPaid = true;
            }
        });

        pusher.trigger(partyId, '{payment_complete}', {
          'orders': party.orders
        });


        await merchant.save();
        await user.save();
        await party.save();
        
    } catch (err) {
        if (err.response.status == 400) {
            if (err.response.data.errors[0].error === 'card_already_tendered') {
                res.status(500).json('card has already been charged for this ticket');
            }
        } else {
            res.sendStatus(500);
        }
    }

});

// router.post('/makePayment', async (req, res, next) => {

//     const {amount, tax, tip, points, restaurantId, partyId} = req.body;

//     try {
//         //create charge
//         const merchant = await Merchant.findOne({_id: restaurantId}).exec();
//         const customer = await stripe.customers.retrieve(req.user.stripeCustomerId);
//         const charge = await stripe.charges.create({
//                                   amount: amount,
//                                   currency: 'usd',
//                                   description: 'Example charge',
//                                   customer: req.user.stripeCustomerId,
//                                   source: customer.default_source.id,
//                                   destination: {
//                                     account: merchant.stripeAccountId,
//                                   }
//                              });

//         const currentTime = new Date();
//         //push chargeId to merchant's transactions

//         var isTransaction = false;
//         var indexOfTransaction = -1;
//         merchant.transactions.forEach((transaction, index) => {
//             if(transaction.partyId.toString() === partyId.toString()) {
//                 isTransaction = true;
//                 indexOfTransaction = index;
//             }
//         });

//         if(!isTransaction) {
//             merchant.transactions.push({
//                  partyId: partyId,
//                     charges: [{
//                         time: currentTime,
//                         chargeId: charge.id,
//                         firstName: req.user.firstName,
//                         lastName: req.user.lastName
//                     }]
//                 });
//         } else {
//             merchant.transactions[indexOfTransaction]['charges'].push({
//                 time: currentTime,
//                 chargeId: charge.id,
//                 firstName: req.user.firstName,
//                 lastName: req.user.lastName
//             });
//         }
//         merchant.markModified('transactions');


//         //update party
//         const party = await Party.findOne({_id: partyId}).exec();

//         party.orders.forEach(order => {
//             order.buyers.forEach(buyer => {
//                 if(buyer.userId.toString() === req.user._id.toString()) {
//                     buyer.finished = true;
//                     party.markModified('orders');
//                 }
//             });
//         });

//         //push partyId to user's pastOrders, update user's loyalty points
//         var user = await User.findOne({_id: req.user._id}).exec();
//         const restaurant = await Merchant.findOne({_id: restaurantId}).exec();

//         var isCustomer = false;
//         user.loyaltyPoints.forEach(loyaltyPoint => {
//             if(loyaltyPoint.restaurantId.toString() === restaurantId.toString()) {
//                 isCustomer = true;
//                 loyaltyPoint.points = loyaltyPoint.points + points;
//                 user.markModified('loyaltyPoints');
//             }
//         });
        
//         var isPastOrder = false;
//         user.pastOrders.forEach(order => {
//             if(order.partyId.toString() == partyId.toString()) {
//                 isPastOrder = true;
//                 order.chargeIds.push(charge.id);
//                 order.tax += tax;
//                 order.tip += tip;
//                 user.markModified('pastOrders');
//             }
//         });

//         if(!isPastOrder) {
//             user.pastOrders.push({time: currentTime, partyId: partyId, 
//             chargeIds: [charge.id], 
//             restaurantId,
//             tax,
//             tip,
//             restaurantName: restaurant.name,
//             description: restaurant.description,
//             address: restaurant.address});
//         }
        
        
//         if(!isCustomer) {
//             user.loyaltyPoints.push({restaurantId, 
//                 points: points, 
//                 restaurantName: restaurant.name,
//                 description: restaurant.description,
//                 address: restaurant.address});
//         }

//         await user.save();
//         await merchant.save();
//         await party.save();
//         res.status(200).json(charge);

//     } catch (err) {
//         res.status(500).json(err.message);
//         next(`Error charging a customer: ${err.message}`);
//     }

// });


// server.post('/party/charge', async (req, res, next) => {

//     const {source, partyId} = req.body;
//   //const { source, amount, currency } = req.body;
//     try {
//         const party = await Party.findOne({_id: partyId}).exec();
//         const restaurant = await Merchant.findOne({_id: party.restaurantId}).exec();
//         const charge = await stripe.charges.create({
//             source: source,
//             amount: party.orderTotal,
//             currency: 'usd',
//             customer: party.members[0],
//             description: `charged ${party.members[0]} on behalf of ${restaurant.name}`,
//             statement_descriptor: 'shareat',
//             destination: {
//                 amount: party.orderTotal * 0.2,
//                 account: restaurant.stripeAccountId
//             }
//         });
//         party.finished = true;
//         party.stripeChargeId = charge.id;
//         party.saved();

//         res.send({
//             orders: party.orders
//         });
        

//     } catch(err) {
//         res.sendStatus(500);
//         next(`Error adding token to customer: ${err.message}`);
//     }
// });



module.exports = router;