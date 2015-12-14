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
	 * Display a line of feedback describing a resource's loading activity.
	 *
	 * @param {Resource} obj  - Resource in question
	 * @param {String}   text - Short description of what's just happened
	 */
	static log(obj, text){
		let type  = obj.constructor.name;
		let id    = obj.id || obj.name;
		let icon  = ICONS[type];

		type      = this.pad(type, 7);
		id        = this.pad(this.truncate(id, 19), 20);

		console.warn(`${icon || " "}  ${type}  ${id}  ${text}`);
	}
	

	/**
	 * Send a formatted/coloured error message to STDERR.
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
	 * Truncate the string-based representation of a value if it exceeds a given character limit.
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
	
	
	/**
	 * Display the program's help message, sending it to STDOUT.
	 *
	 * @return {String}
	 */
	static help(){
		let name = path.basename(process.argv[1]);
		let help = `
			Usage: ${name} [options] <resource-type> <id>

			Export a resource from Metal Archives with the given type and id.

			Options:

			  -h, --help                 Display this help message and exit
			  -e, --embed-images         Embed images directly into generated JSON
			  -p, --pretty-print         Pretty-print the JSON data
			  -s, --save-images <path>   Directory to save images to
			  -l, --log-level   <level>  Extent of logging feedback
			  -u, --user-config <path>   Path of user-login file, relative to program

			Run \`man ma-scraper' for full documentation.
		`.replace(/\t+/g, "    ");
		
		console.log(help);
		return help;
	}
}

export default Feedback;
