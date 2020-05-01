import express from 'express';
import Party from '../models/party';

import { pusher } from '../util/Pusher';

const router = express.Router();


/*
    Table Logic

*/
router.post('/order/split/check', async (req, res, next) => {

    const {amazonUserSub} = req.body;
    if (amazonUserSub === undefined) {
        return res.status(400).json('Please provide a user id');
    }
    if (req.body.firstName === undefined) {
        return res.status(400).json('Please provide the first name');
    }
    if (req.body.lastName === undefined) {
        return res.status(400).json('Please provide the last name');
    }

    try {
        var party = await Party.findOne({_id: req.body.partyId}, ['orders','members']).exec();

        //check if the member has paid yet
        var hasPaid = false;
        party.members.forEach(member => {
            if (member.amazonUserSub === amazonUserSub) {
                if (member.hasPaid) {
                    hasPaid = true;
                }
            }
        });

        if (hasPaid) {
            res.status(400).json({message: 'user has already paid'});
        } else {
            party.orders.forEach( async (order)=> {
                if(order._id == req.body.orderId) {
                    var isBuyer = false;
                    var pos = -1;
                    order.buyers.forEach((buyer, index) => {
                        if(buyer.amazonUserSub === amazonUserSub) {
                            isBuyer = true;
                            pos = index;
                        }
                    });

                    if (!isBuyer) {
                        order.buyers.push({firstName: req.body.firstName, 
                            lastName: req.body.lastName, amazonUserSub: amazonUserSub, finished: false});

                    } else {
                        order.buyers.splice(pos, 1);
                    }
                }
            });

            pusher.trigger(req.body.partyId, 'splitting', {
              orders: party.orders
            });

            await party.save();

            return res.sendStatus(200);
        }

    } catch (err) {
        res.status(500).send(`failed to split the order for the user: ${err.message}`);
        next(`failed to split the order for the user: ${err.message}`);
    }
});



// join a table at a restaurant
router.post('/:restaurant_omnivore_id/:omnivore_ticket_id', async (req, res) => {

    const {amazonUserSub} = req.body;
    if (amazonUserSub === undefined) {
        res.status(400).json('Please provide a user id');
    }

    try {
        const party = await Party.findOne({
            restaurant_omnivore_id: req.params.restaurant_omnivore_id, 
            omnivore_ticket_id: req.params.omnivore_ticket_id,
            finished: false
        });

        if(!party){
            res.status(404).send('No party is found');
        } else {

            //check if the member is in the party yet
            var isMember = false;
            party.members.forEach(member => {
                if (member.amazonUserSub === amazonUserSub) {
                    isMember = true;
                }
            });

            if (!isMember) {
                party.members.push({amazonUserSub: amazonUserSub, hasPaid: false});
            }

            pusher.trigger(party._id.toString(), 'new_member', {
              members: party.members
            });

            await party.save();

            return res.status(200).json(party);
        }
    } catch (err) {
        console.log(err);
        res.status(500).send(`Internal error: ${err.message}`);
    }
});




module.exports = router;