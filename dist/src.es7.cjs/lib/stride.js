"use strict";
var request = require('request');
var jwtUtil = require('jwt-simple');
module.exports = function (app) {
    var API_BASE_URL = app.environment == "production" ? 'https://api.atlassian.com' : 'https://api.stg.atlassian.com';
    var API_AUDIENCE = app.environment == "production" ? "api.atlassian.com" : "api.stg.atlassian.com";
    var AUTH_API_BASE_URL = app.environment == "production" ? 'https://auth.atlassian.com' : 'https://atlassian-account-stg.pus2.auth0.com';
    /**
     * Get an access token from the Atlassian Identity API
     */
    var token = null;
    function getAccessToken(callback) {
        if (!token || Date.now() > token.refresh_time) {
            //No token yet, token expired or about to expire
            //Generate a new token
            var options = {
                uri: AUTH_API_BASE_URL + '/oauth/token',
                method: 'POST',
                json: {
                    grant_type: "client_credentials",
                    client_id: app.clientId,
                    client_secret: app.clientSecret,
                    "audience": API_AUDIENCE
                }
            };
            request(options, function (err, response, body) {
                if (response && response.statusCode === 200 && body.access_token) {
                    token = body;
                    //refresh the token a minute before it expires (tokens last for an hour)
                    token.refresh_time = Date.now() + (token.expires_in - 60) * 1000;
                    callback(null, body.access_token);
                }
                else {
                    callback("could not generate access token: " + JSON.stringify(response));
                }
            });
        }
        else {
            //Reuse the cached token
            callback(null, token.access_token);
        }
    }
    /**
     * Functions to call the Stride API
     */
    /**
     * https://developer.atlassian.com/cloud/stride/apis/rest/#api-site-cloudId-conversation-conversationId-message-post
     */
    function sendMessage(cloudId, conversationId, messageBody, callback) {
        getAccessToken(function (err, accessToken) {
            if (err) {
                callback(err);
            }
            else {
                var uri = API_BASE_URL + '/site/' + cloudId + '/conversation/' + conversationId + '/message';
                var options = {
                    uri: uri,
                    method: 'POST',
                    headers: {
                        authorization: "Bearer " + accessToken,
                        "cache-control": "no-cache"
                    },
                    json: {
                        body: messageBody
                    }
                };
                request(options, function (err, response, body) {
                    callback(err, body);
                });
            }
        });
    }
    /**
     * https://developer.atlassian.com/cloud/stride/apis/rest/#api-site-cloudId-conversation-user-userId-message-post
     */
    function sendUserMessage(token, cloudId, userId, message, callback) {
        var options = {
            uri: API_BASE_URL + '/site/' + cloudId + '/conversation/user/' + userId + '/message',
            method: 'POST',
            headers: {
                authorization: "Bearer " + token,
                "cache-control": "no-cache"
            },
            json: {
                body: message
            }
        };
        request(options, function (err, response, body) {
            callback(err, body);
        });
    }
    /**
     * https://developer.atlassian.com/cloud/stride/apis/rest/#api-site-cloudId-conversation-conversationId-get
     */
    function getConversation(token, cloudId, conversationId, callback) {
        var options = {
            uri: API_BASE_URL + '/site/' + cloudId + '/conversation/' + conversationId,
            method: 'GET',
            headers: {
                authorization: "Bearer " + token,
                "cache-control": "no-cache"
            }
        };
        request(options, function (err, response, body) {
            callback(err, JSON.parse(body));
        });
    }
    /*
     * https://developer.atlassian.com/cloud/stride/apis/rest/#api-site-cloudId-conversation-post
     */
    function createConversation(token, cloudId, name, privacy, topic, callback) {
        var body = {
            name: name,
            privacy: privacy,
            topic: topic
        };
        var options = {
            uri: API_BASE_URL + '/site/' + cloudId + '/conversation',
            method: 'POST',
            headers: {
                authorization: "Bearer " + token,
                "cache-control": "no-cache"
            },
            json: body
        };
        request(options, function (err, response, body) {
            callback(err, body);
        });
    }
    /**
     * https://developer.atlassian.com/cloud/stride/apis/rest/#api-site-cloudId-conversation-conversationId-archive-put
     */
    function archiveConversation(token, cloudId, conversationId, callback) {
        var options = {
            uri: API_BASE_URL + '/site/' + cloudId + '/conversation/' + conversationId + '/archive',
            method: 'PUT',
            headers: {
                authorization: "Bearer " + token,
                "cache-control": "no-cache"
            }
        };
        request(options, function (err, response, body) {
            callback(err, body);
        });
    }
    /**
     * https://developer.atlassian.com/cloud/stride/apis/rest/#api-site-cloudId-conversation-conversationId-message-get
     */
    function getConversationHistory(token, cloudId, conversationId, callback) {
        var options = {
            uri: API_BASE_URL + '/site/' + cloudId + '/conversation/' + conversationId + "/message?limit=5",
            method: 'GET',
            headers: {
                authorization: "Bearer " + token,
                "cache-control": "no-cache"
            }
        };
        request(options, function (err, response, body) {
            callback(err, JSON.parse(body));
        });
    }
    /**
     * https://developer.atlassian.com/cloud/stride/apis/rest/#api-site-cloudId-conversation-conversationId-roster-get
     */
    function getConversationRoster(token, cloudId, conversationId, callback) {
        var options = {
            uri: API_BASE_URL + '/site/' + cloudId + '/conversation/' + conversationId + "/roster",
            method: 'GET',
            headers: {
                authorization: "Bearer " + token,
                "cache-control": "no-cache"
            }
        };
        request(options, function (err, response, body) {
            callback(err, JSON.parse(body));
        });
    }
    /**
     * Send a file to a conversation. you can then include this file when sending a message
     */
    function sendMedia(cloudId, conversationId, name, stream, callback) {
        getAccessToken(function (err, accessToken) {
            if (err) {
                callback(err);
            }
            else {
                var options = {
                    uri: API_BASE_URL + '/site/' + cloudId + '/conversation/' + conversationId + '/media?name=' + name,
                    method: 'POST',
                    headers: {
                        authorization: "Bearer " + accessToken,
                        'content-type': 'application/octet-stream'
                    },
                    body: stream
                };
                request(options, function (err, response, body) {
                    console.log("upload file: " + response.statusCode);
                    callback(err, body);
                });
            }
        });
    }
    function updateGlanceState(cloudId, conversationId, glanceKey, stateTxt, callback) {
        getAccessToken(function (err, accessToken) {
            if (err) {
                callback(err);
            }
            else {
                var uri = API_BASE_URL + '/app/module/chat/conversation/chat:glance/' + glanceKey + '/state';
                console.log(uri);
                var options = {
                    uri: uri,
                    method: 'POST',
                    headers: {
                        authorization: "Bearer " + accessToken,
                        "cache-control": "no-cache"
                    },
                    json: {
                        "context": {
                            "cloudId": cloudId,
                            "conversationId": conversationId
                        },
                        "label": stateTxt,
                        "metadata": {}
                    }
                };
                request(options, function (err, response, body) {
                    callback(err, body);
                });
            }
        });
    }
    function updateConfigurationState(cloudId, conversationId, configKey, state, callback) {
        getAccessToken(function (err, accessToken) {
            if (err) {
                callback(err);
            }
            else {
                var uri = API_BASE_URL + '/app/module/chat/conversation/chat:configuration/' + configKey + '/state';
                console.log(uri);
                var options = {
                    uri: uri,
                    method: 'POST',
                    headers: {
                        authorization: "Bearer " + accessToken,
                        "cache-control": "no-cache"
                    },
                    json: {
                        "context": {
                            "cloudId": cloudId,
                            "conversationId": conversationId
                        },
                        "configured": state
                    }
                };
                request(options, function (err, response, body) {
                    console.log(response.statusCode);
                    console.log(response.body);
                    callback(err, body);
                });
            }
        });
    }
    /**
     * Atlassian Users API
     */
    function getUser(cloudId, userId, callback) {
        getAccessToken(function (err, accessToken) {
            if (err) {
                callback(err);
            }
            else {
                var options = {
                    uri: API_BASE_URL + '/scim/site/' + cloudId + '/Users/' + userId,
                    method: 'GET',
                    headers: {
                        authorization: "Bearer " + accessToken,
                        "cache-control": "no-cache"
                    }
                };
                request(options, function (err, response, body) {
                    callback(err, JSON.parse(body));
                });
            }
        });
    }
    /**
     * Utility functions
     */
    function sendTextMessage(cloudId, conversationId, messageTxt, callback) {
        var message = {
            version: 1,
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: messageTxt
                        }
                    ]
                }
            ]
        };
        sendMessage(cloudId, conversationId, message, callback);
    }
    function sendDocumentReply(message, reply, callback) {
        var cloudId = message.cloudId;
        var conversationId = message.conversation.id;
        var userId = message.sender.id;
        sendMessage(cloudId, conversationId, reply, function (err, response) {
            callback(err, response);
        });
    }
    function sendTextReply(message, replyTxt, callback) {
        var cloudId = message.cloudId;
        var conversationId = message.conversation.id;
        var userId = message.sender.id;
        var reply = {
            version: 1,
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: replyTxt
                        }
                    ]
                }
            ]
        };
        sendMessage(cloudId, conversationId, reply, function (err, response) {
            callback(err, response);
        });
    }
    /**
     * Convert an Atlassian document to plain text
     */
    function convertDocToText(document, callback) {
        getAccessToken(function (err, accessToken) {
            if (err) {
                callback(err);
            }
            else {
                var options = {
                    uri: API_BASE_URL + '/pf-editor-service/render',
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        accept: 'text/plain',
                        authorization: "Bearer " + accessToken
                    },
                    json: document
                };
                request(options, function (err, response, body) {
                    if (response && response.statusCode === 200) {
                        callback(null, body);
                    }
                    else {
                        callback("error converting document: " + JSON.stringify(response));
                    }
                });
            }
        });
    }
    return {
        getAccessToken: getAccessToken,
        sendDocumentMessage: sendMessage,
        sendUserMessage: sendUserMessage,
        getConversation: getConversation,
        getUser: getUser,
        createConversation: createConversation,
        archiveConversation: archiveConversation,
        getConversationHistory: getConversationHistory,
        getConversationRoster: getConversationRoster,
        sendTextMessage: sendTextMessage,
        sendDocumentReply: sendDocumentReply,
        updateGlanceState: updateGlanceState,
        updateConfigurationState: updateConfigurationState,
        sendTextReply: sendTextReply,
        convertDocToText: convertDocToText,
        sendMedia: sendMedia
    };
};
//# sourceMappingURL=stride.js.map