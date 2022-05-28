const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const res = require("express/lib/response");
const app = express();
const port = process.env.PORT || 3030;

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorised Access" });
    }
    const bearer = authHeader.split(" ")[1];
    jwt.verify(bearer, process.env.ACCESS_TOKEN, (err, decoded) => {
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
        app.get("/product/:id", async (req, res) => {
            const query = { _id: ObjectId(req.params.id) };
            const result = await products.findOne(query);
            res.send(result);
        });
        app.post("/placeorder", async (req, res) => {
            const query = { name: req.body.name };
            const update = { $set: req.body };
            const options = { upsert: true };
            await orders.updateOne(query, update, options);
            res.send({ success: true });
        });
        app.post("/update-user", async (req, res) => {
            const query = { name: req.body.email };
            if (req.body._id) {
                req.body._id = ObjectId(req.body._id);
            }
            const update = { $set: req.body };
            const options = { upsert: true };
            const result = await users.updateOne(query, update, options);
            res.send(result);
        });
        app.get("/user", async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await users.findOne(query);
            res.send(result);
        });
    } finally {
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log("Server Listening.....");
});
