/*
    Discord Server Word Frequency Stat Collector
    https://github.com/Yernemm/Discord-Server-Word-Frequency-Stat-Collector


    By Yernemm

*/

debugCounter = 0;

//Edit these values:

//Discord bot token
const token = "";

//ID of the discord server to collect stats for.
const SERVER_ID = "";

//------- Optional config -----------

//How many messages to ask for in one request (max 100)
const MSG_LIMIT = 100; 

//Ignored channels
const IGNORE_CHANNELS = [""];

//-----------------------------------


//Actual code \/



const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');


const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers
	],
});

let wordcount = 0;
let bef = "";
let wordStats = {};


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  getAllMsgsInServer(SERVER_ID)
  //getAllMsgsInServer("")
  .then(coll=>{
    //console.log(coll.array());

/*
    let len = coll.length;

    coll.forEach((msg,i)=>{

        if(i % 250 === 0){
            console.log(i + "/" + len);
        }

        if(msg.author !== undefined)
        if(!msg.author.bot && msg.content.length > 0){
   
            let wordlist = msg.content.replace(/[^A-Za-z ]/g, "").toLowerCase().split(' ');
            wordlist.forEach(word=>{
                
                if(word.length > 0){
                    if(wordStats[word]){
                        wordStats[word]++;
                    }else{
                        wordStats[word] = 1;
                    }
                    
                }
            });
        }
    })
*/

/*
    let sorted = sortedObjToArr(wordStats);

    let datastring = "";

    for(let i = 0; i < sorted.length; i++){
        datastring += `${i + 1}) ${sorted[i][0]} (${sorted[i][1]})` + '\n';
    }

    //console.log(datastring);

    fs.writeFile(Date.now() + '.txt', datastring, function (err) {
        if (err) return console.log(err);
        console.log('written');
      });

      */

      //console.log(sortedObjToArr(coll));

      let sorted = sortedObjToArr(coll);

      let datastring = "";
      let csv = "";

      for(let i = 0; i < sorted.length; i++){
          datastring += `${i + 1}) ${sorted[i][0].trim()} (${sorted[i][1]})` + '\n';
          csv += `${sorted[i][1]},"${sorted[i][0].trim()}"` + '\n';
      }
  
    
  
      fs.writeFile(Date.now() + '.txt', datastring, function (err) {
          if (err) return console.log(err);
          console.log('written');
        });

        fs.writeFile(Date.now() + '.csv', csv, function (err) {
            if (err) return console.log(err);
            console.log('written csv');
          });

  });
    


  




});

function getAllMsgs(channelId, before = null) {
    debugCounter++;
    
    return new Promise((resolve, reject) => {
        console.log(debugCounter + " | Getting messages... " + " [" + client.channels.cache.get(channelId).name + "]");
        client.channels.cache.get(channelId)
        .messages.fetch(before ? {limit: MSG_LIMIT, before: before} : {limit: MSG_LIMIT})
        .then(msgs => {
            
            msgsArray = [...msgs.values()];
            
            if(msgs.last() === undefined){
                resolve([]);
            }else{

                if(msgs.length < 100){
                    console.log(client.channels.cache.get(channelId).name + " DONE!")
                    resolve(msgsArray);
                }else{

                    let lastId = msgs.last().id;
    
                    //console.log(`[${client.channels.cache.get(channelId).name}] ${msgsArray[0].content}`);
                    getAllMsgs(channelId, lastId)
                    .then(restmsgs => {
                        resolve(msgsArray.concat(restmsgs));
                    });
    
                }

            }          

        })
        .catch(err=>{
            console.log('someERR -------------------------------------------')
            console.log(err);
            console.log('someERR -------------------------------------------')
            reject(err);
        });

    });

}

function getAllMsgsInServer(serverId){
    console.log("Getting messages in server...");
    return new Promise((resole, reject)=>{

        let channels = [];

        client.guilds.cache.get(serverId)
        .channels.cache.each(chan=>{
            if((chan.type == 0 || chan.type == 11) && !IGNORE_CHANNELS.includes(chan.id)){
               channels.push(getAllMsgs(chan.id));
            }
        });

        //console.log(client.guilds.cache.get(serverId).channels.cache)
        console.log(channels);

        let allwordlists = [];

        Promise.allSettled(channels)
        .then(allMsgs =>{
            let allMsgsArr = []
            allMsgs.forEach(allmsg=>{
                if(allmsg.status != "rejected"){

                    let localWordList = {};

                    let len = allmsg.value.length;

                    allmsg.value.forEach((msg,i)=>{

                        if(i % 500 === 0){
                            console.log(`[${allmsg.value[0].channel.name}] `+i + "/" + len);
                        }

                        if(msg.author !== undefined)
                        if(!msg.author.bot && msg.content.length > 0){
                
                            let wordlist = msg.content.replace(/[^A-Za-z: ]/g, "").toLowerCase().split(' ');
                            wordlist.forEach(word=>{

                                word = word + " ";
                                
                                if(word.length > 1){
                                    if(localWordList[word]){
                                        localWordList[word]++;
                                    }else{
                                        localWordList[word] = 1;
                                    }
                                    
                                }
                            });
                        }

                        
                });

                allwordlists.push(localWordList);

                }
                   // allMsgsArr.push(allmsg.value);
            })
            resole(combineWordCounts(allwordlists));

        })

    });

}

function sortedObjToArr(obj){
    let sortable = [];
    for (let val in obj) {
        sortable.push([val, obj[val]]);
    }
    
    sortable.sort(function(a, b) {
        return (b[1]*1) - (a[1]*1);
    });

    return sortable;
}

function combineWordCounts(arr){

    let localWordList = {};
    
    arr.forEach(obj=>{

        for(let prop in obj){

            if(typeof localWordList[prop] == "number"){
                localWordList[prop]+=obj[prop];
            }else{
                localWordList[prop] = obj[prop];
            }

        }

    });

    return localWordList;

}




client.login(token);