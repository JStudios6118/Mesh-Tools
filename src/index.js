const { MeshDevice, Protobuf  } = require("@meshtastic/core");
const { TransportNodeSerial } = require("@meshtastic/transport-node-serial");
const { TransportHTTP } = require("@meshtastic/transport-http");
const { TransportNode } = require("@meshtastic/transport-node");


const { EventEmitter } = require('events');
const { JSONFilePreset } = require("lowdb/node");
const path = require('path');

//Logger.setLogLevel(LogLevel.NONE)

// Base class for all nodes (connected to host device)

/*

TODO:
-ADD MESSAGE ACKNOWLEDGEMENT HANDLING
-MAKE EVERYTHING ASYNCHRONOUS
-ADD LOG LEVELS
-ADD SUPPORT FOR MORE PACKET TYPES LIKE TELEMETRY AND ETC
-ADD PROPER JSDOC DOCUMENTATION FOR AUTOFILL AND SUCH
-ADD PROPER ERROR HANDLING FOR ALL FUNCTIONS

DONE:
-ADD BROADCAST MESSAGING
-ADD A NODE DATABASE BUILDER
-ADD TCP AND HTTP CONNECTION TYPES

*/

// Some settings. Will add more later.
settings = {
    print_logs: true
}

// A configure function to change global settings.
function Configure(property, value){
    if(settings[property]){
        throw new Error("That property is invalid!")
    }
    settings[property] = value;
}

// Simple Logger class to provide nice looking, customizable logs
class Logger {
    #name;

    // Sets the name that will show up before a message to help identify where the message is coming from.
    constructor(name){
        this.#name = name;
    }

    log(message){
        if (!settings.print_logs){
            return;
        }
        console.log(`[MT] ${this.#name} | ${message}`)
    }
}

class NodeDB {

    // In the following functions, please note that the identifier fields can take in either the nodes number or id.

    #logger = new Logger('[Node DB]')

    #db = null;
    #dbData;

    // Initialize the database file
    async init(databasePath){
        if (this.#db!=null){ this.#logger.log("Database Already Initialized. Skipping..."); return false }

        this.#db = await JSONFilePreset(path.join(databasePath,'nodeDb.json'), { nodes: [] });
        this.#dbData = this.#db.data;
        await this.#db.write();
        return true
    }

    // Internal method to check if an node of an id exists and return its index.
    #checkId(input){
        //this.#logger.log(`IN: ${input}`)
        if (typeof input === "number"){
            return this.#dbData.nodes.findIndex(p => p.number === input)
        } else if (typeof input === "string"){
            return this.#dbData.nodes.findIndex(p => p.id === input)
        } else {
            throw new Error('.nodeExists: Invalid type! Must be either a string or number.');
        }
    }

    // Internal command that returns a node from the database based on the id. Not compatible with node number.
    #getNodeIndexById(identifier){
        if (this.#db===null){ this.#logger.log("Database has not been initialized yet!"); return false }
        return this.#dbData.nodes.findIndex(p => p.id === identifier);
    }

    // Returns a bool on whether or not a node of the id exists.
    nodeExists(identifier){
        if (this.#db===null){ this.#logger.log("Database has not been initialized yet!"); return false }
        //console.log(typeof identifier)
        const index = this.#checkId(identifier)
        if (index===-1){
            return false;
        }
        return true;

    }

    // Gets a desired node using the identifier
    getNode(identifier){
        if (this.#db===null){ this.#logger.log("Database has not been initialized yet!"); return false }
        const index = this.#checkId(identifier)
        if (index===-1){
            return null;
        }

        //this.#logger.log(`Index of Node: ${index}`)

        const { longName, shortName, id, number, storedData } = this.#dbData.nodes[index]; 

        return new Node(longName,shortName,id,number,storedData);
    }

    // Add a node to the database. If the node is already present, update its lastheard value and validate other data. Does not affect stored data.
    async push(node){
        //console.log('pushing node:', node.id, 'number:', node.number)
        if (this.#db===null){ this.#logger.log("Database has not been initialized yet!"); return false }
        if (this.nodeExists(node.id)){
            let nodeData = this.getNode(node.id)
            this.#dbData.nodes[this.#getNodeIndexById(node.id)] = {
                ...nodeData.info,
                id:node.id,
                number:node.number,
                longName:node.longName,
                shortName:node.shortName,
                lastHeard: Math.floor(Date.now() / 1000)
            }
        } else {
            //console.log(node.info())
            this.#dbData.nodes.push(node.info)
        }

        //console.log("Succeeded!")

        await this.#db.write();

        return true;
    }

    // Gets the data on a desired node as defined by the identifier
    async getNodeStoredData(identifier){
        if (this.#db===null){ this.#logger.log("Database has not been initialized yet!"); return false }

        const index = this.#checkId(identifier)
        if (index===-1){
            return null;
        }

        //this.#logger.log(`All Node Data: ${JSON.stringify(this.getNode(identifier),null,2)}`)

        return this.getNode(identifier).storedData;


    }

    // Update the custom stored data in the node as defined by the identifier
    async updateStoredData(identifier, data) {
        if (this.#db === null) { this.#logger.log("Database has not been initialized yet!"); return false }

        const index = this.#checkId(identifier);
        if (index === -1) { this.#logger.log("Node not found!"); return false }

        this.#dbData.nodes[index].storedData = {
            ...this.#dbData.nodes[index].storedData,
            ...data
        };

        await this.#db.write();
        return true;
    }

    async updateLastHeard(identifier){
        if (this.#db === null) { this.#logger.log("Database has not been initialized yet!"); return false }
        
        const index = this.#checkId(identifier);
        if (index === -1) { this.#logger.log("Node not found!"); return false }

        this.#dbData.nodes[index].lastHeard = Math.floor(Date.now() / 1000);

        await this.#db.write;
        return true;
    }

}

// Node class for NodeDB
class Node {
    constructor(longName,shortName,id,number,storedData){
        this.longName = longName;
        this.shortName = shortName;
        this.id = id;
        this.number = number;
        this.lastHeard = Math.floor(Date.now() / 1000); // Set lastHeard time to current epoch time
        this.storedData = storedData || {};
    }

    // Returns all data on Node as a JSON object.
    get info(){
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

// The base device class for all Meshtastic node connections. Houses all main logic and code for handling packets events and more.
class Device {

    #device = null; // Mesh device. When set to null, many command will not run
    #ownId = null; // Id of connected node
    #longName;
    #shortName;

    // Creates an empty db class. Does nothing by itself, needs to be activated. I didn't leave it empty for autofill reaons and my sanity.
    db = new NodeDB();

    //#pendingMessages = new Map();
    
    // Creates a variable that developers can listen for events on.
    events = new EventEmitter();

    get ownId(){ return this.#ownId } // Getter for grabbing the devices own id number.

    // Constructor called by extended class
    constructor(){
        this.logger = new Logger("Mesh Device");
    }

    // Connect super script. Uses transport to init a MeshDevice.
    async connect(transport){

        //console.log(`TRANSPORT: ${transport}`)

        try {

            this.logger.log('Connecting Node...')

            if (transport.port?.flush) {
                this.logger.log('Flushing Transport')
                await transport.port.flush();
            }

            this.#device = new MeshDevice(transport);
            this.#device.log.settings.minLevel = 5;

        } catch (err) {

            throw new Error(`The program ran into a critical issue while connecting your node! Check to make sure your node is connected properly.\nDetails: ${err}`)

        }

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

        this.events.emit('connected', {ownId:this.#ownId});
        
        return {ownId:this.#ownId}
    }

    // Starts and configures the Node Database.
    async startNodeDB(databasePath){
        this.db = new NodeDB();
        await this.db.init(databasePath);

        this.logger.log('Started Database!')

        return true;
    }

    // Setup listeners for different Meshtastic events
    #setupListeners() {
        // Not sure if this does anything. Needs more testing
        this.#device.events.onNodeInfoPacket.subscribe((nodeInfo) => {
            if (nodeInfo.num === this.#ownId) {
                this.#longName = nodeInfo.user.longName;
                this.#shortName = nodeInfo.user.shortName;
                this.events.emit('ownNameReceived', { longName: this.#longName, shortName:this.#shortName });
            }
        });

        // Unused for now
        this.#device.events.onMeshPacket.subscribe((packet) => {
            if (packet.from === 2996808676){
            }
        });

        // Triggers when the node receives info about another node (name,location,etc)
        this.#device.events.onUserPacket.subscribe((packet) => {
            const dat = packet.data
            const data = {longName:dat.longName, shortName:dat.shortName, id:dat.id, number:packet.from}
            //console.log(`NODEINFO: ${JSON.stringify(packet,null,2)}`)
            const nodeInfo = new Node(data.longName,data.shortName,data.id,data.number);
            this.events.emit("nodeInfoReceived", nodeInfo);
        })

        // Triggers when a message is received. Handles packet type.
        this.#device.events.onMessagePacket.subscribe((packet) => {
            if (packet.to === this.#ownId && packet.type === 'direct'){
                this.events.emit('receiveDm',packet)
            } else if (packet.type === 'broadcast') {
                this.events.emit('receiveMessage',packet)
            }
        });


    }

    // Send a message in a channel
    async sendMessage(message,channel){
        const id = await this.#device.sendText(message,0xFFFFFFFF,true,channel);  
        return id
    }

    // Send a message in a channel as a reply.
    async sendReplyMessage(message,channel,replyId){
        const id = await this.#device.sendText(message,0xFFFFFFFF,true,channel,replyId);
        return id
    }

    // Send a direct message to another node.
    async sendDirectMessage(message,to){
        const id = await this.#device.sendText(message,to);
        return id
        //this.logger.log(`PACKER ID: ${id}`)
    }
    
    // Send a direct message to another node as a reply.
    async sendReplyDirectMessage(message,to,replyId){
        const id = await this.#device.sendText(message,to,true,null,replyId);
        return id
    }

}

// Constructor for Mesh Nodes connected to host over serial
class SerialNode extends Device {
    
    #serial_address;
    #transport;

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

        try {
            this.#transport = await TransportNodeSerial.create(this.#serial_address)
        } catch (err) {
            throw new Error("Could not create the serial transport. Is the correct port selected?")
        }

        return await super.connect(this.#transport);        
    }

}

// Constructor for Mesh Node connected to host over TCP
// Untested
class TCPNode extends Device {
    
    #tcp_ip_address;

    constructor(tcp_ip_address){
        super();
        this.#tcp_ip_address = tcp_ip_address;
    }

    async connect() {
        if (this.device != null) {
            this.logger.log("Device is already connected! Skipping...");
            return false;
        }

        this.logger.log("Creating Transport...")

        const transport = await TransportNode.create(this.#tcp_ip_address).catch((err) => {
            throw new Error("Creation of the TCP Transport Failed! Do you have the correct ip?")
        });

        return await super.connect(transport);
        
    }

}

// Constructor for Mesh Node connected to host over HTTP
// Untested
class HTTPNode extends Device {
    
    #http_ip_address;

    constructor(http_ip_address){
        super();
        this.#http_ip_address = http_ip_address;
    }

    async connect() {
        if (this.device != null) {
            this.logger.log("Device is already connected! Skipping...");
            return;
        }

        this.logger.log("Creating Transport...")

        const transport = await TransportHTTP.create(this.#http_ip_address).catch((err) => {
            throw new Error("Creation of the HTTP Transport Failed! Do you have the correct ip?")
        });
        return await super.connect(transport);
        
    }

}

module.exports = { SerialNode, TCPNode, HTTPNode, Configure }