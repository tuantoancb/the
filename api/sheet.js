const SHEET_ID='1PCjX-ttyfQqCmOeHju9rJciEXNIFK-skezM0cZzrzO0';
const GID='1775041920';
function parseCSV(text){
  const rows=[];let row=[],cell='',q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i],n=text[i+1];
    if(q){if(c==='"'&&n==='"'){cell+='"';i++;}else if(c==='"')q=false;else cell+=c;}
    else if(c==='"')q=true;else if(c===','){row.push(cell);cell='';}
    else if(c==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(cell.length||row.length){row.push(cell.replace(/\r$/,''));rows.push(row)}
  return rows;
}
module.exports=async function handler(req,res){
  try{
    const url=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
    const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'}});
    if(!r.ok) throw new Error(`Google Sheet trả về HTTP ${r.status}`);
    const text=await r.text(); const data=parseCSV(text).filter(r=>r.some(v=>String(v).trim()));
    if(!data.length) throw new Error('Sheet không có dữ liệu hoặc chưa được chia sẻ công khai');
    let headers=data[0].map((h,i)=>String(h).trim()||`Cột ${i+1}`);
    const seen={};headers=headers.map(h=>{seen[h]=(seen[h]||0)+1;return seen[h]>1?`${h} ${seen[h]}`:h});
    const rows=data.slice(1).filter(r=>r.some(v=>String(v).trim())).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])));
    res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=300');
    res.status(200).json({headers,rows});
  }catch(e){res.status(500).json({error:e.message})}
}
