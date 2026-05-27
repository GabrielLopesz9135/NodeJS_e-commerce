const getDb = require('../util/database').getDb
const mongodb = require('mongodb')

class User {
  constructor(username, email){
    this.username = username;
    this.email = email
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