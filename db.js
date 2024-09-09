const mongoose = require('mongoose');
require('dotenv').config();
const uri = process.env.MONGO_URI;
const name = process.env.DB_NAME;

mongoose.connect(uri, {
    dbName: name
}).then(() => {
    console.log("Connected to database")
}).then((err) => {
    console.log("Error while connecting to db", err);
})
