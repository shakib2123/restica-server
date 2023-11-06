const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", async (req, res) => {
  res.send("Restica running here 😎.");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.op9dmu8.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();

    const foodCollection = client.db("ResticaFood").collection("foods");
    const userCollection = client.db("ResticaFood").collection("users");
    const orderCollection = client.db("ResticaFood").collection("orders");

    app.post("/api/v1/users", async (req, res) => {
      try {
        const user = req.body;
        console.log(user);
        const result = await userCollection.insertOne(user);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });
    app.post("/api/v1/foods", async (req, res) => {
      try {
        const food = req.body;
        const result = await foodCollection.insertOne(food);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    app.get("/api/v1/foods", async (req, res) => {
      try {
        const query = {};
        const page = Number(req.query.page) - 1;
        const limit = Number(req.query.limit);
        const search = req.query.search;
        if (search) {
          query.name = search;
        }

        const foodsCount = await foodCollection.estimatedDocumentCount();
        const result = await foodCollection
          .find(query)
          .skip(page * limit)
          .limit(limit)
          .toArray();
        res.send({ result, foodsCount });
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/api/v1/foods/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await foodCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    app.patch("/api/v1/foods/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedInfo = req.body;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            quantity: updatedInfo.updatedStock,
            purchase_count: updatedInfo.updatedCount,
          },
        };
        const result = await foodCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);
        
      } catch (error) {
        console.log(error);
      }
    });

    app.post("/api/v1/orders", async (req, res) => {
      try {
        const order = req.body;
        const result = await orderCollection.insertOne(order);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // Send a ping to confirm a successful connection
    client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Restica running on port: ${port}`);
});
