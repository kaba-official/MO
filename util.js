const fs = require('fs');
const https = require('https');
const https_sync = require('sync-request');

var flatfile = require('flat-file-db');
var db = flatfile.sync('./fox.db');

var CONST = JSON.parse(fs.readFileSync("./secret.json", 'UTF-8'));
var fb_url = "graph.facebook.com";
var path = "/v2.6/me/messages?access_token=" + CONST.page_access_token;

module.exports = {

    "add_new_user": function(user_id) {
        var newEmptyObject = {
            "user_id": user_id,
            "username": "",
			"current_repo": null,
            "repos": "[]",
            "stage": "NEW",
            "context": "WAITING_FOR_GITHUB_USERNAME",
            "state": "NEW",
			"repo": {},
			"issue": {},
			"comment": {}
        };
        module.exports.update_db(user_id, newEmptyObject);
        console.log("new user " + user_id + " added");
    },

    "add_recipient": function(response, recipient) {
        response.recipient = {};
        response.recipient.id = recipient;
    },

    "add_msg": function(response, message) {
        response.message = {};
        response.message.text = message;
    },

    "add_quick_reply": function(response, message, quick_replies) {
        module.exports.add_msg(response, message);
        response.message.quick_replies = quick_replies;
    },

    "add_username": function(user, username) {
        user.username = username;
        module.exports.update_db(user.user_id, user);
    },

    "update_db": function(id, object) {
        console.log(id);
        console.log(JSON.stringify(object));
        //db.del(id);
        db.put(id, object);
    },

    /* Facebook communication functions */
    "send_post_req": function(message) {
        console.log("sending request: " + JSON.stringify(message));

        var options = {
            hostname: fb_url,
            port: 443,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        console.log("sending response: " + JSON.stringify(options));

        var req = https.request(options, function(err, res, body) {});

        req.on('error', function(e) {
            console.log(`problem with request: ${e.message}`);
        });

        req.write(JSON.stringify(message));
        req.end();
    },

    "send_plain_msg": function(id, msg) {
        //TODO: Add message type. Mandatory from May/2018
        var res = {};
        module.exports.add_recipient(res, id);
        module.exports.add_msg(res, msg);
        module.exports.send_post_req(res);
    },

    "send_quick_reply": function(id, msg, quick_replies) {
        var res = {};
        module.exports.add_recipient(res, id);
        module.exports.add_quick_reply(res, msg, quick_replies);
        module.exports.send_post_req(res);
    },

    "not_understood": function(id) {
        module.exports.send_plain_msg(id, "Sorry sir. I'm yet to evolve for your sofisticated language");
    },

    "delete_and_startover": function(user_id) {
        var user;

        if (!db.has(user_id)) {
            /* Not possible */
            return;
        } else {
            user = db.get(user_id);
        }

        var msg = "Sorry sir. I forget you. Lets startover";
        module.exports.send_plain_msg(user_id, msg);

        user.stage = "START_OVER";
        user.context = user.state = "NEW";
        module.exports.update_db(user_id, user);
        msg = "Hii sir";
        module.exports.send_plain_msg(user_id, msg);
    }
};

module.exports.db = db;
