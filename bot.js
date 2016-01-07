/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
          \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
           \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit is has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


var Botkit = require('./lib/Botkit.js')
var os = require('os');

var controller = Botkit.slackbot({
  debug: false,

});

var _bots = {};

var bot = controller.spawn(
  {
    token:process.env.token
  }
).startRTM();

function trackBot(bot) {
  _bots[bot.config.token] = bot;
}

controller.on('create_bot',function(bot,config) {
  console.log('createbot called');
  if (_bots[bot.config.token]) {
    // already online! do nothing.
  } else {
    bot.startRTM(function(err) {

      if (!err) {
        trackBot(bot);
      }

      bot.startPrivateConversation({user: config.createdBy},function(err,convo) {
        if (err) {
          console.log(err);
        } else {
          convo.say('I am a bot that has just joined your team');
          convo.say('You must now /invite me to a channel so that I can be of use!');
        }
      });

    })
  }

});

/*controller.hears(['hello','hi'],'direct_message,direct_mention,mention',function(bot,message) {


  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'robot_face',
  },function(err,res) {
    if (err) {
      bot.botkit.log("Failed to add emoji reaction :(",err);
    }
  });


  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.name) {
      bot.reply(message,"Hello " + user.name+"!!");
    } else {
      bot.reply(message,"Hello.");
    }
  });
})
*/
controller.hears(['call me (.*)'],'direct_message,direct_mention,mention,ambient',function(bot,message) {
  var matches = message.text.match(/call me (.*)/i);
  var name = matches[1];
  controller.storage.users.get(message.user,function(err,user) {
    if (!user) {
      user = {
        id: message.user,
      }
    }
    user.name = name;
    controller.storage.users.save(user,function(err,id) {
      bot.reply(message,"Got it. I will call you " + user.name + " from now on.");
    })
  })
});

controller.hears(['what is my name','who am i'],'direct_message,direct_mention,mention,ambient',function(bot,message) {

  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.name) {
      bot.reply(message,"Your name is " + user.name);
    } else {
      bot.reply(message,"I don't know yet!");
    }
  })
});


controller.hears(['shutdown'],'direct_message,direct_mention,mention',function(bot,message) {

  bot.startConversation(message,function(err,convo) {
    convo.ask("Are you sure you want me to shutdown?",[
      {
        pattern: bot.utterances.yes,
        callback: function(response,convo) {
          convo.say("Bye!");
          convo.next();
          setTimeout(function() {
            process.exit();
          },3000);
        }
      },
      {
        pattern: bot.utterances.no,
        default:true,
        callback: function(response,convo) {
          convo.say("*Phew!*");
          convo.next();
        }
      }
    ])
  })
})


controller.hears(['Hello','hi'],'direct_message,direct_mention,mention,ambient',function(bot,message) {
  controller.storage.users.get(message.user,function(err,user) {
    if (!user) {
       user = {
          id: "noID",
          name: "Seda"
       }
    }


    bot.startConversation(message,function(err,convo) {
      convo.say("Welcome, " + user.name + "! To get started, we'll need some more information from you.");
      convo.ask(
         "What is the maximum you’d like to spend on rent in Austin, TX? You can type in whole numbers with no decimal points or commas ('1200').",[
        {
          pattern: /^[0-9]+$/ ,
          callback: function(response,convo) {
            if (+response.text < 500) {
              convo.say("Lots of luck, I see that you're looking for a rental in Austin, TX with a maximum rent of $" + response.text + ". Here is the first result:");
              convo.say("http://rentals-www-staging.herokuapp.com/search/detroit-mi?filters%5Bprice_max%5D=500&property_id=4582676573");
              convo.next();
            } else {
              convo.say("Awesome, I see that you're looking for a rental in Austin, TX with a maximum rent of $" + response.text + ". Here is the first result:");
              convo.say("http://rentals-www-staging.herokuapp.com/search/austin-tx/hyde-park?property_id=7140476068");
              convo.say(":thumbsup: Okay Seda, I’ve got you all set up. I’ll notify you here with new listings that match your criteria, as soon as they are available. Remember, if you ever need help or want to change or add your search criteria, just type ‘help’.");
              convo.say("To see all results click http://rentals-www-staging.herokuapp.com/search/austin-tx/hyde-park?filters%5Bprice_max%5D=" + response.text);
              convo.next();
            }
          }
        },
        {
          pattern: /^[a-zA-Z]+$/,
          callback: function(response,convo) {
            convo.say("Okay! Remember, if you ever need help or want to change or add your search criteria, just type ‘help’.");
            convo.stop();
          }
        },
        {
          pattern: /\b.*[a-zA-Z]+.*\b/,
          callback: function(response,convo) {
            convo.say("Hmmmm, there is something wrong with that figure.")
           
            convo.repeat();
            convo.next();
          }
        }
        

      ])
    })
  })
})

controller.hears(['help'],'direct_message,direct_mention,mention,ambient',function(bot,message) {

  bot.reply(message,':thumbsup: Good idea but not quite there yet! Talk to Kenny, Andrew or Bob');

})


controller.hears(['new listings','listings'],'direct_message,direct_mention,mention,ambient',function(bot,message) {

  var hostname = os.hostname();
  var uptime = formatUptime(process.uptime());

  bot.reply(message,':thumbsup: Good idea but not quite there yet! Talk to Kenny, Andrew or Bob');

})

controller.hears(['what\'s new','commands'],'direct_message,direct_mention,mention,ambient',function(bot,message) {

  var hostname = os.hostname();
  var uptime = formatUptime(process.uptime());

  bot.reply(message,':thumbsup: listings, new listings, what is your name, who are you, uptime,can ');

})


controller.hears(['uptime','identify yourself','who are you','what is your name','ambient'],'direct_message,direct_mention,mention',function(bot,message) {

  var hostname = os.hostname();
  var uptime = formatUptime(process.uptime());

  bot.reply(message,':robot_face: I am a bot named <@' + bot.identity.name +'>. I have been running for ' + uptime + ' on ' + hostname + ".");

})

controller.hears(['can'],'direct_message,direct_mention,mention',function(bot,message) {

  bot.reply(message,':robot_face: Good idea! But, no.');

})

function formatUptime(uptime) {
  var unit = 'second';
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'minute';
  }
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'hour';
  }
  if (uptime != 1) {
    unit = unit +'s';
  }

  uptime = uptime + ' ' + unit;
  return uptime;
}
