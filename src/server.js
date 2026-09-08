import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import { URL } from "node:url";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors({ origin: true }));
app.use(express.json({ limit: "200kb" }));


// ===============================
// NORMALIZA TELEFONE
// ===============================

function normalizePhone(raw){

  let digits = String(raw || "")
  .replace(/\D/g,"");


  // remove código do Brasil duplicado
  if(digits.startsWith("55") && digits.length > 11){
    digits = digits.substring(2);
  }


  if(
    digits.length !== 10 &&
    digits.length !== 11
  ){
    return "";
  }


  return digits;

}


// ===============================
// NORMALIZA EMAIL
// ===============================

function normalizeEmail(raw){

  let email = String(raw || "")
  .trim()
  .toLowerCase();


  // remove parâmetros do mailto
  email = email.split("?")[0];


  if(
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ){
    return "";
  }


  return email;

}



// ===============================
// UTILIDADES
// ===============================

function sameHost(a,b){

  try{

    return new URL(a).host === new URL(b).host;

  }catch{

    return false;

  }

}



function absolute(href,base){

  try{

    return new URL(href,base).href;

  }catch{

    return null;

  }

}



// ===============================
// EXTRAÇÃO DE LEADS
// ===============================

function extractContacts(html,sourceUrl,city){


const $ = cheerio.load(html);


const contacts=[];



function push(type,value){

if(!value) return;


contacts.push({

type,
value,
sourceUrl,
city

});


}



// TELEFONES LINK

$("a[href^='tel:']").each((_,el)=>{


const phone =
normalizePhone(
$(el)
.attr("href")
.replace("tel:","")
);


if(phone){

push(
"phone",
phone
);

}


});




// EMAILS LINK

$("a[href^='mailto:']").each((_,el)=>{


const email =
normalizeEmail(
$(el)
.attr("href")
.replace("mailto:","")
);


if(email){

push(
"email",
email
);

}


});




// TEXTO DA PAGINA

const text =
$("body")
.text()
.replace(/\s+/g," ");




// TELEFONES NO TEXTO

for(
const match of text.matchAll(
/(?:\+?55[\s.-]?)?(?:\(?\d{2}\)?[\s.-]?)?(?:9?\d{4})[\s.-]?\d{4}/g
)
){


const phone =
normalizePhone(match[0]);


if(phone){

push(
"phone",
phone
);

}


}



// EMAILS NO TEXTO

for(
const match of text.matchAll(
/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig
)
){


const email =
normalizeEmail(match[0]);


if(email){

push(
"email",
email
);

}


}



return contacts;


}




// ===============================
// BUSCAR PAGINA
// ===============================

async function fetchPage(url){


const response =
await fetch(
url,
{

headers:{

"User-Agent":
"Mozilla/5.0 LeadCollectorAI"

}

}
);



const type =
response.headers.get(
"content-type"
)
|| "";



if(
!type.includes("text/html")
){

return null;

}



return await response.text();


}




// ===============================
// ROTA PRINCIPAL
// ===============================

app.get("/",(req,res)=>{

res.json({

status:"online",

message:
"Lead Collector AI API funcionando"

});

});





// ===============================
// HEALTH CHECK
// ===============================

app.get("/health",(req,res)=>{


res.json({

online:true,

service:
"Lead Collector AI"

});


});





// ===============================
// COLETAR LEADS
// ===============================

app.post("/api/collect",async(req,res)=>{


try{


const target =
String(req.body.url || "")
.trim();



const city =
String(req.body.city || "")
.trim();



if(!target){

return res.status(400).json({

error:
"Informe uma URL"

});

}




const start =
new URL(target);



const queue=[
start.href
];


const visited =
new Set();



const contacts=[];


const unique =
new Set();




while(
queue.length &&
visited.size < 20
){



const current =
queue.shift();




if(
visited.has(current) ||
!sameHost(
current,
start.href
)
){

continue;

}



visited.add(current);



const html =
await fetchPage(current)
.catch(()=>null);



if(!html){

continue;

}



const found =
extractContacts(
html,
current,
city
);



found.forEach(item=>{


const key =
item.type +
":" +
item.value;



if(!unique.has(key)){


unique.add(key);

contacts.push(item);


}


});




// encontra links internos

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
sameHost(
link,
start.href
) &&
!visited.has(link)
){

queue.push(link);

}


});



}




res.json({

status:
"success",

pagesVisited:
visited.size,

totalContacts:
contacts.length,

contacts

});



}catch(error){


res.status(500).json({

error:
error.message

});


}



});





// ===============================
// START SERVER
// ===============================

app.listen(PORT,()=>{


console.log(
`API online na porta ${PORT}`
);


});
