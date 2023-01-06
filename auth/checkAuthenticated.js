const User = require('./../database/schemas/User');

const checkAuthenticated = async (cookieToken, cookieEmail) => {

    if (!cookieToken || !cookieEmail) {
        console.log("Authentication failed: missing cookies");
        return { isAuthenticated: false, user: null };
    }

    let user = await User.findOne({ email: cookieEmail });

    if (user?.authToken == cookieToken) {
        console.log("Authentication successful: valid token");
        return { isAuthenticated: true, user: user };
    }

    console.log("Authentication failed: invalid token");
    return { isAuthenticated: false, user: user };
}

module.exports = checkAuthenticated;