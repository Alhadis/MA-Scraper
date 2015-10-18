#!/usr/local/bin/node --es_staging
"use strict";

/** Load core Node.JS modules */
global.util         = require("util");
global.fs           = require("fs");
global.process      = require("process");
global.HTTP			= require("http");
global.queryString  = require("querystring");

/** Load top-level NPM modules */
global.Babel        = require("babel");
global.JSDom        = require("jsdom");
global.fetch        = require("node-fetch");
global.CookieJar    = require("tough-cookie");



/** Top-level wrapper to enable ES6 module importing/exporting */
const ES6ModuleLoader		 = require("es6-module-loader").System;
ES6ModuleLoader.transpiler	 = "babel";
ES6ModuleLoader.babelOptions = {
	whitelist: [
		"es6.destructuring",
		"es6.modules",
		"es6.parameters",
		"es6.regex.sticky",
		"es6.regex.unicode"
	]
};
ES6ModuleLoader.import("./src/main.js")
	.catch(e => { console.error(e); })
