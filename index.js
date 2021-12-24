const fs = require('fs') 
const {Intents, Client, Collection} = require('discord.js')
const ALLINTENTS = new Intents(32767)
const client = new Client({intents: ALLINTENTS})
const prefix = '7!'
const {token, MONGOURI} = require('./config.json')
const mongoose = require('mongoose')
const transcriptChannel = require('./schemas/transcript')
const {GiveawaysManager} = require('discord-giveaways') 

 
mongoose.connect(MONGOURI).then(()=>{
    console.log("Connected to MongoDB")
}).catch(console.error)


console.log("Fetching for command...")
const commandFile = fs.readdirSync('./commands').filter(files => files.endsWith('.js'))

if(commandFile.length == 0)return console.log("No commands found")
else console.log(`Loaded ${commandFile.length} commands.`)
client.commands = new Collection()

process.on("uncaughtException", err=>{
    console.error(err)
    process.exit(1)
})
process.on("unhandledRejection", err=>{
    console.error(err)
    process.exit(1)
})

client.manager = new GiveawaysManager(client, {
    storage: "./giveaways.json",
    default: {
        botsCanWin: false,
        embedColor: "#32FA1E",
        embedColorEnd: "#F0BC00",
        reaction: "🎉"
    }
})

for(files of commandFile){
    const command = require(`./commands/${files}`)
    console.log(`Fetched command ${command.name}`)
    client.commands.set(command.name, command)
}


client.on("ready", () =>{
    console.log("Ready")
})


client.on("messageCreate", async message =>{
     const args = message.content.slice(prefix.length).trim().split(/ +/)
     const cmd = args.shift().toLowerCase()
     const command = client.commands.get(cmd) 
     if(message.author.bot)return;
     if(!message.content.startsWith(prefix))return
     command.execute(client, message, args)
      
     if(message.channel.parentId !== '899855786208030831') return;
     transcriptChannel.findOne({ Channel : message.channel.id }, async(err, data) => {
         if(err) throw err;
         if(data) {
            console.log('there is data')
            data.Content.push(`${message.author.tag} : ${message.content}`) 
         } else {
             console.log('there is no data')
             data = new ticketTranscript({ Channel : message.channel.id, Content: `${message.author.tag} : ${message.content}`})
         }
         await data.save()
             .catch(err =>  console.log(err))
         console.log('data is saved ')
     })
})
client.login(token)
 