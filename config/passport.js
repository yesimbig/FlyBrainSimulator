var LocalStrategy   = require('passport-local').Strategy;
var User            = require('../app/models/user');
//var configAuth = require('./auth');
module.exports = function(passport) {

    // passport session setup ==================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
	
    // LOCAL µù¥U ============================================================
    
    passport.use('local-signup', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true 
    },
    function(req, email, password, done) {
		
        process.nextTick(function() {

        User.findOne({'local.email' :  email}, function(err, user) {
            if (err)
                return done(err);

            if (user) {
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            } else {
                var newUser            = new User();
                newUser.local.email    = email;
                newUser.local.password = newUser.generateHash(password);
                newUser.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, newUser);
                });
            }

        });

        });

    }));
	  // LOCAL ±b¸¹¸j©w ============================================================
  passport.use('local-connect', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true 
    },
    function(req, email, password, done) {

        process.nextTick(function() {

        User.findOne({$or :[{'local.email' :  email}, {'facebook.email' : email}]}, function(err, user) {
            if (err)
                return done(err);

            if (user && user.local.email == email) {
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            } else {
				var connect_user;
				if(user.facebook.email == email){
					connect_user = user;
					
				}else{
					connect_user = new User();
					
				}
				connect_user.local.email    = email;
				connect_user.local.password = connect_user.generateHash(password);
				connect_user.save(function(err) {
					if (err) throw err;
					return done(null, connect_user);
				});
				    }
        });    

        });

    }));
	// =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' :  email}, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);
            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

            // all is well, return successful user
            return done(null, user);
        });

    }));


};