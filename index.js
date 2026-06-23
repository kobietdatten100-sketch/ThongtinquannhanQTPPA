import discord
from discord.ext import commands
import json
import os
import random
import time

TOKEN = "YOUR_BOT_TOKEN"
PREFIX = "."

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix=PREFIX, intents=intents, help_command=None)

DATA_FILE = "users.json"

# ======================
# DATABASE JSON
# ======================

def load_data():
    if not os.path.exists(DATA_FILE):
        return {}

    with open(DATA_FILE, "r", encoding="utf8") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf8") as f:
        json.dump(data, f, indent=4)

def get_user(user_id):
    data = load_data()

    uid = str(user_id)

    if uid not in data:
        data[uid] = {
            "pscoin": 0,
            "wins": 0,
            "losses": 0,
            "daily": 0
        }
        save_data(data)

    return data

# ======================
# HELP
# ======================

@bot.command()
async def help(ctx):

    embed = discord.Embed(
        title="📖 HƯỚNG DẪN SỬ DỤNG BOT",
        color=0x00BFFF
    )

    embed.add_field(
        name="🎮 MINI GAME",
        value=
        "✊ `.kbb keo|bua|bao`\n"
        "🎲 `.dice`\n"
        "🪙 `.coinflip ngua|sap`\n"
        "🔢 `.guess <1-10>`",
        inline=False
    )

    embed.add_field(
        name="⚙️ HỆ THỐNG",
        value=
        "💰 `.check [@user]`\n"
        "🏆 `.top`\n"
        "🎁 `.dl`\n"
        "💸 `.givepscoin @user amount`\n"
        "👤 `.profile`",
        inline=False
    )

    await ctx.send(embed=embed)

# ======================
# CHECK
# ======================

@bot.command()
async def check(ctx, member: discord.Member = None):

    member = member or ctx.author

    data = get_user(member.id)

    uid = str(member.id)

    embed = discord.Embed(
        title="💰 THÔNG TIN TÀI KHOẢN",
        color=0x00ff00
    )

    embed.add_field(name="Tên", value=member.name)
    embed.add_field(name="PSCoin", value=f"{data[uid]['pscoin']:,}")

    await ctx.send(embed=embed)

# ======================
# PROFILE
# ======================

@bot.command()
async def profile(ctx):

    data = get_user(ctx.author.id)

    uid = str(ctx.author.id)

    embed = discord.Embed(
        title=f"👤 {ctx.author.name}",
        color=0xFFD700
    )

    embed.add_field(
        name="PSCoin",
        value=f"{data[uid]['pscoin']:,}"
    )

    embed.add_field(
        name="Thắng",
        value=data[uid]["wins"]
    )

    embed.add_field(
        name="Thua",
        value=data[uid]["losses"]
    )

    await ctx.send(embed=embed)

# ======================
# DAILY
# ======================

@bot.command()
async def dl(ctx):

    data = get_user(ctx.author.id)

    uid = str(ctx.author.id)

    now = int(time.time())

    cooldown = 10800

    if now - data[uid]["daily"] < cooldown:

        left = cooldown - (now - data[uid]["daily"])

        mins = left // 60

        return await ctx.send(
            f"⏳ Chờ {mins} phút nữa."
        )

    reward = 500000

    data[uid]["pscoin"] += reward
    data[uid]["daily"] = now

    save_data(data)

    embed = discord.Embed(
        title="🎁 NHẬN THƯỞNG THÀNH CÔNG",
        description=f"+{reward:,} PSCOIN",
        color=0x00ff00
    )

    await ctx.send(embed=embed)

# ======================
# GIVE
# ======================

@bot.command()
async def givepscoin(ctx, member: discord.Member, amount: int):

    if amount <= 0:
        return

    data = get_user(ctx.author.id)

    uid = str(ctx.author.id)

    get_user(member.id)

    if data[uid]["pscoin"] < amount:
        return await ctx.send("❌ Không đủ coin.")

    data[str(ctx.author.id)]["pscoin"] -= amount
    data[str(member.id)]["pscoin"] += amount

    save_data(data)

    await ctx.send(
        f"💸 Đã chuyển {amount:,} PSCoin cho {member.mention}"
    )

# ======================
# TOP
# ======================

@bot.command()
async def top(ctx):

    data = load_data()

    ranking = sorted(
        data.items(),
        key=lambda x: x[1]["pscoin"],
        reverse=True
    )

    embed = discord.Embed(
        title="🏆 BẢNG XẾP HẠNG ĐẠI GIA",
        color=0xFFD700
    )

    for i, (uid, info) in enumerate(ranking[:10], start=1):

        try:
            user = await bot.fetch_user(int(uid))
            name = user.name
        except:
            name = uid

        embed.add_field(
            name=f"#{i}",
            value=f"{name} - {info['pscoin']:,} PSCoin",
            inline=False
        )

    await ctx.send(embed=embed)

# ======================
# KEO BUA BAO
# ======================

@bot.command()
async def kbb(ctx, choice):

    choice = choice.lower()

    choices = ["keo", "bua", "bao"]

    if choice not in choices:
        return

    bot_choice = random.choice(choices)

    result = "Hòa"

    if (
        (choice == "keo" and bot_choice == "bao")
        or
        (choice == "bao" and bot_choice == "bua")
        or
        (choice == "bua" and bot_choice == "keo")
    ):
        result = "Bạn thắng"

    elif choice != bot_choice:
        result = "Bạn thua"

    await ctx.send(
        f"Bạn: {choice}\nBot: {bot_choice}\n\n{result}"
    )

# ======================
# DICE
# ======================

@bot.command()
async def dice(ctx):

    value = random.randint(1, 6)

    await ctx.send(f"🎲 Kết quả: **{value}**")

# ======================
# COINFLIP
# ======================

@bot.command()
async def coinflip(ctx, choice):

    result = random.choice(["ngua", "sap"])

    if choice.lower() == result:
        msg = "🎉 Đoán đúng"
    else:
        msg = "😢 Đoán sai"

    await ctx.send(
        f"🪙 {result}\n{msg}"
    )

# ======================
# GUESS
# ======================

@bot.command()
async def guess(ctx, number: int):

    if number < 1 or number > 10:
        return

    value = random.randint(1, 10)

    if value == number:
        msg = "🎉 Chính xác!"
    else:
        msg = f"❌ Sai rồi. Số là {value}"

    await ctx.send(msg)

# ======================

@bot.event
async def on_ready():
    print(f"Online: {bot.user}")

client.login(process.env.TOKEN);