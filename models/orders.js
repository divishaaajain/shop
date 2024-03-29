const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new mongoose.Schema({
    products:[
        {
            product: {type: Object, required: true},                    // product = {product full info}
            quantity: {type: Number, required: true}
        }
    ],
    user: {
        userId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
        email: {type: String, ref: 'User', required:true}
    }  
});

module.exports = mongoose.model('Order', orderSchema);