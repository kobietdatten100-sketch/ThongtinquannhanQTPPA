
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ====== MEMORY COIN (tạm thời) ======
let money = {};

function get(id) {
    return money[id] || 1000;
}

function add(id, amt) {
    money[id] = get(id) + amt;
}

// ====== UI CASINO ======
function ui(title, desc) {
    return new EmbedBuilder()
        .setTitle("🎰 CASINO ROYALE | " + title)
        .setDescription(desc)
        .setColor(0x00FFD5)
        .setFooter({ text: "Casino Bot • Coin ảo" });
}

// ====== READY ======
client.on("ready", () => {
    console.log("Casino Bot Ready!");
});

// ====== MESSAGE ======
client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;

    const args = msg.content.split(" ");
    const cmd = args[0];

    // ================= BALANCE =================
    if (cmd === ".bal") {
        msg.channel.send({
            embeds: [ui("BALANCE", `💰 Bạn có: **${get(msg.author.id)} coin**`)]
        });
    }

    // ================= SLOT =================
    if (cmd === ".slot") {
        let bet = parseInt(args[1]);
        let symbols = ["🍒", "🍋", "💎", "7️⃣"];

        let a = symbols[Math.floor(Math.random() * symbols.length)];
        let b = symbols[Math.floor(Math.random() * symbols.length)];
        let c = symbols[Math.floor(Math.random() * symbols.length)];

        let win = 0;

        if (a === b && b === c) win = bet * 5;
        else win = -bet;

        add(msg.author.id, win);

        msg.channel.send({
            embeds: [ui(
                "SLOT",
                `🎰 ${a} | ${b} | ${c}\n💰 ${win > 0 ? "+" : ""}${win}`
            )]
        });
    }

    // ================= DICE =================
    if (cmd === ".dice") {
        let bet = parseInt(args[1]);
        let roll = Math.floor(Math.random() * 6) + 1;

        let win = roll >= 4 ? bet : -bet;

        add(msg.author.id, win);

        msg.channel.send({
            embeds: [ui(
                "DICE",
                `🎲 Roll: ${roll}\n💰 ${win > 0 ? "+" : ""}${win}`
            )]
        });
    }

    // ================= CRASH =================
    if (cmd === ".crash") {
        let bet = parseInt(args[1]);
        let cashout = parseFloat(args[2]);

        let multiplier = 1.0;
        let crashPoint = (Math.random() * 3 + 1.2).toFixed(2);

        let msgEdit = await msg.channel.send({
            embeds: [ui("CRASH", "🚀 Launching...")]
        });

        let interval = setInterval(async () => {
            multiplier += 0.2;

            if (multiplier >= crashPoint) {
                clearInterval(interval);
                add(msg.author.id, -bet);

                return msgEdit.edit({
                    embeds: [ui("CRASH", `💥 CRASH at x${crashPoint}\n💀 -${bet}`)]
                });
            }

            if (multiplier >= cashout) {
                clearInterval(interval);

                let win = Math.floor(bet * multiplier);
                add(msg.author.id, win);

                return msgEdit.edit({
                    embeds: [ui("CRASH", `🚀 CASHOUT x${multiplier.toFixed(2)}\n💰 +${win}`)]
                });
            }

            msgEdit.edit({
                embeds: [ui("CRASH", `🚀 x${multiplier.toFixed(2)}`)]
            });

        }, 1000);
    }
});

// ====== LOGIN ======
client.login(process.env.TOKEN);
