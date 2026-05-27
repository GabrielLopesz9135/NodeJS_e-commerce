const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = callback => {
    MongoClient.connect('mongodb+srv://gabriellopes9135_db_user:zkH6XJHoYhCTLTb8@nodejs.vyto5wf.mongodb.net/?appName=nodeJS')
    .then(client => {
        //console.log(client)
        _db = client.db();
        callback(client)
    })
    .catch(err => {
        console.log(err)
        throw err;
    });
}

const getDb = () => {
    if(_db){
        return _db
    }
    throw "No database found!";
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;

