
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

    const args = msg.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    if(cmd === "coins") {
        const user = getUser(msg.author.id);
        return msg.reply(`💰 Bạn có ${user.coins} Coins`);
    }

    
    if(cmd === "profile") {
if(cmd === "daily") {
        if(cmd === "profile") {

    const user = getUser(msg.author.id);

    return msg.reply(
        `👤 ${msg.author.username}\n💰 Coins: ${user.coins}`
    );
}
        if(cmd === "pay") {

    const target = msg.mentions.users.first();
    const amount = parseInt(args[1]);

    if(!target)
        return msg.reply("Dùng: .pay @user 100");

    const sender = getUser(msg.author.id);
    const receiver = getUser(target.id);

    if(sender.coins < amount)
        return msg.reply("Không đủ tiền.");

    sender.coins -= amount;
    receiver.coins += amount;

    saveData();

    return msg.reply(
        `💸 Đã chuyển ${amount} Coins cho ${target}`
    );
}

});

 if(msg.author.bot) return;
 if(!msg.content.startsWith('.')) return;
 const args = msg.content.slice(1).trim().split(/ +/);
const cmd = args.shift().toLowerCase();
 if(cmd==='help') msg.reply('Commands: .help .check .tx .dl .top');
});
client.login(process.env.TOKEN);
