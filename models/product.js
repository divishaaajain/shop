/* DEFINING SCHEMAS - MODELS

STEP:1 const mongoose = require('mongoose');

STEP:2 Use the schems constructor property of mongoose. This constructor allows to create a new schema

const Schema = mongoose.Schema;                              or...  const productSchema = new mongoose.Schema({
                                                                            .... schema definition
const productSchema = new Schema({                                  });
    .... schema definition
});


STEP:3 Creating a model based on the schema to work with the MongoDB database.

module.exports = mongoose.model('Product', productSchema);
                                    |            |
                                model name    Schema name


NOTE:- 1. Model name will be converetd in the databse like this - 'products'.

2. We can skip defining a specific schema, but since we know about our collections we can define specific properties based on the model

3. IN MONGOOSE A 'MODEL' IS A "CLASS".
*/


const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new mongoose.Schema({
    title: {                                      // or... title: String
        type: String,
        required: true                            // required - that every document in this collection must have 'title'
    },
    price: {
        type: Number,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',                              // ref - which model is related to the data in this field                  
        required: true
    }
});

module.exports = mongoose.model('Product', productSchema);