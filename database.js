const { MongoClient } = require('mongodb');
//const measures = require('./test');
//import measures from "/test.js";

// Connection URL
//const url = 'mongodb+srv://adazejohnson:Hy3da6qkZi0X6POf@cluster0.teaetw3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const url = 'mongodb+srv://adazejohnson:Hy3da6qkZi0X6POf@cluster0.teaetw3.mongodb.net/';

// Database Name
const dbName = 'motor_performance';

// Create a new MongoClient
const client = new MongoClient(url);


export async function insert() {
    // Use connect method to connect to the Server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('measures');
    // the following code examples can be pasted here...
    const insertMeasures = await collection.insertMany(measures)
    console.log(`Inserted documents => ${insertMeasures.insertedCount}`);

    return collection;
}

insert()
    .then(console.log)
    .catch(console.error)
    .finally(() => client.close());
