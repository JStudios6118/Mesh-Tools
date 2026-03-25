[Table of Contents](/docs/table-of-contents.md)

# Device Events

Mesh tools has a variety of events that can be listened for.

```js
// Example of one way you might listen for events. All event are emitted on the events variable.
node.events.on("eventName", (events) => {
    return; // Add whatever code you want
})
```

Here is a reference of all of the possible events you can listen for.

### `connected` (return: {ownId:number}) Emitted when the program is finished connecting to the device. Returns the nodes own id number.

### `disconnected` (return: nothing) Emitted when the connected device unexpectedly disconnects from the program.

### `ownNameReceived` (returns: {longName:string, shortName:string}) Emitted when your node learns its own name because there is no way to find it without this (that i know of at least)

### `nodeInfoReceived` (returns: Node) Emitted when info about another node has been received. Returns a Node object which contains all of the information about the heard node.

### `receiveMessage` (returns: packet) Emitted when the node hears a message in a channel it is a part of. Returns a blob of JSON that contains the raw payload from the message.

### `receiveDm` (returns: packet) Emitted when the node receives a direct message. Returns a blob of JSON that contains the raw payload from the message.


---

[Table of Contents](/docs/table-of-contents.md)