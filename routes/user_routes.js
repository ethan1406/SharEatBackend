import express from 'express';

import User from '../models/user';
import Merchant from '../models/merchant';
import {spreedly} from '../config/auth';
import axios from 'axios';

const router = express.Router();


router.post('/signup', async (req, res, next) => {
    try {
        const count = await User.count({amazonUserSub: req.body.amazonUserSub}).exec();
        if (count == 0) {
            var newUser = new User();                   
            newUser.email = req.body.email;
            newUser.amazonUserSub = req.body.amazonUserSub;
            newUser.save();
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



module.exports = router;