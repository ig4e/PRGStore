const config = require("./config.json");
const express = require("express");
const app = express();
const session = require("express-session");
const passport = require("passport");
const Strategy = require("passport-discord").Strategy;
const Store = require("connect-mongodb-session")(session);
const cors = require("cors");
const helmet = require("helmet");
const Discord = require("discord.js");
const client = new Discord.Client({
  intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS"],
});
const mongoose = require("mongoose");
const db = require("./models/shop");
const user_db = require("./models/user");
const setSlash = require("./slash");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.database, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});
client.on("ready", async () => {
  client.user.setPresence({ activities: [{ name: 'PRG-Store & DashBord Go to Buy now | https://prg-buyacc.store' }], status: 'dnd' });
  console.log(client.user.tag);
  await setSlash(client, config.guildId);
});


app.use(
  cors({
    origin: [`${config.dashboard_link}`],
    credentials: true,
  }),
);

app.use(
  session({
    secret: "secret",
    cookie: {
      maxAge: 60000 * 60 * 24,
    },
    resave: false,
    saveUninitialized: false,
    store: new Store({
      uri: process.env.database,
      collection: "sessions",
      expires: 60000 * 60 * 24,
      connectionOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    }),
  }),
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(
  new Strategy(
    {
      clientID: config.client_id,
      clientSecret: config.client_secret,
      callbackURL: config.dash_url + "/auth",
      scope: ["identify"],
    },
    async (accessToken, refreshToken, profile, done) => {
      let data = await user_db.findOne({
        id: profile.id,
      });
      if (!data) {
        let data_new = await user_db.create({
          id: profile.id,
          accessToken: accessToken,
        });
        await data_new.save();
      } else {
        data.accessToken = accessToken;
        await data.save();
      }
      process.nextTick(() => done(null, profile));
    },
  ),
);

app.use(passport.initialize());
app.use(passport.session());

app.get(
  "/login",
  (req, res, next) => {
    next();
  },
  passport.authenticate("discord"),
);

app.get(
  "/auth",
  passport.authenticate("discord", {
    failureRedirect: config.dashboard_link,
  }),
  (req, res) => {
    res.redirect(config.dashboard_link);
  },
);

app.use(
  helmet({
    contentSecurityPolice: false,
  }),
);

app.get("/logout", function(req, res) {
  req.session.destroy(() => {
    req.logout();
    res.redirect(config.dashboard_link);
  });
});

app.get("/user", async (req, res) => {
  if (!req.user) return res.send({ error: "Please login first" });
  let data = await user_db.findOne({
    id: req.user.id,
  });
  if (!data) {
    data = await user_db.create({
      id: req.user.id,
    });
    await data.save();
  }
  data.accessToken = req.user.accessToken;
  await data.save();
  let guild = client.guilds.cache.get(config.guildId);
  let member;
  try {
    member = await guild.members.fetch(req.user.id);
  } catch (err) {
    member = null;
  }
  let vip;
  if (member && member.roles.cache.has(config.roleId)) {
    vip = true;
  } else {
    vip = false;
  }
  let shop_data = await db.findOne({
    id: "shop",
  });
  if (!shop_data) {
    shop_data = await db.create({
      id: "shop",
    });
    await shop_data.save();
  }
  res.send({
    username: req.user.username,
    id: req.user.id,
    avatar: req.user.avatar
      ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}`
      : "https://cdn.discordapp.com/embed/avatars/0.png",
    accessToken: req.user.accessToken,
    dollars: data.dollars,
    accounts: data.accounts,
    stocks:
      shop_data.stocks.length > 0
        ? shop_data.stocks.map((s) => ({
          name: s.name,
          url: s.url,
          price:
            vip === true ? Math.ceil(s.price * 0.9) : s.price,
          count: s.accounts.length,
        }))
        : [],
    vip: vip,
  });
});

app.get("/support", (req, res) => {
  res.redirect(config.support);
});

app.get("/", (req, res) => {
  res.send("hi");
});

app.put("/delete-account", async (req, res) => {
  try {
    let id = req.body.itemID;
    let user = await user_db.findOne({
      id: req.body.userID,
    });
    if (!user || user.accessToken !== req.body.accessToken)
      return res.send({ error: "Invalid Access Token." });

    user.accounts = user.accounts.filter((el, i) => i !== id);
    await user.save().catch();

    res.json(user);
  } catch {
    res.json({ error: { msg: "unkown error" } });
  }
})
app.put("/", async (req, res) => {
  let user = await user_db.findOne({
    id: req.body.userID,
  });
  if (!user || user.accessToken !== req.body.accessToken)
    return res.send({ error: "Invalid Access Token." });
  let data = await db.findOne({
    id: "shop",
  });
  if (!data) return res.send({ error: "المخزون فارغ عد لاحقاّ | او لو تريد الان تقدر تكلم PRG ⌯ Store#4056" });
  let index = data.stocks.findIndex((i) => i.name === req.body.name);
  if (index === -1 || data.stocks[index].accounts.length < 1)
    return res.send({ error: "المخزون فارغ عد لاحقاّ | او لو تريد الان تقدر تكلم PRG ⌯ Store#4056" });
  let guild = client.guilds.cache.get(config.guildId);
  let member;
  try {
    member = await guild.members.fetch(req.body.userID);
  } catch (err) {
    member = null;
  }
  let vip;
  if (member && member.roles.cache.has(config.roleId)) {
    vip = true;
  } else {
    vip = false;
  }
  let price =
    vip === true
      ? Math.ceil(data.stocks[index].price * 0.9)
      : data.stocks[index].price;
  if (user.dollars < price)
    return res.send({ error: "ليس لديك ما يكفي من الدولارات" });
  let random = Math.floor(Math.random() * data.stocks[index].accounts.length);
  let account = data.stocks[index].accounts[random];
  await data.stocks[index].accounts.splice(random, 1);
  await user.accounts.push({
    name: req.body.name,
    email: account.email,
    pass: account.pass,
    date: Date.now(),
  });
  user.dollars -= price;
  await user.save();
  await db.findOneAndUpdate({
    id: "shop",
    stocks: data.stocks,
  });
  res.send({
    msg: `تم إضافة الحساب إلى مخزونك | شكرا علي التعامل معنا وثقتك بنا`,
  });
});

app.listen(() => 0);


client.on("interactionCreate", async (inter) => {
  if (!inter.isCommand()) return;
  if (!inter.guild)
    return inter.reply({
      content: ":x: | **You can't use my commands in dm.**",
      ephemeral: true,
    });
  if (inter.commandName === "stock") {
    if (!config.devs.find((i) => i === inter.user.id))
      return inter.reply({
        content: `❌ - **You can't use this commands.**`,
        ephemeral: true,
      });
    let command = inter.options.getSubcommand();
    if (command === "create") {
      let name = inter.options.getString("name");
      let url = inter.options.getString("url");
      let price = inter.options.getNumber("price");
      let data = await db.findOne({
        id: "shop",
      });
      if (!data) {
        data = await db.create({
          id: "shop",
        });
        await data.save();
      }
      if (data.stocks.find((s) => s.name === name))
        return inter.reply({
          content: `❌ - **You already added stock with this name.**`,
        });
      await data.stocks.push({
        name: name,
        url: url,
        price: price,
        accounts: [],
      });
      await data.save();
      inter.reply({ content: `✅ - **Done create new stock.**` });
    } else if (command === "edit") {
      let name = inter.options.getString("name");
      let price = inter.options.getNumber("price");
      let data = await db.findOne({
        id: "shop",
      });
      if (!data || data.stocks.length < 1)
        return inter.reply({
          content: `❌ - **You don't add any stock yet.**`,
        });
      let index = data.stocks.findIndex((i) => i.name === name);
      if (index === -1)
        return inter.reply({
          content: `❌ - **I can't find any stock with this name.**`,
        });
      data.stocks[index].price = price;
      await db.findOneAndUpdate({
        id: "shop",
        stocks: data.stocks,
      });
      inter.reply({
        content: `✅ - **Done edit the price for this stock.**`,
      });
    } else if (command === "delete") {
      let name = inter.options.getString("name");
      let data = await db.findOne({
        id: "shop",
      });
      if (!data || data.stocks.length < 1)
        return inter.reply({
          content: `❌ - **You don't add any stock yet.**`,
        });
      let index = data.stocks.findIndex((i) => i.name === name);
      if (index === -1)
        return inter.reply({
          content: `❌ - **I can't find any stock with this name.**`,
        });
      await data.stocks.splice(index, 1);
      await data.save();
      inter.reply({ content: `✅ - **Done delete this stock.**` });
    }
  } else if (inter.commandName === "add-account") {
    if (!config.devs.find((i) => i === inter.user.id))
      return inter.reply({
        content: `❌ - **You can't use this commands.**`,
        ephemeral: true,
      });
    let name = inter.options.getString("name");
    let account = inter.options.getString("account");
    account = account.split(" ").join("");
    account = account.startsWith("https://")
      ? [account, ""]
      : account.split(":");
    let email = account[0];
    let pass = account[1];
    let data = await db.findOne({
      id: "shop",
    });
    if (!data || data.stocks.length < 1)
      return inter.reply({
        content: `❌ - **You don't add any stock yet.**`,
      });
    let index = data.stocks.findIndex((i) => i.name === name);
    if (index === -1)
      return inter.reply({
        content: `❌ - **I can't find any stock with this name.**`,
      });
    await data.stocks[index].accounts.push({
      email: email,
      pass: pass,
    });
    await db.findOneAndUpdate({
      id: "shop",
      stocks: data.stocks,
    });
    await inter.reply({ content: `adding...` });
    await inter.deleteReply().catch((err) => 0);
    inter.channel.send({
      content: `✅ - **Done add this account to stock.**`,
    });
  } else if (inter.commandName === "add-multi-account") {
    if (!config.devs.find((i) => i === inter.user.id))
      return inter.reply({
        content: `❌ - **You can't use this commands.**`,
        ephemeral: true,
      });
    let name = inter.options.getString("name");
    let account = inter.options.getString("account");
    let data = await db.findOne({
      id: "shop",
    });
    let accounts = account
      .trim()
      .split(",")
      .map(async (account) => {
        account = account.split(" ").join("");
        account = account.startsWith("https://")
          ? [account, ""]
          : account.split(":");
        let email = account[0];
        let pass = account[1];
        if (!data || data.stocks.length < 1)
          return inter.reply({
            content: `❌ - **You don't add any stock yet.**`,
          });
        let index = data.stocks.findIndex((i) => i.name === name);
        if (index === -1)
          return inter.reply({
            content: `❌ - **I can't find any stock with this name.**`,
          });

        await data.stocks[index].accounts.push({
          email: email,
          pass: pass,
        });
      });
    inter.channel.send({
      content: `✅ - **Done add this accounts to stock.**`,
    });

    await db.findOneAndUpdate({
      id: "shop",
      stocks: data.stocks,
    });
    await inter.reply({ content: `adding...` });
    await inter.deleteReply().catch((err) => 0);
  } else if (inter.commandName === "add-dollars") {
    if (!config.devs.find((i) => i === inter.user.id))
      return inter.reply({
        content: `❌ - **You can't use this commands.**`,
        ephemeral: true,
      });
    let user = inter.options.getMember("user");
    let amount = inter.options.getNumber("amount");
    if (user.user.bot)
      return inter.reply({ content: `❌ - **Are you ok?**` });
    if (amount <= 0)
      return inter.reply({
        content: `❌ - **Amount must be higher than 0.**`,
      });
    let data = await user_db.findOne({
      id: user.user.id,
    });
    if (!data) {
      data = await user_db.create({
        id: user.user.id,
      });
      await data.save();
    }
    data.dollars += parseInt(amount);
    await data.save();
    inter.reply({
      content: `✅ - **Done add \`$${parseInt(amount)}\` to ${
        user.user.tag
        }**.`,
    });
  } else if (inter.commandName === "remove-dollars") {
    if (!config.devs.find((i) => i === inter.user.id))
      return inter.reply({
        content: `❌ - **You can't use this commands.**`,
        ephemeral: true,
      });
    let user = inter.options.getMember("user");
    let amount = inter.options.getNumber("amount");
    if (user.user.bot)
      return inter.reply({ content: `❌ - **Are you ok?**` });
    if (amount <= 0)
      return inter.reply({
        content: `❌ - **Amount must be higher than 0.**`,
      });
    let data = await user_db.findOne({
      id: user.user.id,
    });
    if (!data) {
      data = await user_db.create({
        id: user.user.id,
      });
      await data.save();
    }
    if (data.dollars < amount)
      return inter.reply({
        content: `❌ - **This user not have enough dollars**`,
      });
    data.dollars -= parseInt(amount);
    await data.save();
    inter.reply({
      content: `✅ - **Done remove \`$${parseInt(amount)}\` from ${
        user.user.tag
        }**.`,
    });
  } else if (inter.commandName === "balance") {
    let user = inter.options.getMember("user") || inter.member;
    let data = await user_db.findOne({
      id: user.user.id,
    });
    let dollars;
    if (!data) {
      dollars = 0;
    } else {
      dollars = data.dollars;
    }
    inter.reply({
      content: `**\💲 ${user.user.tag} account balance is \`$${dollars}\`.**`,
    });
  }
});

const { Probot } = require("discord-probot-transfer");

client.probot = Probot(client, {
  fetchGuilds: true,
  data: [
    {
      fetchMembers: true,
      guildId: `${config.guildId}`,
      probotId: `${config.probotId}`,
      owners: [`${config.ownerId}`],
    },
  ],
});

client.probot.on("transfered", async (guild, data, err) => {
  if (err) return guild.channel.send({ content: `❌` });
  var { member, price, receiver } = data;
  if (
    receiver.user.id === config.ownerId &&
    guild.channel.id === config.channelId
  ) {
    let data = await user_db.findOne({
      id: member.user.id,
    });
    if (!data) {
      data = await user_db.create({
        id: member.user.id,
      });
      await data.save();
    }
    data.dollars += parseInt(price);
    await data.save();
    guild.channel.send({
      files: [
        {
          name: "Line.png",
          attachment:
            "https://cdn.discordapp.com/attachments/960690722539991100/960690846120964126/20220404_175812.jpg",
        },
      ],
    });
  }
});
const { Client, Intents, MessageEmbed, Message } = require("discord.js");
const {
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
} = require("discord.js");
const prefix = `d?`;
client.on("messageCreate", (message) => {
  if (message.content.startsWith(prefix + "menu")) {
    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId("pages")
        .setPlaceholder("Nothing selected")

        .addOptions([
          {
            label: "Minecraft",
            description: "Minecraft price",
            value: "minecraft",
          },
          {
            label: "Netflix",
            description: "Netflix price",
            value: "netflix",
          },
          {
            label: "primegaming",
            description: "PrimeGaming price",
            value: "primegaming",
          },
        ]),
    );

    let embed0 = new MessageEmbed()

      .setTitle(" ** 🛒 قائمة اسعار المنتجات **")
      .setDescription(
        `اسعار المتنجات الي نوفرها اضغط علي المينوي وي اختر`,
      )
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/939850223335923723/945496235123556362/1642498672913.png",
      )
      .setImage(
        "https://cdn.discordapp.com/attachments/939850223335923723/945529178818768996/1642627209674.png",
      )
      .setFooter({
        text: "PRG-Store",
        iconURL: "https://i.imgur.com/Bq8YWy6.png",
      })
      .setTimestamp();
    message.channel.send({ components: [row], embeds: [embed0] });
  }
});

client.on("interactionCreate", (interaction) => {
  if (!interaction.isSelectMenu()) return;
  if (interaction.customId == "pages") {
    if (interaction.values[0] == "minecraft") {
      let embed2 = new MessageEmbed()
        .setDescription(`full access minecraft = 10$`)
        .setThumbnail(
          "https://cdn.discordapp.com/attachments/939850223335923723/945496235123556362/1642498672913.png",
        )
        .setImage(
          "https://cdn.discordapp.com/attachments/939850223335923723/945529178818768996/1642627209674.png",
        )
        .setFooter({
          text: "PRG-Store",
          iconURL: "https://i.imgur.com/Bq8YWy6.png",
        })
        .setTimestamp();
      interaction.reply({ embeds: [embed2], ephemeral: true });
    } else if (interaction.values[0] == "netflix") {
      let embed1 = new MessageEmbed()
        .setDescription(`> full access roblox = 10$`)
        .setFooter({
          text: "PRG-Store",
          iconURL: "https://i.imgur.com/Bq8YWy6.png",
        });

      interaction.reply({ embeds: [embed1], ephemeral: true });
    } else if (interaction.values[0] == "primegaming") {
      let embed3 = new MessageEmbed()
        .setTitle(`قائمة اسعار PrimeGaming`)
        .setDescription(`Prime Gaming 7d => 35k probot`)
        .setThumbnail(
          "https://cdn.discordapp.com/attachments/939850223335923723/945496235123556362/1642498672913.png",
        )
        .setImage(
          "https://cdn.discordapp.com/attachments/939850223335923723/945529178818768996/1642627209674.png",
        )
        .setFooter({
          text: "PRG-Store",
          iconURL: "https://i.imgur.com/Bq8YWy6.png",
        })
        .setTimestamp();
      interaction.reply({ embeds: [embed3], ephemeral: true });
    }
  }
});

client.login(process.env.token);
