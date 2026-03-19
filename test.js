const mt = require('./src/index.js')

async function main() {
    const node = new mt.SerialNode('/dev/ttyACM0');
    node.logger.enabled = true;
    await node.connect();
    console.log(node.ownId);
}

main().catch(console.error);