const mt = require('./src/index.js')
const path = require('path');
const node = new mt.SerialNode('/dev/ttyACM0');
node.logger.enabled = true;

node.connect().then((result)=>{
    console.log(node.ownId);
})

node.startNodeDB(path.join(__dirname))

node.events.on('receiveDm',(data)=>{
    node.sendDirectMessage(`MIRROR: ${data.data}`,data.from)
})

node.events.on('nodeInfoReceived', (node) => {
    console.log(node)
})