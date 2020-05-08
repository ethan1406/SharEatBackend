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

export const jsonWebKeys = [
    {
        alg: 'RS256',
        e: 'AQAB',
        kid: 'gXopDt8RP5dbRd1eGcuTGlEKx2sLxuRWM8XGPUUVkaU=',
        kty: 'RSA',
        n: 'lGHHj34RQZWAzUBUK-pF8Yo0Dlt4TG8B4JLT5gbjo1Nt0GLSlSnSas4EgMsH1nAmiliMEJC3i7HrskQXIDSrDA26XmtAQoe1vR3B67t1ujDQIXuFhYboETQYWt_n75khhYFzewoF4FKRpsEupfQfjxKLsht2txg_n-fKzJ_FCdCIgKwU-z7iD0BrkncCErn4w5UGdS7-ukfIZxlDNmgx1Ce2tjuR8YhRut_WsRfqsa5GnxRX7AUw8p0yc-XacMaU6GjrzNQ20Dsax3bezOzSnDMGPLIvexFKpXAKz4aX6lTbKutdP9kgcbwleQhl6TxzhkL5wgMIxxDONDTINO2u7Q',
        use: 'sig'
    },
    {
        alg: 'RS256',
        e: 'AQAB',
        kid: 'X85rJS9W+rgQbg8dvjeG2DsPoSOWXxakO8MMXN7G0Ig=',
        kty: 'RSA',
        n: 'u2fAIu3S3r-6ajcUJAEDoj92F0dsFJ5o_hiV6vUtHY3lcQEMmGD-gGllqNc6TBzSbLWfHwHf3fqOll9gkp5HDQjKgkR4oGoQBFpPVKEguGhdlvbMWZ2Y330vYbECYmM0oiRXZ6BjDNols-6FIzRVkCLwSkRMuGTB2iQTngU6dJcutdyubu4KnZtLOO2qOn9Wt33xnIACxjYNZSPNH3UHg5wx9ulBaKz-iEeSh4Ed8uzsOxXicLqcj0KJDiJbRPLQ_9i8okQ1X_cgk52mn69v77aml4HUy0S9LetBTUycJZ96Pk7wTDxtAFcTAiIWbxHkrLSQJV3fsPNliN1Aq2_Y5w',
        use: 'sig'
    }
];


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