const { Error } = require("mongoose");
const passport = require("../config/passport");
const User = require("../models/User.model");
const EmailToken = require("../models/EmailToken.model");

const asyncHandler = require("../middlewares/asyncHandler");
const authService = require("../services/auth.service");
const userService = require("../services/user.service");

const { isObjEmpty } = require("../utils/object");
const pick = require("../utils/pick");

const {
    BadRequestError,
    ConflictError,
    InternalServerError,
    UnauthenticatedError,
} = require("../utils/errors");


const checkIdentifier = asyncHandler(async (req, res, next) => {
    const query = pick(req.query, ["username", "email", "identifier"]);

    if (isObjEmpty(query))
        return next(new BadRequestError("Invalid query parameters!"));

    let userStatus = false;
    const { identifier } = req.params;

    if (query.identifier && await User.exists({
        $or: [{ username: identifier }, { email: identifier }]
    })) {
        userStatus = true;
    }

    if (query.username && await User.exists({ username: identifier }))
        userStatus = true;

    if (query.email && await User.exists({ email: identifier }))
        userStatus = true;

    return res.status(200).json({
        exists: userStatus,
    });
});


/*const signUp = asyncHandler(async (req, res, next) => {
    // Step 1: Log the incoming request and its data
    console.log('Received sign-up request:', req.body);

    const { displayName, username, email, password } = req.body;

    // Step 2: Validate required fields and log if any are missing
    if (!displayName || !email || !password || !username) {
        console.error('Missing required fields:', {
            displayName,
            username,
            email,
            password
        });
        return next(new BadRequestError("Provide all of the required fields!"));
    }

    try {
        // Step 3: Log before user creation
        console.log('Attempting to create user with data:', {
            displayName,
            username,
            email,
        });

        const user = await authService.createLocalUser({
            displayName,
            username,
            email,
            password,
            profileImageURL: process.env.API_URL ? `${process.env.API_URL}/uploads/default_pfp.png` : 'default_pfp.png',
        });

        // Step 4: Log successful user creation
        console.log('User created successfully:', {
            id: user._id,
            displayName: user.displayName,
            username: user.username,
        });

        // Step 5: Log before sending confirmation email
        console.log('Sending confirmation email to user with email:', user.email);
        await authService.sendConfirmationEmail(user._id, user.email);

        // Step 6: Send response back to the client
        return res.status(200).json({
            isAuthenticated: true,
            id: user._id,
        });

    } catch (err) {
        // Step 7: Log errors for debugging
        console.error('Error during sign-up process:', err);

        if (err.errors?.['username'] instanceof Error.ValidatorError) {
            console.error('Username validation error:', err.errors['username']);
            return next(new BadRequestError(err.errors['username']));
        }

        if (err.errors?.['displayName'] instanceof Error.ValidatorError) {
            console.error('Display name validation error:', err.errors['displayName']);
            return next(new BadRequestError(err.errors['displayName']));
        }

        if (err.errors?.['email'] instanceof Error.ValidatorError) {
            console.error('Email validation error:', err.errors['email']);
            return next(new BadRequestError(err.errors['email']));
        }

        if (err.errors?.['password'] instanceof Error.ValidatorError) {
            console.error('Password validation error:', err.errors['password']);
            return next(new BadRequestError(err.errors['password']));
        }

        // Step 8: Log conflict error if username or email already exists
        if (err.code === 11000) {
            console.error('Username or email conflict error:', err);
            return next(new ConflictError("User with the provided username/email already exists!"));
        }

        // Final catch-all error log
        console.error('Unexpected error during sign-up process:', err);
        return next(err);
    }
});*/



const signUp = asyncHandler(async (req, res, next) => {
    const { displayName, username, email, password } = req.body;

    if (!displayName || !email || !password || !username)
        return next(new BadRequestError("Provide all of the required fields!"));

    try {
        const user = await authService.createLocalUser({
            displayName,
            username,
            email,
            password,
            //profileImageURL
           // profileImageURL: `${process.env.API_URL}/uploads/default_pfp.png`,
        });

        await authService.sendConfirmationEmail(user._id, user.email);

        return res.status(200).json({
            isAuthenticated: true,
            id: user._id,
        });
    } catch (err) {
        if (err.errors?.['username'] instanceof Error.ValidatorError) {
            return next(new BadRequestError(err.errors['username']));
        }

        if (err.errors?.['displayName'] instanceof Error.ValidatorError) {
            return next(new BadRequestError(err.errors['displayName']));
        }

        if (err.errors?.['email'] instanceof Error.ValidatorError) {
            return next(new BadRequestError(err.errors['email']));
        }

        if (err.errors?.['password'] instanceof Error.ValidatorError) {
            return next(new BadRequestError(err.errors['password']));
        }

        if (err.code === 11000)
            return next(new ConflictError(
                "User with the provided username/email already exists!"
            ));

        return next(err);
    }

});

const verifyToken = asyncHandler(async (req, res, next) => {
    const { id, code: codeParam } = req.params;
    const user = await User.findOne({ _id: id });

    if (!user)
        return next(new BadRequestError("The user doesn't exist!"));

    const token = await EmailToken.findOne({
        userId: user._id,
        code: codeParam,
    });


    if (!token)
        return next(new BadRequestError("The token doesn't exist or has expired!"));

    await EmailToken.findByIdAndRemove(token._id);
    await User.findByIdAndUpdate(user._id, { verified: true });

    req.login(user, (err) => {
        if (err) return next(new InternalServerError());

        return res.status(200).json({
            isAuthenticated: true
        });
    });

});


const signIn = (req, res, next) => {
    passport.authenticate("local", async (err, user, info) => {
        if (err) return next(new BadRequestError(info.message)); // local strategy error
        if (!user) return next(new BadRequestError(info.message)); // no user error


        if (!user.verified) {
            await authService.sendConfirmationEmail(user._id, user.email);

            return res.status(200).json({
                id: user._id,
                isEmailVerified: false
            })
        }


        req.logIn(user, (err) => {
            if (err) return next(new InternalServerError()); // error while establishing session

            return res.status(200).json({ isAuthenticated: true });
        });
    })(req, res, next);
};

const logout = (req, res) => {
    req.logout((err) => {
        if (err) next(new InternalServerError());

        return res.json({
            isAuthenticated: false,
        });
    });
};

/*const isAuth = (req, res, next) => {
    if (req.user)
        return res.status(200).json({
            isAuthenticated: true,
            data: req.user,
        });

    return next(new UnauthenticatedError("You are not authenticated!"));
};*/

const isAuth = (req, res, next) => {
    try {
        if (req.user) {
            return res.status(200).json({
                isAuthenticated: true,
                data: req.user,
            });
        }
        // Log the lack of user authentication
        console.log("Authentication failed: No user found in the request.");
        return next(new UnauthenticatedError("You are not authenticated!!!"));
    } catch (error) {
        // Log the exact error message and stack trace for detailed debugging
        console.error("Error in isAuth function:", error.message);
        console.error("Stack trace:", error.stack);
        return next(new InternalServerError("An error occurred during authentication."));
    }
};



module.exports = {
    checkIdentifier,
    signUp,
    signIn,
    verifyToken,
    logout,
    isAuth,
};