import discord
from discord.ext import commands
from discord import app_commands
import sqlite3
from datetime import datetime

TOKEN = "YOUR_BOT_TOKEN"

# =========================
# CẤU HÌNH ROLE
# =========================

BO_TRUONG = 1518871534935085127
THU_TRUONG = 000000000000000000
CUC_TRUONG = 000000000000000000

ROLE_LIMITS = {
    BO_TRUONG: 1_000_000_000,
    THU_TRUONG: 500_000_000,
    CUC_TRUONG: 100_000_000
}

# =========================
# DATABASE
# =========================

db = sqlite3.connect("finance.db")
cursor = db.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS treasury (
    id INTEGER PRIMARY KEY,
    budget INTEGER
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    target TEXT,
    action TEXT,
    amount INTEGER,
    date TEXT
)
""")

cursor.execute("SELECT * FROM treasury WHERE id=1")
if cursor.fetchone() is None:
    cursor.execute(
        "INSERT INTO treasury VALUES (1, 1000000000)"
    )
    db.commit()

# =========================
# BOT
# =========================

intents = discord.Intents.default()
bot = commands.Bot(
    command_prefix="!",
    intents=intents
)

# =========================
# HÀM PHỤ
# =========================

def get_budget():
    cursor.execute(
        "SELECT budget FROM treasury WHERE id=1"
    )
    return cursor.fetchone()[0]

def set_budget(amount):
    cursor.execute(
        "UPDATE treasury SET budget=? WHERE id=1",
        (amount,)
    )
    db.commit()

def log_transaction(
    user,
    target,
    action,
    amount
):
    cursor.execute("""
        INSERT INTO transactions
        (user,target,action,amount,date)
        VALUES (?,?,?,?,?)
    """, (
        user,
        target,
        action,
        amount,
        datetime.now().strftime(
            "%d/%m/%Y %H:%M:%S"
        )
    ))
    db.commit()

def get_user_limit(member):
    highest = 0

    for role in member.roles:
        if role.id in ROLE_LIMITS:
            highest = max(
                highest,
                ROLE_LIMITS[role.id]
            )

    return highest

# =========================
# READY
# =========================

@bot.event
async def on_ready():
    await bot.tree.sync()
    print(f"Đăng nhập: {bot.user}")

# =========================
# NGÂN SÁCH
# =========================

@bot.tree.command(
    name="ngansach",
    description="Xem ngân sách quốc gia"
)
async def ngansach(
    interaction: discord.Interaction
):
    budget = get_budget()

    embed = discord.Embed(
        title="🏛️ BỘ TÀI CHÍNH",
        color=0x2ecc71
    )

    embed.add_field(
        name="Ngân sách hiện tại",
        value=f"{budget:,} VNĐ"
    )

    await interaction.response.send_message(
        embed=embed
    )

# =========================
# CẤP NGÂN SÁCH
# =========================

@bot.tree.command(
    name="capngansach",
    description="Cấp phát ngân sách"
)
async def capngansach(
    interaction: discord.Interaction,
    member: discord.Member,
    amount: int
):

    limit = get_user_limit(
        interaction.user
    )

    if limit == 0:
        await interaction.response.send_message(
            "❌ Bạn không có quyền.",
            ephemeral=True
        )
        return

    if amount > limit:
        await interaction.response.send_message(
            f"❌ Giới hạn của bạn là {limit:,} VNĐ",
            ephemeral=True
        )
        return

    budget = get_budget()

    if amount > budget:
        await interaction.response.send_message(
            "❌ Ngân sách quốc gia không đủ.",
            ephemeral=True
        )
        return

    budget -= amount
    set_budget(budget)

    log_transaction(
        str(interaction.user),
        str(member),
        "CẤP PHÁT",
        amount
    )

    embed = discord.Embed(
        title="🏛️ CẤP PHÁT NGÂN SÁCH",
        color=0x3498db
    )

    embed.add_field(
        name="Người nhận",
        value=member.mention,
        inline=False
    )

    embed.add_field(
        name="Số tiền",
        value=f"{amount:,} VNĐ",
        inline=False
    )

    embed.add_field(
        name="Ngân sách còn lại",
        value=f"{budget:,} VNĐ",
        inline=False
    )

    await interaction.response.send_message(
        embed=embed
    )

# =========================
# THU HỒI
# =========================

@bot.tree.command(
    name="trungansach",
    description="Thu hồi ngân sách"
)
async def trungansach(
    interaction: discord.Interaction,
    amount: int
):

    limit = get_user_limit(
        interaction.user
    )

    if limit == 0:
        await interaction.response.send_message(
            "❌ Bạn không có quyền.",
            ephemeral=True
        )
        return

    budget = get_budget()
    budget += amount

    set_budget(budget)

    log_transaction(
        str(interaction.user),
        "KHO BẠC",
        "THU HỒI",
        amount
    )

    await interaction.response.send_message(
        f"✅ Đã thu hồi {amount:,} VNĐ.\n"
        f"Ngân sách mới: {budget:,} VNĐ"
    )

# =========================
# LỊCH SỬ
# =========================

@bot.tree.command(
    name="lichsu",
    description="Xem 10 giao dịch gần nhất"
)
async def lichsu(
    interaction: discord.Interaction
):

    cursor.execute("""
        SELECT *
        FROM transactions
        ORDER BY id DESC
        LIMIT 10
    """)

    rows = cursor.fetchall()

    embed = discord.Embed(
        title="📋 LỊCH SỬ GIAO DỊCH",
        color=0xf1c40f
    )

    if not rows:
        embed.description = "Chưa có dữ liệu."

    for row in rows:
        embed.add_field(
            name=f"{row[3]} | {row[4]:,} VNĐ",
            value=f"{row[1]} ➜ {row[2]}\n{row[5]}",
            inline=False
        )

    await interaction.response.send_message(
        embed=embed
    )

# =========================
# KHỞI ĐỘNG
# =========================
client.login(process.env.TOKEN);