const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
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

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const toolsCollection = client.db('ztools').collection('tools');
    const reviewsCollection = client.db('ztools').collection('reviews');
    const ordersCollection = client.db('ztools').collection('orders');
    const userInfoUpdateCollection = client
      .db('ztools')
      .collection('userInfoUpdate');
    // change
    //User data
    const userCollection = client.db('ztools').collection('users');

    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === 'admin') {
        next();
      } else {
        res.status(403).send({ message: 'forbidden' });
      }
    };

    //User data
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '2h' }
      );
      res.send({ result, token });
    });

    app.get('/user', verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin });
    });

    app.put('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: 'admin' },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' }
      );
      res.send({ result, token });
    });

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

    // get order data
    app.get('/order', async (req, res) => {
      const query = {};
      const cursor = ordersCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    app.get('/order', verifyJWT, async (req, res) => {
      const email = req.query.email;
      console.log(email);
      // const authorization = req.headers.authorization;
      // console.log(authorization);
      const decodedEmail = req.decoded.email;
      console.log(decodedEmail);
      if (email === decodedEmail) {
        const query = { email: email };
        console.log(query);
        // const cursor = ordersCollection.find(query);
        // const orders = await cursor.toArray();
        const orders = await ordersCollection.find(query).toArray();
        return res.send(orders);
        // console.log(orders);
      } else {
        return res.status(403).send({ message: 'forbidden access' });
      }
    });

    app.get('/order/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await ordersCollection.findOne(query);
      res.send(order);
    });

    //Delete a order data
    // app.delete('/order/:id', async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: ObjectId(id) };
    //   // console.log(id, query);
    //   const result = await ordersCollection.deleteOne(query);
    //   res.send(result);
    // });

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
      // console.log('query', query);
      const cursor = reviewsCollection.find(query);
      const reviews = await cursor.toArray();
      // console.log('reviews', reviews);
      res.send(reviews);
    });
    // post review data
    app.post('/reviews', async (req, res) => {
      const newReview = req.body;
      console.log('adding new review', newReview);
      const result = await reviewsCollection.insertOne(newReview);
      console.log('Add New review Result', result);
      res.send(result);
    });
    // users reviews sections end

    // user info update section start
    // change

    app.get('/userinfo', async (req, res) => {
      const query = {};
      console.log('user info query', query);
      const cursor = userInfoUpdateCollection.find(query);
      const userInfo = await cursor.toArray();
      console.log('user info reviews', userInfo);
      res.send(userInfo);
    });

    app.post('/userinfo', async (req, res) => {
      const userInfoUpdate = req.body;
      console.log('adding user Info Update', userInfoUpdate);
      const result = await userInfoUpdateCollection.insertOne(userInfoUpdate);
      console.log('user Info Update Result', result);
      res.send(result);
    });
    // user info update section end
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
