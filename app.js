// // require dependencies for the application
// var express = require('express');
// var bodyParser = require('body-parser');
var twilio = require('twilio');
var express = require('express');
var ConversationV1 = require('watson-developer-cloud/conversation/v1');
var bodyParser = require('body-parser');
var watson = require('watson-developer-cloud');

// // Create a simple Express web app that will parse incoming POST bodies
// var app = express();
// app.use(bodyParser.urlencoded({ extended: true }));

var initial_language = "en";


function translate(message, to='en') {
    // create a TwiML response object. This object helps us generate an XML
    // string that we will ultimately return as the result of this HTTP request
    console.log("Translating Message")
    var language_translation = watson.language_translator({
        url: "https://gateway.watsonplatform.net/language-translator/api",
        password: "NY5jpP3ouTqm",
        username: "142be989-9887-4e53-ab20-fa9e7fc354fe",
        version: 'v2'
    });
    console.log(1);
    var fromLanguage = "Target:";
    var req = message;
    var hasTarget = false;
    var hasSource = false;
    var tar;
    // make regexs for the source and Target language inputs in tex messages 
    var reg1 = new RegExp("(Target:en|Target:es|Target:fr|Target:ara|Target:ja)", 'i');
    var reg2 = new RegExp("(Source:en|Source:es|Source:fr|Source:ara|Target:ja)", 'i');

    var matchesTarget = req.match(reg1);
    try {
        if (matchesTarget && matchesTarget.length > 0) {
            hasTarget = true;
            tar = matchesTarget[0];
            tar = matchesTarget[0].slice(7, matchesTarget[0].length);
            // console.log(tar); // for debugging
            console.log(2);
        }
        else {
            tar = to;
            hasTarget = true;
        }
    } catch (err) { // null list 
        // var twiml = new twilio.TwimlResponse();
        // twiml.message(function () {
        //     // Watson uses ISO 639-1 expect arabic and egyptian 639-3            
        //     this.body("Include target to translate to 'Target:{langCode=en,es,fr,ara}'");
        // });
        // response.type('text/xml');
        // response.send(twiml.toString());
        console.error('Target not found');
        throw new Error(err);
    }
    console.log('z', hasTarget);
    if (hasTarget) {
        console.log("has target");
        var matchesSource = req.match(reg2);
        var src;
        try {
            if (matchesSource.length > 0) {
                hasSource = true;
                src = matchesSource[0];
                src = matchesSource[0].slice(7, matchesSource[0].length);
                initial_language = src;
                // console.log(src); // for debugging
                console.log('src is ', src, '***tar is ', tar);
                console.log('should return 1');
                if (tar === 'en' && src === 'en') {
                    // don't translate
                    console.log('should return 1');
                    resolve(message);
                    // return message;
                }
            }
        } catch (err) { // null list
            // Use Watson to Identify language
            console.log(3);
            var req = req.replace(reg1, "");
            return new Promise(function (resolve, reject) {
                language_translation.identify({ text: req },
                    function (err, identifiedLanguages) {
                        if (err) {
                            console.log(4);
                            console.log(err);
                            reject(err);
                        }

                        else {
                            console.log(5);
                            var identifiedStringfy = JSON.stringify(identifiedLanguages);
                            // console.log(identifiedStringfy);  // for debugging selected language                      
                            var identifiedSplit = identifiedStringfy.split(",");
                            var identifiedDoubleSplit = identifiedSplit[0].split(":");
                            var identifiedFinal = identifiedDoubleSplit[2].slice(1, identifiedDoubleSplit[2].length - 1);
                            fromLanguage = fromLanguage + identifiedFinal;
                            console.log("Identified final", identifiedFinal);
                            
                            if(identifiedFinal !== 'en' && identifiedFinal !== 'fr' && 
                            identifiedFinal !== 'es' && identifiedFinal !== 'ara') {
                                console.log("hit");
                                identifiedFinal = 'en';
                            }

                            console.log("error might be", fromLanguage, "correct ", identifiedFinal);

                            console.log('src is ', identifiedFinal, '***tar is ', tar);
                            console.log('should return 2')
                            if (identifiedFinal === 'en' && tar === 'en') {
                                // don't translate
                                console.log('should return 2')
                                resolve(message);
                            }

                            initial_language = identifiedFinal;
                            console.log("text", fromLanguage);
                            console.log("tar is", tar);
                            console.log(req, identifiedFinal, tar);

                            language_translation.translate({
                                text: req,
                                source: identifiedFinal,
                                target: tar
                            }, function (err, translation) {
                                console.log('F');
                                console.log(err, translation);
                                if (err) {
                                    console.log(6);
                                    console.log(err)
                                    reject(err);
                                }

                                else {
                                    /* HERE IS WHERE WE WILL PUT THE MEDICAL API LOGIC */
                                    console.log(7);
                                    //Get translation out of json object
                                    var tansStringfy = JSON.stringify(translation);
                                    console.log(tansStringfy);
                                    var transSplit = tansStringfy.split(",");
                                    var transDoubleSplit = transSplit[0].split(":");
                                    var transFinal = transDoubleSplit[2].slice(1, transDoubleSplit[2].length - 3);
                                    console.log(transFinal)
                                    // prepare the TwiML response 
                                    // twiml.message(function () {
                                    //     this.body(transFinal);
                                    // });
                                    // // Render an XML response
                                    // response.type('text/xml');
                                    // response.send(twiml.toString());
                                    console.log('THIS IS TRANS FINAL1', transFinal)
                                    resolve(transFinal);
                                }
                            });
                        }
                    });
            });
        }
        if (hasSource) {
            initial_language = src;
            // strip message  source inputs
            var req = req.replace(reg1, "");
            // console.log("req" + req);  // for debugging
            req = req.replace(reg2, "");
            // console.log("striped: "+req); // for debugging       
            // var twiml = new twilio.TwimlResponse();
            // console.log("src: "+src+" tar: "+tar); //for debugging
            // Use Watson to translate language
            return new Promise(function (resolve, reject) {
                language_translation.translate({
                    text: req,
                    source: src,
                    target: tar
                }, function (err, translation) {
                    if (err) {
                        console.log(err)
                        reject(err);
                    } else {
                        //Get translation out of json object
                        var tansStringfy = JSON.stringify(translation);
                        var transSplit = tansStringfy.split(",");
                        var transDoubleSplit = transSplit[0].split(":");
                        var transFinal = transDoubleSplit[2].slice(1, transDoubleSplit[2].length - 3);
                        // prepare the TwiML response 
                        // console.log("final:"+transFinal); // for debugging
                        // twiml.message(function () {
                        //     this.body(transFinal);
                        // });
                        // // Render an XML response
                        // response.type('text/xml');
                        // response.send(twiml.toString());
                        console.log('THIS IS TRANS FINAL2', transFinal);
                        resolve(transFinal);
                    }
                });
            });
        }
    }

};


// var client = require('twilio');

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));

var contexts = [];

app.post('/smssent', function (req, res) {
    res.end();
    console.log("We're in the post!")
    console.log("THIS IS REQ BODY", req.body.Body)
    translate(req.body.Body)
        .then(function (message) {
            var number = req.body.From;
            var twilioNumber = req.body.To;
            console.log('In', message, number, twilioNumber);

            var context = null;
            var index = 0;
            var contextIndex = 0;
            contexts.forEach(function (value) {
                console.log(value.from);
                if (value.from == number) {
                    context = value.context;
                    contextIndex = index;
                }
                index = index + 1;
            });

            console.log('Recieved message from ' + number + ' saying \'' + message + '\'');
            console.log(process.env.CONVERSATION_USERNAME, process.env.CONVERSATION_PASSWORD);

            var conversation = new ConversationV1({
                username: process.env.CONVERSATION_USERNAME,
                password: process.env.CONVERSATION_PASSWORD,
                path: { workspace_id: process.env.WORKSPACE_ID },
                version_date: ConversationV1.VERSION_DATE_2016_09_20
            });

            console.log({
                username: process.env.CONVERSATION_USERNAME,
                password: process.env.CONVERSATION_PASSWORD,
                path: { workspace_id: '7e200353-7bd2-4ad6-9929-0c682211edad' },
                version_date: ConversationV1.VERSION_DATE_2016_09_20
            })

            console.log(JSON.stringify(context));
            console.log(contexts.length);
            return new Promise(function (resolve, reject) {
                conversation.message({
                    input: { text: message },
                    workspace_id: process.env.WORKSPACE_ID,
                    context: context
                }, function (err, response) {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        console.log(response.output.text[0]);
                        if (context == null) {
                            contexts.push({ 'from': number, 'context': response.context });
                        } else {
                            contexts[contextIndex].context = response.context;
                        }

                        var intent = response.intents[0].intent;
                        console.log(intent);
                        console.log("intent");
                        if (intent == "done") {
                            //contexts.splice(contexts.indexOf({'from': number, 'context': response.context}),1);
                            contexts.splice(contextIndex, 1);
                            // Call REST API here (order pizza, etc.)
                        }



                        //  client.messages.create({
                        //    from: twilioNumber,
                        //    to: number,
                        //    body: response.output.text[0]
                        //  }, function(err, message) {
                        //    if(err) {
                        //      console.error(err.message);
                        //    }
                        //  });
                        resolve(response.output.text[0]);
                        // client.messages.create({
                        //     from: '+16313874080',
                        //     to: '+12032589303',
                        //     // body: response.output.text[0]
                        //     body: reply
                        // }, function(err, message) {
                        //     if(err) {
                        //         console.log("Twilio")
                        //         console.error(err.message);
                        //     }
                        // });
                    }
                });
            })
        })
        .then(function (x) {
            console.log('x', x);
            console.log('y', initial_language);
            return translate(x, initial_language);
        })
        .then(function (reply) {
            console.log(reply, 'reply');
            var client = require('twilio')(
                'ACa797f4d78e64abc0c8f760ad492b9291',
                'ee57133998b3ba6f19cb7ac6b5cb18b2'
            );
            client.messages.create({
                from: '+16313874080',
                to: '+12032589303',
                // body: response.output.text[0]
                body: reply
            }, function (err, message) {
                if (err) {
                    console.log("Twilio")
                    console.error(err.message);
                }
            });
        })
        .catch(function (err) {
            console.log('promise failed', err);
        })
});

app.listen(process.env.PORT || 3000, function () {
    console.log('Example app listening on port 3000!');
});