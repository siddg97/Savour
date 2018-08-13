const User = require('../models').user
const jwt = require('jsonwebtoken');


module.exports = {
    login(req, res) {
        console.log("req.body:");
        console.log(req.body);
        console.log("attempting to login");

        // verify the user's login information
        let errMsg = "Username/email and password does not match.";

        return User
            .or([
                { email: req.body.user},
                { username: req.body.user }  
            ])
            .then(user => {
                if(!user) {
                    return res.status(404).send({
                        message: "Can not find user with username/email: " + req.body.user
                    })
                } else {

                    // verify the password of the user
                    let plainTextPassword = req.body.password;
                    let passwordHash = user.password
                    bcrypt.compare(plainTextPassword, passwordHash, function(err, result) {

                        if(err) {
                            console.log(err);
                            return res.status(400).send(err);
                        }

                        // add { expiresIn: '1h' } as 3rd param to set the token to expire
                        if(result == true) {
                            jwt.sign({user}, 'secretkey', (err, token) => {
                                if(err) {
                                    console.log(err);
                                    return res.status(400).send(err);
                                }

                                let response = user.dataValues;
                                response.token = token;
                                return res.send(response);
                            });
                        } else {
                            return res.status(404).send({
                                message: errMsg
                            })                     
                        } 
                    });
                }
            })
            .catch((error) => {
                console.log("Opps we ran into an error");
                console.log(error);
                res.status(400).send(error);
            })

        return
    },


    // Verify Token
    verifyToken(req, res, next) {
        // Get auth header value (token)
        // console.log(req);
    
        const bearerHeader = req.headers['authorization'];
    
        let errMsg = "Authorization token invalid, you are not authorized to access this endpoint."
    
        // Check if bearer is undefined
        if(typeof bearerHeader !== 'undefined') {
            // Split at the space
            const bearer = bearerHeader.split(' ');
            // Get token from array
            const bearerToken = bearer[1];
            // Set the token
            req.token = bearerToken;

            jwt.verify(req.token, 'secretkey', (err, authData) => {
                if(err) {
                    // Forbidden
                    res.status(403).json({
                        message: errMsg
                    });
                } else {
                    // Next middleware, user verified, process the request
                    // console.log("authData", authData);
                    // console.log("user", authData.user)
                    req.body.validatedUser = authData.user;
                    
                    console.log("validatedUser", req.body.validatedUser);

                    next();
                }
            });  
        } else {
            // Forbidden
            res.status(403).json({
                message: errMsg
            });
        }
    },

    checkToken(req, res) {
        let token = req.body.token;

        let errMsg = "This token is invalid";
        
        jwt.verify(token, 'secretkey', (err, authData) => {
            if(err) {
                // Forbidden
                res.status(403).send({
                    message: errMsg
                });
            } else {
                console.log(authData);
                res.send(authData.user);
            }
        }); 
    },

    
    
}