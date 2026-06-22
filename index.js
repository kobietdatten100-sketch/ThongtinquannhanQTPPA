
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const prefix = ".";
const coins = new Map();

client.once('ready', () => console.log(`Logged in as ${client.user.tag}`));

client.on('messageCreate', async (msg) => {
  if (msg.author.bot || !msg.content.startsWith(prefix)) return;

  const args = msg.content.slice(prefix.length).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();

  if (!coins.has(msg.author.id)) coins.set(msg.author.id, 1000000);

  if (cmd === "help") {
    const embed = new EmbedBuilder()
      .setColor("#00BFFF")
      .setTitle("📖 HƯỚNG DẪN SỬ DỤNG BOT MINI GAME")
      .setDescription("🎲 .tx tai|xiu <tiền>\n🪙 .check\n🎁 .dl");
    return msg.reply({ embeds:[embed] });
  }

  if (cmd === "check") {
    return msg.reply(`💰 PSCOIN: ${coins.get(msg.author.id).toLocaleString()}`);
  }

  if (cmd === "dl") {
    coins.set(msg.author.id, coins.get(msg.author.id) + 500000);
    return msg.reply("🎁 Nhận 500,000 PSCOIN thành công!");
  }

  if (cmd === "tx") {
    const choice = args[0];
    const bet = Number(args[1] || 0);
    if (!["tai","xiu"].includes(choice)) return msg.reply("Dùng: .tx tai 1000");
    if (bet <= 0) return;

    let balance = coins.get(msg.author.id);
    if (balance < bet) return msg.reply("Không đủ tiền.");

    const d1 = Math.floor(Math.random()*6)+1;
    const d2 = Math.floor(Math.random()*6)+1;
    const d3 = Math.floor(Math.random()*6)+1;
    const total = d1+d2+d3;
    const result = total >= 11 ? "tai" : "xiu";

    const win = result === choice;

    balance += win ? bet : -bet;
    coins.set(msg.author.id, balance);

    const embed = new EmbedBuilder()
      .setColor(win ? "Green" : "Red")
      .setTitle("🎲 KẾT QUẢ TÀI XỈU")
      .setDescription(
        `Xúc xắc: ${d1}-${d2}-${d3}\nTổng: ${total} (${result.toUpperCase()})\n\n` +
        (win ? `🎉 THẮNG +${bet}` : `😢 THUA -${bet}`)
      );

    msg.reply({ embeds:[embed] });
  }
});

client.login("YOUR_BOT_TOKEN");
