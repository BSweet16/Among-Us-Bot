// Includes
import { Client } from 'discord.js';
import { prefix, token } from '../config.json';
import * as channel from '../src/classes/channel';
import * as helper from '../src/classes/helper';
// import '../src/classes/channel';
// import '../src/classes/helper';
// import { readFile } from 'fs';					// Used to read/write from a file. (Import data)

// Global Variables
const client = new Client();
let channelPairList: channel.ChannelPair[] = [];			// A GLOBAL list of ChannelPair objects

/**
 * ==========================================================================================================================================
 * 																Discord Event Listeners
 * ==========================================================================================================================================
 */
client.login(token);
client.once('ready', () =>{
	helper.readData();
	channelPairList = helper.gatherChannelSettings();
	console.log('Listening for channel pairs...');
});

// Monitor for people to join the voice channel 
client.on('voiceStateUpdate', (oldState, newState) => {
	const omitList = ['497919497836167168', '647281949651632128']; // List of roles to omit from channel permissions modification Admin/Mod from role changes
	
	// Determine if we need to omit the user from the discord
	let omitUser = false;
	omitList.forEach(userToOmit => {
		if (newState.member!.roles.cache.has(userToOmit)){
			omitUser = true;
		}
	});

	// // See if voiceStateUpdate is updated for a listed channel pair
	if (!omitUser){ 
		let joinedChannel = newState.channel;
		let discordServer = newState.guild;
		
		// See if voiceStateUpdate is for a listed channel pair
		if(joinedChannel) { // User Joins a voice channel
			// Add the user to the text chat permissions
			let foundChannelPairIndex = channelPairList.findIndex(channelPair => channelPair.voiceChannel.channelID === newState.channelID); // Compare with the Voice Channel ID from the user
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
		} else if (!joinedChannel && oldState.channel) { // User leaves a voice channel
			// Remove the user from the text chat permissions
			let foundChannelPairIndex = channelPairList.findIndex(channelPair => channelPair.voiceChannel.channelID === oldState.channelID); // Compare with the Voice Channel ID from the user
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
	/**
	 * Send a message to the user in an embedded format
	 * @param title - Title of the message embed
	 * @param content - Message content. This should contain the majority of the message
	 */
	function displayMessage (title: string, content: string){
		let newMessage = {
			"embed": {
				"color": 160860,
				"fields": [
					{
						"name": `${title}`,
						"value": `${content}`,
						"inline": false
					}
				]
			}
		};
		message.channel.send(newMessage);
	}
	
	let messageContentUpper = message.content.toUpperCase(); 	// Used to provide non-case sensitive commands
	let messageArrayUpper = messageContentUpper.split(' '); 	// Used to access command information (non-case sensitive)
	
	// List all commands
	if(messageContentUpper === `${prefix}` || messageContentUpper === `${prefix}`[0]){ 
		helper.showBotDescription(message);
		message.delete(); // Clean chat history
	}

	// Detect messages coming from DMs
	else if (message.guild === null && !(messageArrayUpper.length > 3 && messageArrayUpper[0] > `${prefix}`)){ 
		// Do nothing for DMs
	}

	// else if(messageArrayUpper[0] == `${prefix}` || messageArrayUpper[0] == `${prefix}`[0]){
	// }
})
