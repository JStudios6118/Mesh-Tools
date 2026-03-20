# Getting Started

This is the quick start quide to get started with mesh-tools.

It is very easy to get started. All you need is a Meshtastic node and a computer to run your program on. You also need this package of course.

## Connecting to your Node

Connecting to a node is very straightforward. There are 3 ways you can connect the program to your device;

- Serial/USB `SerialNode`
- TCP `TCPNode`
- HTTP `HTTPNode`

Here is all of the code required to connect a node over Serial:

```js
const MeshTools = require("mesh-tools"); // Import MeshtTools

const node = MeshTools.SerialNode("/dev/ttyACM0"); // Connect to the nodes port

node.connect() // Establish a connection with your node
```

That's all there is too it! Only 3 lines to connect your node to the program. The next part of this guide will show you how to use events and send messages.

## Receiving Events

There are a handful of events you can listen for in MeshTools. Here is a list of the currently available events.

| event name | description |
|------------|-------------|
|`connected`| gets emitted once the node has successfully connected to the program |
|`nodeInfoReceived`| gets emitted when the connected node receives info about another node |
|`ownNameReceived`| gets emitted when the device receives its own information|
|`receiveDm`| gets emitted when the node receives a dm from another node |
|`receiveMessage`| gets emitted whenever the nore receives a message on a channel (not a dm)|

These events can be accessed like so...

```js
// All events have a value in the form of a json object returned
node.events.on('receiveMessage',(packet) => {
    console.log("WOW! A packet!");
})
```

## Sending a Message

Sending a message is very easy as well. There are currently 4 different ways to send a message.

```js
sendMessage(message,channel) // Sends to a designated channel
sendReplyMessage(message,channel,replyId) // Sends the message in a channel as a reply to another message. Reply id is the id of the packet you are responding to.

sendDirectMessage(message,to) // Send a direct message to a node. To defines the id (number) of the node you are dming
sendReplyDirectMessage(message,to,replyId) // Send a direct message to a node as a reply to a message. ReplyId must be the id of the packet you are responsing to.
```

These are called as follows...

```js
node.sendMessage("hello world!",0); // send the message hello world in channel 0.
```

All methods to send messages are asynchronous and will return the packet id of the message they sent.

## Thanks for Reading

This is my basic getting started guide. There is more that you can do with my package which you can find in my other documentation once I have time to write it.

If you would like to learn how to use the built-in database, use this guide: [Using NodeDB](/docs/node-db.md)

Please give this repo a star if you find it cool and helpful!

Thanks!
-JStudios6118

[Table of Contents](/docs/table-of-contents.md)