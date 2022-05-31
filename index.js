const express = require("express");
const redis = require("redis");
const session = require("express-session");
let RedisStore = require("connect-redis")(session);
const app = express();
// const client = redis.createClient(6379, "redis");
// const client = redis.createClient({
//     host: "redis-server",
//     port: 6379,
// });
const client = redis.createClient({
    url: "redis://redis:6379",
    legacyMode: true,
});

client.on("error", (err) => console.log("Redis Client Error", err));
const visits = 0;

(async () => {
    try {
        await client.connect();
        const re = await client.ping();
        console.log("ping", re);
    } catch (error) {
        console.log(error);
    }
})();
client.on("connect", () => console.log("Connected to Redis"));
app.use(
    session({
        store: new RedisStore({ client: client }),
        secret: "config.SECRET",
        //resave: false,
        //proxy: true,
        //saveUninitialized: false,
        cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: false, secure: false }, // mini second hour * 60 * 60 * 1000
    })
);
app.use(function (req, res, next) {
    if (!req.session) {
        return next(new Error("oh no")); // handle error
    }
    next(); // otherwise continue
});
//Set initial visits, ERROR THIS HERE
client.set("visits", 0);
RedisStore["hits"] = 0;
app.get("/", (req, res) => {
    res.send("working");
});

//set session data
app.get("/set-session", async (req, res) => {
    req.session.count = 0;
    res.send("Number of visits from session is: " + req.session.count);
});
app.get("/get-visit", async (req, res) => {
    const visits = req.session.count || 0;
    const newVisitCount = parseInt(visits) + 1;
    req.session.count = newVisitCount;
    res.send("Number of visits is: " + newVisitCount);
});
//defining the root endpoint
app.get("/redis", async (req, res) => {
    console.log("redis");
    console.log("sess", req.session.count);
    //let oldCount = RedisStore["visits"] || 0;
    //let oldCount = req.session.count || 0;
    try {
        client.get("visits", (err, visits) => {
            let oldCount = req.session.count || visits;
            req.session.count = parseInt(oldCount) + 1;
            res.send("Number of visits is: " + oldCount);
            client.set("visits", parseInt(oldCount) + 1);
            //console.log(req.session.count);
        });
    } catch (error) {
        console.log(error);
    }
});
app.get("/visits", async (req, res) => {
    console.log("hi");
    const visits = (await client.get("visits")) || 0;
    const newVisitCount = parseInt(visits) + 1;
    await client.set("visits", newVisitCount);
    res.send("Number of visits is: " + newVisitCount);
});

//specifying the listening port
app.listen(8081, () => {
    console.log("Listening on port 8081");
});
