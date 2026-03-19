const mt = require('./src/index.js')
const node = new mt.SerialNode('/dev/ttyACM0');
node.logger.enabled = true;

node.connect().then((result)=>{
    console.log(node.ownId);
})

node.events.on('receiveDm',(data)=>{
    node.sendDirectMessage(`MIRROR: ${data.data}`,data.from)
})