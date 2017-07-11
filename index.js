var request = require('request');
var contextInfo = {};

//New session
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

//OnLaunch Message
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

//WElcome Response
function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Welcome to the Alexa';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'tell me hii';
    const shouldEndSession = false;

    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

//Response Generator
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

//help function 
function help(intent, session, callback){
	let cardTitle = intent.name;
	let speechOutput = 'I give weather notification';
	let sessionAttributes = {};
	let repromptText = 'Say city name with weather and I give the weather';
	const shouldEndSession = false;
	callback(sessionAttributes,  buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

//get weather notification
function weather(intent, session, callback){
	let cardTitle = intent.name;
	let speechOutput = '';
	let repromptText = '';
	let sessionAttributes = contextInfo;
	const shouldEndSession = false;
	
	if(intent.slots.city.value){
	    let city = intent.slots.city.value.toLowerCase();
	
		request({
			url: 'http://api.openweathermap.org/data/2.5/weather?APPID=&q=' + city,
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		}, function (error, response, body) {
			if (!error && response.statusCode == 200) {           //  console.log('BODY: ', body);
				let responseData = JSON.parse(body); 
			    let weather = responseData.weather[0].description ; // turn response into JSON
                speechOutput = 'It is ' + weather + " in " + city ;
		        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText,shouldEndSession)); 
			
			}else if(response.statusCode == 404){
				let responseData = JSON.parse(body); 
			    let message = responseData.message ; // turn response into JSON
                speechOutput = message;
		        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText,shouldEndSession)); 
			}else{
			    speechOutput = 'error occured';
				callback(sessionAttributes,buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
			}
		});
				
	}else{
	    speechOutput = "Pease specify the city";
		callback(sessionAttributes,buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));    
	}	
}

//Intent handler
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'weather') {
        weather(intent, session, callback);			
	} else if (intentName === 'help'){
		help(intent, session, callback);
	}else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

//Building Response
function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}

//On Session end 
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
}


//Main Handler
exports.handler = (event, context, callback) => {
	try {
        contextInfo = context;
        
        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request, event.session, (sessionAttributes, speechletResponse) => {
                callback(null, buildResponse(sessionAttributes, speechletResponse));
            });
			
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,event.session,(sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }

};