const mt = require('./src/index.js')
const node = new mt.SerialNode('/dev/ttyACM1');
node.logger.enabled = true;

node.connect()

node.events.on('receiveDm',(data)=>{
    node.sendDirectMessage(`MIRROR: ${data.data}`,data.from)
})