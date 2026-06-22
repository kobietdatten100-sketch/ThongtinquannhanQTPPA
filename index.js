const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const Database = require("better-sqlite3");

// ================= BOT =================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const db = new Database("casino.db");

// ================= DATABASE =================
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 1000,
    last_daily INTEGER DEFAULT 0
)
`).run();

// ================= CORE =================
function getUser(id) {
    let user = db.prepare("SELECT * FROM users WHERE user_id=?").get(id);

    if (!user) {
        db.prepare("INSERT INTO users (user_id, balance, last_daily) VALUES (?, 1000, 0)")
            .run(id);
        user = { user_id: id, balance: 1000, last_daily: 0 };
    }

    return user;
}

function setBalance(id, amount) {
    db.prepare("UPDATE users SET balance=? WHERE user_id=?").run(amount, id);
}

function addMoney(id, amount) {
    let u = getUser(id);
    let newBal = u.balance + amount;
    if (newBal < 0) newBal = 0;
    setBalance(id, newBal);
    return newBal;
}

// ================= UI =================
function ui(title, desc) {
    return new EmbedBuilder()
        .setTitle("🎰 CASINO ROYALE | " + title)
        .setDescription(desc)
        .setColor(0x00FFD5)
        .setFooter({ text: "💎 Coin Casino System" });
}

// ================= READY =================
client.on("ready", () => {
    console.log("🎰 Casino Bot Online!");
});

// ================= COMMANDS =================
client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;

    const args = msg.content.split(" ");
    const cmd = args[0];
    const id = msg.author.id;

    // ================= BALANCE =================
    if (cmd === ".bal") {
        let u = getUser(id);
        return msg.channel.send({
            embeds: [ui("BALANCE", `💰 Bạn có: **${u.balance} coin**`)]
        });
    }

    // ================= DAILY (3 HOURS) =================
    if (cmd === ".daily") {
        let u = getUser(id);
        let now = Date.now();

        if (now - u.last_daily < 3 * 60 * 60 * 1000) {
            let left = Math.ceil((3 * 60 * 60 * 1000 - (now - u.last_daily)) / 60000);
            return msg.reply(`⏳ Chờ ${left} phút nữa`);
        }

        let reward = 500;
        addMoney(id, reward);

        db.prepare("UPDATE users SET last_daily=? WHERE user_id=?")
            .run(now, id);

        return msg.channel.send({
            embeds: [ui("DAILY", `🎁 +${reward} coin`)]
        });
    }

    // ================= PAY =================
    if (cmd === ".pay") {
        let target = msg.mentions.users.first();
        let amount = parseInt(args[2]);

        if (!target || !amount || amount <= 0)
            return msg.reply("❌ .pay @user số tiền");

        let sender = getUser(id);

        if (sender.balance < amount)
            return msg.reply("❌ Không đủ coin");

        addMoney(id, -amount);
        addMoney(target.id, amount);

        return msg.channel.send({
            embeds: [ui("TRANSFER", `💸 <@${id}> → <@${target.id}> : +${amount}`)]
        });
    }

    // ================= TOP =================
    if (cmd === ".top") {
        let rows = db.prepare(`
            SELECT user_id, balance 
            FROM users 
            ORDER BY balance DESC 
            LIMIT 10
        `).all();

        let text = rows.map((r, i) =>
            `**${i + 1}.** <@${r.user_id}> — 💰 ${r.balance}`
        ).join("\n");

        return msg.channel.send({
            embeds: [ui("LEADERBOARD", text)]
        });
    }

    // ================= FLIP 50/50 =================
    if (cmd === ".flip") {
        let bet = parseInt(args[1]);
        let u = getUser(id);

        if (bet > u.balance) return msg.reply("❌ Không đủ coin");

        let win = Math.random() < 0.5;

        if (win) {
            addMoney(id, bet);
            msg.channel.send({ embeds: [ui("FLIP", `🪙 WIN x2 (+${bet})`)] });
        } else {
            addMoney(id, -bet);
            msg.channel.send({ embeds: [ui("FLIP", `💀 LOSE (-${bet})`)] });
        }
    }

    // ================= SLOT =================
    if (cmd === ".slot") {
        let bet = parseInt(args[1]);
        let u = getUser(id);

        if (bet > u.balance) return msg.reply("❌ Không đủ coin");

        let s = ["🍒", "🍋", "💎", "7️⃣"];

        let a = s[Math.floor(Math.random() * 4)];
        let b = s[Math.floor(Math.random() * 4)];
        let c = s[Math.floor(Math.random() * 4)];

        let win =
            (a === b && b === c) ? bet * 5 :
            (a === b || b === c) ? bet * 2 :
            -bet;

        addMoney(id, win);

        return msg.channel.send({
            embeds: [ui("SLOT", `${a} | ${b} | ${c}\n💰 ${win > 0 ? "+" : ""}${win}`)]
        });
    }

    // ================= DICE =================
    if (cmd === ".dice") {
        let bet = parseInt(args[1]);
        let u = getUser(id);

        if (bet > u.balance) return msg.reply("❌ Không đủ coin");

        let roll = Math.random() < 0.5;
        let win = roll ? bet : -bet;

        addMoney(id, win);

        return msg.channel.send({
            embeds: [ui("DICE", `🎲 ${roll ? "WIN x2" : "LOSE"}\n💰 ${win > 0 ? "+" : ""}${win}`)]
        });
    }

    // ================= TRIPLE 35/35/30 =================
    if (cmd === ".triple") {
        let bet = parseInt(args[1]);
        let u = getUser(id);

        if (bet > u.balance) return msg.reply("❌ Không đủ coin");

        let r = Math.random();

        if (r < 0.35) {
            addMoney(id, bet);
            return msg.channel.send({ embeds: [ui("TRIPLE", "🟥 RED → WIN x2")] });
        }
        else if (r < 0.70) {
            addMoney(id, bet);
            return msg.channel.send({ embeds: [ui("TRIPLE", "⬛ BLACK → WIN x2")] });
        }
        else {
            let win = bet * 3;
            addMoney(id, win);
            return msg.channel.send({ embeds: [ui("TRIPLE", `⭐ GREEN → x3 (+${win})`)] });
        }
    }
});

// ================= LOGIN ================
client.login(process.env.TOKEN);
