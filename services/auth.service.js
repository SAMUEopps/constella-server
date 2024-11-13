/*const { transporter } = require("../config/nodemailer");
const User = require("../models/User.model");
const EmailToken = require("../models/EmailToken.model");
const getKeyAsync = require("../helpers/getKeyAsync");
const generateUsername = require("../helpers/generateUsername")


const createLocalUser = async (data) => {
    return await User.addUser(data);
};

const createGoogleUser = async (data) => {
    const generatedUsername = generateUsername(data.email);

    return await User.addUser({
        ...data,
        username: generatedUsername,
    });
};

const sendConfirmationEmail = async (userId, targetEmail) => {
    const { code = null } = await EmailToken.findOne({ userId }) || {};
    let toSend = code;

    if (!code) {
        const code = ((await getKeyAsync(3)).toString("hex"));

        new EmailToken({
            userId,
            code
        }).save();

        toSend = code;
    }

    const options = {
        to: targetEmail,
        from: '"X Clone" <' + process.env.MAIL_USER + ">",
        subject: "X Clone",
        text: "Thank you for exploring my application! \nYour verification code is: " + toSend,
    };

    await transporter.sendMail(options);
};

module.exports = {
    createLocalUser,
    createGoogleUser,
    sendConfirmationEmail,
};
*/

const { transporter } = require("../config/nodemailer");
const User = require("../models/User.model");
const EmailToken = require("../models/EmailToken.model");
const getKeyAsync = require("../helpers/getKeyAsync");
const generateUsername = require("../helpers/generateUsername");

const createLocalUser = async (data) => {
    console.log("Attempting to create local user with data:", data);
    try {
        const newUser = await User.addUser(data);
        console.log("Local user created successfully:", newUser);
        return newUser;
    } catch (error) {
        console.error("Error creating local user:", error);
        throw error;
    }
};

const createGoogleUser = async (data) => {
    console.log("Creating Google user with data:", data);
    try {
        const generatedUsername = generateUsername(data.email);
        console.log("Generated username for Google user:", generatedUsername);
        const newUser = await User.addUser({
            ...data,
            username: generatedUsername,
        });
        console.log("Google user created successfully:", newUser);
        return newUser;
    } catch (error) {
        console.error("Error creating Google user:", error);
        throw error;
    }
};

const sendConfirmationEmail = async (userId, targetEmail) => {
    console.log("Sending confirmation email for user ID:", userId);
    try {
        const { code = null } = await EmailToken.findOne({ userId }) || {};
        let toSend = code;

        if (!code) {
            console.log("No code found, generating new code...");
            const code = ((await getKeyAsync(3)).toString("hex"));

            console.log("Generated new confirmation code:", code);

            const emailToken = new EmailToken({
                userId,
                code
            });

            await emailToken.save();
            console.log("Email token saved to database");

            toSend = code;
        }

        const options = {
            to: targetEmail,
            from: '"X Clone" <' + process.env.MAIL_USER + ">",
            subject: "X Clone",
            text: "Thank you for exploring my application! \nYour verification code is: " + toSend,
        };

        console.log("Sending email with options:", options);
        await transporter.sendMail(options);
        console.log("Confirmation email sent successfully to:", targetEmail);
    } catch (error) {
        console.error("Error sending confirmation email:", error);
        throw error;
    }
};

module.exports = {
    createLocalUser,
    createGoogleUser,
    sendConfirmationEmail,
};
