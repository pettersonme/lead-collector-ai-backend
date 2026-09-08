import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import { URL } from "node:url";

const app = express();

const PORT = process.env.PORT || 10000;


app.use(cors({ origin:true }));
app.use(express.json({limit:"500kb"}));



function cleanPhone(value){

    const phone = String(value || "")
    .replace(/\D/g,"");

    if(phone.length >= 10 && phone.length <= 15){
        return phone;
    }

    return "";
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




function absolute(url,base){

    try{
        return new URL(url,base).href;
    }
    catch{
        return null;
    }

}




function sameDomain(a,b){

    try{

        return new URL(a).hostname === new URL(b).hostname;

    }
    catch{

        return false;

    }

}




async function fetchHTML(url){

    try{

        const response = await fetch(url,{
            headers:{
                "User-Agent":
                "Mozilla/5.0 Chrome LeadCollectorAI"
            },
            signal:
            AbortSignal.timeout(15000)
        });


        const type =
        response.headers.get("content-type") || "";


        if(!type.includes("text/html")){
            return "";
        }


        return await response.text();


    }catch(error){

        return "";

    }

}





function extractProfileData(html,url){


    const $ = cheerio.load(html);


    let result = {

        name:"",
        phone:"",
        email:"",
        url

    };



    const title =
    $("h1").first().text().trim()
    ||
    $("title").text().trim();


    result.name = title;



    $("a[href^='tel:']").each((_,el)=>{

        if(!result.phone){

            result.phone =
            cleanPhone(
                $(el)
                .attr("href")
                .replace("tel:","")
            );

        }

    });



    $("a[href^='mailto:']").each((_,el)=>{


        if(!result.email){

            result.email =
            cleanEmail(
                $(el)
                .attr("href")
                .replace("mailto:","")
            );

        }


    });




    const text =
    $("body")
    .text()
    .replace(/\s+/g," ");




    if(!result.phone){


        const phones =
        text.match(
        /(?:\+?55)?\s?\(?\d{2}\)?\s?\d{4,5}[- ]?\d{4}/g
        );


        if(phones && phones.length){

            result.phone =
            cleanPhone(phones[0]);

        }

    }




    if(!result.email){


        const emails =
        text.match(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig
        );


        if(emails && emails.length){

            result.email =
            cleanEmail(emails[0]);

        }

    }



    return result;

}






app.get("/",(req,res)=>{

    res.json({

        status:"online",

        message:
        "Lead Collector AI API funcionando"

    });

});






app.get("/health",(req,res)=>{


    res.json({

        online:true,

        service:
        "Lead Collector AI"

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
            "Informe uma URL"

        });

    }




    const base =
    new URL(target)
    .href;



    const visited =
    new Set();



    const profileLinks =
    new Set();



    const queue=[base];



    let pages=0;




    while(
        queue.length &&
        profileLinks.size < 300
    ){



        const current =
        queue.shift();



        if(
            visited.has(current)
        ){
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


            const link =
            absolute(
                $(el).attr("href"),
                current
            );



            if(
                link &&
                sameDomain(link,base)
            ){


                if(
                    link !== base
                ){

                    profileLinks.add(link);

                }


                if(
                    !visited.has(link)
                    &&
                    queue.length < 100
                ){

                    queue.push(link);

                }


            }



        });



    }






    const contacts=[];


    for(
        const profile of
        Array.from(profileLinks)
        .slice(0,100)
    ){



        const html =
        await fetchHTML(profile);



        if(!html){
            continue;
        }



        const data =
        extractProfileData(
            html,
            profile
        );



        if(
            data.phone ||
            data.email
        ){

            contacts.push(data);

        }



    }





    res.json({

        status:"success",

        message:
        "Processamento concluído",

        pagesVisited:pages,

        profilesFound:
        profileLinks.size,

        totalContacts:
        contacts.length,


        hasMore:
        profileLinks.size > 100,


        next:
        profileLinks.size > 100
        ?
        "Existem mais perfis para processar"
        :
        null,


        contacts


    });




}
catch(error){


    res.status(500).json({

        error:
        error.message

    });


}



});






app.listen(PORT,()=>{


console.log(
`Lead Collector AI online na porta ${PORT}`
);


});
