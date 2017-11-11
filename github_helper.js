const fs = require('fs');
const https = require('https');
const https_sync = require('sync-request');

var util = require('./util.js');
var fb = require("./fb_helper.js');

var CONST = JSON.parse(fs.readFileSync("./secret.json", 'UTF-8'));

module.exports = {
    "verify_user": function(username) {
        var path = "/users/" + username;
        var res = github_get_req(path);
		//console.log("res: " + JSON.stringify(res));
		if ((res != null) && (res.login == username)) {
            return true;
        } else {
            return false;
        }
    },

	"create_repo": function(id) {
		console.log("Github - create_repo: ");

		var user = util.db.get(id);
		if (user == null) {
			return null;
		}

		var req = {
			"name": user.repo.name,
			"description": user.repo.description,
			"private": false
		};

		github_post_req(id, "/user/repos", req);
	},
	
	"get_my_repo" : function() {
		test_get_my_repo();
	}
};

function github_post_req(id, path, obj)
{
	var username = CONST.github_username;
	var passw = CONST.github_token;
	var auth = 'Basic ' + new Buffer(username + ':' + passw).toString('base64');

	var options = {
		host : "api.github.com",
		path : path,
		method : "PATH",
		headers : {
			'Authorization' : auth,
			'User-Agent': 'curl/7.47.0',
			'Accept': '*/*'
		}
	};

	var req = https.request(options, function(err, res) {
		var data = "";

		if (err) {
			console.log("github_post_req: " + err);
			return;
		}

		res.on('data', function(chunk) {
			data += chunk;
		});

		res.on('end', function() {
			console.log("github_post_req - data: " + data);
		
			var user = util.db.get(this.id);
			if (user == null) {
				fb.delete_and_startover(this.id);
				return;
			}

			var json_obj = JSON.parse(data);
			user.repo.github_url = json_obj.github_url;
			util.update_db(this.id, user);

			var msg = "repo created successfully. you can clone it from " + json_obj.github_url;
			fb.send_plain_msg(this.id, msg);

		}.bind( {"id": this.id}  ));

	}.bind( {"id": id} ));

	req.on('error', function(e) {
		console.log(`problem with request: ${e.message}`);
	});

	req.write(JSON.stringify(obj));
	req.end();
}


function github_get_req(path)
{
	var username = CONST.github_username;
	var passw = CONST.github_token;
	var auth = 'Basic ' + new Buffer(username + ':' + passw).toString('base64');

	var option = {
		host : "api.github.com",
		path : path,
		method : "GET",
		headers : {
			'Authorization' : auth,
			'User-Agent': 'curl/7.47.0',
			'Accept': '*/*'
		}
	};

	var res = https_sync("GET", "https://api.github.com" + path, option);

	if (res.statusCode == 200) {
		return JSON.parse(res.getBody('utf8'));
	} else {
		return null;
	}
}

/*** Test Functions ***/
function test_get_my_repo()
{
	console.log("Starting test_get_my_repo");

	var username = CONST.github_username;
	var passw = CONST.github_token;
	var auth = 'Basic ' + new Buffer(username + ':' + passw).toString('base64');

	var option = {
		host : "api.github.com",
		path : "/user/repos",
		method : "GET",
		headers : {
			'Authorization' : auth,
			//'User-Agent': 'curl/7.47.0',
			'Accept': '*/*'
		}
	};

	var res = https_sync("GET", "https://api.github.com", option);

	if (res.statusCode == 200) {
		console.log(res.getBody('utf8'));
	} else {
		console.log("Error: " + res.statusCode);
	}
}
