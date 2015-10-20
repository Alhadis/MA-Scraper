"use strict";

const RED     = "\x1B[38;5;196m";
const GREY    = "\x1B[38;5;8m";
const BOLD    = "\x1B[1m";
const RESET   = "\x1B[0m";


const ICONS = {
	Artist:   String.fromCodePoint(0x1F3AD),
	Band:     String.fromCodePoint(0x1F3B8),
	Label:    String.fromCodePoint(0x1F516),
	Release:  String.fromCodePoint(0x1F4C0),
	User:     String.fromCodePoint(0x1F464)
};


class Feedback{

	/**
	 * Displays a line of feedback describing a resource's loading activity.
	 *
	 * @param {Resource} obj  - Resource in question
	 * @param {String}   text - Short description of what's just happened
	 */
	static log(obj, text){
		let type  = obj.constructor.name;
		let id    = obj.id || obj.name;
		let icon  = ICONS[type];

		/** Suppress output for minor resource types */
		if(!icon) return;

		type      = this.pad(type, 7);
		id        = this.pad(this.truncate(id, 16), 16);

		console.info(`${icon || " "}  ${type}  ${id}  ${text}`);
	}
	

	/**
	 * Sends a formatted/coloured error message to STDERR.
	 *
	 * @param {String|Error} message
	 * @static
	 */
	static error(message){
		console.error(`${RED}${BOLD}ERROR${RESET}${RED}: ${message.stack || message}${RESET}`);
	}
	


	/**
	 * Helper method to pad a string with trailing whitespace.
	 *
	 * @param {String}  string   - Text to operate on
	 * @param {Number}  width    - Desired width, including added whitespace
	 * @param {Boolean} reverse  - If set, will right-align text by prepending it with space instead
	 * @return {String}
	 */
	static pad(string, width, reverse){
		let slug = ("\xA0".repeat(Math.max(0, width - string.length)));
		return reverse ? (slug + string) : (string + slug);
	}
	
	
	/**
	 * Truncates the string-based representation of a value if it exceeds a given character limit.
	 *
	 * @param {Mixed} value - The variable to truncate; typecast to a string beforehand
	 * @param {Number} limit - Maximum number of characters
	 * @return {String}
	 */
	static truncate(value, limit, marker = "…"){
		let output = String(value);
		if(output.length > limit)
			output = output.substr(0, limit) + marker;
		return output;
	}
}

export default Feedback;
