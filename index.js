const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const res = require("express/lib/response");
const app = express();
const port = process.env.PORT || 3030;
const stripe = require("stripe")(process.env.stripe_secret);
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorised Access" });
    }
    const bearer = authHeader.split(" ")[1];
    jwt.verify(bearer, process.env.access_webtoken, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: "Forbidden Access" });
        }
        req.decoded = decoded;
        next();
    });
}

const uri = `mongodb+srv://${process.env.database_username}:${process.env.database_password}@hasan-manufacturer-indu.nazsf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const products = client.db("manufacturer").collection("products");
        const orders = client.db("manufacturer").collection("orders");
        const users = client.db("manufacturer").collection("users");
        const userCollection = client.db("manufacturer").collection("userCollection");
        const reviews = client.db("manufacturer").collection("reviews");

        app.get("/", (req, res) => {
            res.send("Server Listening.....");
        });
        app.post("/add-product", async (req, res) => {
            const query = { name: req.body.name };
            const update = { $set: req.body };
            const options = { upsert: true };
            await products.updateOne(query, update, options);
            res.send({ success: true });
        });
        app.get("/get-products", async (req, res) => {
            const query = {};
            const cursor = await products.find(query);
            const productsResult = await cursor.toArray();
            res.send(productsResult.reverse());
        });
        app.get("/reviews", async (req, res) => {
            const query = {};
            const cursor = reviews.find(query);
            const reviewsArrsy = await cursor.toArray();
            res.send(reviewsArrsy.reverse());
        });
        app.get("/users", verifyJWT, async (req, res) => {
            const query = {};
            const cursor = userCollection.find(query);
            const usersArray = await cursor.toArray();
            res.send(usersArray.reverse());
        });
        app.get("/product/:id", async (req, res) => {
            const query = { _id: ObjectId(req.params.id) };
            const result = await products.findOne(query);
            res.send(result);
        });
        app.post("/placeorder", async (req, res) => {
            await orders.insertOne(req.body);
            res.send({ success: true });
        });
        app.post("/addreview", async (req, res) => {
            await reviews.insertOne(req.body);
            res.send({ success: true });
        });
        app.post("/update-user", verifyJWT, async (req, res) => {
            const decodedEmail = req?.decoded?.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { name: req.body.email };
                if (req.body._id) {
                    req.body._id = ObjectId(req.body._id);
                }
                const update = { $set: req.body };
                const options = { upsert: true };
                const result = await users.updateOne(query, update, options);
                res.send(result);
            } else {
                res.status(403).send({ message: "Forbidden Access" });
            }
        });
        app.get("/user", verifyJWT, async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await users.findOne(query);
            res.send(result);
        });
        app.get("/myorders", verifyJWT, async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = await orders.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get("/myorders/:id", verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orders.findOne(query);
            res.send(result);
        });
        app.get("/myreviews", verifyJWT, async (req, res) => {
            const decodedEmail = req?.decoded?.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = await reviews.find(query);
                const result = await cursor.toArray();
                res.send(result);
            } else {
                res.status(403).send({ message: "Forbidden Access" });
            }
        });
        app.delete("/delete/:id", verifyJWT, async (req, res) => {
            const products = client.db("manufacturer").collection("orders");
            const query = { _id: ObjectId(req.params.id) };
            const result = await products.deleteOne(query);
            res.send(result);
        });
        app.put("/user/:email", async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.access_webtoken, { expiresIn: "76h" });
            res.send({ result, token });
        });
        app.put("/makeadmin/:email", verifyJWT, async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const requester = req?.decoded?.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === "admin") {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: "admin" },
                };
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send(result);
            } else {
                res.status(403).send({ message: "Forbidden Access" });
            }
        });
        app.get("/admin/:email", verifyJWT, async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === "admin";
            res.send({ admin: isAdmin });
        });
        app.post("/create-payment-intent", verifyJWT, async (req, res) => {
            const order = req.body;
            console.log(order);
            const price = order.price;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ["card"],
            });
            res.send({ client_secret: paymentIntent.payment_secret });
        });
    } finally {
    }
}

run().catch(console.dir);

app.listen(port, () => {
    console.log("Server Listening.....");
});
