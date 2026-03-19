const { MeshDevice, Protobuf  } = require("@meshtastic/core");
const { TransportNodeSerial } = require("@meshtastic/transport-node-serial");
const { log } = require("console");
const { EventEmitter } = require('events');
const { JSONFilePreset } = require("lowdb/node");

//Logger.setLogLevel(LogLevel.NONE)

// Base class for all nodes (connected to host device)

/*

TODO:
-ADD MESSAGE ACKNOWLEDGEMENT HANDLING
-ADD BROADCAST MESSAGING
-ADD TCP AND HTTP CONNECTION TYPES
-ADD A NODE DATABASE BUILDER
-MAKE EVERYTHING ASYNCHRONOUS


*/

class Logger {
    constructor(enabled=false){
        this.enabled = enabled;
    }

    log(message){
        if (!this.enabled){
            return;
        }
        console.log(`MESH-TOOLS | ${message}`)
    }
}

class NodeDB {

    #db;
    #dbPath;

    constructor(databasePath){
        this.#dbPath = databasePath;

        this.#db = JSONFilePreset('nodeDb.json', { users: [] });

    }
}

class Node {
    constructor(longName,shortName,id,number,lastHeard){
        this.longName = longName;
        this.shortName = shortName;
        this.id = id;
        this.number = number;
        this.lastHeard = Math.floor(Date.now() / 1000); // Set lastHeard time to current epoch time
    }
}

class Device {

    #device = null;
    #ownId = null;
    #longName;
    #shortName;

    #nodeDb = null;

    #pendingMessages = new Map();
    
    events = new EventEmitter();

    get ownId(){ return this.#ownId }

    constructor(){
        this.logger = new Logger(false);
    }

    // Connect super script. Uses transport to init a MeshDevice
    async connect(transport){

        if (transport.port?.flush) {
            this.logger.log('Flushing Transport')
            await transport.port.flush();
        }

        this.#device = new MeshDevice(transport);
        this.#device.log.settings.minLevel = 5;

        // wait for the configured event instead of awaiting configure()
        await new Promise((resolve, reject) => {
            this.#device.events.onDeviceStatus.subscribe((status) => {
                if (status === 7) resolve()   // 7 = DeviceConfigured
                if (status === 9) reject(new Error("Device disconnected during config"))
            })

            this.#device.configure().catch(reject)
        })

        this.logger.log('Device Successfully Configured!')

        //console.log(this.#device)

        // Save nodes id. Useful for handling dms
        this.#ownId = this.#device.myNodeInfo.myNodeNum;

        // Add an event listerner for ownNodeInfo to get the nodes own information
        this.#setupListeners();

        this.events.emit('connect', {ownId:this.#ownId});
        
        return {ownId:this.#ownId}
    }

    startNodeDB(databasePath){
        this.#nodeDb = new NodeDB(databasePath)
    }

    #setupListeners() {
        this.#device.events.onNodeInfoPacket.subscribe((nodeInfo) => {
            if (nodeInfo.num === this.#ownId) {
                this.#longName = nodeInfo.user.longName;
                this.#shortName = nodeInfo.user.shortName;
                this.events.emit('ownNameReceived', { longName: this.#longName, shortName:this.#shortName });
            }
        });

        this.#device.events.onMeshPacket.subscribe((packet) => {
            if (packet.from === 2996808676){
                this.logger.log(`RAW ROUTING PACKET: ${JSON.stringify(packet)}`);
            }
        });

        this.#device.events.onMessagePacket.subscribe((packet) => {
            if (packet.to === this.#ownId && packet.type === 'direct'){
                this.events.emit('receiveDm', {...packet})
            } else if (packet.type === 'broadcast') {
                this.events.emit('receiveMessage',{...packet})
            }
        });


    }

    sendMessage(){
        const id = this.#device.sendText(message,to);  
    }

    async sendDirectMessage(message,to){
        const id = await this.#device.sendText(message,to);
        this.logger.log(`PACKER ID: ${id}`)
    }

}

// Constructor for Mesh Nodes connected to host over serial
class SerialNode extends Device {
    
    #serial_address;

    constructor(serial_address){
        super();
        this.#serial_address = serial_address;
    }

    async connect() {
        if (this.device != null) {
            this.logger.log("Device is already connected! Skipping...");
            return;
        }

        this.logger.log("Creating Transport...")

        const transport = await TransportNodeSerial.create(this.#serial_address);
        return await super.connect(transport);
        
    }

}

module.exports = { SerialNode }