"use strict";

const {
	lua,
	lauxlib,
	lualib,
	to_luastring
} = require("fengari");
const assert = require("assert");

describe("fengari-interop", function() {
	it("loads successfully", function() {
		const jslib = require("../src/jslib.js");
		assert(typeof jslib.luaopen_js === "function");
	});

	const new_state = function() {
		const jslib = require("../src/jslib.js");

		const L = lauxlib.luaL_newstate();
		lualib.luaL_openlibs(L);
		lauxlib.luaL_requiref(L, to_luastring("js"), jslib.luaopen_js, 0);
		return L;
	};

	it("can be required from lua", function() {
		const L = new_state();
		if (lauxlib.luaL_dostring(L, to_luastring('require("js")')) !== lua.LUA_OK) {
			throw lua.lua_tojsstring(L, -1);
		}
	});

	it("pushes same null every time", function() {
		const jslib = require("../src/jslib.js");
		const L = new_state();
		if (lauxlib.luaL_loadstring(L, to_luastring(`
		local null = ...
		local js = require "js"
		assert(null == js.null)
		assert(rawequal(null, js.null))
		`)) !== lua.LUA_OK) {
			throw lua.lua_tojsstring(L, -1);
		}
		jslib.push(L, null);
		if (lua.lua_pcall(L, 1, 0, 0) !== lua.LUA_OK) {
			throw jslib.tojs(L, -1);
		}
	});

	it("allows calls with no 'this' or arguments", function() {
		const jslib = require("../src/jslib.js");
		const L = new_state();
		if (lauxlib.luaL_loadstring(L, to_luastring(`
		local js = require "js"
		js.global.Date.now()
		`)) !== lua.LUA_OK) {
			throw lua.lua_tojsstring(L, -1);
		}
		if (lua.lua_pcall(L, 0, 0, 0) !== lua.LUA_OK) {
			throw jslib.tojs(L, -1);
		}
	});
});
