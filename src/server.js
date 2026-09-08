import express from "express";
import cors from "cors";

const app = express();

const PORT = process.env.PORT || 10000;


// ==============================
// MIDDLEWARES
// ==============================

app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json());


// ==============================
// ROTA PRINCIPAL
// ==============================

app.get("/", (req, res) => {

    res.status(200).json({

        status: "online",

        service: "Lead Collector AI API",

        message: "Servidor funcionando corretamente",

        version: "1.0.0",

        timestamp: new Date()

    });

});


// ==============================
// HEALTH CHECK RENDER
// ==============================

app.get("/health", (req, res) => {

    res.status(200).json({

        online: true,

        service: "Lead Collector AI",

        uptime: process.uptime(),

        timestamp: new Date()

    });

});


// ==============================
// COLETAR LEADS
// ==============================

app.post("/api/collect", async (req, res) => {


    try {


        const {

            url,

            company,

            name

        } = req.body;



        if(!url){

            return res.status(400).json({

                status:"error",

                message:"URL não enviada"

            });

        }



        // Aqui futuramente entra:
        // - scraping
        // - IA
        // - busca Google Maps
        // - Hunter API
        // - Apollo
        // - enriquecimento de dados


        const leads = [

            {

                name: name || "Lead Teste",

                company: company || "Empresa Teste",

                email:"",

                phone:"",

                source:url

            }

        ];



        res.status(200).json({

            status:"success",

            message:"Coleta realizada com sucesso",

            url:url,

            total:leads.length,

            leads:leads

        });



    } catch(error){


        res.status(500).json({

            status:"error",

            message:"Erro interno",

            error:error.message

        });


    }


});


// ==============================
// TESTE POST
// ==============================

app.post("/api/test", (req,res)=>{


    res.json({

        success:true,

        body:req.body,

        message:"POST funcionando"

    });


});


// ==============================
// ERRO 404
// ==============================

app.use((req,res)=>{


    res.status(404).json({

        status:"error",

        message:"Rota não encontrada",

        route:req.originalUrl

    });


});


// ==============================
// START SERVER
// ==============================

app.listen(PORT,()=>{


    console.log("--------------------------------");

    console.log("Lead Collector AI iniciado");

    console.log("Porta:", PORT);

    console.log("Status: ONLINE");

    console.log("--------------------------------");


});
