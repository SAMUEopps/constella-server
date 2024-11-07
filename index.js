require("dotenv").config();

const app = require("./app");
const cors = require("cors");

const passport = require("./config/passport");
const connectDB = require("./config/database");
const sessionMiddleware = require("./config/session");

app.use(
    cors({
        origin: process.env.CLIENT_ORIGIN || "https://constella.onrender.com",
        methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    })
);

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());


connectDB(() => {
    const PORT = process.env.API_PORT || 8000;

    app.listen(PORT, () => {
        console.log(`[SERVER]: Server is running at port ${PORT}`);
    });
});
