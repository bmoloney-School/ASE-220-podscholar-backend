const express = require('express');
const mongo = require("mongodb");
const { v4: uuidv4 } = require('uuid');
var cors = require('cors');
const { query } = require('express');

// Express setup -- DO NOT TOUCH THIS IT WILL BREAK EVERYTHING
const app = express();
app.use(express.json());
app.use(cors());
const router = express.Router();

// App values
const uri = "mongodb+srv://6K9uMUAg2t6e:Ey4kype7VAYbsZG3@podscholarcluster.g5sjk.mongodb.net/podscholar?retryWrites=true&w=majority";
const client = new mongo.MongoClient(uri);
var db;
var podcasts;
var users;
const port = process.env.PORT || 5000

//shared middlware
router.use((req, res, next) => {
    res.header()
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

router.put('/podcast/:id', async function (req, res) {
    let podcastId = req.params.id;
    const filter = {
        _id: new mongo.ObjectId(podcastId)
    };
    const options = { upsert: false }
    let update = {
        $set: {}
    }
    // There has to be a better way to do this.
    if (req.body.title) {
        update.$set.title = req.body.title;
    }
    if (req.body.journal) {
        update.$set.journal = req.body.journal;
    }
    if (req.body.publishedDate) {
        update.$set.publishedDate = req.body.publishedDate;
    }
    if (req.body.DOI) {
        update.$set.DOI = req.body.DOI;
    }
    if (req.body.keywords) {
        update.$set.keywords = req.body.keywords;
    }

    console.log(update);

    try {
        let result = await podcasts.updateOne(filter, update, options)
        res.send(result);
    }
    catch (e) {
        console.log("ERROR:\t" + e)
        res.status(400).send({ message: "An error occured processing your request" });
    }
})

//This returns a single podcast
router.get('/podcast/byId/:id', async (req, res, next) => {
    let id = req.params.id
    try {
        const query = {
            _id: new mongo.ObjectId(id)
        };
        const options = {}
        let mongoResp = await podcasts.findOne(query, options)
        if (!mongoResp) {
            res.status(400).send({ message: "User does not exist." })
        }
        else {
            res.json(mongoResp)
        }
    }
    catch (e) {
        res.status(400).json({ message: "Invalid Reqeust" })
    }

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

router.get('/podcasts*/doi/:DOI*', (req, res, next) => {
    res.locals.DOI = req.params.DOI;
    console.log('Filtering by DOI: ', req.params.DOI);
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
        query._id = mongo.ObjectId(res.locals.authorId);
    }
    // Currently Broken bc of / and . characters in doi
    if (res.locals.DOI) {
        query.DOI = res.locals.DOI;
    }
    var mongoResp = {};
    podcasts.find(query).sort({ publishedDate: -1 }).toArray(function (err, result) {
        if (err) res.status(400).send({ message: "Podcast does not exist." });
        mongoResp.podcasts = result;
        res.json(mongoResp)
    })
})

router.get('/podcasts/byCategory', async function (req, res) {
    const query = {};
    const options = { upsert: false };
    if (res.locals.category) {
        query.category = res.locals.category
    }
    if (res.locals.year) {
        query.year = res.locals.year
    }
    if (res.locals.authorId) {
        query._id = mongo.ObjectId(res.locals.authorId);
    }
    // Currently Broken bc of / and . characters in doi
    if (res.locals.DOI) {
        query.DOI = res.locals.DOI;
    }
    var mongoResp = {};
    podcasts.find(query).sort({ category: 1 }).toArray(function (err, result) {
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
    let userId = req.params.id;
    const filter = {
        _id: new mongo.ObjectId(userId)
    };
    console.log(filter)
    const options = { upsert: false }
    let update = {
        $set: {}
    }
    // There has to be a better way to do this.
    if (req.body.organization) {
        update.$set.organization = req.body.organization;
    }
    if (req.body.title) {
        update.$set.title = req.body.title;
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


router.get('/user/email/:e', async function (req, res) {
    let email = req.params.e

    const query = {
        email: email
    };
    const options = {
        projection: { password: 0 },
    }
    let mongoResp = await users.findOne(query, options)
    if (!mongoResp) {
        res.status(400).send({ message: "User does not exist." })
    }
    else {
        res.json(mongoResp)
    }
})

router.get('/user/name/:fullname', async function (req, res) {
    let name = req.params.fullname
    let splitName = name.split('-');

    const query = {
        firstName: splitName[0],
        lastName: splitName[1]
    };
    const options = {
        projection: { password: 0 },
    }
    let mongoResp = await users.findOne(query, options)
    if (!mongoResp) {
        res.status(400).send({ message: "User does not exist." })
    }
    else {
        res.json(mongoResp)
    }
})

router.get('/user/:userId', async function (req, res) {
    let userId = req.params.userId
    try {
        const query = {
            _id: new mongo.ObjectId(userId)
        };
        const options = {
            projection: { password: 0 },
        }
        let mongoResp = await users.findOne(query, options)
        if (!mongoResp) {
            res.status(400).send({ message: "User does not exist." })
        }
        else {
            res.json(mongoResp)
        }
    }
    catch (e) {
        res.status(400).json({ message: "Invalid Reqeust" })
    }

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

router.post('/login', async function (req, res) {
    //TODO: Add verification

    let user = req.body;
    let query = {
        email: user.email,
        password: user.password
    }
    try {
        result = await users.findOne(query);
        console.log(result)
        if (result._id) {
            res.send({ userID: result._id });
        }
        else {
            res.send({ message: "invalid Login" })
        }

    }
    catch (e) {
        res.send(e)
    }
})

router.get('/categories', async function (req, res) {
    try {
        result = await podcasts.aggregate(
            [{
                $group: {
                    _id: '$category', count: { $sum: 1 }
                }
            }]
        )
        res.send(result)
    }
    catch (e) {
        console.log("error")
    }
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


app.use('/api', router);

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