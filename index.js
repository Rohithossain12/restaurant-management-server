const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uv360.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();

    const foodCollection = client.db("foodDB").collection("food");
    const purchaseCollection = client.db("foodDB").collection("purchases");

    // auth related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "5h" });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    // get all food items
    app.get("/foodItems", async (req, res) => {
      const result = await foodCollection
        .find()
        .limit(6)
        .sort({ purchaseCount: -1 })
        .toArray();
      res.send(result);
    });

    // get all foods
    app.get("/allFoods", async (req, res) => {
      const result = await foodCollection.find().toArray();
      res.send(result);
    });

    // get a single food data by id from db
    app.get("/allFoods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });

    // get all foods data by a specific user
    app.get("/allFoods-ByEmail/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { "addBy.email": email };
      const result = await foodCollection.find(filter).toArray();
      console.log(result);
      res.send(result);
    });

    // update food data
    app.put("/updateFood/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedFood = req.body;
      const food = {
        $set: {
          food: updatedFood.food,
          image: updatedFood.image,
          category: updatedFood.category,
          quantity: updatedFood.quantity,
          price: updatedFood.price,
          origin: updatedFood.origin,
          description: updatedFood.description,
          ingredients: updatedFood.ingredients,
          making: updatedFood.making,
        },
      };
      const result = await foodCollection.updateOne(filter, food, options);
      res.send(result);
    });

    // save food data in db
    app.post("/addFood", async (req, res) => {
      const foodData = req.body;
      const result = await foodCollection.insertOne(foodData);
      res.send(result);
    });

    // get all foods
    app.get("/allFood", async (req, res) => {
      const search = req.query.search || "";
      const query = search.trim()
        ? { food: { $regex: search, $options: "i" } }
        : {};
      const result = await foodCollection.find(query).toArray();
      res.send(result);
    });

    // purchase by specific user
    app.get("/addPurchase", async (req, res) => {
      const email = req.query.email;
      const result = await purchaseCollection
        .find({ buyerEmail: email })
        .toArray();
      res.send(result);
    });

    // add purchase related api
    app.post("/addPurchase", async (req, res) => {
      const purchaseData = req.body;
      const foodId = purchaseData.foodId;
      const purchasedQuantity = purchaseData.quantity;
      const food = await foodCollection.findOne({ _id: foodId });

      if (food?.addBy?.email === purchaseData.buyerEmail) {
        return res.status(400).send({
          success: false,
          message: "You cannot purchase your own food item.",
        });
      }

      // update the food quantity and purchase count
      const updatedFood = await foodCollection.updateOne(
        { _id: new ObjectId(foodId) },
        {
          $inc: {
            quantity: -purchasedQuantity,
            purchaseCount: purchasedQuantity,
          },
        }
      );

      if (updatedFood.modifiedCount === 0) {
        return res.status(500).send({
          success: false,
          message: "Failed to update food item.",
        });
      }

      const purchaseResult = await purchaseCollection.insertOne(purchaseData);

      res.send({
        success: true,
        message: "Purchase completed successfully",
        purchaseResult,
        updatedFood,
      });
    });

    // delete food data my orders
    app.delete("/addPurchase/:id", async (req, res) => {
      const id = req.params.id;
      const result = await purchaseCollection.deleteOne({
        _id: new ObjectId(id),
      });
      if (result.deletedCount === 1) {
        res.send({ success: true, message: "Order deleted successfully." });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hello from restaurant management server.....");
});

app.listen(port, () => {
  console.log(`Server is running on PORT ${port}`);
});
