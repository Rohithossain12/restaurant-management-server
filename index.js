const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(express.json());
app.use(cors());

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
    app.put("/product/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedProduct = req.body;
      const product = {
        $set: {
          food: updatedProduct.food,
          image: updatedProduct.image,
          category: updatedProduct.category,
          quantity: updatedProduct.quantity,
          price: updatedProduct.price,
          origin: updatedProduct.origin,
          description: updatedProduct.description,
          ingredients: updatedProduct.ingredients,
          making: updatedProduct.making,
        },
      };
      const result = await foodCollection.updateOne(filter, product, options);
      res.send(result);
    });

    // save food data in db
    app.post("/addFood", async (req, res) => {
      const foodData = req.body;
      const result = await foodCollection.insertOne(foodData);
      res.send(result);
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
