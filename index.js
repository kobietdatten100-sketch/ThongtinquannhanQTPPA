const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const Database = require("better-sqlite3");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
const fs = require("fs");

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
            balance: 1000,
            last_daily: 0
        };
        saveData();
    }

    return data[id];
}

function addMoney(id, amount) {
    const user = getUser(id);

    user.balance += amount;

    if (user.balance < 0)
        user.balance = 0;

    saveData();

    return user.balance;
}

// ================= ADMIN CHECK =================
function isAdmin(member) {
    return member.permissions.has("Administrator");
}

// ================= UI =================
function ui(title, desc) {
    return new EmbedBuilder()
        .setTitle("🎰 CASINO ROYALE | " + title)
        .setDescription(desc)
        .setColor(0x00FFD5)
        .setFooter({ text: "💎 Coin System" });
}

// ================= READY =================
client.on("ready", () => {
    console.log("🎰 Casino Bot Ready!");
});

// ================= COMMANDS =================
client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;

    const args = msg.content.split(" ");
    const cmd = args[0];
    const id = msg.author.id;

    // ================= BAL =================
    if (cmd === ".bal") {
        let u = getUser(id);
        return msg.channel.send({
            embeds: [ui("BALANCE", `💰 ${u.balance} coin`)]
        });
    }

    // ================= DAILY =================
    if (cmd === ".daily") {
        let u = getUser(id);
        let now = Date.now();

        if (now - u.last_daily < 3 * 60 * 60 * 1000) {
            let left = Math.ceil((3 * 60 * 60 * 1000 - (now - u.last_daily)) / 60000);
            return msg.reply(`⏳ Chờ ${left} phút`);
        }

        addMoney(id, 500);

       

        return msg.channel.send({
            embeds: [ui("DAILY", "🎁 +500 coin")]
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
            embeds: [ui("TRANSFER", `💸 <@${id}> → <@${target.id}> +${amount}`)]
        });
    }

    // ================= LEADERBOARD =================
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

    // ================= MINT (ADMIN ONLY) =================
    if (cmd === ".mint") {
        if (!isAdmin(msg.member))
            return msg.reply("❌ Chỉ admin được dùng lệnh này");

        let target = msg.mentions.users.first();
        let amount = parseInt(args[2]);

        if (!target || !amount)
            return msg.reply("❌ .mint @user số tiền");

        addMoney(target.id, amount);

        return msg.channel.send({
            embeds: [ui("MINT SYSTEM", `🏦 Admin cấp +${amount} coin cho <@${target.id}>`)]
        });
    }

    // ================= FLIP 50/50 =================
    if (cmd === ".flip") {
        let bet = parseInt(args[1]);
        let u = getUser(id);

        if (bet > u.balance) return msg.reply("❌ Không đủ coin");

        let win = Math.random() < 0.5;

        if (win) {
            addMoney(id, bet); // x2
            msg.channel.send({ embeds: [ui("FLIP", `🪙 WIN x2 (+${bet})`)] });
        } else {
            addMoney(id, -bet); // ❗ mất toàn bộ cược
            msg.channel.send({ embeds: [ui("FLIP", `💀 LOSE (-${bet})`)] });
        }
    }

    // ================= SLOT =================
    if (cmd === ".slot") {
        let bet = parseInt(args[1]);
        let u = getUser(id);
if (bet > u.balance) return msg.reply("❌ Không đủ coin");

        let s = ["🍒","🍋","💎","7️⃣"];
        let a = s[Math.floor(Math.random()*4)];
        let b = s[Math.floor(Math.random()*4)];
        let c = s[Math.floor(Math.random()*4)];

        let win =
            (a === b && b === c) ? bet * 5 :
            (a === b || b === c) ? bet * 2 :
            -bet; // ❗ thua mất hết

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

        let win = Math.random() < 0.5 ? bet : -bet; // thua mất hết

        addMoney(id, win);

        return msg.channel.send({
            embeds: [ui("DICE", `🎲 ${win > 0 ? "WIN x2" : "LOSE"}\n💰 ${win}`)]
        });
    }

    // ================= TRIPLE =================
    if (cmd === ".triple") {
        let bet = parseInt(args[1]);
        let u = getUser(id);

        if (bet > u.balance) return msg.reply("❌ Không đủ coin");

        let r = Math.random();

        if (r < 0.35) {
            addMoney(id, bet);
            return msg.channel.send({ embeds: [ui("TRIPLE", "🟥 WIN x2")] });
        }
        else if (r < 0.70) {
            addMoney(id, bet);
            return msg.channel.send({ embeds: [ui("TRIPLE", "⬛ WIN x2")] });
        }
        else {
            addMoney(id, -bet); // ❗ mất toàn bộ
            return msg.channel.send({ embeds: [ui("TRIPLE", `⭐ LOSE (-${bet})`)] });
        }
    }
});
if (cmd === ".help") {
    return msg.channel.send({
        embeds: [
            ui(
                "MENU",
                `
💰 KINH TẾ
.bal
.daily
.pay @user tiền

🎲 MINI GAME
.flip tiền
.slot tiền
.dice tiền
.triple tiền

🏆 KHÁC
.top
.help
`
            )
        ]
    });
}
// ================= LOGIN =================
client.login(process.env.TOKEN);