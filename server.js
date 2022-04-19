const express = require("express");
const app = express();
var mongoose = require('mongoose');
var cors = require("cors");
const path = require("path");
const Schema = mongoose.Schema;
const bodyParser = require("body-parser");
const { query } = require("express");

const uri = "mongodb+srv://stu097:p314851-@csci2720.m2qbq.mongodb.net/stu097";

const baseURL = "http://localhost:3000/";

app.use(cors());

//app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(uri);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error:'));

db.once('open', function () {
  console.log("Connection is open...");
});

const server = app.listen(3000);

const EventSchema = Schema({
  eventId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  loc: { type: Schema.Types.ObjectId, ref: "Location" },
  quota: { type: Number }
});

const LocationSchema = Schema({
  locId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  quota: { type: Number },
});

const Location = mongoose.model("Location", LocationSchema);
const Event = mongoose.model("Event", EventSchema);

// Q1. GET /event/eventID
app.get('/event/:eventId', (req, res) => {
    Event.findOne(
      {eventId: req.params['eventId']}).populate('loc').exec(
      (err, e) => {
      if (err)
        res.status(404).send(err);
      else if(typeof e == "undefined" || !e){
        console.log("Event not found");
        res.status(404).send("Event not found");
      }
      else
        var ret = {
          "eventId": e.eventId,
          "name": e.name,
          "loc":
          {
            "locId": e.loc.locId,
            "name": e.loc.name,
          },
          "quota": e.quota,
        }
        console.log("Generating event...");
        res.status(200).send(ret);
      }
    );
});

//Q2 POST /event
app.post("/event", (req, res) => {
  let maxEid = 0;
  Event.findOne({}).sort('-eventId').exec((err, e) => {
    if(err) res.status(400).send(err);
    else{
      if(e){
        maxEid = e.eventId;
      }
      Location.findOne({locId: req.body.loc}).exec((err,loc) => {
        if(err) res.status(400).send(err);
        else if(typeof loc == "undefined" || !loc){
          console.log("Location does not exist");
          res.status(404).send("Error 404: Location not found");
        }
        else{
          if(loc.quota < req.body.quota){
            console.log("Event quota overload");
            res.status(404).send("Error 404: Location is not suitable for the event quota"); 
          }
          else{
            Event.create(
              {
                eventId: maxEid + 1,
                name: req.body["name"],
                loc: loc._id,
                quota: req.body["quota"],
              },
              (err, newe) => {
                if (err) res.send(err);
                else{
                  let ret =
                  {
                    "eventId": newe.eventId,
                    "name": newe.name,
                    "loc":
                    {
                      "locId": loc.locId,
                      "name": loc.name,
                    },
                    "quota": newe.quota,
                  }
                  console.log("Creating event...");
                  res.header('Location', baseURL + "event/" + newe.eventId);
                  res.status(201).send(ret);
                }
              }
            )
          }
        }
      })
    }
  })
});

//Q3. Delete /event/eventID
app.delete("/event/:eventId", (req,res) => {
  Event.findOneAndDelete({eventId: req.params["eventId"]}).exec((err, e) => {
    if (err) res.status(400).send("Failed to delete event, error : " + err);
    else if(typeof e == "undefined" || !e){
      res.status(404).send("Error 404: Event not found");
    }
    else{
      console.log("Event deleted");
      res.status(204).send("Deletion succesful");
    }
  });
});

//Q4. GET /event
app.get("/event", (req, res) => {
  Event.find({}).populate('loc').exec((err, e) => {
      if (err) res.status(400).send(err);
      else if(typeof e == "undefined" || !e){
        console.log("Event not found");
        res.status(404).send("Error 404: Event not found");
      }
      else {
        var event_list = []
        var event_sing = {};
        for (var i = 0; i< e.length ; i++){
          event_sing = {
            "eventId": e[i].eventId,
            "name": e[i].name,
            "loc": {
              "locId": e[i].loc.locId,
              "name": e[i].loc.name,
            },
            "quota": e[i].quota
          }
          event_list.push(event_sing);
        }
        console.log("Generating all events...");
        res.status(200).send(event_list);
      }
    }
  );
});

//Q5 GET /loc/locationID
app.get("/loc/:locationId", (req, res) => {
  Location.findOne({locId: req.params["locationId"]}).exec((err, e) =>{
    if (err) res.status(400).send("Location not found, error :" + err);
    else if(typeof e == "undefined" || !e){
      console.log("Location not found");
      res.status(404).send("Error 404: Location not found");
    }
    else{
      var locData = {
        "locId": e.locId,
        "name": e.name,
        "quota": e.quota
      }
      console.log("Displaying a specific location");
      res.status(200).send(locData);
    }
  });
});

//Q6+7 GET /loc?quota=number
app.get("/loc", (req,res) => { 
  let qry = 0;
  if(req.query.quota){
    qry = req.query.quota;
  }
  Location.find({quota: { $gte: qry}}).exec((err, e) =>{
    if(err) res.status(404).send("Location not found, err: " + err);
    else if(typeof e == "undefined" || !e){
      console.log("Location not found");
      res.status(404).send("Error 404: Location not found");
    }
    else
      var locData = [];
      var singleLoc = {};
      for (var i = 0; i< e.length; i++){
        singleLoc = {
          "locId": e[i].locId,
          "name": e[i].name,
          "quota": e[i].quota
        }
        locData.push(singleLoc);
      }
      console.log("Generating locations...");
      res.status(200).send(locData);
  })
})

//Q8 PUT /event/eventID
app.put("/event/:eventId", (req, res) => {
  Location.findOne({locId: req.body.eloc}).exec((err,loc) => {
        if(err) res.status(400).send(err);
        else if(typeof loc == "undefined" || !loc){
          console.log("Location not found put");
          res.status(404).send("Error 404: Location not found");
        }
        else{
          let updateEnt = {name: req.body.ename, loc: loc._id, quota: req.body.equota}
          Event.findOneAndUpdate({
            eventId: req.params["eventId"]
          }, updateEnt).exec((err, upe) =>{
            if (err) res.status(400).send(err);
            else if (typeof upe == "undefined" || !upe) {
              res.status(404).send("Error 404: Event not found");
            } 
            else {
              console.log("Event successfully updated");
              res.status(200).send("Update event successful!");
            }
          })
        }
  })
})

app.get("/maxid", (req,res) => {
  let maxEid = 0;
  Event.findOne({}).sort('-eventId').exec((err, e) => {
    if(err) res.status(400).send(err);
    else{
      if(e){
        var data = 
        {
          maxEid : e.eventId
        }
        res.status(200).send(data);
      }
    }
  });
});

app.get("/new", (req, res) => {
  res.sendFile(path.join(__dirname, "/form.html"));
})

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/main.html"));
});

app.get("/update", (req, res) => {
  res.sendFile(path.join(__dirname, "/update.html"));
})
