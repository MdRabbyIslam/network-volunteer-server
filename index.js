const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
let port = 5000;
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;

const app = express();

//middlewar
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

//dot env
require("dotenv").config();

//firebase admin
const admin = require("firebase-admin");
const serviceAccount = require("./volunteer-network-12fba-firebase-adminsdk-c4d2q-fe7ce4923b.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.FIREBASE_DB_NAME}.firebaseio.com`,
});

//mongo db
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d4pds.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const collection = client
    .db(`${process.env.DB_NAME}`)
    .collection("EventCollection");
  // perform actions on the collection object
  console.log("database connected");

  //start get api
  //getting all events
  app.get("/allevents", (req, res) => {
    collection.find({}).toArray((err, documents) => {
      const filterdEvent = documents.filter((event) => !event.email);
      res.send(filterdEvent);
    });
  });
  //getting volunteer list for single users
  app.get("/userVolunteerList", (req, res) => {
    const email = req.query.email;
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const token = bearer.split(" ")[1];
      admin
        .auth()
        .verifyIdToken(token)
        .then(function (decodedToken) {
          // let uid = decodedToken.uid;
          let tokenEmail = decodedToken.email;
          if (tokenEmail === email) {
            collection.find({ email: email }).toArray((err, documents) => {
              res.status(200).send(documents);
            });
          }
        })
        .catch(function (error) {
          // Handle
          console.log(error.message);
        });
    } else {
      // res.sendStatus(401).send("unauthorized access");
      res.status(401).send("unauthorized user");
    }
  });
  // getting all volunteer list
  app.get("/allVolunteerList", (req, res) => {
    collection.find({}).toArray((err, documents) => {
      const filtered = documents.filter((volunteer) => volunteer.email);
      res.send(filtered);
    });
  });
  //end get apis

  //start post
  //adding new event
  app.post("/addevents", (req, res) => {
    collection.insertOne(req.body).then((result) => {
      res.send(result.insertedCount > 0);
      console.log(result.insertedCount);
    });
  });
  //adding new volunteer
  app.post("/addVolunteer", (req, res) => {
    collection.insertOne(req.body).then((result) => {
      res.send(result);
    });
  });
  // end post
  //start delete
  app.delete("/delete/:id", (req, res) => {
    const id = req.params.id;
    collection
      .deleteOne({
        _id: ObjectId(id),
      })
      .then((result) => {
        res.send(result.deletedCount > 0);
      });
  });
  //end delete
}); //end mongo db

app.get("/", (req, res) => {
  res.send("this is rabby's server");
});

app.listen(process.env.PORT || port);
