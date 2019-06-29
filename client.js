//import all the dependencies
const prompt = require("prompt");
const { ChatManager, TokenProvider } = require("@pusher/chatkit-client");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const readline = require("readline");
const ora = require('ora');
 
const spinner = ora()

//make compatible with command line using jsdom
makeCompatiblewithcommadline = () => {
  const { window } = new JSDOM();
  global.window = window;
  global.navigator = {};
};

prompt.start();
makeCompatiblewithcommadline();
prompt.message = "";

//declare schemas of getting command line user input
var schema1 = {
  properties: {
    name: {
      message: "enter username - ",
      required: true
    }
  }
};

var schema2 = {
  properties: {
    index: {
      message: "enter room index - ",
      required: true
    }
  }
};

//get username
prompt.get(schema1, function(err, result) {
  console.log("  username: " + result.name);

  //add a new user
  spinner.start()
  axios
    .post("http://localhost:3005/user", { name: result.name })
    .then(data => {
      console.log("sucsess - " + data.data.msg);

      //get the token
      const chatmanager = new ChatManager({
        instanceLocator: "your-instanceLocator",
        userId: result.name,
        tokenProvider: new TokenProvider({
          url: "http://localhost:3005/auth"
        })
      });

      chatmanager
        .connect()
        .then(data => {
           
          //subscribe to a room from room list
          subsroom(data);
        })
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      console.log("error - " + err);
    });
});

const subsroom = async user => {
  //list all available rooms
  spinner.stop()
  const avaiblerooms = await user.getJoinableRooms();
  const allromms = [...avaiblerooms, ...user.rooms];

  allromms.forEach((element, index) => {
    console.log("rooms " + index + " " + JSON.stringify(element.name));
  });

  //get room index to join
  prompt.get(schema2, async function(err, result) {
    var roomnumber = result.index;

    const selectedRoom = allromms[roomnumber];

    await user.subscribeToRoomMultipart({
      roomId: selectedRoom.id,
      hooks: {
        onMessage: message => {
          // this hook will run when a new message is recieved displaying the message

          if (message.senderId !== user.name) {
            console.log(
              message.senderId + " : " + message.parts[0].payload.content
            );
          }
        },
        onUserJoined: userobj => {
          //this hook will run when a new user is joind to the room diaplaying the joined message
          console.log(userobj.name + "joined...\n");
        }
      },

      messageLimit: 0
    });

    const input = readline.createInterface({ input: process.stdin });

    input.on("line", async test => {
      //send the massage you enter to the room

      await user.sendSimpleMessage({ roomId: selectedRoom.id, text: test });
    });
  });
};
