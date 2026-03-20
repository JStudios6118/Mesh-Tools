# Getting Started with the Built-In NodeDB

My package features a simple, built-in, database. It uses the popular package lowdb to manage the database. By default, the database feature is turned off and must be activated by running a method.

Here is how to use the database.

## What does the Database Store?

The database stores a variety of useful date. Here is a reference to the data stored for each node.

```json

{
    "longName": "ThisIsALongName", // The long name for the node
    "shortName": "TISN", // THe shortname for the node (4 bytes max)
    "id": "!ABCD1234", // The unique hexadecimal id of the node. This should be the main identifier used in queries.
    "number": 123456789, // The nodes numerical number. Also can be used in queries
    "lastHeard": 1773981196, // Epoch time in seconds. When the node was last heard. Meant to be used to tell if the node has gone stale.
    "storedData": {} // Custom stored data. This can be accessed by the developer to special data about the node
},

```

When selecting a node from the database, currently only the id and number are supported.

I will add more ways to query nodes in the future.

## Starting the Database

If you don't already have a node connected, connect your node to the program. Use my guide on getting started if you haven't done this yet. [Getting Started](/docs/getting-started.md)

Lets start by initializing the database. This is done with the following method.

```js
// Starts the NodeDB. FilePath is the location where the database file will be kept.
node.startNodeDB(filePath);
```

The method is asynchronous and will return true if the database starts correctly.

## Adding Nodes to the Database

Working with the database is very simple. There are a variety of methods that can be used with the database.

All methods will be called on `node.db`. Here is an example of a block of code that will add discovered nodes to the NodeDB.

```js
// Listen for when your node receives information about another node
node.events.on('nodeInfoReceived', async (nodeInfo) => {
    await node.db.push(nodeInfo); // Add the node to the node db
})
```

The `push` method will check if the node is already in the database. If it is already in the database, the database entry will be updated with the most current information. StoredData will be overwritten when this happens.

## Grabbing Data from the Database

There are a few different methods for grabbing data from the database.

### Check if a node exists

Use the method `.nodeExists(identifer)` to check if a node is in the database. Returns a `bool`.

### Grab a node

Use the method `.getNode(identifier)` to grab a nodes data. Returns either `null`  or a `Node` object.

### Get the stored data of a node

Use the method `.getNodeStoredData(identifier)` to quickly grab a nodes stored data. Returns either `null` or a `JSON` object with the data.

### Storing data on the node

Use the method `.updateStoredData(identifier, data)` to store data on the node. Returns a `bool` on whether or not the operation succeeded. The data field should be JSON data. Any new field will be added to the existing data and existing field can be modified by overwriting them.

## Thanks for Reading

As you can tell, it is very easy to work with the database. I will be adding more methods over time to allow greater control over the data in the database.

If you like this package, please give me a star on github!

JStudios6118

[Table of Contents](/docs/table-of-contents.md)