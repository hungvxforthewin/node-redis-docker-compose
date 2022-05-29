const express = require("express");
const redis = require("redis");
const session = require("express-session");
let RedisStore = require("connect-redis")(session);
const app = express();
const client = redis.createClient({
    url: "redis://redis:6379",
    //legacyMode: true,
    // host: "redis",
    // port: "redis:6379",
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

app.use(
    session({
        store: new RedisStore({ client: client, ttl: 260 }),
        secret: "config.SECRET",
        resave: false,
        //proxy: true,
        saveUninitialized: false,
        cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: false, secure: false }, // mini second hour * 60 * 60 * 1000
    })
);

//Set initial visits
client.set("visits", 0);

app.get("/", (req, res) => {
    res.send("working");
});

//defining the root endpoint
app.get("/visits", async (req, res) => {
    console.log("hi");
    const visits = await client.get("visits");
    const newVisitCount = parseInt(visits) + 1;
    await client.set("visits", newVisitCount);
    res.send("Number of visits is: " + newVisitCount);
});

//defining the root endpoint
app.get("/xxx", (req, res) => {
    console.log("redis");
    let oldCount = RedisStore["visits"] || 0;
    //let oldCount req.session.count || 0;
    client.get("visits", (err, visits) => {
        RedisStore["visits"] = parseInt(oldCount) + 1;
        res.send("Number of visits is: " + oldCount);
        client.set("visits", parseInt(oldCount) + 1);
        //console.log(req.session.count);
    });
});

//defining the root endpoint
app.get("/withoutredis", (req, res) => {
    client.get("visits", (err, visits) => {
        res.send("Number of visits is: " + visits);
        client.set("visits", parseInt(visits) + 1);
    });
});

//specifying the listening port
app.listen(8081, () => {
    console.log("Listening on port 8081");
});
