module.exports = {
    'facebookAuth' : {
        'clientID'      : '184399145517801', // your App ID
        'clientSecret'  : '1bc61b99aadaab8145b57af3a63e2934', // your App Secret
        'callbackURL'   : 'https://www.shareatpay.com/auth/facebook/callback'
        //'https://refriendonline.herokuapp.com/auth/facebook/callback'
    },
    stripe: {
	    secretKey: 'sk_test_mgtufzoiXQteGddpQ7fuE4MP',
	    publishableKey: 'pk_test_x9efkreYwQ5wlmqXXc2paByL',
	    clientId: 'ca_DK1flNQ4jLLde6EAbIFLalAbbxbQDZxU',
	    authorizeUri: 'https://connect.stripe.com/express/oauth/authorize',
	    tokenUri: 'https://connect.stripe.com/oauth/token'
    },
};