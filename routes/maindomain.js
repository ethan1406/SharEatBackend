import express from 'express';


const app = express();

const router = express.Router();


app.get('/auth/facebook', passport.authenticate('facebook', { scope : ['email', 'user_friends'],
																failureFlash: true ,
																successFlash: 'Welcome!'}));

    // handle the callback after facebook has authenticated the user
app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/loginsuccess',
            failureRedirect : '/login',
}));



app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

app.get('/login', (req,res)=> {
	res.render('login.ejs', { message: req.flash('loginMessage') });
});


app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/loginsuccess', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
 }));


app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/loginsuccess', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
}));





app.get('/test', (req, res) =>
{
	res.send('sup');
});

// server.get('/testdb', (req, res) =>
// {
// 	var newUser = new User();
// 	newUser.id = '12345';
// 	newUser.name = 'Ethan Chang';
// 	newUser.save();
// 	res.send('here');
// });


// function loggedIn(req, res, next) {
//     //console.log(req.user);
//     if (req.user) {
//         next();
//     } else {
//         res.redirect('/login');
//     }
// }



app.get('/loginsuccess', (req,res)=> {
	res.send('youre logged in');
});

// server.get('*', loggedIn, (req, res) => {

//  //res.render(__dirname + "/views/index.ejs");
//   res.render('index', {
//     content: '...'
//   });
// });

// server.use('/api', apiRouter);
app.use(router);

exports.app = app;