const { MeshDevice, Protobuf  } = require("@meshtastic/core");
const { TransportNodeSerial } = require("@meshtastic/transport-node-serial");
const { log } = require("console");
const { EventEmitter } = require('events');
const { JSONFilePreset } = require("lowdb/node");
const path = require('path');

//Logger.setLogLevel(LogLevel.NONE)

// Base class for all nodes (connected to host device)

/*

TODO:
-ADD MESSAGE ACKNOWLEDGEMENT HANDLING
-ADD BROADCAST MESSAGING
-ADD TCP AND HTTP CONNECTION TYPES
-ADD A NODE DATABASE BUILDER
-MAKE EVERYTHING ASYNCHRONOUS
-

*/

class Logger {
    #name;

    constructor(name,enabled=false){
        this.#name = name;
        this.enabled = enabled;
    }

    log(message){
        if (!this.enabled){
            return;
        }
        console.log(`[MT] ${this.#name} | ${message}`)
    }
}

class NodeDB {

    #db = null;
    #dbData;
    #dbPath;

    async init(databasePath){
        this.#db = await JSONFilePreset(path.join(databasePath,'nodeDb.json'), { nodes: [] });
        this.#dbData = this.#db.data;
        await this.#db.write();
    }

    push(node){
        
    }

}

class Node {
    constructor(longName,shortName,id,number){
        this.longName = longName;
        this.shortName = shortName;
        this.id = id;
        this.number = number;
        this.lastHeard = Math.floor(Date.now() / 1000); // Set lastHeard time to current epoch time
        this.storedData = {};
    }

    // Returns all data on Node as a JSON object.
    info(){
        return {
            longName:this.longName,
            shortName:this.shortName,
            id:this.id,
            number:this.number,
            lastHeard:this.lastHeard,
            storedData:this.storedData
        }
    }

}

class Device {

    #device = null;
    #ownId = null;
    #longName;
    #shortName;

    db = null;

    //#pendingMessages = new Map();
    
    events = new EventEmitter();

    get ownId(){ return this.#ownId } // Getter for grabbing the devices own id number.

    // Constructor called by extended class
    constructor(){
        this.logger = new Logger("Mesh Device",false);
    }

    // Connect super script. Uses transport to init a MeshDevice
    async connect(transport){

        this.logger.log('Connecting Node...')

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

    async startNodeDB(databasePath){
        this.nodes = new NodeDB();
        await this.nodes.init(databasePath);

        this.logger.log('Started Database!')

        return true;
    }

    // Setup listeners for different Meshtastic events
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
            }
        });

        this.#device.events.onUserPacket.subscribe((packet) => {
            const dat = packet.data
            const data = {longName:dat.longName, shortName:dat.shortName, id:dat.id, number:packet.id}
            //console.log(`NODEINFO: ${JSON.stringify(packet,null,2)}`)
            const nodeInfo = new Node(data.longName,data.shortName,data.id,data.number);
            this.events.emit("nodeInfoReceived", {...nodeInfo});
        })

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
        return { packetId:id }
        //this.logger.log(`PACKER ID: ${id}`)
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