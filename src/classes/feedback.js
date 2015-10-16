"use strict";

const TYPE_ARTIST   = "artist";
const TYPE_BAND     = "band";
const TYPE_LABEL    = "label";
const TYPE_RELEASE  = "release";
const TYPE_USER     = "user";

const ICONS = {
	[TYPE_ARTIST]:   String.fromCodePoint(0x1F3AD),
	[TYPE_BAND]:     String.fromCodePoint(0x1F3B8),
	[TYPE_LABEL]:    String.fromCodePoint(0x1F516),
	[TYPE_RELEASE]:  String.fromCodePoint(0x1F4C0),
	[TYPE_USER]:     String.fromCodePoint(0x1F464)
};


class Feedback{

	/**
	 * Displays a line of feedback describing a resource's loading activity.
	 *
	 * @param {String} type - One of the TYPE_* string constants
	 * @param {Mixed}  id   - Numeric or string-based identifier for subject resource
	 * @param {String} text - Details describing what's going on
	 */
	static log(type, id, text){
		let ucType  = type[0].toUpperCase() + type.substr(1).toLowerCase();
		let icon    = ICONS[type] || "  ";

		type = this.pad(ucType, 7);
		id   = this.pad(this.truncate(id, 14), 14);
		console.info(`${icon}  ${type}  ${id}  ${text}`);
	}
	

	/**
	 * Sends a formatted/coloured error message to STDERR.
	 *
	 * @param {String} message
	 * @static
	 */
	static error(message){
		const RED     = "\x1B[38;5;196m";
		const BOLD    = "\x1B[1m";
		const RESET   = "\x1B[0m";
		console.error(`${RED}${BOLD}ERROR${RESET}${RED}: ${message}${RESET}`);
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
