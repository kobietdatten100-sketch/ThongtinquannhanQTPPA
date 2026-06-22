
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent] });

client.once('ready', ()=> console.log('Casino Bot Online'));
client.on('messageCreate', msg => {
 if(msg.author.bot) return;
 if(!msg.content.startsWith('.')) return;
 const cmd = msg.content.slice(1).split(/\s+/)[0].toLowerCase();
 if(cmd==='help') msg.reply('Commands: .help .check .tx .dl .top');
});
client.login('MTUxMTkyMTg2MzA1ODc4NDQxNw.G5PSSn.NtYFPLLXOHmKPw7VnX8Zc-Jk0cSzahxfyDF9WI');
