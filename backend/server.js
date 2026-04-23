const express = require('express');
require('dotenv').config();
const apiRouters = require("./src/routes/api");
const apiRoutersView = require("./src/routes/apiView");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require('path');
const { startReviewSummaryWorker } = require("./src/workers/reviewSummaryWorker");
const app = express();
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
startReviewSummaryWorker().catch((error) => {
    console.error("Cannot start review summary worker:", error.message);
});


const port = process.env.PORT || 8081;
const hostname = process.env.HOST_NAME;

const configViewEngine = require('./src/config/viewEngine');
configViewEngine(app);
app.use('/api', apiRouters);
app.use('/view', apiRoutersView); app.listen(port, () => {
    console.log(`🚀 Server is running at http://${hostname || 'localhost'}:${port}`);
});
