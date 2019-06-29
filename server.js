//import all the dependencies
const chatkit = require("@pusher/chatkit-server");
const express = require("express");
const bp = require("body-parser");
const cors = require("cors");
//make our server
const app = express();
//enable cors
app.use(cors());
//enable body parser
app.use(bp.urlencoded({ extended: false }));
app.use(bp.json());

//create chatkit object user - our credentials in the chatkit dashboard
const chatkitserver = new chatkit.default({
  instanceLocator: "your-instanceLocator",
  key: "your-key"
});

//cofigure user route
app.post("/user", (req, res) => {
  const datain = req.body;

  console.log("requested username- " + datain.name);

  chatkitserver
    .createUser({ id: datain.name, name: datain.name })
    .then(() => {
      console.log("user created");
      res.status(200).json({ msg: "user_created" });
    })
    .catch(err => {
      if (err.error === "services/chatkit/user_already_exists") {
        console.log("duplicate user detected");
        res.status(200).json({ msg: "duplicate_user" });
      }

      //console.log(err);
    });
});

//cofigure auth route
app.post("/auth", (req, res) => {
  console.log("request connection by - " + req.query.user_id);

  var usrid = req.query.user_id;

  var authdata = chatkitserver.authenticate({ userId: usrid });
  console.log(authdata);

  res.status(authdata.status).json(authdata.body);
});

//listn to incoming requests on port 3005
app.listen(3005, () => {
  console.log("server is listning on port 3005");
});
