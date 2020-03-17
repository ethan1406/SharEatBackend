import express from 'express';
import passport from 'passport';

import Merchant from '../models/merchant';
import Party from '../models/party';

import mongoose from 'mongoose';
import moment from 'moment';
const _ = require('underscore');


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

router.get('/webhook/omnivore', async (req, res) => {
    res.status(200).send('ae8e8565be464ad89729828d608cd0b5');
});

router.post('/webhook/omnivore', async (req, res, next) => {
    try {
        const {omnivore} = await Merchant.findOne({_id: '5b346f48d585fb0e7d3ed3fc'}, 'omnivore').exec();
        omnivore['data'] = req.body ;
        omnivore.save();
    } catch (err) {
        res.sendStatus(500);
        next(`Error getting rewards for merchant: ${err.message}`);
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

router.get('/allParties', async (req, res, next) => {
    try {
        const parties = await Party.find({
            restaurantId: req.user.id, 
        }).exec();

        res.status(200).send(parties);
        
    } catch (err) {
        res.status(500);
        next(`Internal error from Mongoose: ${err.message}`);
    }
});

const groups = (() => {
    const day = (item) => moment(item.time).format('MMM DD YYYY'),
        month = (item) => moment(item.time).format('MMM YYYY'),
        week = (item) =>  moment(item.time).format('ww gggg');
    return {
        day,
        month,
        week,
    };
})();

const periodRanges = ['day', 'week', 'month'];
const periodRangeFormat = {
    'day' : 'MMM DD YYYY',
    'week': 'ww gggg',
    'month': 'MMM YYYY'
};

router.get('/analytics/:amazonUserSub/:currentTimeStamp', async (req, res, next) => {
    var analyticsData = {};

    try {
        const {visits, members, transactions, rewards, address, name} = await Merchant.findOne({_id: req.params.amazonUserSub}, 
                                'visits members transactions rewards address name')
                                .exec();

        analyticsData['address'] = address;
        analyticsData['name'] = name;
        analyticsData['total members'] = members.length;
        analyticsData['total visits'] = visits.length;
        analyticsData['total splits'] = transactions.reduce((acc, transaction) =>                
            acc + transaction.charges.length, 0);  

        analyticsData['rewards'] = rewards.map(reward => {
            var rewardData = {};
            rewardData['reward'] = reward.reward;
            rewardData['pointsRequired'] = reward.pointsRequired;
            rewardData['total lifetime redemptions'] = reward.redemptions.length;
            return rewardData;
        });  


        const orderedVists = visits.sort((first, second) => moment.utc(second.time).diff(moment.utc(first.time)));
        const lastDate = moment(orderedVists[orderedVists.length - 1].time);


        periodRanges.forEach( (range) => {
            const currentPeriod = moment(req.params.currentTimeStamp);
            const visitsByRange = _.groupBy(orderedVists, groups[range]);

            for (const period in visitsByRange) {
                var numVisits = {'returning customer': 0, 'new customers': 0};
                visitsByRange[period].forEach((visit) => {
                        if (visit.returning) {
                            numVisits['returning customer'] ++;
                        } else {
                            numVisits['new customers'] ++;
                        }      
                    });

                visitsByRange[period] = numVisits;
            }

            // populate array and makes sure all ranges are valid
            while (currentPeriod.isAfter(lastDate)) {
                const currentPeriodFormat = moment(currentPeriod).format(periodRangeFormat[range]);
                if (!(currentPeriodFormat in visitsByRange)) {
                    visitsByRange[currentPeriodFormat] = {'returning customer': 0, 'new customers': 0};
                }
                currentPeriod.subtract(1, `${range}s`);
            }

            rewards.forEach( reward => {
                const redemptionsByRange = _.groupBy(reward.redemptions, groups[range]);
                Object.keys(redemptionsByRange).forEach( redemption => {
                    if (!('rewards' in visitsByRange[redemption])) {
                         visitsByRange[redemption]['rewards'] = [];
                    } 
                    visitsByRange[redemption]['rewards'].push(
                        {'reward': reward.reward, 'redemptions': redemptionsByRange[redemption].length});
                });
            });

            const orderedAllVisits = 
                Object.keys(visitsByRange)
                        .sort((first, second) => moment.utc(second, periodRangeFormat[range]) - moment.utc(first, periodRangeFormat[range]))
                        .map((key) => {
                            var temp = {};
                            temp['date'] = key;
                            Object.keys(visitsByRange[key]).forEach(k => {
                                temp[k] = visitsByRange[key][k];
                            });
                            return temp;
                        });

            analyticsData[range] = orderedAllVisits;
        });

        res.status(200).send(analyticsData);
    } catch (err) {
        res.status(500);
        next(`Internal error from Mongoose: ${err}`);
    }



});


module.exports = router;