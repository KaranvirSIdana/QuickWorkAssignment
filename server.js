const express =require("express");
const querystring =require("querystring");
const axios = require("axios");


require('dotenv').config();

const app = express();

// Setting up the authentication URL 
function getGmailAuthURL(){
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: "http://localhost:3000/authenticate/google",
    client_id:process.env.CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/gmail.modify"
    ].join(' ')
  };

  return `${rootUrl}?${querystring.stringify(options)}`;
};

// Getting the code to generate acess tokens from the redirected URI
async function fetchToken(code){

  const { data } = await axios({
    url: `https://oauth2.googleapis.com/token`,
    method: 'post',
    data: {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: 'http://localhost:3000/authenticate/google',
      grant_type: 'authorization_code',
      code,
    },
  });
  console.log(data); // { access_token, expires_in, token_type, refresh_token }

  return data.access_token; //Returning the Acess Token
};

// Using the access Credentials Making a post request to get the User Credentials
async function getGoogleUserEmail(access_token) {
  const { data } = await axios({
    url: "https://www.googleapis.com/oauth2/v1/userinfo",
    method: 'get',
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
  console.log(data); // { id, email, given_name, family_name }
  return data.email; //Returning email
};

//Function to send the emails
async function sendEmail(access_token){
  var data = JSON.stringify({
    "raw": "RnJvbToga2FyYW52aXJzaW5naDQ2QGdtYWlsLmNvbQpUbzogZjIwMTgwMTc0QHBpbGFuaS5iaXRzLXBpbGFuaS5hYy5pbgpTdWJqZWN0OiBUZXN0IEVtYWlsCg=="
  });

  const { response } = await axios({
    url: "https://www.googleapis.com/gmail/v1/users/karanvirsingh46@gmail.com/messages/send",
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
    data : data
  });
  console.log(response);
  return response;
};


// ################################################################################# //
// Making an APi call to get the Authenticated URL
app.get("/",(request,response)=>{
  response.redirect(getGmailAuthURL());
});


// The Redirected URI Route which is redirected after Authentication
app.get("/authenticate/google",(req,res)=>{
  const urlParams = req.query;

  if (urlParams.error) {
    console.log(`An error occurred: ${urlParams.error}`);
  } else {
    console.log(`The code is: ${urlParams.code}`);
  }  

  // Getting the Token value from the fetchToken function by resolving the promise 
  // And getting the user email


  console.log(data.base);
  let token_value,user_email;
  const getTokenAndEmail = () => {
    fetchToken(urlParams.code)
      .then(ok => {
        console.log(ok);
        token_value = ok;
        user_email = getGoogleUserEmail(token_value);
        user_email
          .then(email =>{
            console.log(email);
            sendEmail(token_value);
          })
          .catch(err => {
            console.log(err);
          });
        
      })
      .catch(err => {
        console.error(err)
      }) 
  };

  getTokenAndEmail();

  res.send("wohooooooo"); 
  
});


// Setting up the local host at port 3000
app.listen(3000,function(){
  console.log("The server has started on Port 3000");
});