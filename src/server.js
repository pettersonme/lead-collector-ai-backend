import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import { URL } from "node:url";

const app = express();

const PORT = process.env.PORT || 10000;


app.use(cors({
    origin:"*"
}));

app.use(express.json({
    limit:"2mb"
}));



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


    if(
        email.includes("@") &&
        email.includes(".")
    ){
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

        return (
            new URL(a).hostname ===
            new URL(b).hostname
        );

    }catch{

        return false;

    }

}



async function fetchHTML(url){

    try{

        const response = await fetch(url,{

            headers:{

                "User-Agent":
                "Mozilla/5.0 LeadCollectorAI"

            },

            signal:
            AbortSignal.timeout(10000)

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





function extractData(html,url){


    const $ =
    cheerio.load(html);


    const result = {


        nome:"",

        whatsapp:"",

        email:"",

        url:url


    };



    result.nome =
    $("h1").first().text().trim()
    ||
    $("title").text().trim();





    $("a").each((i,el)=>{


        const href =
        $(el).attr("href") || "";


        if(
            href.includes("wa.me")
            ||
            href.includes("whatsapp")
        ){

            result.whatsapp =
            href;

        }


        if(
            href.startsWith("tel:")
        ){

            result.whatsapp =
            cleanPhone(
                href.replace("tel:","")
            );

        }



        if(
            href.startsWith("mailto:")
        ){

            result.email =
            cleanEmail(
                href.replace("mailto:","")
            );

        }


    });




    const texto =
    $("body")
    .text()
    .replace(/\s+/g," ");




    if(!result.whatsapp){


        const telefones =
        texto.match(
        /(\+55\s?)?\(?\d{2}\)?\s?\d{4,5}[- ]?\d{4}/g
        );


        if(telefones){

            result.whatsapp =
            cleanPhone(
                telefones[0]
            );

        }


    }





    if(!result.email){


        const emails =
        texto.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
        );


        if(emails){

            result.email =
            cleanEmail(
                emails[0]
            );

        }

    }



    return result;


}






// TESTE DO SERVIDOR

app.get("/",(req,res)=>{


    res.json({

        status:"online",

        mensagem:
        "Lead Collector AI funcionando"

    });


});




app.get("/health",(req,res)=>{


    res.json({

        online:true,

        servidor:
        "Lead Collector AI"

    });


});






app.post("/api/collect", async(req,res)=>{


try{


    const target =
    String(req.body.url || "")
    .trim();



    if(!target){

        return res.status(400).json({

            erro:
            "Informe uma URL"

        });

    }




    const base =
    new URL(target).href;



    const visitadas =
    new Set();


    const fila =
    [base];


    const paginas =
    new Set();



    let totalPaginas = 0;




    while(
        fila.length &&
        paginas.size < 80
    ){


        const atual =
        fila.shift();



        if(visitadas.has(atual))
        continue;



        visitadas.add(atual);



        const html =
        await fetchHTML(atual);



        if(!html)
        continue;



        totalPaginas++;


        const $ =
        cheerio.load(html);



        $("a[href]").each((i,el)=>{


            const link =
            absolute(
                $(el).attr("href"),
                atual
            );



            if(
                link &&
                sameDomain(link,base)
            ){

                if(link !== base){

                    paginas.add(link);

                }


                if(
                    fila.length < 80 &&
                    !visitadas.has(link)
                ){

                    fila.push(link);

                }

            }


        });


    }




    const contatos=[];




    for(
        const pagina of paginas
    ){


        const html =
        await fetchHTML(pagina);


        if(!html)
        continue;



        const dados =
        extractData(
            html,
            pagina
        );



        if(
            dados.whatsapp ||
            dados.email
        ){

            contatos.push(dados);

        }


    }





    res.json({

        sucesso:true,

        paginasVisitadas:
        totalPaginas,


        contatosEncontrados:
        contatos.length,


        contatos


    });




}catch(error){


    res.status(500).json({

        erro:
        error.message

    });


}


});





app.listen(PORT,()=>{


console.log(
"Lead Collector AI rodando na porta "+PORT
);


});
