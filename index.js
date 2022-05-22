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

const uri = "mongodb+srv://adminHasan:<password>@hasan-manufacturer-indu.nazsf.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.get("/", (req, res) => {
    res.send("Server Listening.....");
});

app.listen(port, () => {
    console.log("Server Listening.....");
});
