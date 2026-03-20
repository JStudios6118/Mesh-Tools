# Mesh-Tools

This is a packer made for the Meshtastic Project. I am not affiliated with Meshtastic or sponsored. This project is just for fun. [Meshtastic](https://meshtastic.org)

## Documentation

[Documentation](https://github.com/JStudios6118/Mesh-Tools/blob/main/docs/table-of-contents.md)

## What this package does #
This package is meant to abstract the functions of the meshtastic node.js cli package. It is meant to make the developement of programs that interact with the mesh network easier and more efficient.

This is a side project so don't expect this to always be up to date but I'll try my best.

It can easily handle connecting to nodes, detect when someone has dmed you, sending dms, sending on channels, receiving on channels and more. All of the stuff you would ever want. It can even manage an optional Database of Nodes and store custom data for each node.

## How it works

I tried my best to abstract many of the Meshtastic CLI's functions.

Here is all of the code needed to connect to your node. It is much shorter than what would be needed if you were not using my package.
```js
// Import the package. Install with npm i mesh-tools
const MeshTools = require('mesh-tools');
// Define the port your node is on over serial
const node = new MeshTools.SerialNode('/dev/ttyACM1');
// Connect the node to your computer
node.connect()
```

If you wanted to listen for a direct messages to your node, it is as easy as this chunk of code.

```js
// Connect to the receiveDm event
node.events.on('receiveDm',(data) => {
    // Send a DM back to the sender
    node.sendDirectMessage(`Hello!`,data.from)
})
```

It's that easy! I'll have more examples later.

## Why I made this

I made this because I was annoyed at how difficult it was to work with the nodejs cli for Meshtastic. There was little documentation and I frequently ran into issues. To solve these issues, I made this package that bundles all the most common features of the cli into one easy to use package.

Thanks for checking this out! Please give it a star :)

-JStudios6118