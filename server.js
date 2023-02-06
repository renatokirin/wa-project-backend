const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
require('dotenv').config();

const mongoose = require('mongoose');
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true }); // 'mongodb://127.0.0.1/blog'
mongoose.set('strictQuery', false);

const postsRouter = require("./routes/Posts");
const usersRouter = require("./routes/Users");
const topicsRouter = require("./routes/Topics");
const imageUploadRouter = require("./routes/ImageUpload");

const app = express();
const port = process.env.PORT || 3000;


app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());

app.use('/api/posts', postsRouter);
app.use('/api/users', imageUploadRouter);
app.use('/api/users', usersRouter);
app.use('/api/topics', topicsRouter);

app.listen(port, () => console.log(`Running on port ${port}`));