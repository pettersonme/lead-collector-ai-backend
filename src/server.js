import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import { URL } from "node:url";

const app = express();

const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));


// TESTE DO SERVIDOR
app.get("/", (req,res)=>{
    res.json({
        status:"online",
        message:"Lead Collector AI API funcionando"
    });
});


app.get("/health",(req,res)=>{
    res.json({
        online:true
    });
});



function cleanPhone(value){

    return String(value || "")
    .replace(/\D/g,"");

}


function cleanEmail(value){

    const email = String(value || "")
    .trim()
    .toLowerCase();

    return email.includes("@") ? email : "";

}



function absolute(link,base){

    try{
        return new URL(link,base).href;
    }
    catch{
        return null;
    }

}



function sameDomain(a,b){

    try{

        return new URL(a).hostname === new URL(b).hostname;

    }catch{

        return false;

    }

}



async function fetchHTML(url){

    try{

        const response = await fetch(url,{
            headers:{
                "User-Agent":
                "Mozilla/5.0"
            }
        });


        return await response.text();


    }catch(e){

        console.log(e);
        return "";

    }

}



function extract(html,url){

    const $ = cheerio.load(html);


    let data={

        nome:"",
        whatsapp:"",
        email:"",
        url:url

    };



    data.nome =
    $("h1").first().text().trim()
    ||
    $("title").text().trim();



    $("a").each((i,el)=>{

        const href =
        $(el).attr("href") || "";


        if(href.includes("whatsapp")){

            data.whatsapp =
            href;

        }


        if(href.includes("tel:")){

            data.whatsapp =
            cleanPhone(
                href.replace("tel:","")
            );

        }


        if(href.includes("mailto:")){

            data.email =
            cleanEmail(
                href.replace("mailto:","")
            );

        }


    });



    const texto =
    $("body")
    .text()
    .replace(/\s+/g," ");



    if(!data.email){

        const email =
        texto.match(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig
        );


        if(email){

            data.email=email[0];

        }

    }



    if(!data.whatsapp){

        const phone =
        texto.match(
        /\(?\d{2}\)?\s?\d{4,5}-?\d{4}/
        );


        if(phone){

            data.whatsapp =
            cleanPhone(phone[0]);

        }

    }



    return data;

}




app.post("/api/collect", async(req,res)=>{


try{


const site=req.body.url;


if(!site){

return res.status(400).json({
error:"URL obrigatória"
});

}



let html =
await fetchHTML(site);



const $=cheerio.load(html);



let links=[];


$("a").each((i,el)=>{


let href =
absolute(
$(el).attr("href"),
site
);



if(
href &&
sameDomain(href,site)
){

links.push(href);

}


});



links=[
...new Set(links)
];



let contatos=[];


for(
const link of links.slice(0,100)
){

const page =
await fetchHTML(link);


if(page){

const dados =
extract(page,link);


contatos.push(dados);

}

}



res.json({

status:"ok",

paginasVisitadas:
links.length,

contatos

});


}catch(e){


res.status(500).json({

erro:e.message

});


}



});




app.listen(PORT,()=>{

console.log(
"Servidor rodando na porta "+PORT
);

});
