const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();

// came with mongodb API
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;

// middleware
const corsConfig = {
  origin: true,
  credentials: true,
};
app.use(cors(corsConfig));
app.options('*', cors(corsConfig));
//app.use(cors())
app.use(express.json());

// mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v2kvc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    await client.connect();
    const toolsCollection = client.db('ztools').collection('tools');
    // change
    const reviewsCollection = client.db('ztools').collection('reviews');
    const ordersCollection = client.db('ztools').collection('orders');

    // tools section start
    // all tools
    app.get('/tools', async (req, res) => {
      const query = {};
      const cursor = toolsCollection.find(query);
      const tools = await cursor.toArray();
      res.send(tools);
    });

    // tools by tool id
    app.get('/tools/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const tool = await toolsCollection.findOne(query);
      res.send(tool);
    });
    // tools sections ends

    // orders sections start
    // get order data
    // change
    app.get('/order', async (req, res) => {
      const query = {};
      const cursor = ordersCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    // post order data
    app.post('/order', async (req, res) => {
      const newOrder = req.body;
      console.log('adding new Tools', newOrder);
      const result = await ordersCollection.insertOne(newOrder);
      console.log('Add New order Result', result);
      res.send(result);
    });
    // orders sections end

    // users reviews sections start
    // all reviews
    app.get('/reviews', async (req, res) => {
      const query = {};
      console.log('query', query);
      const cursor = reviewsCollection.find(query);
      const reviews = await cursor.toArray();
      console.log('reviews', reviews);
      res.send(reviews);
    });
    // users reviews sections end
  } finally {
    // if need to close the server
    // await client.close();
  }
}
run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`App listening on http://localhost:${port}`);
});
