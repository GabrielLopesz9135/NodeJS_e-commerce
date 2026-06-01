const getDb = require('../util/database').getDb
const mongodb = require('mongodb')
class Product {
  constructor(title, price, description, imageUrl, id, userId){
    this.title = title;
    this.price = price;
    this.description = description;
    this.imageUrl = imageUrl;
    this._id = new mongodb.ObjectId(id);
    this.userId = userId;
  }

  save(){
    const db = getDb();
    return db.collection('products')
    .insertOne(this)
    .then(result => {
    })
    .catch(err => console.log(err))
  }

  update(){
    const db = getDb();
    return db.collection('products')
    .updateOne({_id: this._id}, {$set: this})
    .then(result => {
    })
    .catch(err => console.log(err))
  }

  static fetchAll(){
    const db = getDb();
    return db.collection('products')
    .find()
    .toArray()
    .then(products => {
      return products
    }).catch(err => console.log(err))
  }

  static findById(id){
    console.log('id', id)
    const db = getDb();
    return db.collection('products')
    .find({_id: new mongodb.ObjectId(id)})
    .next()
    .then(product => {
      return product
    }).catch(err => console.log(err))
  }

  static delete(id){
    const db = getDb();
    return db.collection('products')
    .deleteOne({_id: new mongodb.ObjectId(id)})
    .then(result => {
      return result;
    })
    .catch(err => console.log(err))
  }
  
}

module.exports = Product;