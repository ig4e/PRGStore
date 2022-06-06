module.exports = async (client, guildId) => {
  let array = [
    {
      name: "stock",
      description: "Stocks manager.",
      options: [
        {
          name: "create",
          description: "Create new stock.",
          type: "SUB_COMMAND",
          options: [
            {
              name: "name",
              description: "The name of stock.",
              type: "STRING",
              required: true
            },
            {
              name: "url",
              description: "The url of stock image.",
              type: "STRING",
              required: true
            },
            {
              name: "price",
              description: "The price of the accounts in stock.",
              type: "NUMBER",
              required: true
            }
          ]
        },
        {
          name: "edit",
          description: "Edit the price of stock.",
          type: "SUB_COMMAND",
          options: [
            {
              name: "name",
              description: "The name of stock.",
              type: "STRING",
              required: true
            },
            {
              name: "price",
              description: "The new price of the accounts in stock.",
              type: "NUMBER",
              required: true
            }
          ]
        },
        {
          name: "delete",
          description: "Delete stock.",
          type: "SUB_COMMAND",
          options: [
            {
              name: "name",
              description: "The name of stock.",
              type: "STRING",
              required: true
            }
          ]
        }
      ]
    },
    {
      name: "add-account",
      description: "Add account to custom stock.",
      options: [
        {
          name: "name",
          description: "The name of stock.",
          type: "STRING",
          required: true
        },
        {
          name: "account",
          description: "The account to add it to stock.",
          type: "STRING",
          required: true
        }
      ]
    },
    {
      name: "add-multi-account",
      description: "Add account to custom stock.",
      options: [
        {
          name: "name",
          description: "The name of stock.",
          type: "STRING",
          required: true
        },
        {
          name: "account",
          description: "The account to add it to stock.",
          type: "STRING",
          required: true
        }
      ]
    },
    {
      name: "add-dollars",
      description: "Add dollars to someone.",
      options: [
        {
          name: "user",
          description: "The user to add dollars to his.",
          type: "USER",
          required: true
        },
        {
          name: "amount",
          description: "The amount to add it to the user.",
          type: "NUMBER",
          required: true
        }
      ]
    },
    {
      name: "remove-dollars",
      description: "Remove dollars from someone.",
      options: [
        {
          name: "user",
          description: "The user to remove dollars from his.",
          type: "USER",
          required: true
        },
        {
          name: "amount",
          description: "The amount to remove it from the user.",
          type: "NUMBER",
          required: true
        }
      ]
    },
    {
      name: "balance",
      description: "Get your account balance or another one.",
      options: [
        {
          name: "user",
          description: "The user to get his balance.",
          type: "USER"
        }
      ]
    }
  ];
  await client.guilds.cache.get(guildId)?.commands.set(array);
  console.log("Done refresh the slash commands.");
}