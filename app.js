//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');
const dotenv = require('dotenv').config()

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.mongoDbLink, {useNewUrlParser: true, useUnifiedTopology: true });
const itemSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    }
  });
const Item = mongoose.model('Item', itemSchema);
Item.find({}, function (err, items) {
  if (err) {
    console.log(err);
  }else {
    if (items.length === 0) {
      Item.create({ name: 'add new task' }, function (err, small) {
      if (err) return handleError(err);
      // saved!
      });
    }
  }
})

const listSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    listOfItems: [itemSchema]
  });
const List = mongoose.model('List', listSchema);
List.findOne({}, function (err, list) {
  if (err) {
    console.log(err);
  }else {
    if (list === null) {
      List.create({ name: 'default', listOfItems: [new Item({name: 'add tasks below'})] }, function (err, small) {
      if (err) return handleError(err);
        // saved!
      });
    }
  }
})


app.get("/", function(req, res) {

const day = date.getDate();

  Item.find({}, function (err, items) {
    if (err) {
      console.log(err);
    }else {
      if (items.length === 0) {
        Item.create({ name: 'add new task' }, function (err, small) {
        if (err) return handleError(err);
        // saved!
        });
        res.redirect('/');
      }
      else {
        res.render("list", {listTitle: day, newListItems: items, senderPage: ''});
      }
    }
  });

});

app.post("/", function(req, res){

  const item = req.body.newItem;

  if (req.body.list === '') {
    Item.create({ name: item }, function (err, small) {
    if (err) return handleError(err);
    // saved!
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: req.body.list}, { $push: { listOfItems: new Item({name: item}) } }, {useFindAndModify: false}, function(err){
      if (err) {
        console.log(err)
      }
    })
    res.redirect('/' + req.body.list);
  }
});

app.post('/delete', function(req, res) {
  checkedItem = req.body.checkboxDelete;
  listChecker = _.lowerCase(req.body.taskListChecker);
  if (listChecker === '') {
    Item.deleteOne({ _id: checkedItem }, function (err) {
    if (err) return handleError(err);
    // deleted at most one tank document
    });
    res.redirect('/');
  }else {
    List.findOne({ name: listChecker }, function (err, list) {
    if (err) return handleError(err);
     list.listOfItems.splice(list.listOfItems.findIndex(v => JSON.stringify(v._id) === JSON.stringify(checkedItem)), 1);
     list.save();
     });
     res.redirect('/' + listChecker);
    }
  });

app.get('/:listName', function(req, res){
  const day = date.getDate();
  const listName = _.lowerCase(req.params.listName);
  List.findOne({name: listName}, function (err, list) {
    if (err) {
      console.log(err);
    }else {
      if (list === null) {
        List.create({ name: listName, listOfItems: [new Item({name: 'add tasks below'})] }, function (err, small) {
        if (err) return handleError(err);
          // saved!
        });
        res.redirect('/' + listName);
      }
      else {
        res.render("list", {listTitle: day + ' ' + listName, newListItems: list.listOfItems, senderPage: listName});
      }
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started on port 3000");
});
