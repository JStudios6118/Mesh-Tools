const mt = require('./src/index.js')
const path = require('path');
const node = new mt.SerialNode('/dev/ttyACM0');

node.connect().then((result)=>{
    console.log(node.ownId);
})

node.startNodeDB(path.join(__dirname))

node.events.on('receiveDm',(data)=>{
    node.sendDirectMessage(`MIRROR: ${data.data}`,data.from)
})

node.events.on('nodeInfoReceived', async (nodeinfo) => {
    if (node.db.nodeExists(nodeinfo.id)){
        console.log("node exists")
    }
    await node.db.push(nodeinfo)
    console.log(`Logged User ${nodeinfo.longName}`)
})