const express = require('express');
const { MongoClient } = require("mongodb");
const { v4: uuidv4 } = require('uuid');

// Express setup -- DO NOT TOUCH THIS IT WILL BREAK EVERYTHING
const app = express();
app.use(express.json());
const router = express.Router();

// App values
const uri = "mongodb+srv://6K9uMUAg2t6e:Ey4kype7VAYbsZG3@podscholarcluster.g5sjk.mongodb.net/podscholar?retryWrites=true&w=majority";
const client = new MongoClient(uri);
var db;
var podcasts;
var users;
const port = 3001;

//shared middlware
router.use((req, res, next) => {
    console.log("Request Path:", req.originalUrl);
    next()
})

//TODO: Authentication

//=============PODCAST ROUTES=============


router.post('/podcast', async function (req, res) {
    try {
        let newPodcast = req.body;
        result = await podcasts.insertOne(newPodcast);
        res.send({ message: "Podcast Created", result: result })
    }
    catch (e) {
        res.status(400).json({ message: "There was an error processing your request", error: e.toString() })
    }
})


//This returns a single podcast
router.get('/podcast/byId/:id', (req, res, next) => {
    res.json({ podcast: "Some Podcast" })
})

//This is a really neat way I found to have dynamic paths for searching podcasts
router.get('/podcasts*/author/:authorId*', (req, res, next) => {
    console.log('Filtering by author');
    next();
})

router.get('/podcasts*/category/:name*', (req, res, next) => {
    res.locals.category = req.params.name;
    console.log('Filtering by category: ', req.params.name);
    next();
})

router.get('/podcasts*/year/:yyyy*', (req, res, next) => {
    res.locals.year = req.params.yyyy;
    console.log('Filtering by year: ', req.params.yyyy);
    next();
})

/***
 * catch all the routes that start with /podcasts/
 * Because of how I did this, malformed routes can sometimes be accepted but they are treated as normal paths so I dont think this is an issue.
 * For example /v2/podcasts/AAAAAAAAAAAAAA would be accepted but it would be treated the same as /v2/podcasts
*/
router.get('/podcasts*', async function (req, res) {
    const query = {};
    const options = { upsert: false };
    if (res.locals.category) {
        query.category = res.locals.category
    }
    if (res.locals.year) {
        query.year = res.locals.year
    }
    if (res.locals.authorId) {
        query.authorId = res.locals.authorId
    }
    var mongoResp = {};
    users.find(query).toArray(function (err, result) {
        if (err) res.status(400).send({ message: "Podcast does not exist." });
        mongoResp.podcasts = result;
        res.json(mongoResp)
    })
})

//=============USER ROUTES=============

router.post('/user', async function (req, res) {
    //TODO: Add verification

    let newUser = req.body;
    newUser.isAuthor = false;
    try {
        result = await users.insertOne(newUser);
        res.send({ message: "User Created", result: result });
    }
    catch (e) {
        res.send(e)
    }
})

router.put('/user/:id', async function (req, res) {
    let userId = req.params.userId;
    const filter = {
        userId: userId
    };
    const options = { upsert: false }
    let update = {
        $set: {}
    }
    // There has to be a better way to do this.
    isAuthor = false;
    if (req.body.organization) {
        isAuthor = true;
        update.$set.organization = req.body.organization;
    }
    if (req.body.title) {
        isAuthor = true;
        update.$set.title = req.body.title;
    }
    if (req.body.isVerified && isAuthor) {
        update.$set.isVerified = req.body.isVerified;
    }
    if (isAuthor) {
        update.$set.isAuthor = isAuthor;
    }
    if (req.body.email) {
        update.$set.email = req.body.email;
    }
    if (req.body.firstName) {
        update.$set.firstName = req.body.firstName;
    }
    if (req.body.lastName) {
        update.$set.lastName = req.body.lastName;
    }

    console.log(update);

    try {
        let result = await users.updateOne(filter, update, options)
        res.send(result);
    }
    catch (e) {
        console.log("ERROR:\t" + e)
        res.status(400).send({ message: "An error occured processing your request" });
    }
})

router.get('/user/:userId', async function (req, res) {
    let userId = req.params.userId

    const query = {
        userId: userId
    };
    const options = {
        projection: { _id: 0, password: 0 },
    }
    let mongoResp = await users.findOne(query, options)
    if (!mongoResp) {
        res.status(400).send({ message: "User does not exist." })
    }
    res.json(mongoResp)
})

router.delete('/user/:userId', async function (req, res) {
    let userId = req.params.userId

    const query = {
        userId: userId
    };
    const options = {
        projection: { _id: 0, password: 0 },
    }
    let mongoResp = await users.deleteOne(query, options)

    res.send(mongoResp)
})

//Main app functionality

async function tryConnect() {
    try {
        // Connect the client to the server
        await client.connect();
        // Establish and verify connection
        // await client.db("admin");
        console.log("Connected successfully to server");
        db = client.db("podscholar");
        podcasts = db.collection("podcasts");
        users = db.collection("users");
        users.createIndex({ id: 1 })

        return true;
    }
    catch (e) {
        console.log(" There was an error connecting to Mongodb: " + e);
        return false;
    }
}


app.use('/', router);

async function main() {
    // if connection failed try again up to 10 times
    let retryCount = 0;
    do {
        console.log("CONNECTION ATTEMPT: " + retryCount);
        retryCount++;
    } while (!await tryConnect() && retryCount < 10);
    app.listen(port);
    console.log("listening on:", port)
}

main()