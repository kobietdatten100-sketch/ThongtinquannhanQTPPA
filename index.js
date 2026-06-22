const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ================= VIRTUAL MONEY SYSTEM =================
let balance = {};   // 💰 tiền ảo
let daily = {};     // 🎁 cooldown daily

const START_COINS = 1000;

// tạo ví nếu chưa có
function get(id) {
    if (!balance[id]) balance[id] = START_COINS;
    return balance[id];
}

// cộng trừ tiền
function add(id, amount) {
    if (!balance[id]) balance[id] = START_COINS;
    balance[id] += amount;
    if (balance[id] < 0) balance[id] = 0;
    return balance[id];
}

// ================= UI =================
function ui(title, desc) {
    return new EmbedBuilder()
        .setTitle("🎰 CASINO VIRTUAL | " + title)
        .setDescription(desc)
        .setColor(0x00FFD5)
        .setFooter({ text: "💎 Coin ảo system" });
}

// ================= BOT =================
client.on("ready", () => {
    console.log("🎰 Casino Bot Online (Virtual Money)");
});

// ================= COMMAND =================
client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;

    const args = msg.content.split(" ");
    const cmd = args[0];
    const id = msg.author.id;

    // ================= BAL =================
    if (cmd === ".bal") {
        return msg.channel.send({
            embeds: [ui("BALANCE", `💰 Bạn có: **${get(id)} coin**`)]
        });
    }

    // ================= DAILY =================
    if (cmd === ".daily") {
        let now = Date.now();

        if (daily[id] && now - daily[id] < 3 * 60 * 60 * 1000) {
            let left = Math.ceil((3 * 60 * 60 * 1000 - (now - daily[id])) / 60000);
            return msg.reply(`⏳ Chờ ${left} phút nữa`);
        }

        add(id, 500);
        daily[id] = now;

        return msg.channel.send({
            embeds: [ui("DAILY", "🎁 +500 coin ảo")]
        });
    }

    // ================= PAY =================
    if (cmd === ".pay") {
        let target = msg.mentions.users.first();
        let amount = parseInt(args[2]);

        if (!target || !amount || amount <= 0)
            return msg.reply("❌ .pay @user số tiền");

        if (get(id) < amount)
            return msg.reply("❌ Không đủ coin");

        add(id, -amount);
        add(target.id, amount);

        return msg.channel.send({
            embeds: [ui("TRANSFER", `💸 <@${id}> → <@${target.id}> +${amount}`)]
        });
    }

    // ================= TOP =================
    if (cmd === ".top") {
        let sorted = Object.entries(balance)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        let text = sorted.length
            ? sorted.map((x, i) => `**${i+1}.** <@${x[0]}> — 💰 ${x[1]}`).join("\n")
            : "Chưa có dữ liệu";

        return msg.channel.send({
            embeds: [ui("LEADERBOARD", text)]
        });
    }

    // ================= FLIP 50/50 =================
    if (cmd === ".flip") {
        let bet = parseInt(args[1]);
        if (get(id) < bet) return msg.reply("❌ Không đủ coin");

        let win = Math.random() < 0.5;

        add(id, win ? bet : -bet);

        return msg.channel.send({
            embeds: [ui("FLIP", win ? "🪙 WIN x2" : "💀 LOSE")]
        });
    }

    // ================= SLOT =================
    if (cmd === ".slot") {
        let bet = parseInt(args[1]);
        if (get(id) < bet) return msg.reply("❌ Không đủ coin");

        let s = ["🍒","🍋","💎","7️⃣"];
        let a = s[Math.floor(Math.random()*4)];
        let b = s[Math.floor(Math.random()*4)];
        let c = s[Math.floor(Math.random()*4)];

        let win =
            (a===b && b===c) ? bet*5 :
            (a===b || b===c) ? bet*2 :
            -bet;

        add(id, win);

        return msg.channel.send({
            embeds: [ui("SLOT", `${a} | ${b} | ${c}\n💰 ${win}`)]
        });
    }

    // ================= DICE =================
    if (cmd === ".dice") {
        let bet = parseInt(args[1]);
        if (get(id) < bet) return msg.reply("❌ Không đủ coin");

        let win = Math.random() < 0.5 ? bet : -bet;

        add(id, win);

        return msg.channel.send({
            embeds: [ui("DICE", win > 0 ? "WIN x2" : "LOSE")]
        });
    }

    // ================= TRIPLE =================
    if (cmd === ".triple") {
        let bet = parseInt(args[1]);
        if (get(id) < bet) return msg.reply("❌ Không đủ coin");

        let r = Math.random();

        if (r < 0.35) {
            add(id, bet);
            return msg.channel.send({ embeds: [ui("TRIPLE", "🟥 WIN x2")] });
        }
        else if (r < 0.70) {
            add(id, bet);
            return msg.channel.send({ embeds: [ui("TRIPLE", "⬛ WIN x2")] });
        }
        else {
            add(id, -bet);
            return msg.channel.send({ embeds: [ui("TRIPLE", "💀 LOSE")] });
        }
    }
});

// ================= LOGIN =================
client.login(process.env.TOKEN);