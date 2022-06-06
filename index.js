const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bhtwe.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

    try {
        await client.connect();
        // console.log('Database Connected Successfully!');
        const database = client.db('cosmo-cam');
        const usersCollection = database.collection('users');
        const productsCollection = database.collection('products');
        const ordersCollection = database.collection('orders');
        const reviewsCollection = database.collection('reviews');

        //POST USERS
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        //MAKE ADMIN
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

        //FINDING ADMIN
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });

        //POST PRODUCT  API 
        app.post("/addNewProduct", async (req, res) => {
            const newProduct = req.body;
            const result = await productsCollection.insertOne(newProduct);
            res.send(result);
            console.log(req.body);
            console.log(result);
        });

        //GET PRODUCT API 
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const result = await cursor.toArray();
            res.send(result);
        });

        // ORDERS DETAILS
        app.get('/singleProduct/:id', async (req, res) => {
            console.log(req.params.id);
            productsCollection
                .find({ _id: ObjectId(req.params.id) })
                .toArray((err, results) => {
                    res.send(results[0]);
                });
        });

        // CONFIRM ORDER
        app.post("/completePurchase", async (req, res) => {
            const result = await ordersCollection.insertOne(req.body);
            res.send(result);
            console.log(result);
        });

        //GET ORDER BY EMAIL
        app.get("/myOrders/:email", async (req, res) => {
            const result = await ordersCollection
                .find({ email: req.params.email })
                .toArray();
            res.send(result);
        });

        // CANCEL ORDERS FROM MY ORDERS
        app.delete("/cancelOrder/:id", async (req, res) => {
            const result = await ordersCollection.deleteOne({
                _id: ObjectId(req.params.id),
            });
            res.send(result);
        });

        //POST REVIEW API 
        app.post("/addReview", async (req, res) => {
            const newReview = req.body;
            const result = await reviewsCollection.insertOne(newReview);
            res.send(result);
            console.log(req.body);
            console.log(result);
        });

        //GET REVIEW API
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const result = await cursor.toArray();
            res.send(result);
        });

        //GET ALL USERS ORDERS
        app.get("/allOrders", async (req, res) => {
            const result = await ordersCollection.find({}).toArray();
            res.send(result);
        });

        // UPDATE STATUS IN MANAGE ALL ORDERS
        app.put("/updateStatus/:id", (req, res) => {
            const id = req.params.id;
            const updatedStatus = req.body.status;
            const filter = { _id: ObjectId(id) };
            // console.log(updatedStatus);
            ordersCollection
                .updateOne(filter, {
                    $set: { status: updatedStatus },
                })
                .then(result => {
                    res.send(result);
                });
        });

        // FINAL DELETE ORDERS FROM MANAGE ALL ORDERS
        app.delete("/deleteFinal/:id", async (req, res) => {
            const result = await ordersCollection.deleteOne({
                _id: ObjectId(req.params.id),
            });
            res.send(result);
        });


        // FINAL DELETE PRODUCTS FROM PRODUCTS COLLECTION
        app.delete("/deleteProduct/:id", async (req, res) => {
            const result = await productsCollection.deleteOne({
                _id: ObjectId(req.params.id),
            });
            res.send(result);
        });

    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);

// console.log(uri);

app.get('/', (req, res) => {
    res.send('Hello CosmoCam!')
})

app.listen(port, () => {
    console.log(`Listening at port ${port}`)
})