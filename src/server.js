import express from "express";
import cors from "cors";

const app = express();

const PORT = process.env.PORT || 10000;


app.use(cors({
    origin:"*"
}));

app.use(express.json());


app.get("/", (req,res)=>{

    res.json({
        status:"online",
        message:"Lead Collector AI API funcionando"
    });

});


app.get("/health",(req,res)=>{

    res.json({
        online:true,
        service:"Lead Collector AI"
    });

});



app.post("/api/collect",(req,res)=>{

    const url = req.body.url || "";


    res.json({

        status:"success",

        message:"API recebeu a URL",

        url:url,

        contacts:[

            {
                name:"Teste",
                phone:"",
                email:"",
                url:url
            }

        ]

    });


});



app.listen(PORT,()=>{

    console.log(
        "Lead Collector AI rodando na porta "+PORT
    );

});
