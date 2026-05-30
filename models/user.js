const getDb = require('../util/database').getDb
const mongodb = require('mongodb')

class User {
  constructor(username, email, id, cart){
    this.username = username;
    this.email = email;
    this._id = id;
    this.cart = cart;
  }

  async save(){
    const db = getDb();
    const collection = await db.collection('users')
    collection.insertOne(this)
    .then(result => {
      console.log(result);
      return result;
    })
    .catch(err => console.log(err))
  }

  async addToCart(product){
    const cartProductIndex = this.cart.items.findIndex(cp => {
      return cp.productId.toString() === product._id.toString();
    })

    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if(cartProductIndex >= 0){
      newQuantity = this.cart.items[cartProductIndex].quantity + 1
      updatedCartItems[cartProductIndex].quantity = newQuantity
    }else{
      updatedCartItems.push({
        productId: new mongodb.ObjectId(product._id),
        quantity: 1
      })
    }

    const updatedCart = {items: updatedCartItems}
    const db = getDb();
    const collection = await db.collection('users')
    return collection.updateOne(
      {_id: new mongodb.ObjectId(this._id)},
      {$set: {cart: updatedCart}}
    )
  }

  async getCart(){
    const db = getDb();
    const productIds = this.cart.items.map(i => {
      return i.productId
    })

    const collection = await db.collection('products');
    const products = await collection.find({_id: {$in: productIds}}).toArray();

    return products.map(p => {
      return {
        ...p,
        quantity: this.cart.items.find(i => {
          return i.productId.toString() === p._id.toString();
        }).quantity
      }
    })
  }

  static async findById(id){
    const db = getDb();
    const collection = await db.collection('users')
    return await collection.findOne({_id: new mongodb.ObjectId(id)})
    .then(result => {
      console.log(result);
      return result;
    })
    .catch(err => console.log(err))
  }
}

module.exports = User;