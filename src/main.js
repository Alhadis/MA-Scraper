"use strict";

import Band      from "./classes/band.js";
import Artist    from "./classes/artist.js";
import Scraper   from "./classes/scraper.js";

const RED     = "\x1B[38;5;196m";
const BOLD    = "\x1B[1m";
const RESET   = "\x1B[0m";

let onError   = e => console.error(`${RED}${BOLD}ERROR${RESET}${RED}: ${e}${RESET}`);



let creds     = JSON.parse(fs.readFileSync(".devrc.json"));
let username  = creds.username;
let password  = creds.password;
let cookie    = creds.cookie;

Scraper.cookie = cookie;
Scraper.init(username, password)
	.catch(onError)
	.then(m => { new Band(3540334729); });
