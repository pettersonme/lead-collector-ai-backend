import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import { URL } from "node:url";


const app = express();

const PORT = process.env.PORT || 10000;


app.use(cors({origin:true}));

app.use(express.json({
  limit:"200kb"
}));



function normalizePhone(raw){

  const digits =
  String(raw || "")
  .replace(/\D/g,"");


  if(
    digits.length < 10 ||
    digits.length > 15
  ){
    return "";
  }


  return digits;

}



function normalizeEmail(raw){

  return String(raw || "")
  .trim()
  .toLowerCase();

}



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




function extractContacts(
html,
sourceUrl,
city
){


const $ = cheerio.load(html);


const contacts=[];



function add(type,value){


if(!value)
return;


contacts.push({

type,

value,

sourceUrl,

city

});


}




$("a[href^='tel:']")
.each((_,el)=>{


const phone =
normalizePhone(
$(el)
.attr("href")
.replace("tel:","")
);


if(phone)
add(
"phone",
phone
);


});





$("a[href^='mailto:']")
.each((_,el)=>{


const email =
normalizeEmail(
$(el)
.attr("href")
.replace("mailto:","")
);


if(email)
add(
"email",
email
);


});





const text =
$("body")
.text()
.replace(/\s+/g," ");




for(
const match of text.matchAll(
/(?:\+?55[\s.-]?)?(?:\(?\d{2}\)?[\s.-]?)?(?:9?\d{4})[\s.-]?\d{4}/g
)
){


const phone =
normalizePhone(
match[0]
);


if(phone)
add(
"phone",
phone
);


}





for(
const match of text.matchAll(
/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig
)
){


add(
"email",
normalizeEmail(match[0])
);


}



return contacts;


}






async function fetchPage(url){


try{


const controller =
new AbortController();


const timeout =
setTimeout(
()=>controller.abort(),
8000
);



const response =
await fetch(
url,
{

signal:
controller.signal,


headers:{
"User-Agent":
"Mozilla/5.0 LeadCollectorAI"
}

}
);



clearTimeout(timeout);



const type =
response.headers
.get("content-type")
|| "";



if(
!type.includes("text/html")
){

return null;

}



return await response.text();



}catch{


return null;


}



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









app.post(
"/api/collect",
async(req,res)=>{


try{



const target =
String(
req.body.url || ""
)
.trim();



const city =
String(
req.body.city || ""
)
.trim();





if(!target){


return res
.status(400)
.json({

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
visited.size < 50

){



const current =
queue.shift();




if(

visited.has(current)
||
!sameHost(
current,
start.href
)

){

continue;

}



visited.add(current);




const html =
await fetchPage(current);



if(!html)
continue;




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



if(
!unique.has(key)
){

unique.add(key);

contacts.push(item);

}


});







const $ =
cheerio.load(html);




$("a[href]")
.each((_,el)=>{


const link =
absolute(
$(el).attr("href"),
current
);




if(

link
&&
sameHost(
link,
start.href
)
&&
!visited.has(link)

){

queue.push(link);

}



});



}





res.json({


status:
"success",


message:
"Processamento concluído",


pagesVisited:
visited.size,


totalContacts:
contacts.length,


hasMorePages:
queue.length > 0,


nextPagesAvailable:
queue.length,


contacts


});





}catch(error){



res
.status(500)
.json({

error:
error.message

});



}



});








app.listen(
PORT,
()=>{


console.log(
`API online na porta ${PORT}`
);


}
);
