import express from 'express';
import passport from 'passport';

import User from '../models/user';
import Merchant from '../models/merchant';
import {spreedly} from '../config/auth';
import axios from 'axios';

const router = express.Router();


router.post('/signup', (req, res, next) => {
    passport.authenticate('local-signup', (err, user, info) =>{
        if(err)
        {
            return next(err);
        }
        if(!user)
        {
            req.session.message = info.message;
            return res.status(401).json({error : info.message});
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.status(200).json({email:req.user.email, id:req.user.id, 
                firstName: req.user.firstName, lastName: req.user.lastName, 
                loyaltyPoints: req.user.loyaltyPoints});
        });
    })(req, res, next);
});


router.post('/login', (req, res, next) => {
    passport.authenticate('local-login', (err, user, info) =>{
        if(err)
        {
            return next(err);
        }
        if(!user)
        {
            req.session.message = info.message;
            return res.status(401).json({error : info.message});
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.status(200).json({email:req.user.email, id:req.user.id, 
                firstName: req.user.firstName, lastName: req.user.lastName, 
                loyaltyPoints: req.user.loyaltyPoints});
        });
    })(req, res, next);
});

router.post('/storeCreditCardToken', async (req, res, next) => {
    try {
        const {data} = await axios.put(`${spreedly.spreedlyAddCardURL}/${req.body.payment_method.token}/retain.json`,
                {}, {auth: {username: spreedly.environment_key, password: spreedly.secret_key}});
        const user = await User.findOne({_id: req.user._id}, 'creditCards').exec();

        user.creditCards.push({
            last4Digits: data.transaction.payment_method.last_four_digits,
            token: data.transaction.payment_method.token,
            type: data.transaction.payment_method.data.type,
            selected: true
        });


        user.creditCards.forEach(card => {
            card.selected = false;
        });

        await user.save();
        res.status(200).json({'creditCards': user.creditCards});
    } catch (err) {
        res.status(500).send(err);
        next(err.message);
    }
});

router.get('/getCards', async (req, res, next) => {
    try {
       const {creditCards} = await User.findOne({_id: req.user._id}, 'creditCards').exec();
       res.status(200).json({creditCards});

    } catch (err) {
        next(`could not retrieve the list of cards for the user: ${err.message}`);
        res.sendStatus(500).json(err);
    }

});


router.post('/changeDefaultPayment', async (req, res, next) => {
    try {
        const user = await User.findOne({_id: req.user._id}, 'creditCards').exec();
        user.creditCards.forEach(card => {
            if(card._id.toString() == req.body.cardId.toString()) {
                card.selected = true;
            } else {
                card.selected = false;
            }
        });
        await user.save();
        res.status(200).json({'creditCards' : user.creditCards});
    } catch (err) {
        next(`could not update source: ${err.message}`);
        res.sendStatus(500);
    }

    res.sendStatus(200);
});



router.get('/receipts', async (req, res) => {
    try {
        const {pastOrders} = await User.findOne({_id: req.user._id}, 'pastOrders').exec();
        res.status(200).json(pastOrders);
    } catch (err) {
        res.status(500).send(`could not retrieve user's receipts: ${err.message}`);
    }
});


router.get('/loyaltyPoints', async (req, res) => {
    try {
        const {loyaltyPoints} = await User.findOne({_id: req.user._id}, 'loyaltyPoints').exec();
        res.status(200).json(loyaltyPoints);
    } catch (err) {
        res.status(500).send(`could not retrieve user's receipts: ${err.message}`);
    }
});

router.get('/getMerchantInfo', async (req, res) => {
    try {
        const restaurantId = req.query.restaurantId;
        const merchant = await Merchant.findOne({_id: restaurantId}, ['-__v','-stripeAccountId']).exec();
        res.status(200).json(merchant);
    } catch(err) {
        console.log(`error when getting merchant info: ${err.message}`);
        res.sendStatus(500);
    }
});



module.exports = router;