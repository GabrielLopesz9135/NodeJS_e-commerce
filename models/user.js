const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  cart: {
    items: [{
      productId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Product"
      },
      quantity: {
        type: Number,
        required: true
      }
    }]
  }
})

UserSchema.methods.getCart = async function() {
    const user = await this.populate('cart.items.productId')

    return user.cart.items.map(item => ({
      product: item.productId,
      quantity: item.quantity
    }))
}

UserSchema.methods.addToCart = function (product) {
  const cartProductIndex = this.cart.items.findIndex(cp => {
    return cp.productId.toString() === product._id.toString();
  })

  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1
    updatedCartItems[cartProductIndex].quantity = newQuantity
  } else {
    updatedCartItems.push({
      productId: product._id,
      quantity: 1
    })
  }

  const updatedCart = { items: updatedCartItems }
  this.cart = updatedCart;
  return this.save();
}

UserSchema.methods.deleteItemCart = function (prodId) {
  try {
      console.log(prodId);
      const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === prodId.toString()
      })

      console.log(cartProductIndex);

      let quantity = this.cart.items[cartProductIndex].quantity

      if (quantity > 1) {
        this.cart.items[cartProductIndex].quantity = quantity - 1;
      } else {
        this.cart.items = this.cart.items.filter(ci => ci.productId.toString() !== id.toString())
      }
      
      this.save();
    } catch (err) {
      console.log(err)
    }
}

UserSchema.methods.deleteAllCart = function () {
  this.cart = [];
  this.save();
}

module.exports = mongoose.model('User', UserSchema)


/* 




  async createOrder() {
    try{
      const db = getDb();
      const products = await this.getCart();
      const order =  {
        items: products,
        user: {
          _id: new mongodb.ObjectId(this._id),
          username: this.username,
          email: this.email
        }
      }
      const collection = await db.collection('orders')
      const result = await collection.insertOne(order)
      if(result){
        this.cart = { items: [] };
        const db = getDb();
        const collection = await db.collection('users')
        return collection.updateOne(
          { _id: new mongodb.ObjectId(this._id) },
          { $set: { cart: {items: []} } }
        )
      }
    }catch(err){
      console.log(err)
    }

  }

  async getOrders(){
    const db = getDb();
    return db
    .collection('orders')
    .find({ 'user._id': new mongodb.ObjectId(this._id)})
    .toArray();
  }

  static async findById(id) {
    const db = getDb();
    const collection = await db.collection('users')
    return await collection.findOne({ _id: new mongodb.ObjectId(id) })
      .then(result => {
        console.log(result);
        return result;
      })
      .catch(err => console.log(err))
  }
}

module.exports = User; */