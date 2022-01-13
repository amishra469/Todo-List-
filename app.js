//Required Packages
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");
const date = require(__dirname +"/date.js")

const app = express();
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// URL for Mongo DB Atlus
// %40 is used as @ in password
let mongo_url = "mongodb+srv://aditya469k:Aditya%40123@cluster0.eqs7a.mongodb.net/todoListDB?retryWrites=true&w=majority";
mongoose.connect(mongo_url , {useNewUrlParser: true});


// Creating a Schema to stor data of Main Page
const itemSchema = {name: String};

const Item = mongoose.model("Item", itemSchema);

// Adding basic items that will be available in each page
const item1 = new Item({name: "Welcome to your To-Do list"});
const item2 = new Item({name: "Hit the + button to add a new line"});
const item3 = new Item({name: "Hit the Checkbox to delete item"});

const defaultItems = [item1, item2, item3];

// Schema for other pages
// Name will store page name and items will store all the items
const listSchema = {
    name: String,
    items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

// Method to handle Get requst for main page
app.get("/", function (req, res) {  
    
    Item.find({}, function(err,foundItems){
        if(foundItems.length === 0){
            Item.insertMany(defaultItems, function(err){
                if(err)console.log(err);
                else console.log("Succesfully saved all fruits");
            });
            res.redirect("/");
        }
        else{
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    }); 
});

// Method to handle Post requst for main page
app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });
    
    if(listName === "Today"){
        item.save();
        res.redirect("/");
    }
    else{
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

// Handler to handle any delete request
app.post("/delete", function(req, res){
    const checkedItemId =req.body.checkbox;  // Id of item that is to delete
    const listName = req.body.listName; // Page name

    // If ListName is "Today" that means request is received from Main page
    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId, function(err){
            if(err){
                console.log(err);
            }
            else{
                console.log("Successfully deleted");
                res.redirect("/");
            }
        });
    }
    else{
        List.findOneAndUpdate({name: listName}, {$pull: {items:{_id: checkedItemId}}}, function(err, foundList){
            if(err){
                console.log(err);
            }else{
                res.redirect("/"+ listName);
            }
        });
    }

});

// Method to handle Get requst for some other page
app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
        if(err){
            console.log(err);
        }
        else{
            if(!foundList){
                // create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save(); 
                res.redirect("/"+customListName);
            }
            else{
                // show an existing list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});

            }
        }
    })

    
});

// Port for heroku
let port = process.env.PORT;
if(port == null || port == ""){
    port = 3000;
}

app.listen(port, function (req, res) {
    console.log("Server is running at port 3000");
})