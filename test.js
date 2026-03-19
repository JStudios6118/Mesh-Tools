const mt = require('./src/index.js')

const node = new mt.SerialNode('/dev/ttyACM0');
node.logger.enabled = true;
node.connect()

node.events.on('receiveDm',(data)=>{
    node.sendDirectMessage(data.data,data.from)
})