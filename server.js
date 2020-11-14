// ------------------------ SETUP ---------------------------
// import libraries
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const axios = require('axios');
const mysql = require('mysql');


// load client html
const clientHtml = fs.readFileSync(__dirname + '/client.html', 'utf8');

// load config.json file
const load_config = () => {
    let rawData = fs.readFileSync('./config.json');
    return JSON.parse(rawData);
};
const globalConfig = load_config();

// path separate css, js files by using public
app.use(express.static(path.join(__dirname, '/public/')));

// express routing serve client.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client.html');
});

// start server listen
http.listen(8080, () => {
    console.log('listening on 8080');
});


// ------------------------ FUNCTIONS ---------------------------
// api
const use_api = apiObj => {
    /* 
    parameter input tree:
    -
    mode = {
        mode: "test" OR "get",
        url: "url",
        data: "data"
    }
    -
    */
    let returnedAPI;

    // axios async api stuff
    (async () => {
        try{
            if(apiObj.mode === "test"){
                // test api with no api key: https://api.kanye.rest/
                returnedAPI = await axios.get('https://api.kanye.rest/');
                console.log("API success. here\'s your Kanye quote: \n" + returnedAPI.data.quote);

            }else if(apiObj.mode === "get"){
                // get mode, oanda by default
                returnedAPI = await axios.get('');
            };
        }catch(error){
            console.log(error);
        };
    })();
};

// file system for storing and retrieving sql files
const sql_file = sqlObj => {
    /*
    sqlObj input tree:
    -
    sqlObj = {
        mode: "init" OR "write" OR "read",
        instrument: e.g. "EUR_USD",
        data: returned read data OR input write data
    }
    -
    data tree structure:
    data: [
        [unix,0,0], // starts with unix timestamp and follows with bid high, bid low, ask high, ask low
        [unix,0,0],
        [unix,0,0] // etc, for each data point
    ]
    */

    // check mode
    if(sqlObj.mode === "init"){
        // initial setup mode

        // 
        //console.log('in');
    }else if(sqlObj.mode === "read"){
        // read mode
    }else if(sqlObj.mode === "write"){
        // write mode
    };
};
sql_file({mode: "init"});


// ------------------------ SOCKET ---------------------------

// on connection
io.on('connect', socket => {
    console.log('client connected');

    // send global list of available instruments
    socket.emit('instruments', globalConfig.instruments);

    // on chart_requests
    socket.on('chart_requests', data => {
        console.log(data);
    });
});

// ------------------------ MAIN ---------------------------

//use_api({mode: "test"});
sql_file({
    mode: "write",
    instrument: "test"
});





/*
// watch loop
setInterval(() => {
    // inner loop, repeat every globalConfig.loopInterval.main ms

    // DEBUG:: see what config.json contains
    //console.log("n test");
}, globalConfig.loopInterval.main);
*/
