const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1/blog', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('strictQuery', false);

const postsRouter = require("./routes/Posts");
const usersRouter = require("./routes/Users");
const topicsRouter = require("./routes/Topics");

const app = express();
const port = 3000;


app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.urlencoded({ extended: false })); 
app.use(cookieParser());
app.use(bodyParser.json());

app.use('/api/posts', postsRouter);
app.use('/api/users', usersRouter);
app.use('/api/topics', topicsRouter);

app.listen(port, () => console.log(`Running on port ${port}`));