const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();

// middleware

app.use(express());
app.use(cors());


app.get('/',(req,res)=>{
    res.send('hello from restaurant management server.....')
})

app.listen(port,() =>{
console.log(`Server is running on PORT ${port}`)    
})