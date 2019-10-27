import express from 'express';
import passport from 'passport';

import User from '../models/user';
import Merchant from '../models/merchant';

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

router.get('/user/getMerchantInfo', async (req, res) => {
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