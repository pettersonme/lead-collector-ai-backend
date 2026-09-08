import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import { URL } from "node:url";


const app = express();

const PORT = process.env.PORT || 10000;


app.use(cors({origin:true}));

app.use(express.json({
    limit:"1mb"
}));



function cleanPhone(value){

    return String(value || "")
    .replace(/\D/g,"");

}



function cleanEmail(value){

    const email = String(value || "")
    .trim()
    .toLowerCase();


    if(email.includes("@")){
        return email;
    }


    return "";

}



function absolute(link,base){

    try{

        return new URL(link,base).href;

    }catch{

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
            },

            signal:
            AbortSignal.timeout(15000)

        });


        const type =
        response.headers.get(
            "content-type"
        ) || "";


        if(!type.includes("text/html")){
            return "";
        }


        return await response.text();



    }catch(error){

        console.log(
            "Erro:",
            url
        );

        return "";

    }


}






function extractData(html,url){


    const $ = cheerio.load(html);


    let data={

        name:"",
        phone:"",
        email:"",
        url:url

    };



    // nome

    data.name =
    $("h1").first().text().trim()
    ||
    $("title").text().trim();




    // whatsapp tel

    $("a").each((_,el)=>{


        const href =
        $(el).attr("href") || "";


        if(
            href.includes("wa.me")
            ||
            href.includes("whatsapp")
        ){

            data.phone =
            cleanPhone(href);

        }



    });





    // telefone normal

    if(!data.phone){


        const text =
        $("body")
        .text()
        .replace(/\s+/g," ");



        const phones =
        text.match(
        /(\(?\d{2}\)?\s?\d{4,5}[- ]?\d{4})/g
        );


        if(phones){

            data.phone =
            cleanPhone(
                phones[0]
            );

        }


    }




    // email


    const body =
    $("body")
    .text();



    const emails =
    body.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig
    );


    if(emails){

        data.email =
        cleanEmail(
            emails[0]
        );

    }



    return data;


}








app.get("/",(req,res)=>{


    res.json({

        status:"online",

        message:
        "Lead Collector AI funcionando"

    });


});







app.post("/api/collect",async(req,res)=>{


try{


    const target =
    String(req.body.url || "")
    .trim();



    if(!target){

        return res.status(400).json({

            error:
            "URL obrigatória"

        });

    }




    const base =
    new URL(target).href;




    const visited =
    new Set();



    const profiles =
    new Set();



    const queue=[
        base
    ];



    let pages=0;



    while(queue.length){



        const current =
        queue.shift();



        if(visited.has(current)){
            continue;
        }



        visited.add(current);



        const html =
        await fetchHTML(current);



        if(!html){
            continue;
        }



        pages++;



        const $ =
        cheerio.load(html);





        $("a[href]").each((_,el)=>{


            const href =
            $(el).attr("href");



            const link =
            absolute(
                href,
                current
            );



            if(!link){
                return;
            }




            if(!sameDomain(link,base)){
                return;
            }




            const path =
            new URL(link)
            .pathname;




            /*
              pega somente:

              /tai
              /nome
              
              ignora:

              /
              /login
              /categorias
            */


            if(
                path.split("/")
                .filter(Boolean)
                .length === 1
            ){

                profiles.add(link);

            }


        });



    }







    const contacts=[];



    for(
        const profile of profiles
    ){


        const html =
        await fetchHTML(profile);



        if(!html){
            continue;
        }



        const data =
        extractData(
            html,
            profile
        );



        contacts.push(data);


    }






    res.json({

        status:"ok",

        pagesVisited:
        pages,


        profilesFound:
        profiles.size,


        total:
        contacts.length,


        contacts


    });





}catch(error){


    console.log(error);


    res.status(500).json({

        error:
        error.message

    });



}



});







app.listen(PORT,()=>{


console.log(
"Lead Collector AI rodando na porta "
+PORT
);


});
