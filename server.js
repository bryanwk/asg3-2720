const express = require("express");
const app = express();
var mongoose = require('mongoose');
const Schema = mongoose.Schema;

//const { MongoClient, ServerApiVersion } = require("mongodb");

/*const client = new MongoClient(
  uri,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  },
  () => console.log("Connected to MongoDB")
);*/
const uri = "mongodb+srv://stu097:p314851-@csci2720.m2qbq.mongodb.net/stu097";

mongoose.connect(uri);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error:'));

db.once('open', function () {
  console.log("Connection is open...");

  app.get('/event/:eventId/loc/:locId', (req, res) => {
        res.send(req.params);
    });
});

const EventSchema = new Schema({
    eventId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    loc: { type: Schema.Types.ObjectId, ref: 'Location' },
    quota: { type: Number }
});

const LocationSchema = mongoose.Schema({
  locId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  quota: { type: Number },
});

app.get('/event/:eventId/loc/:locId', (req, res) => {
        res.send(req.params);
    });

const server = app.listen(3000);