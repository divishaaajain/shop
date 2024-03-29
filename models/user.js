const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetToken: String,
    resetTokenExpiration: Date,
    cart: {
        items: [
            {
                productId: { type: Schema.Types.ObjectID, ref: 'Product', required: true },
                quantity: { type: Number, required: true }
            }
        ]
    }
});

userSchema.methods.addToCart = function (prodId) {
    let newQty = 1;
    let updatedCartItems = [...this.cart.items];
    const cartProductIndex = this.cart.items.findIndex((product) => {
        return product.productId.toString() === prodId.toString();
    });
    if (cartProductIndex >= 0) {
        newQty = updatedCartItems[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQty;
    } else {
        updatedCartItems.push({ productId: prodId, quantity: newQty });
    }
    const updatedCart = { items: updatedCartItems };
    this.cart = updatedCart;
    return this.save();
}

userSchema.methods.deleteFromCart = function(prodId){
    const updatedCartItems = this.cart.items.filter((item)=>{
        return item.productId.toString() !== prodId.toString()
    });
    this.cart.items = updatedCartItems;
    return this.save();
}

userSchema.methods.clearCart = function(){
    this.cart = {items:[]}
    return this.save();
}

module.exports = mongoose.model('User', userSchema);