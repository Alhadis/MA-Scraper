"use strict";


/**
 * Class to hold each of the session's configurable settings.
 */
class Options{
	
	/**
	 * Initialises a new Options object and parses CLI arguments.
	 *
	 * @param {Array} input - Reference to unfiltered argv array
	 * @constructor
	 */
	constructor(input){
		
		let {options, argv} = getOptions(input, {
			"-h, --help":          "",
			"-e, --embed-images":  "",
			"-p, --pretty-print":  "",
			"-s, --save-images":   "<path>",
			"-l, --log-level":     "<n=\\d+>",
			"-u, --user-config":   "<path>"
		});
		
		/** Normalise option values, deferring to defaults when omitted */
		this.help         = options.help;
		this.embedImages  = options.embedImages;
		this.prettyPrint  = options.prettyPrint;
		this.saveImages   = options.saveImages;
		this.logLevel     = options.logLevel   || 4;
		this.userConfig   = options.userConfig || ".devrc.json";
		
		/** Store leftover arguments for subcommand interpretation */
		this.argv = argv;
	}
}


export default Options;
