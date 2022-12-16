const http = require('http');
const httpSuccessStatus = 200;
const express = require("express")
const app = express();
const path = require("path")
const statusCode = 200;
const bodyParser = require("body-parser");
let fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') }) 

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

const portNumber = 10000

const databaseAndCollection = {db: "CMSC335DB", collection:"campApplicants"};
const { MongoClient, ServerApiVersion } = require('mongodb');
const { response } = require('express');




if (process.argv.length != 2) {
    console.log(`Usage ${process.argv[1]} jsonFile`);
    process.exit(1);
}



app.set("views", path.resolve(__dirname, "templates"));

/* view/templating engine */
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended:false}));

app.use(express.static(__dirname + '/public'));

app.get("/", async(request, response) => {
    
    response.render("index");
})


app.get("/forum", (request, response) => {
    response.render("forum");
})

app.post("/forum", async(request, response) => {
    const uri = 'mongodb+srv://andrewUser1963:Ubwk2382@cluster0.pqevol1.mongodb.net/?retryWrites=true&w=majority';
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    let list = "<ul>"

    let variables = {
        professor: request.body.professor,
    }

    try {
        await client.connect();
        let filter = {professor_name:request.body.professor};
        const cursor = client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .find(filter);
        
        const result = await cursor.toArray();
        
        function addToList(item) {
            list += "<li>" + item.review_text + "</li>"
        }

        result.forEach(addToList);

        list += "</ul>"


    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

    let url = 'https://planetterp.com/api/v1/professor?name=' + variables.professor + '&reviews=true';
    

    try {
        fetch(url)
        .then(response => response.json())
        .then(json => printTitles(json))
    } catch(e) {
        console.log(e);
    }
   
    function printTitles(json) {
        variables = {
            professor: request.body.professor,
            rating: json.average_rating,
            list: list
        }
        response.render("reviewList", variables);
    }

    
})

app.get("/submitReview", (request, response) => {
    response.render("review");
})

app.post("/submitReview", async(request, response) => {
    const uri = 'mongodb+srv://andrewUser1963:Ubwk2382@cluster0.pqevol1.mongodb.net/?retryWrites=true&w=majority';
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    
    const variables = {
        profname: request.body.profname,
        studname: request.body.studname,
        rating: request.body.rating,
        reviewtext: request.body.reviewtext,
    }

    try {
        await client.connect();

        let review = {professor_name: variables.profname, student_name: variables.studname, rating: variables.rating, review_text: variables.reviewtext};
        
        await insertReview(client, databaseAndCollection, review);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

    
    response.render("reviewconfirmation", variables);
})


async function insertReview(client, databaseAndCollection, newReview) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newReview);
}




process.stdin.setEncoding("utf8");



app.listen(portNumber); 