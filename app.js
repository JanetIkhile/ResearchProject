const express = require('express')
const mongoose = require('mongoose')
const Measures = require('./models/measures.model.js')
const measuresRoutes = require('./routes/measures.route.js')
const cors = require('cors')
const app = express()
const bodyParser = require('body-parser');


//middleware
app.use(express.json())
app.use(cors())
app.use(bodyParser.json());

//routes
app.use("/api/measures", measuresRoutes);


mongoose.connect('mongodb+srv://adazejohnson:Hy3da6qkZi0X6POf@cluster0.teaetw3.mongodb.net/motor_performance?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => {
        console.log('Connected to the database!');
        app.listen(3001, () => {
            console.log('Server is running on http://localhost:3001')
        });
    })
    .catch((error) => console.log('Connection failed!', error));

const corsOptions = {
    origin: 'http://localhost:3001',  // Replace with your frontend's URL
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
