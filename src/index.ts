// Includes
import { Client } from 'discord.js';
import { prefix, token } from '../config.json';
import { ChannelPair } from '../src/classes/channel';
import { readData, gatherChannelSettings, showBotDescription } from '../src/classes/helper';
// import '../src/classes/channel';
// import '../src/classes/helper';
// import { readFile } from 'fs';					// Used to read/write from a file. (Import data)

// Global Variables
const client = new Client();
let channelPairList: ChannelPair[] = [];			// A GLOBAL list of ChannelPair objects

/**
 * ==========================================================================================================================================
 * 																Discord Event Listeners
 * ==========================================================================================================================================
 */
client.login(token);
client.once('ready', () =>{
	readData();
	console.log(`Loaded readData`);
	channelPairList = gatherChannelSettings();
	console.log(`Loaded gatherChannelSettings`);
});

// Monitor for people to join the voice channel 
client.on('voiceStateUpdate', (oldState, newState) => {
	if (!(newState.member!.roles.cache.has('497919497836167168') || newState.member!.roles.cache.has('647281949651632128'))){ // OMIT Admin/Mod from role changes
		let joinedChannel = newState.channel;
		let leftChannel = oldState.channel;
		let discordServer = newState.guild;
		
		// See if it is a listed pair
		let foundChannelPairIndex = channelPairList.findIndex(channelPair => channelPair.voiceChannel.channelID === newState.channelID); // Compare with the Voice Channel ID from the user
		if(leftChannel === undefined && joinedChannel !== undefined) { // User Joins a voice channel
			// Add the user to the text chat permissions
			if (foundChannelPairIndex >= 0){ 
				// Define permissions
				let overwriteOptions = { 
					VIEW_CHANNEL: true
				};

				// Find channel and update it
				let discordTextChannel = discordServer.channels.cache.find(discordChannel => {
					return discordChannel.id === channelPairList[foundChannelPairIndex].textChannel.channelID;
				});
				discordTextChannel!.updateOverwrite(newState.member!, overwriteOptions);
			}
		} else if(joinedChannel === undefined){ // User leaves a voice channel
			// Remove the user from the text chat permissions
			if (foundChannelPairIndex >= 0){ 
				// Find channel and update it
				let discordTextChannel = discordServer.channels.cache.find(discordChannel => {
					return discordChannel.id === channelPairList[foundChannelPairIndex].textChannel.channelID;
				});
				discordTextChannel!.permissionOverwrites.get(newState.member!.id)!.delete(); // Remove user from channel overwrites. 
			}
		}
	}
});

client.on('message', message =>{ 
	let messageContentUpper = message.content.toUpperCase(); 	// Used to provide non-case sensitive commands
	let messageArrayUpper = messageContentUpper.split(' '); 	// Used to access command information (non-case sensitive)
	
	// List all commands
	if(messageContentUpper === `${prefix}` || messageContentUpper === `${prefix}`[0]){ 
		showBotDescription(message);
		message.delete(); // Clean chat history
	}

	// Detect messages coming from DMs
	else if (message.guild === null && !(messageArrayUpper.length > 3 && messageArrayUpper[0] > `${prefix}`)){ 
		// Do nothing for DMs
	}

	// else if(messageArrayUpper[0] == `${prefix}` || messageArrayUpper[0] == `${prefix}`[0]){
	// }
})
