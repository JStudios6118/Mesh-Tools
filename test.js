const mt = require('./src/index.js')

const node = new mt.SerialNode('/dev/ttyACM0');
node.logger.enabled = true;
node.connect().then((data)=>{
    console.log(data)
})

node.events.on('receiveDm',(data)=>{
    console.log(data)
    node.sendDirectMessage("Hello!",data.from).then((res)=>{
        console.log(res)
    })
})