const mt = require('./src/index.js')
const path = require('path');
const node = new mt.SerialNode('/dev/ttyACM0');

node.connect().then((result)=>{    
    node.startNodeDB(path.join(__dirname)).then(async (result) => {       
        console.log(await node.db.getNodeStoredData('!b29fabe4'));
        console.log(`Own NodeId: ${node.ownId}`);
    })
})



node.events.on('receiveDm',(data)=>{
    node.sendReplyDirectMessage(`MIRROR: ${data.data}`,data.from,data.id)
})

node.events.on('receiveMessage',(data)=>{
    //console.log(`Message: ${JSON.stringify(data)}`)
    if (data.data === "!test"){
        node.sendReplyMessage("Hello! Is this thing on?",data.channel,data.id);
    }
})

node.events.on('nodeInfoReceived', async (nodeinfo) => {
    //console.log(nodeinfo)
    if (node.db.nodeExists(nodeinfo.id)){
        console.log("node exists")
    }
    await node.db.push(nodeinfo)
    //console.log(`Logged User ${nodeinfo.longName}`)
})