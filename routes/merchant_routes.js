import express from 'express';
import passport from 'passport';

import Merchant from '../models/merchant';


const router = express.Router();


router.get('/merchant/dashboard', (req,res) => {
    res.render('index', {
        content: '...'
    });
});

router.post('/signup', (req, res, next) => {
    passport.authenticate('merchant-signup', (err, user, info) =>{
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
            return res.status(200).json({email:req.user.email, id:req.user.id});
        });
    })(req, res, next);
});


router.post('/login', (req, res, next) => {
    passport.authenticate('merchant-login', (err, user, info) =>{
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
            return res.status(200).json({email:req.user.email, name: req.user.name, id:req.user.id});
        });
    })(req, res, next);
});


router.get('/getActiveParties', async (req, res, next) => {
    try {
        const merchant = await Merchant.findOne({_id: req.user.id}, 'activeParties').exec();
        res.status(200).json(merchant);
        
    } catch(err) {
        res.sendStatus(500);
        next(`Error getting active parties for merchant: ${err.message}`);
    }
});

router.get('/getRewards', async (req, res, next) => {
    try {
        const merchant = await Merchant.findOne({_id: req.user.id}, 'rewards').exec();
        res.status(200).json(merchant);
        
    } catch(err) {
        res.sendStatus(500);
        next(`Error getting rewards for merchant: ${err.message}`);
    }
});

router.post('/addReward', async (req, res, next) => {
    try {
        var merchant = await Merchant.findOne({_id: req.user.id}, 'rewards').exec();
        const {rewardType, pointsRequired, rewardTitle} = req.body;  

        if(rewardType && rewardTitle) {
            if(rewardType == 'loyalty_points') {
                merchant.rewards[rewardType].push({rewardId: new mongoose.Types.ObjectId,
                reward: rewardTitle, pointsRequired});
            } else if (rewardType == 'check_in'){
                merchant.rewards[rewardType].push({rewardId: new mongoose.Types.ObjectId,
                reward: rewardTitle});
            }      
            merchant.save(err => {
                if(err) {
                    res.sendStatus(500);
                    next(`Error adding a new reward for merchant: ${err.message}`);
                }
                res.sendStatus(200);
            });
        } else {    
            res.sendStatus(400);
            next('Invalid Input');   
        }
        
    } catch(err) {
        res.sendStatus(500);
        next(`Error retrieving rewards for merchant: ${err.message}`);
    }
});


router.delete('/deleteReward', async (req, res, next) => {
    try {
        var merchant = await Merchant.findOne({_id: req.user.id}, 'rewards').exec();
        const rewardId = req.query.rewardId;  

        if(rewardId) {
            merchant.rewards.check_in = merchant.rewards.check_in.filter(reward => reward._id != rewardId);
            merchant.rewards.loyalty_points = 
                merchant.rewards.loyalty_points.filter(reward => reward._id != rewardId);
            merchant.save(err => {
                if(err) {
                    res.sendStatus(500);
                    next(`Error deleting a reward for merchant: ${err.message}`);
                }
                res.sendStatus(200);
            });
        } else {    
            res.sendStatus(400);
            next('Invalid Input');   
        }
        
    } catch(err) {
        res.sendStatus(500);
        next(`Error retrieving rewards for merchant: ${err.message}`);
    }
});


module.exports = router;