require('dotenv').config();
const {Client, GatewayIntentBits, REST, Routes, Collection, MessageFlags, Events, ButtonBuilder, ButtonStyle, TextInputStyle, TextInputBuilder, ModalBuilder, ActionRowBuilder, EmbedBuilder} = require('discord.js');
const fs = require('fs');
const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]});
const cron = require('node-cron');
const expr = process.env.CRON || "0 9 * * *";
const tz = process.env.TIMEZONE || "UTC";

//#region Math Variables
let A1 = 0;
let A2 = 0;
let B1 = 0;
let B2 = 0;
let C1 = 0;
let C2 = 0;

let A = [];
let B = [];
let C = [];

//#endregion Math Variables

//#region Math 
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function dailyRandValues() {
    A1 = getRandomInt(1, 9);
    A2 = getRandomInt(1, 9);
    B1 = getRandomInt(1, 9);
    B2 = getRandomInt(1, 9);
    C1 = getRandomInt(1, 9);
    C2 = getRandomInt(1, 9);

    A = [A1, A2];
    B = [B1, B2];
    C = [C1, C2];

    return;
}

function solveDailyBraKet() {
    const A_Answer = A1 * C1 + A2 * C2;
    const B_Answer = B1 * C1 + B2 * C2;
    const answer = A_Answer + B_Answer;
    return answer;
}

//#endregion Math

async function getDailyMath() {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
        if (!channel || !channel.isTextBased()) {
            return console.error("Channel fetch failed or not text-based")
        }
    dailyRandValues()
    const {embed, row} = createMathEmbed();

    channel.send({content:'Ready for the daily math equation?', embeds: [embed], components: [row]});
}

function createMathEmbed() {
    const embed = new EmbedBuilder()
        .setTitle('Math')
        .setDescription('Here is your math homework!')
        .setColor('#00FF00')
        .addFields(
            {name: 'Equation', value: '(⟨A| + ⟨B|) |C⟩'},
            {name: 'Values', value: `A = (${A}) B = (${B}) C = (${C})`},
        );
    
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('enterMathAnswerButton')
            .setLabel('Enter your answer!')
            .setStyle(ButtonStyle.Primary)
    );

    return {embed, row};
}

client.on(Events.InteractionCreate, async interaction => {
    try {
        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

        if (interaction.isButton()) {
            switch (interaction.customId) {
                case 'enterMathAnswerButton':
                    try {
                        const modal = new ModalBuilder()
                            .setCustomId('createMathAnswerModal')
                            .setTitle('Your Answer?')
                            .setComponents(
                                new ActionRowBuilder().addComponents(
                                    new TextInputBuilder() 
                                    .setCustomId('mathAnswerInput')
                                    .setLabel('Answer in number only ex: 36')
                                    .setStyle(TextInputStyle.Short)
                                )
                            );

                        await interaction.showModal(modal)

                    } catch (error) {
                        console.log('error with answer button.', error);
                    }
            }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'createMathAnswerModal')
            const userAnswer = parseInt(interaction.fields.getTextInputValue('mathAnswerInput'));
            const answer = solveDailyBraKet();

            if (userAnswer === answer) {
                await interaction.reply({content:'✅ You got it right congrats! Come back again tomorrow!', flags: MessageFlags.Ephemeral});
            } else {
                await interaction.reply({content: '❌ Wrong try again! No answer handouts!', flags: MessageFlags.Ephemeral});
            }

        }

    } catch (error) {
        console.log('error with interactions.', error);
    }
});


client.once(Events.ClientReady, async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    cron.schedule(expr, async () => {
        try {
            getDailyMath();
            console.log("📤 Sent daily math equation");
        } catch (err) {
            console.error("Daily math error:", err);
        }
    }, {timezone: tz });

    console.log(`⏰ Scheduled daily math: "${expr}" in ${tz}`);
});

getDailyMath();
client.login(process.env.TOKEN);