// ------------------------------------- SETUP -------------------------------------
// import socket io
const socket = io();

// global object variable
const global = {
    current: {
        unix: 0,
        utc: ""
    },
    prior: {
        unix: 0,
        utc: ""
    },
    instruments: [],
    chart: {
        instrument: "AUD_CAD",
        data: {
            xAxis: [1604710964,1604713964,1605315764,0],
            high: {
                bid: [8,9,7,0],
                ask: [9,10,8,0],
                rsi: [],
                percbb: [], // percent bollinger bands
                smaShort: [], // 7 bar
                smaMed: [], // 20 bar
                smaLong: [] // 180 bar
            },
            low: {
                bid: [1,2,0,0],
                ask: [2,3,1,0],
                rsi: [],
                percbb: [],
                smaShort: [],
                smaMed: [],
                smaLong: []
            }
        },
        options: {
            scales: {
                xAxes: [{
                    ticks: {
                        sampleSize: 100, // lower sample size if performance is an issue
                        minRotation: 75,
                        maxRotation: 75,
                        labelOffset: 20
                    }
                }]
            },
            showLines: true // another performance option, false to only show points
        }
    }
};


// ------------------------------------- FUNCTIONS -------------------------------------
// write document nodes into an object so easy access modifications
const get_dom_list = () => {
    // returned array
    let returnArray = {};

    // an array of arrays, a list of all ids[1] and what to refer to them by [0]
    let idArray = [
        ["equity", "account-equity"], 
        ["marginLevel", "account-marglevel"],
        ["instruments", "instrument-selection"]
    ];
    idArray.forEach((item, index) => {
        // get the items inner html
        let tempItem = document.getElementById(item[1]);

        // push it into obj
        returnArray[item[0]] = tempItem;
    });
    // DEBUG:: this will return an object with keys as names, and pairs as the nodes
    //console.log(returnArray);
    // example of how to use it to change a value
    //idList.equity.innerHTML = 7645;

    // return an array of all id elements
    return returnArray;
};
const idList = get_dom_list();


// change chart defaults
const change_chart_defaults = () => {
    let chartDef = Chart.defaults.global;
    // animation
    chartDef.animation.duration = 0;
    chartDef.hover.animationDuration = 0;

    // tooltips, future attempt to grid-ize the output, custom tooltip
    chartDef.tooltips.mode = "nearest"; // since point is 0, cant use point
    chartDef.tooltips.intersect = false;
    chartDef.tooltips.backgroundColor = "rgba(0, 0, 0, 0)";

    // line
    chartDef.elements.point.radius = 0;
    chartDef.elements.line.tension = 0;
    chartDef.elements.line.stepped = "before"; // middle has bg color problems, before cuts out last data pt so append data 0s
    chartDef.elements.line.borderWidth = 1;
    chartDef.elements.line.borderColor = "rgba(0, 0, 0, 1)";

    // disable legend at top
    chartDef.legend.display = false;

    // font size, color
    chartDef.defaultFontColor = "#ddd";
    chartDef.defaultFontSize = 13;

    // DEBUG:: output of global defaults on charts
    console.log(chartDef);
};
change_chart_defaults();


// start chart
const start_chart = () => {
    // default price chart
    const ctxPrice = document.getElementById('chart-price').getContext('2d');
    let chartPrice = new Chart(ctxPrice, {
        type: "line",
        data: {
            labels: global.chart.data.xAxis,
            datasets: [{
                label: "Ask: HI",
                data: global.chart.data.high.ask,
                fill: false
            },{
                label: "Bid: HI",
                data: global.chart.data.high.bid,
                backgroundColor: 'rgba(0, 118, 209, 1)',
                fill: "-1"
            },{
                label: "Ask: LO",
                data: global.chart.data.low.ask,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                fill: "-1"
            },{
                label: "Bid: LO",
                data: global.chart.data.low.bid,
                backgroundColor: 'rgba(0, 118, 209, 1)',
                fill: "-1"
            }]
        },
        options: global.chart.options
    });
};
start_chart();


// catch-all update chart
const update_chart = () => {
    // this will send to server global.chart.instrument, current and prior unix stamps in a new obj
    let transmitObj = {
        instrument: global.chart.instrument,
        startUnix: global.prior.unix,
        endUnix: global.current.unix
    }

    console.log(transmitObj);

    // send on channel chart_requests
    socket.emit("chart_requests", transmitObj);
};


// button timeframe click
const chart_timeframe_handler = id => {
    // grab current unix timestamp in seconds, had a problem with iso timestamps
    global.current.unix = Math.floor(new Date() / 1000);

    // check id clicked and set prior value accordingly
    if(id === "lweek"){
        // week - 604,800s
        global.prior.unix = global.current.unix - 604800;
    }else if(id === "lmonth"){
        // month - 2,628,000s
        global.prior.unix = global.current.unix - 2628000;
    }else if(id === "lseason"){
        // season - 7,884,000s
        global.prior.unix = global.current.unix - 7884000;
    }else if(id === "lyear"){
        // year - 31,536,000s
        global.prior.unix = global.current.unix - 31536000;
    }else{
        // nothing should be here, error
    };

    // attempt utc timestamps
    global.current.utc = new Date(global.current.unix * 1000);
    global.current.utc = global.current.utc.toUTCString();
    global.prior.utc = new Date(global.prior.unix * 1000);
    global.prior.utc = global.prior.utc.toUTCString();

    // DEBUG:: grab current, and prior of whatever timeframe clicked on in human readable form
    //console.log(global.current.unix + " --- " + global.current.utc);
    //console.log(global.prior.unix + " --- " + global.prior.utc);

    // update chart
    update_chart();
};


// select instrument on change
const instrument_change_handler = e => {
    // store value
    global.chart.instrument = e.value;
    //console.log(global.chart.instrument);

    // update chart
    update_chart();
}


// ------------------------------------- SOCKET -------------------------------------
// on connect
socket.on('connect', () => {
    console.log("connected to server");
    
    // populate the instruments list from server, which gets it from config.json
    socket.on('instruments', data => {

        // for each item
        data.forEach((item, index) => {
            // store into local global.instruments array
            global.instruments.push(item);

            // feed into the instruments options dropdown
            let tempFeed = document.createElement("option");
            tempFeed.text = item;
            idList.instruments.add(tempFeed);
        });
        // DEBUG:: return local global list of instruments
        //console.log(global.instruments);

    });
});



// ------------------------------------- MAIN -------------------------------------
// loop
let counter = 0;
setInterval(() => {
    //idList.equity.innerHTML = counter;
}, 500);