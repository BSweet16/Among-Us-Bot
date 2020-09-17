import { Message } from "discord.js";
import { ChannelObject, ChannelPair } from "./channel";

/**
 * Displays a help menu for the user describing the bot.
 * @param givenMessage - A Message object from DiscordAPI that contains information that called the command.
 */
export function showBotDescription (givenMessage: Message){
	let helpMenu = {
		"content": "**Among Us**",
		"embed": {
			"description": "This bot controls server setup for Among Us in Discord. ",
			"color": 160860,
			"fields": [
				{
					"name": "Among add [Voice Channel Code] [Text Channel Code]",
					"value": "This command pairs the [Voice Channel] with the [Text Channel] so that only the people currently in [Voice Channel] can see [Text Channel].",
					"inline": false
				},
				{
					"name": "Among remove [Voice Channel Code] [Text Channel Code]",
					"value": "This command removes the link between the [Voice Channel] with the [Text Channel] so that only the people currently in [Voice Channel] can see [Text Channel].",
					"inline": false
				},
			]
		}
	};
	givenMessage.channel.send(helpMenu);
}

/**
 * Read the file for the pre-existing channel pairs.
 */
export function readData(){
	// Read Team Names
	// readFile(teamsFile , 'utf8', function(err, data) {
	// 	if (err) throw err;
	// 	teamsListData = data;
	// });
	// if (teamsListData){
	// 	teamNamesList = teamsListData.split('\n');
	// }
}

/** 
 * Update the channel pairs with the current member permissions
 */
export function gatherChannelSettings(): ChannelPair[]{
	/** 
	 * ==================
	 * TEMP Hardcode data 
	 * ==================
	 * */ 
	let myVoiceChannel = new ChannelObject('754869751347544245', 'Among Us', 'Voice');
	let myTextChannel = new ChannelObject('754908030327586857', 'general', 'Text');
	let myChannelPair = new ChannelPair(myVoiceChannel, myTextChannel);
	return [myChannelPair];
}