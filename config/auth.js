// module.exports = {
//     'facebookAuth' : {
//         'clientID'      : '184399145517801', // your App ID
//         'clientSecret'  : '1bc61b99aadaab8145b57af3a63e2934', // your App Secret
//         'callbackURL'   : 'https://www.shareatpay.com/auth/facebook/callback'
//         //'https://refriendonline.herokuapp.com/auth/facebook/callback'
//     },
//     stripe: {
// 	    secretKey: 'sk_test_mgtufzoiXQteGddpQ7fuE4MP',
// 	    publishableKey: 'pk_test_x9efkreYwQ5wlmqXXc2paByL',
// 	    clientId: 'ca_DK1flNQ4jLLde6EAbIFLalAbbxbQDZxU',
// 	    authorizeUri: 'https://connect.stripe.com/express/oauth/authorize',
// 	    tokenUri: 'https://connect.stripe.com/oauth/token'
//     },
//     spreedly: {
//         environment_key: 'WtpbfN6WddeL2acp774MhJHtT8t',
//         secret_key: '7uTBa3uNsUO4Ccs36Ci1CVskCxh4s1xsnrgxB47PTKwqjKanzCsvVgiPEMV4bzFH',
//         spreedlyAddCardURL: 'https://core.spreedly.com/v1/payment_methods'
//     }
// };

export const spreedly = {
    environment_key: 'WtpbfN6WddeL2acp774MhJHtT8t',
    secret_key: '7uTBa3uNsUO4Ccs36Ci1CVskCxh4s1xsnrgxB47PTKwqjKanzCsvVgiPEMV4bzFH',
    spreedlyAddCardURL: 'https://core.spreedly.com/v1/payment_methods'
};

export const omnivore = {
    url: 'https://api.omnivore.io/1.0/locations',
    encryption_key_id: 'Li68KEcL',
    api_key: '13c73167d0a94d719cbd419aca31dabc'
};


export const stripeKeys = {
    secretKey: 'sk_test_mgtufzoiXQteGddpQ7fuE4MP',
    publishableKey: 'pk_test_x9efkreYwQ5wlmqXXc2paByL',
    clientId: 'ca_DK1flNQ4jLLde6EAbIFLalAbbxbQDZxU',
    authorizeUri: 'https://connect.stripe.com/express/oauth/authorize',
    tokenUri: 'https://connect.stripe.com/oauth/token'
};

export const facebookAuth = {
    'clientID'      : '184399145517801', // your App ID
    'clientSecret'  : '1bc61b99aadaab8145b57af3a63e2934', // your App Secret
    'callbackURL'   : 'https://www.shareatpay.com/auth/facebook/callback'
};