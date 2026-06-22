
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require("fs");
const client = new Client({ intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent] });
let data = {};

if (fs.existsSync("./data.json")) {
    data = JSON.parse(fs.readFileSync("./data.json"));
}

function saveData() {
    fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
}

function getUser(id) {
    if (!data[id]) {
        data[id] = {
            coins: 1000,
            daily: 0
        };
    }
    return data[id];
}

client.once('ready', ()=> console.log('Casino Bot Online'));
client.on('messageCreate', msg => {
 if(msg.author.bot) return;
 if(!msg.content.startsWith('.')) return;
 const cmd = msg.content.slice(1).split(/\s+/)[0].toLowerCase();
 if(cmd==='help') msg.reply('Commands: .help .check .tx .dl .top');
});
client.login(process.env.TOKEN);
