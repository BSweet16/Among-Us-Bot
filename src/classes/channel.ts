/**
 * A basic channel with information. 
 * @param newChannelID - The ID Code of the channel
 * @param newChannelName - The Name of the channel
 * @param newChannelType - The type of the channel. ("Text" or "Voice")
 * @param newUserList - The list of users currently given access to the channel
 */
export class ChannelObject{
	id: string;
	name: string;
	type: string;
	
	constructor(newChannelID: string = '', newChannelName: string = '', newChannelType: string = ''){
		this.id = newChannelID;
		this.name = newChannelName;
		this.type = newChannelType;
	}
}

/**
 * Outline of a text/voice channel pair. This pair should consist of 2 ChannelObjects.
 * @param newVoiceChannel - ChannelObject that contains the data for the voice channel of the pair.
 * @param newTextChannel - ChannelObject that contains the data for the text channel of the pair.
 */
export class ChannelPair{
	voiceChannel: ChannelObject;
	textChannel: ChannelObject;

	constructor(newVoiceChannel: ChannelObject, newTextChannel: ChannelObject){
		this.voiceChannel = newVoiceChannel;
		this.textChannel = newTextChannel;
	}
}