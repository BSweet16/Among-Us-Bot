// Includes
import { Client, GuildMember } from 'discord.js';
import { prefix, token } from '../config.json';
import * as channel from '../src/classes/channel';
import * as helper from '../src/classes/helper';
// import '../src/classes/channel';
// import '../src/classes/helper';
// import { readFile } from 'fs';					// Used to read/write from a file. (Import data)

// Global Variables
enum cardColors{
	red = '#FD0061',
	green = '#008E44',
	yellow = '#F8C300'
}
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
	const omitList = ['497919497836167168']; // List of roles to omit from channel permissions modification Admin from role changes
	
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
		
		if(joinedChannel) { // User Joins a voice channel
			// Add the user to the text chat permissions
			let foundChannelPairIndex = channelPairList.findIndex(channelPair => channelPair.voiceChannel.id === newState.channelID); // Compare with the Voice Channel ID from the user
			if (foundChannelPairIndex >= 0){ 
				// Define permissions
				let overwriteOptions = { 
					VIEW_CHANNEL: true
				};

				// Find channel and update it
				let discordTextChannel = discordServer.channels.cache.find(discordChannel => {
					return discordChannel.id === channelPairList[foundChannelPairIndex].textChannel.id;
				});
				discordTextChannel!.updateOverwrite(newState.member!, overwriteOptions);
			}
		} else if (!joinedChannel && oldState.channel) { // User leaves a voice channel
			// Remove the user from the text chat permissions
			let foundChannelPairIndex = channelPairList.findIndex(channelPair => channelPair.voiceChannel.id === oldState.channelID); // Compare with the Voice Channel ID from the user
			if (foundChannelPairIndex >= 0){ 
				// Find channel and update it
				let discordTextChannel = discordServer.channels.cache.find(discordChannel => {
					return discordChannel.id === channelPairList[foundChannelPairIndex].textChannel.id;
				});
				let permissionStates = discordTextChannel!.permissionOverwrites.get(newState.member!.id)
				if (permissionStates){
					permissionStates.delete(); // Remove user from channel overwrites. 
				}
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
	function displayMessage (title: string = '', content: string = '', cardColor: string = cardColors.green){
		let newMessage = {
			"embed": {
				"color": cardColor,
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

	/**
	 * Determines if the given user has the role "Admin"
	 * @param member - The member object to evaluate
	 * @returns - True if the user has Admin role
	 */
	function isAdminRole(member: GuildMember | null): boolean{
		if (member){
			let foundAdmin = member.roles.cache.find(role => role.name === 'Admin');
			if (foundAdmin){
				return true;
			}
		} 
		return false;
	}

	/**
	 * Determines if the given user has the server permissions for an ADMINISTRATOR
	 * @param member - The member object to evaluate
	 * @returns - True if the user has Admin permissions from the server
	 */
	function isAdmin(member: GuildMember | null){
		if (member){
			return message.member?.hasPermission("ADMINISTRATOR")
		}
		return false;
	}
	
	// Contents of the chat message
	let messageContentUpper = message.content.toUpperCase(); 	// Used to provide non-case sensitive commands
	let messageArrayUpper = messageContentUpper.split(' '); 	// Used to access command information (non-case sensitive)
	var messageArray = message.content.split(' '); 				// Used to access command information
	
	// List all commands
	if(messageContentUpper === `${prefix}` || messageContentUpper === `${prefix}`[0]){ 
		helper.showBotDescription(message);
		message.delete(); // Clean chat history
	}

	// Detect messages coming from DMs
	else if (message.guild === null && !(messageArrayUpper.length > 3 && messageArrayUpper[0] > `${prefix}`)){ 
		// Do nothing for DMs
	}

	// Commands in format (PREFIX [Command] [... Parameters])
	else if(messageArrayUpper[0] === `${prefix}` || messageArrayUpper[0] === `${prefix}`[0]){

		// Create a channel pair
		if (messageArrayUpper[1] === "ADD"){ 
			if (messageArray.length !== 4){ // Incorrect number of parameters
				displayMessage('Among add [Voice Channel ID] [Text Channel ID]', 'Create a new channel pair', cardColors.yellow);
			}
			else if (!isAdmin(message.member) &&  !isAdminRole(message.member)){ // Check role permissions
				displayMessage('Invalid Permissions', 'You must have the \'Admin\' role to perform this command.', cardColors.red);
			}
			else{
				if (+messageArrayUpper[2]){ // Verify Voice Channel ID is a number
					if (+messageArrayUpper[3]){ // Verify Text Channel ID is a number
						// Find channels for pair
						let discordVoiceChannel = message.guild?.channels.cache.find(discordChannel => {
							return discordChannel.id === messageArrayUpper[2];
						});
						let discordTextChannel = message.guild?.channels.cache.find(discordChannel => {
							return discordChannel.id === messageArrayUpper[3];
						});

						// Build a new channel pair with the found channel information
						if (discordVoiceChannel){
							if (discordTextChannel){
								let newVoiceChannel = new channel.ChannelObject(discordVoiceChannel?.id, discordVoiceChannel?.name, discordVoiceChannel?.type);
								let newTextChannel = new channel.ChannelObject(discordTextChannel?.id, discordTextChannel?.name, discordVoiceChannel?.type);
								channelPairList.push(new channel.ChannelPair(newVoiceChannel, newTextChannel));
								displayMessage(`Channels Successfully paired`, `Voice Channel: **${discordVoiceChannel?.name}** \nText Channel: **${discordTextChannel?.name}**`);
							} else{
								displayMessage('Error', '__[Text Channel ID]__ not found.', cardColors.red);
							}
						} else{
							displayMessage('Error', '__[Voice Channel ID]__ not found.', cardColors.red);
						}
					} else{
						displayMessage('Error', '__[Voice Channel ID]__ should be a number.', cardColors.red);
					}
				} else {
					displayMessage('Error', '__[Text Channel ID]__ should be a number.', cardColors.red);
				}
			}
		}

		// Remove a channel pair
		else if (messageArrayUpper[1] == "REMOVE"){ 
			if (messageArray.length !== 4){ // Incorrect number of parameters
				displayMessage('Among remove [Voice Channel ID] [Text Channel ID]', 'Remove a pre-existing channel pair.', cardColors.yellow);
			}
			else if (!isAdmin(message.member) &&  !isAdminRole(message.member)){ // Check role permissions
				displayMessage('Invalid Permissions', 'You must have the \'Admin\' role to perform this command.', cardColors.red);
			}
			else{
				if (+messageArrayUpper[2]){ // Verify Voice Channel ID is a number
					if (+messageArrayUpper[3]){ // Verify Text Channel ID is a number
						let foundVoiceChannel: channel.ChannelObject | undefined;
						let foundTextChannel: channel.ChannelObject | undefined;
						
						// Remove the found channel pair
						channelPairList.find((channelPair, index) => {
							// See if either of the channels are found in each channel pair 
							let voiceChannelMatches = (channelPair.voiceChannel.id === messageArrayUpper[2]);
							let textChannelMatches = (channelPair.textChannel.id === messageArrayUpper[3]);
							if (voiceChannelMatches){
								foundVoiceChannel = channelPair.voiceChannel;
							}
							if (textChannelMatches){
								foundTextChannel = channelPair.textChannel;
							}

							// Remove channel if found
							if (voiceChannelMatches && textChannelMatches){
								channelPairList.splice(index, 1); 
							}
						});

						// Display status message 
						if (foundVoiceChannel && foundTextChannel){
							displayMessage('Channel pair removed', `Voice Channel: **${foundVoiceChannel.name}** \nText Channel: **${foundTextChannel?.name}**`);
						} else if (!foundVoiceChannel){
							displayMessage('Error', 'Unable to find a channel pair with the given __[Voice Channel]__ ID.', cardColors.red);
						} else if (!foundTextChannel){
							displayMessage('Error', 'Unable to find a channel pair with the given __[Text Channel]__ ID.', cardColors.red);
						} else{
							displayMessage('Error', 'Unable to find a channel pair with either channel IDs.', cardColors.red);
						}
					} else{
						displayMessage('Error', '__[Voice Channel ID]__ should be a number.', cardColors.red);
					}
				} else {
					displayMessage('Error', '__[Text Channel ID]__ should be a number.', cardColors.red);
				}
			}
		}

		// Display all current Channel Pairs
		else if (messageArrayUpper[1] == "LIST"){ 
			if (messageArray.length !== 2){
				displayMessage('Among list', 'Display the current list of Channel Pairs.', cardColors.yellow);
			}
			else{
				// Get Channel Pair data
				let pairString = '';
				channelPairList.forEach((channelPair, index) => {
					pairString += index !== 0 ? '\n\n' : ''; // Add line spacing
					pairString += `${index+1}: \nVoice Channel: **${channelPair.voiceChannel.name}** \nText Channel: **${channelPair.textChannel.name}**`;
				});
				if (!pairString){
					pairString = 'None';
				}

				// Display Channel Pairs
				displayMessage('Channel Pairs', pairString);
			}
		}

		// Unknown command
		else{
			displayMessage('Unknown Command', 'Try command \"**Among**\" to list available commands.', cardColors.red);
		} 
		message.delete(); // Clean chat history
	}
})
