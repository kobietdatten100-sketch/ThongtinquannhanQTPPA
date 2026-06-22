const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ================= MONEY SYSTEM =================
let money = {};
let cooldown = {};

const START_COINS = 1000;
const COOLDOWN_TIME = 2000;

// tạo ví
function get(id) {
    if (!money[id]) money[id] = START_COINS;
    return money[id];
}

// cộng/trừ tiền
function add(id, amt) {
    if (!money[id]) money[id] = START_COINS;
    money[id] += amt;
    if (money[id] < 0) money[id] = 0;
    return money[id];
}

// cooldown
function canUse(id, cmd) {
    let key = id + cmd;
    let now = Date.now();

    if (cooldown[key] && now - cooldown[key] < COOLDOWN_TIME) {
        return false;
    }

    cooldown[key] = now;
    return true;
}

// ================= UI =================
function ui(title, desc) {
    return new EmbedBuilder()
        .setTitle("🎰 CASINO SYSTEM | " + title)
        .setDescription(desc)
        .setColor(0x00FFD5)
        .setFooter({ text: "💎 Virtual Coin System" });
}

function wait(ms) {
    return new Promise(res => setTimeout(res, ms));
}

// ================= BOT =================
client.on("ready", () => {
    console.log("🎰 Casino Bot Online");
});

client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;

    const args = msg.content.split(" ");
    const cmd = args[0];
    const id = msg.author.id;

    // ================= HELP =================
    if (cmd === ".help") {
        return msg.channel.send({
            embeds: [
                ui("HELP MENU",
`💰 ECONOMY
.bal → xem tiền
.daily → nhận 500 coin (3h)
.pay @user amount

🎮 MINI GAMES
.flip amount → 50/50 x2
.slot amount → slot x2/x5
.dice amount → xúc xắc
.roulette amount → x3 hoặc mất
.highlow amount → đoán số

🏆 RANK
.top → bảng xếp hạng

⏳ SYSTEM
Cooldown: 2 giây
Thua = mất tiền cược`)
            ]
        });
    }

    // ================= BAL =================
    if (cmd === ".bal") {
        return msg.channel.send({
            embeds: [ui("BALANCE", `💰 Bạn có: ${get(id)} coin`)]
        });
    }

    // ================= DAILY =================
    if (cmd === ".daily") {
        let now = Date.now();

        if (cooldown["daily_" + id] && now - cooldown["daily_" + id] < 3 * 60 * 60 * 1000) {
            let left = Math.ceil((3 * 60 * 60 * 1000 - (now - cooldown["daily_" + id])) / 60000);
            return msg.reply("⏳ Chờ " + left + " phút");
        }

        add(id, 500);
        cooldown["daily_" + id] = now;

        return msg.channel.send({
            embeds: [ui("DAILY", "🎁 +500 coin")]
        });
    }

    // ================= PAY =================
    if (cmd === ".pay") {
        let target = msg.mentions.users.first();
        let amount = parseInt(args[2]);

        if (!target || !amount) return msg.reply("❌ .pay @user số tiền");
        if (get(id) < amount) return msg.reply("❌ Không đủ coin");

        add(id, -amount);
        add(target.id, amount);

        return msg.channel.send({
            embeds: [ui("TRANSFER", `💸 <@${id}> → <@${target.id}> +${amount}`)]
        });
    }

    // ================= TOP =================
    if (cmd === ".top") {
        let sorted = Object.entries(money)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        let text = sorted.length
            ? sorted.map((x, i) => `**${i+1}.** <@${x[0]}> — 💰 ${x[1]}`).join("\n")
            : "Chưa có dữ liệu";

        return msg.channel.send({
            embeds: [ui("LEADERBOARD", text)]
        });
    }

    // ================= FLIP =================
    if (cmd === ".flip") {
        let bet = parseInt(args[1]);
        if (!canUse(id, ".flip")) return msg.reply("⏳ Cooldown");
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
        if (!canUse(id, ".slot")) return msg.reply("⏳ Cooldown");
        if (get(id) < bet) return msg.reply("❌ Không đủ coin");

        let m = await msg.channel.send("🎰 Đang quay...");
        await wait(2000);

        let s = ["🍒","🍋","💎","7️⃣"];
        let a = s[Math.floor(Math.random()*4)];
        let b = s[Math.floor(Math.random()*4)];
        let c = s[Math.floor(Math.random()*4)];

        let win =
            (a===b && b===c) ? bet*5 :
            (a===b || b===c) ? bet*2 :
            -bet;

        add(id, win);

        return m.edit({
            embeds: [ui("SLOT", `${a} | ${b} | ${c}\n💰 ${win}`)]
        });
    }

    // ================= DICE =================
    if (cmd === ".dice") {
        let bet = parseInt(args[1]);
        if (!canUse(id, ".dice")) return msg.reply("⏳ Cooldown");
        if (get(id) < bet) return msg.reply("❌ Không đủ coin");

        let m = await msg.channel.send("🎲 rolling...");
        await wait(2000);

        let roll = Math.floor(Math.random()*6)+1;
        let win = roll >= 4 ? bet : -bet;

        add(id, win);

        return m.edit({
            embeds: [ui("DICE", `🎲 ${roll}\n💰 ${win}`)]
        });
    }

    // ================= ROULETTE =================
    if (cmd === ".roulette") {
        let bet = parseInt(args[1]);
        if (!canUse(id, ".roulette")) return msg.reply("⏳ Cooldown");
        if (get(id) < bet) return msg.reply("❌ Không đủ coin");

        let m = await msg.channel.send("🎡 spinning...");
        await wait(2000);

        let r = Math.random();

        if (r < 0.33) {
            add(id, bet*3);
            return m.edit({ embeds: [ui("ROULETTE", "⭐ WIN x3")] });
        } else {
            add(id, -bet);
            return m.edit({ embeds: [ui("ROULETTE", "💀 LOSE")] });
        }
    }

    // ================= HIGHLOW =================
    if (cmd === ".highlow") {
        let bet = parseInt(args[1]);
        if (!canUse(id, ".highlow")) return msg.reply("⏳ Cooldown");
        if (get(id) < bet) return msg.reply("❌ Không đủ coin");

        let m = await msg.channel.send("🎯 guessing...");
        await wait(2000);

        let num = Math.floor(Math.random()*10);
        let win = num >= 5 ? bet : -bet;

        add(id, win);

        return m.edit({
            embeds: [ui("HIGH/LOW", `🎯 ${num}\n💰 ${win}`)]
        });
    }
});

// ================= LOGIN =================
client.login(process.env.TOKEN);